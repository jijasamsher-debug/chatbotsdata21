import { useState, useEffect } from 'react';
import { CreditCard, Calendar, TrendingUp, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createSubscriptionOrder } from '../lib/razorpay';
import { syncSubscriptionAfterPayment, syncAddonAfterPayment } from '../lib/postPaymentSync';
import { getPlanAmount, trackSubscriptionCommission } from '../utils/affiliateCommissions';
import { subscriptionPlanMap, type SubscriptionPlanId } from '../constants/pricingPlans';

export const Billing = () => {
  const { user } = useAuth();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (window.location.hash === '#available-plans') {
      setTimeout(() => {
        document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const starterPlan = subscriptionPlanMap.starter;
  const growthPlan = subscriptionPlanMap.growth;
  const currentPlan = (user?.subscription?.plan?.toLowerCase() || 'free') as 'free' | SubscriptionPlanId;
  const planPriority: Record<SubscriptionPlanId, number> = { starter: 1, growth: 2 };
  const isPlanLocked = (plan: SubscriptionPlanId) => currentPlan !== 'free' && planPriority[currentPlan as SubscriptionPlanId] >= planPriority[plan];

  const handleUpgrade = async (plan: SubscriptionPlanId, period: 'monthly' | 'annual') => {
    if (!user) return;
    if (isPlanLocked(plan)) return;

    setProcessingPlan(plan);
    try {
      const response: any = await createSubscriptionOrder(user.uid, plan, period);
      // Immediately update Firestore so the user sees the upgrade
      await syncSubscriptionAfterPayment(user.uid, plan, period, response);
      try {
        const commissionPlan = period === 'annual' ? `${plan}_yearly` : plan;
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

  const handleBuyAddon = async () => {
    if (!user) return;

    setProcessingPlan('addon_bot');
    try {
      const response: any = await createSubscriptionOrder(user.uid, 'addon_bot');
      // Immediately add bot slot in Firestore
      await syncAddonAfterPayment(user.uid, response);
      alert('Extra bot slot added to your subscription!');
      window.location.reload();
    } catch (error: any) {
      console.error('Addon payment failed:', error);
      alert(error?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isOnTrial = user.trialActive && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const trialDaysLeft = isOnTrial
    ? Math.ceil((new Date(user.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Billing & Subscription</h1>
      <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 mb-8">
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
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Instant Razorpay Checkout</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Upgrade plans and buy add-ons instantly with secure checkout.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              currentPlan === 'growth' ? 'bg-green-100 text-green-800' :
              currentPlan === 'starter' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Current Plan
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {currentPlan === 'free' && 'Basic features included'}
              {currentPlan === 'starter' && '₹299/month'}
              {currentPlan === 'growth' && '₹999/month'}
          </div>
        </div>

        {isOnTrial && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                Active
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {trialDaysLeft} Days Left
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              Trial ends on {new Date(user.trialEndsAt!).toLocaleDateString()}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {user.subscription?.status === 'active' ? 'Active' : 'Inactive'}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            Account status
          </div>
        </div>
      </div>

      <div id="available-plans" className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 mb-8 text-white scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <p className="mb-6 text-blue-100">
          Pricing is visible here so you can compare and upgrade anytime.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => handleUpgrade('starter', billingPeriod)}
            disabled={processingPlan !== null || isPlanLocked('starter')}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {processingPlan === 'starter'
              ? 'Opening Checkout...'
              : isPlanLocked('starter')
                ? 'Already on Starter/Growth'
                : `Buy Starter - ₹${billingPeriod === 'monthly' ? starterPlan.monthlyPrice : starterPlan.yearlyPrice.toLocaleString('en-IN')}/${billingPeriod === 'monthly' ? 'mo' : 'yr'}`}
          </button>
          <button
            onClick={() => handleUpgrade('growth', billingPeriod)}
            disabled={processingPlan !== null || isPlanLocked('growth')}
            className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {processingPlan === 'growth'
              ? 'Opening Checkout...'
              : isPlanLocked('growth')
                ? 'Already on Growth'
                : `Buy Growth - ₹${billingPeriod === 'monthly' ? growthPlan.monthlyPrice : growthPlan.yearlyPrice.toLocaleString('en-IN')}/${billingPeriod === 'monthly' ? 'mo' : 'yr'}`}
          </button>
        </div>
        {billingPeriod === 'annual' && (
          <p className="text-sm text-blue-100 mt-4">
            Starter saves ₹{starterPlan.yearlySavings.toLocaleString('en-IN')}/year • Growth saves ₹{growthPlan.yearlySavings.toLocaleString('en-IN')}/year
          </p>
        )}
        {isOnTrial && (
          <p className="text-sm text-blue-100 mt-2">You are currently on trial; upgrades are available anytime.</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Add-ons
          </h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-1 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Extra Bot Slot</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">₹49/month</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Add one more chatbot to your account
              </p>
              <button
                onClick={handleBuyAddon}
                disabled={processingPlan !== null}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {processingPlan === 'addon_bot' ? 'Opening Checkout...' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
