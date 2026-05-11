import { recordAffiliateSubscription } from './affiliateTracking';

export const trackSubscriptionCommission = async (
  userId: string,
  plan: string,
  amount: number
) => {
  await recordAffiliateSubscription(userId, plan, amount);
};

export const getPlanAmount = (plan: string): number => {
  const planPrices: Record<string, number> = {
    starter: 299,
    starter_yearly: 3050,
    growth: 999,
    growth_yearly: 10190,
    addon_bot: 490,
    addon_bot_yearly: 5000,
  };

  return planPrices[plan.toLowerCase()] || 0;
};
