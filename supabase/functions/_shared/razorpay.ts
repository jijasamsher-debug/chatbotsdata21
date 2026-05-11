import Razorpay from 'npm:razorpay@2.9.6';

export const getRazorpayClient = () => {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID is not configured');
  }

  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const readRazorpayPlanId = (secretName: string) => {
  const planId = Deno.env.get(secretName)?.trim();

  if (!planId) {
    throw new Error(`${secretName} is not configured`);
  }

  if (!/^plan_[A-Za-z0-9]{14}$/.test(planId)) {
    throw new Error(`${secretName} must be a Razorpay plan ID like plan_XXXXXXXXXXXXXX`);
  }

  return planId;
};

export const getPlanId = (plan: 'starter' | 'growth' | 'addon_bot', billingPeriod: 'monthly' | 'annual' = 'monthly') => {
  if (plan === 'addon_bot') {
    return readRazorpayPlanId('RAZORPAY_ADDON_BOT_PLAN_ID');
  }

  if (plan === 'starter') {
    if (billingPeriod === 'annual') {
      return readRazorpayPlanId('RAZORPAY_STARTER_YEARLY_PLAN_ID');
    }

    return readRazorpayPlanId('RAZORPAY_STARTER_PLAN_ID');
  }

  if (billingPeriod === 'annual') {
    return readRazorpayPlanId('RAZORPAY_GROWTH_YEARLY_PLAN_ID');
  }

  return readRazorpayPlanId('RAZORPAY_GROWTH_PLAN_ID');
};
