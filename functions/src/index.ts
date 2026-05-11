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

const PLAN_CONFIG = {
  starter: {
    amount: 999,
    razorpayPlanId: functions.config().razorpay.starter_plan_id,
  },
  growth: {
    amount: 2499,
    razorpayPlanId: functions.config().razorpay.growth_plan_id,
  },
  addon_bot: {
    amount: 49,
    razorpayPlanId: functions.config().razorpay.addon_bot_plan_id,
  },
} as const;

const getUserPlan = (userData: admin.firestore.DocumentData | undefined): string => {
  if (!userData) return 'free';
  return userData?.subscription?.plan || userData?.plan || 'free';
};

export const createActivationOrder = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { offerConfig } = data || {};

  try {
    const order = await razorpay.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: `activation_${userId}_${Date.now()}`,
      notes: {
        type: 'activation',
        userId,
        trialDays: String(offerConfig?.trialDays || 14),
        planAfterTrial: String(offerConfig?.planAfterTrial || 'starter'),
      },
    });

    await db.collection('payments').add({
      userId,
      type: 'activation',
      razorpayOrderId: order.id,
      amount: 10,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { orderId: order.id, amount: 1000 };
  } catch (error: any) {
    console.error('createActivationOrder error:', error);
    throw new functions.https.HttpsError('internal', error?.message || 'Failed to create activation order');
  }
});

export const createSubscription = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const plan = typeof data?.plan === 'string' ? data.plan.trim().toLowerCase() as keyof typeof PLAN_CONFIG : undefined;

  if (!plan || !PLAN_CONFIG[plan]) {
    throw new functions.https.HttpsError('invalid-argument', 'plan must be starter, growth, or addon_bot');
  }

  const planConfig = PLAN_CONFIG[plan];
  if (!planConfig.razorpayPlanId) {
    throw new functions.https.HttpsError('failed-precondition', `Missing Razorpay plan id for ${plan}`);
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planConfig.razorpayPlanId,
      total_count: plan === 'addon_bot' ? 10 : 12,
      customer_notify: 1,
      notes: {
        userId,
        plan,
      },
    });

    await db.collection('users').doc(userId).set(
      {
        subscription: {
          plan,
          status: 'pending',
          razorpaySubscriptionId: subscription.id,
        },
      },
      { merge: true }
    );

    return {
      subscriptionId: subscription.id,
      amount: planConfig.amount * 100,
    };
  } catch (error: any) {
    console.error('createSubscription error:', error);
    throw new functions.https.HttpsError('internal', error?.message || 'Failed to create subscription');
  }
});

export const createAddonOrder = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const addonType = typeof data?.addonType === 'string' ? data.addonType.trim().toLowerCase() : '';

  const amountByAddonType = {
    bot: 4900,
    addon_bot: 4900,
  } as const;
  const amount = amountByAddonType[addonType as keyof typeof amountByAddonType];

  if (!amount) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid addon type');
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `addon_${addonType}_${userId}_${Date.now()}`,
      notes: {
        type: 'addon',
        addonType,
        userId,
      },
    });

    await db.collection('payments').add({
      userId,
      type: 'addon',
      razorpayOrderId: order.id,
      amount: amount / 100,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { addonType },
    });

    return { orderId: order.id, amount };
  } catch (error: any) {
    console.error('createAddonOrder error:', error);
    throw new functions.https.HttpsError('internal', error?.message || 'Failed to create addon order');
  }
});

export const razorpayWebhook = functions.region('asia-south1').https.onRequest(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = functions.config().razorpay.webhook_secret;

  if (!webhookSecret) {
    res.status(500).send('Webhook secret not configured');
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    res.status(400).send('Invalid signature');
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    if (event === 'subscription.charged') {
      const subscription = payload.subscription.entity;
      const payment = payload.payment.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;
      const planName = notes.plan || 'starter';

      if (userId) {
        // Handle addon_bot subscriptions — increment bot limit
        if (planName === 'addon_bot') {
          const userRef = db.collection('users').doc(userId);
          const userSnap = await userRef.get();
          const userData = userSnap.data();
          const currentExtraBots = userData?.subscription?.addons?.extraBots || 0;
          const currentBotLimit = userData?.botLimit || 1;

          await userRef.set(
            {
              botLimit: currentBotLimit + 1,
              subscription: {
                addons: {
                  extraBots: currentExtraBots + 1,
                },
              },
            },
            { merge: true }
          );

          await db.collection('payments').add({
            userId,
            type: 'addon',
            razorpayPaymentId: payment.id,
            razorpaySubscriptionId: subscription.id,
            amount: payment.amount / 100,
            status: 'captured',
            metadata: { addonType: 'bot' },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Regular subscription (starter/growth) — update plan
          const billingPeriod = notes.billingPeriod || 'monthly';
          const resolvedPlan = billingPeriod === 'annual' || billingPeriod === 'yearly'
            ? `${planName}_yearly`
            : planName;

          await db.collection('users').doc(userId).set(
            {
              plan: resolvedPlan,
              subscription: {
                status: 'active',
                plan: resolvedPlan,
                razorpaySubscriptionId: subscription.id,
                billingPeriod: billingPeriod === 'annual' ? 'yearly' : billingPeriod,
                nextBillingDate: new Date(subscription.current_end * 1000),
              },
            },
            { merge: true }
          );

          await db.collection('payments').add({
            userId,
            type: 'subscription',
            razorpayPaymentId: payment.id,
            razorpaySubscriptionId: subscription.id,
            amount: payment.amount / 100,
            status: 'captured',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Affiliate commission tracking for eligible plans
          const commissionEligiblePlans = ['starter', 'starter_yearly', 'growth', 'growth_yearly'];

          if (commissionEligiblePlans.includes(resolvedPlan)) {
            const referralSnap = await db
              .collection('affiliateReferrals')
              .where('referredUserId', '==', userId)
              .limit(1)
              .get();

            if (!referralSnap.empty) {
              const referralDoc = referralSnap.docs[0];
              const referral = referralDoc.data();

              if (referral.affiliateId) {
                const affiliateRef = db.collection('affiliates').doc(referral.affiliateId);
                const affiliateSnap = await affiliateRef.get();

                if (affiliateSnap.exists) {
                  const affiliateData = affiliateSnap.data();
                  const commissionRate = affiliateData?.commissionRate || 20;
                  const isLifetime = affiliateData?.lifetimeCommissions === true;

                  // Pay commission on first charge always; on recurring only if lifetime enabled
                  const isFirstCharge = referral.status !== 'subscribed';
                  if (isFirstCharge || isLifetime) {
                    const commission = (payment.amount / 100) * (commissionRate / 100);

                    await referralDoc.ref.set(
                      {
                        status: 'subscribed',
                        subscriptionPlan: resolvedPlan,
                        subscriptionAmount: payment.amount / 100,
                        commissionEarned: admin.firestore.FieldValue.increment(commission),
                        subscriptionDate: admin.firestore.FieldValue.serverTimestamp(),
                      },
                      { merge: true }
                    );

                    await affiliateRef.set(
                      {
                        totalEarnings: admin.firestore.FieldValue.increment(commission),
                        pendingBalance: admin.firestore.FieldValue.increment(commission),
                      },
                      { merge: true }
                    );

                    await db.collection('affiliateCommissions').add({
                      affiliateId: referral.affiliateId,
                      userId,
                      paymentId: payment.id,
                      plan: resolvedPlan,
                      amount: payment.amount / 100,
                      commission,
                      commissionRate,
                      status: 'pending',
                      createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                  }
                }
              }
            }
          }
        }
      }
    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      // Handle subscription cancellation or halt (failed auto-pay)
      const subscription = payload.subscription.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;

      if (userId && notes.plan !== 'addon_bot') {
        await db.collection('users').doc(userId).set(
          {
            subscription: {
              status: event === 'subscription.cancelled' ? 'cancelled' : 'failed',
            },
          },
          { merge: true }
        );
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('razorpayWebhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

export const onLeadCreated = functions
  .region('asia-south1')
  .firestore.document('leads/{leadId}')
  .onCreate(async (snapshot) => {
    const leadData = snapshot.data();
    const ownerId = leadData?.ownerId as string | undefined;

    if (!ownerId) return;

    const userRef = db.collection('users').doc(ownerId);

    await userRef.set(
      {
        totalLeadsCount: admin.firestore.FieldValue.increment(1),
      },
      { merge: true }
    );

    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const plan = getUserPlan(userData);

    if (plan !== 'free' || userData?.freeLeadVisibleUntil) {
      return;
    }

    const leadsSnap = await db
      .collection('leads')
      .where('ownerId', '==', ownerId)
      .orderBy('collectedAt', 'asc')
      .limit(31)
      .get();

    if (leadsSnap.size <= 30) {
      return;
    }

    const cutoffLead = leadsSnap.docs[29];
    const cutoffTimestamp = cutoffLead.get('collectedAt');

    if (!cutoffTimestamp) {
      return;
    }

    await userRef.set(
      {
        freeLeadVisibleUntil: cutoffTimestamp,
      },
      { merge: true }
    );
  });

export const backfillFreeLeadVisibility = functions
  .region('asia-south1')
  .https.onCall(async (_, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const requesterRef = db.collection('users').doc(context.auth.uid);
    const requesterSnap = await requesterRef.get();

    if (requesterSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can run this backfill');
    }

    const usersSnap = await db.collection('users').get();
    let processedUsers = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const plan = getUserPlan(userData);

      if (plan !== 'free') {
        continue;
      }

      const leadsSnap = await db
        .collection('leads')
        .where('ownerId', '==', userDoc.id)
        .orderBy('collectedAt', 'asc')
        .get();

      const totalLeadsCount = leadsSnap.size;
      const updatePayload: admin.firestore.UpdateData<admin.firestore.DocumentData> = {
        totalLeadsCount,
      };

      if (totalLeadsCount > 30) {
        const cutoffTimestamp = leadsSnap.docs[29].get('collectedAt');
        if (cutoffTimestamp) {
          updatePayload.freeLeadVisibleUntil = cutoffTimestamp;
        }
      } else {
        updatePayload.freeLeadVisibleUntil = admin.firestore.FieldValue.delete();
      }

      await userDoc.ref.set(updatePayload, { merge: true });
      processedUsers += 1;
    }

    return {
      success: true,
      processedUsers,
    };
  });

export const syncMyLeadStats = functions
  .region('asia-south1')
  .https.onCall(async (_, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const plan = getUserPlan(userData);

    const leadsSnap = await db
      .collection('leads')
      .where('ownerId', '==', userId)
      .orderBy('collectedAt', 'asc')
      .get();

    const totalLeadsCount = leadsSnap.size;
    const updatePayload: admin.firestore.UpdateData<admin.firestore.DocumentData> = {
      totalLeadsCount,
    };

    let cutoffDate: Date | null = null;
    if (plan === 'free' && totalLeadsCount > 30) {
      const cutoffTimestamp = leadsSnap.docs[29].get('collectedAt');
      if (cutoffTimestamp) {
        updatePayload.freeLeadVisibleUntil = cutoffTimestamp;
        cutoffDate = cutoffTimestamp.toDate();
      }
    } else {
      updatePayload.freeLeadVisibleUntil = admin.firestore.FieldValue.delete();
    }

    await userRef.set(updatePayload, { merge: true });

    return {
      totalLeadsCount,
      freeLeadVisibleUntil: cutoffDate ? cutoffDate.toISOString() : null,
      plan,
    };
  });