import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

export const createActivationOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { offerConfig } = data;

  try {
    const order = await razorpay.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: `activation_${userId}_${Date.now()}`,
      notes: {
        type: 'activation',
        userId: userId,
        trialDays: offerConfig?.trialDays || 14,
        planAfterTrial: offerConfig?.planAfterTrial || 'starter',
        affiliateId: offerConfig?.affiliateId || '',
      },
    });

    await db.collection('payments').add({
      userId,
      type: 'activation',
      razorpayOrderId: order.id,
      amount: 10,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: offerConfig,
    });

    return { orderId: order.id };
  } catch (error) {
    console.error('Error creating activation order:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create order');
  }
});

export const createSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { plan } = data;

  const planAmounts = {
    starter: 9900,
    growth: 69900,
  };

  const amount = planAmounts[plan as keyof typeof planAmounts];
  if (!amount) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid plan');
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan === 'starter' ? functions.config().razorpay.starter_plan_id : functions.config().razorpay.growth_plan_id,
      total_count: 12,
      customer_notify: 1,
      notes: {
        userId: userId,
        plan: plan,
      },
    });

    await db.collection('users').doc(userId).update({
      'subscription.plan': plan,
      'subscription.status': 'pending',
      'subscription.razorpaySubscriptionId': subscription.id,
    });

    return { subscriptionId: subscription.id };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create subscription');
  }
});

export const createLeadUnlockOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { leadId } = data;

  try {
    const leadDoc = await db.collection('leads').doc(leadId).get();
    if (!leadDoc.exists || leadDoc.data()?.ownerId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Lead not found');
    }

    if (leadDoc.data()?.unlocked) {
      throw new functions.https.HttpsError('already-exists', 'Lead already unlocked');
    }

    const order = await razorpay.orders.create({
      amount: 1900,
      currency: 'INR',
      receipt: `lead_unlock_${leadId}_${Date.now()}`,
      notes: {
        type: 'lead_unlock',
        userId: userId,
        leadId: leadId,
      },
    });

    await db.collection('payments').add({
      userId,
      type: 'lead_unlock',
      razorpayOrderId: order.id,
      amount: 19,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { leadId },
    });

    return { orderId: order.id };
  } catch (error) {
    console.error('Error creating lead unlock order:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create order');
  }
});

export const createAddonOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { addonType, plan } = data;

  const addonPrices = {
    extraBot: 3900,
    aiBot: plan === 'starter' ? 24900 : 19900,
  };

  const amount = addonPrices[addonType as keyof typeof addonPrices];
  if (!amount) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid addon type');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const subscriptionId = userDoc.data()?.subscription?.razorpaySubscriptionId;

    if (!subscriptionId) {
      throw new functions.https.HttpsError('failed-precondition', 'No active subscription');
    }

    await razorpay.subscriptions.createAddon(subscriptionId, {
      item: {
        name: addonType === 'extraBot' ? 'Extra Bot Slot' : 'AI Bot Addon',
        amount: amount,
        currency: 'INR',
      },
    });

    await db.collection('payments').add({
      userId,
      type: 'addon',
      razorpaySubscriptionId: subscriptionId,
      amount: amount / 100,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { addonType },
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating addon:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create addon');
  }
});

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = functions.config().razorpay.webhook_secret;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Invalid webhook signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment.entity;
        const order = await razorpay.orders.fetch(payment.order_id);
        const notes = order.notes;

        if (notes.type === 'activation') {
          const trialDays = parseInt(notes.trialDays) || 14;
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + trialDays);

          await db.collection('users').doc(notes.userId).update({
            activated: true,
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
            trialActive: true,
            trialStartAt: admin.firestore.FieldValue.serverTimestamp(),
            trialEndsAt: trialEndDate,
            planAfterTrial: notes.planAfterTrial || 'starter',
          });

          if (notes.affiliateId) {
            await db.collection('users').doc(notes.userId).update({
              referredBy: notes.affiliateId,
            });
          }

          const paymentsQuery = await db
            .collection('payments')
            .where('razorpayOrderId', '==', payment.order_id)
            .get();

          paymentsQuery.forEach(async (doc) => {
            await doc.ref.update({
              razorpayPaymentId: payment.id,
              status: 'captured',
            });
          });
        } else if (notes.type === 'lead_unlock') {
          await db.collection('leads').doc(notes.leadId).update({
            unlocked: true,
          });

          const paymentsQuery = await db
            .collection('payments')
            .where('razorpayOrderId', '==', payment.order_id)
            .get();

          paymentsQuery.forEach(async (doc) => {
            await doc.ref.update({
              razorpayPaymentId: payment.id,
              status: 'captured',
            });
          });
        }
        break;
      }

      case 'subscription.charged': {
        const subscription = payload.subscription.entity;
        const payment = payload.payment.entity;
        const notes = subscription.notes;

        await db.collection('users').doc(notes.userId).update({
          'subscription.status': 'active',
          'subscription.nextBillingDate': new Date(subscription.current_end * 1000),
        });

        await db.collection('payments').add({
          userId: notes.userId,
          type: 'subscription',
          razorpayPaymentId: payment.id,
          razorpaySubscriptionId: subscription.id,
          amount: payment.amount / 100,
          status: 'captured',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (notes.userId) {
          const userDoc = await db.collection('users').doc(notes.userId).get();
          const referredBy = userDoc.data()?.referredBy;

          if (referredBy) {
            const affiliateDoc = await db.collection('affiliates').doc(referredBy).get();
            if (affiliateDoc.exists) {
              const commissionPercent = affiliateDoc.data()?.commissionPercent || 0;
              const commission = (payment.amount / 100) * (commissionPercent / 100);

              await db.collection('affiliates').doc(referredBy).update({
                pendingBalance: admin.firestore.FieldValue.increment(commission),
                totalEarned: admin.firestore.FieldValue.increment(commission),
              });

              await db.collection('affiliateCommissions').add({
                affiliateId: referredBy,
                userId: notes.userId,
                paymentId: payment.id,
                amount: payment.amount / 100,
                commission: commission,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        }
        break;
      }

      case 'subscription.halted':
      case 'payment.failed': {
        const subscription = payload.subscription.entity;
        const notes = subscription.notes;

        await db.collection('users').doc(notes.userId).update({
          'subscription.status': 'failed',
        });

        const botsQuery = await db.collection('bots').where('ownerId', '==', notes.userId).get();
        const batch = db.batch();
        botsQuery.forEach((doc) => {
          batch.update(doc.ref, { active: false });
        });
        await batch.commit();
        break;
      }

      case 'subscription.cancelled': {
        const subscription = payload.subscription.entity;
        const notes = subscription.notes;

        await db.collection('users').doc(notes.userId).update({
          'subscription.status': 'cancelled',
        });

        const botsQuery = await db.collection('bots').where('ownerId', '==', notes.userId).get();
        const batch = db.batch();
        botsQuery.forEach((doc) => {
          batch.update(doc.ref, { active: false });
        });
        await batch.commit();
        break;
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

export const checkExpiredTrials = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const now = new Date();

  const expiredTrialsQuery = await db
    .collection('users')
    .where('activated', '==', true)
    .where('trialActive', '==', true)
    .where('trialEndsAt', '<', now)
    .get();

  const batch = db.batch();

  for (const userDoc of expiredTrialsQuery.docs) {
    const userId = userDoc.id;
    const subscription = userDoc.data().subscription;

    if (!subscription || subscription.status !== 'active') {
      batch.update(userDoc.ref, {
        trialActive: false,
      });

      const botsQuery = await db.collection('bots').where('ownerId', '==', userId).get();
      botsQuery.forEach((botDoc) => {
        batch.update(botDoc.ref, { active: false });
      });
    }
  }

  await batch.commit();
  console.log(`Processed ${expiredTrialsQuery.size} expired trials`);
  return null;
});
