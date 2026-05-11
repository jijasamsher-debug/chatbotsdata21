export type SubscriptionPlanId = 'starter' | 'growth';

export interface SubscriptionPlanDetails {
  id: SubscriptionPlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyEquivalentOnYearly: number;
  yearlySavings: number;
  popular?: boolean;
  features: string[];
}

export const subscriptionPlans: SubscriptionPlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 299,
    yearlyPrice: 3050,
    monthlyEquivalentOnYearly: 254,
    yearlySavings: 538,
    popular: true,
    features: [
      '3 bots included',
      'Unlimited leads visible',
      'Unlimited chats',
      'Extra bots: +₹49/bot/month',
      
      'Email support',
      'Cannot remove Powered by Flood.chat',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 999,
    yearlyPrice: 10190,
    monthlyEquivalentOnYearly: 849,
    yearlySavings: 1798,
    features: [
      '3 bots included',
      
      'Unlimited leads visible',
      'Unlimited chats',
      
      'Priority support',
      'Remove Powered by Flood.chat watermark',
    ],
  },
];

export const subscriptionPlanMap = Object.fromEntries(
  subscriptionPlans.map((plan) => [plan.id, plan])
) as Record<SubscriptionPlanId, SubscriptionPlanDetails>;