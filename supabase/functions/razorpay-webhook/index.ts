import { getFirestoreDb, FieldValue } from '../_shared/firestore.ts';

const createHmac = async (secret: string, data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
    return new Response('Server misconfigured', { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  const expectedSignature = await createHmac(webhookSecret, body);

  if (signature !== expectedSignature) {
    console.error('Invalid Razorpay webhook signature');
    return new Response('Invalid signature', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType = event.event;
  const payload = event.payload;

  try {
    const db = getFirestoreDb();

    // Log all webhook events for audit trail
    await db.collection('webhookEvents').add({
      event: eventType,
      razorpayEventId: event.account_id || null,
      payload: JSON.stringify(payload).substring(0, 5000),
      processedAt: FieldValue.serverTimestamp(),
    });

    if (eventType === 'subscription.activated') {
      // Fired on first successful charge — activate plan immediately
      const subscription = payload.subscription.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;
      const planName = notes.plan || 'starter';

      if (!userId) {
        console.warn('subscription.activated: no userId in notes');
        return new Response('OK', { status: 200 });
      }

      if (planName === 'addon_bot') {
        // First activation of addon bot — increment bot limit
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

        console.log(`Addon bot slot activated for user ${userId} (limit: ${currentBotLimit + 1})`);
      } else {
        const billingPeriod = notes.billingPeriod || 'monthly';
        const resolvedPlan =
          billingPeriod === 'annual' || billingPeriod === 'yearly'
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
            },
          },
          { merge: true }
        );

        console.log(`Subscription ${resolvedPlan} activated for user ${userId}`);
      }
    } else if (eventType === 'subscription.charged') {
      const subscription = payload.subscription.entity;
      const payment = payload.payment.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;
      const planName = notes.plan || 'starter';

      if (!userId) {
        console.warn('subscription.charged: no userId in notes');
        return new Response('OK', { status: 200 });
      }

      // Check if this payment was already processed (idempotency)
      const existingPayment = await db
        .collection('payments')
        .where('razorpayPaymentId', '==', payment.id)
        .limit(1)
        .get();

      if (!existingPayment.empty) {
        console.log(`Payment ${payment.id} already processed, skipping`);
        return new Response('OK', { status: 200 });
      }

      if (planName === 'addon_bot') {
        // For addon bots, subscription.charged fires on initial + renewals
        // Only record payment — bot limit was already incremented on subscription.activated
        // Do NOT increment bot limit again on renewals
        await db.collection('payments').add({
          userId,
          type: 'addon',
          razorpayPaymentId: payment.id,
          razorpaySubscriptionId: subscription.id,
          amount: payment.amount / 100,
          status: 'captured',
          metadata: { addonType: 'bot' },
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`Addon bot renewal payment recorded for user ${userId}`);
      } else {
        // Regular subscription (starter/growth) — update plan on every charge
        const billingPeriod = notes.billingPeriod || 'monthly';
        const resolvedPlan =
          billingPeriod === 'annual' || billingPeriod === 'yearly'
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
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`Subscription ${resolvedPlan} charged for user ${userId}`);

        // Affiliate commission tracking
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
                const isFirstCharge = referral.status !== 'subscribed';

                if (isFirstCharge || isLifetime) {
                  const commission = (payment.amount / 100) * (commissionRate / 100);

                  await referralDoc.ref.set(
                    {
                      status: 'subscribed',
                      subscriptionPlan: resolvedPlan,
                      subscriptionAmount: payment.amount / 100,
                      commissionEarned: FieldValue.increment(commission),
                      subscriptionDate: FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                  );

                  await affiliateRef.set(
                    {
                      totalEarnings: FieldValue.increment(commission),
                      pendingBalance: FieldValue.increment(commission),
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
                    isRecurring: !isFirstCharge,
                    createdAt: FieldValue.serverTimestamp(),
                  });

                  console.log(`Commission ₹${commission} recorded for affiliate ${referral.affiliateId}${!isFirstCharge ? ' [recurring]' : ''}`);
                }
              }
            }
          }
        }
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
      const subscription = payload.subscription.entity;
      const notes = subscription.notes || {};
      const userId = notes.userId;
      const planName = notes.plan;

      if (!userId) {
        console.warn(`${eventType}: no userId in notes`);
        return new Response('OK', { status: 200 });
      }

      if (planName === 'addon_bot') {
        // Addon bot cancelled/halted — decrement bot limit
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        const userData = userSnap.data();
        const currentExtraBots = userData?.subscription?.addons?.extraBots || 0;
        const currentBotLimit = userData?.botLimit || 1;

        const newExtraBots = Math.max(0, currentExtraBots - 1);
        const newBotLimit = Math.max(1, currentBotLimit - 1);

        await userRef.set(
          {
            botLimit: newBotLimit,
            subscription: {
              addons: {
                extraBots: newExtraBots,
              },
            },
          },
          { merge: true }
        );

        console.log(`Addon bot slot removed for user ${userId} (${eventType}, limit: ${newBotLimit})`);
      } else {
        // Regular plan cancelled/halted
        await db.collection('users').doc(userId).set(
          {
            subscription: {
              status: eventType === 'subscription.cancelled' ? 'cancelled' : 'failed',
            },
          },
          { merge: true }
        );

        console.log(`Subscription ${eventType} for user ${userId}`);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('razorpay-webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});
