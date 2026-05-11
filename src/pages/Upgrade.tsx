import { useState } from 'react';
import { Check } from 'lucide-react';
import { createSubscriptionOrder } from '../lib/razorpay';
import { syncSubscriptionAfterPayment } from '../lib/postPaymentSync';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPlanAmount, trackSubscriptionCommission } from '../utils/affiliateCommissions';
import { subscriptionPlans, type SubscriptionPlanId } from '../constants/pricingPlans';

export const Upgrade = () => {
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlanId | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentPlan = user?.subscription?.plan?.toLowerCase() as SubscriptionPlanId | undefined;
  const planPriority: Record<SubscriptionPlanId, number> = {
    starter: 1,
    growth: 2,
  };

  const isPlanLocked = (planId: SubscriptionPlanId) => {
    if (!currentPlan || !planPriority[currentPlan]) {
      return false;
    }

    return planPriority[currentPlan] >= planPriority[planId];
  };

  const handlePlanPurchase = async (plan: SubscriptionPlanId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isPlanLocked(plan)) {
      return;
    }

    setProcessingPlan(plan);
    try {
      const response: any = await createSubscriptionOrder(user.uid, plan, billingPeriod);
      // Immediately update Firestore so the user sees the upgrade
      await syncSubscriptionAfterPayment(user.uid, plan, billingPeriod, response);
      try {
        const commissionPlan = billingPeriod === 'annual' ? `${plan}_yearly` : plan;
        await trackSubscriptionCommission(user.uid, plan, getPlanAmount(commissionPlan));
      } catch (commissionError) {
        console.error('Affiliate commission tracking failed:', commissionError);
      }
      alert('Payment successful! Your subscription is now active.');
      window.location.reload();
    } catch (error: any) {
      console.error('Subscription payment failed:', error);
      alert(error?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Upgrade to unlock unlimited features and scale your business
          </p>
          <div className="mt-6 inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border-2 p-8 relative ${
                plan.popular
                  ? 'border-blue-600 shadow-xl'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  ₹{billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                {billingPeriod === 'annual' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ₹{plan.monthlyEquivalentOnYearly}/month • Save ₹{plan.yearlySavings.toLocaleString('en-IN')}/year
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanPurchase(plan.id)}
                disabled={processingPlan === plan.id || isPlanLocked(plan.id)}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {processingPlan === plan.id
                  ? 'Opening Checkout...'
                  : isPlanLocked(plan.id)
                    ? `Current or lower than your ${currentPlan === 'growth' ? 'Growth' : 'Starter'} plan`
                    : `Pay ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'} with Razorpay`}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
            How It Works
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Click "Pay with Razorpay" to complete your payment instantly and activate your plan automatically.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Need a custom plan or have questions? Contact support from the Contact page.
          </p>
        </div>
      </div>
    </div>
  );
};
