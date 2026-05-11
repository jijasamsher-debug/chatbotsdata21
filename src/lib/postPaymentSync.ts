import { doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Immediately update the user's subscription in Firestore after a successful Razorpay payment.
 */
export const syncSubscriptionAfterPayment = async (
  userId: string,
  plan: 'starter' | 'growth',
  billingPeriod: 'monthly' | 'annual',
  razorpayResponse: { razorpay_subscription_id?: string; razorpay_payment_id?: string }
) => {
  const subscriptionPlan = billingPeriod === 'annual' ? `${plan}_yearly` : plan;

  await setDoc(
    doc(db, 'users', userId),
    {
      plan: subscriptionPlan,
      subscription: {
        plan: subscriptionPlan,
        status: 'active',
        razorpaySubscriptionId: razorpayResponse.razorpay_subscription_id || '',
        billingPeriod: billingPeriod === 'annual' ? 'yearly' : 'monthly',
      },
    },
    { merge: true }
  );
};

/**
 * Immediately add an extra bot slot to the user's Firestore doc after successful addon payment.
 */
export const syncAddonAfterPayment = async (
  userId: string,
  razorpayResponse: { razorpay_subscription_id?: string; razorpay_payment_id?: string }
) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const currentBotLimit = userSnap.exists() ? (userSnap.data()?.botLimit || 1) : 1;

  await setDoc(
    userRef,
    {
      botLimit: currentBotLimit + 1,
      subscription: {
        addons: {
          extraBots: (userSnap.data()?.subscription?.addons?.extraBots || 0) + 1,
        },
      },
    },
    { merge: true }
  );
};
