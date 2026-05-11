import { useState } from 'react';
import { Check, X, Bot, Sparkles, Lock, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlanMap } from '../constants/pricingPlans';

export const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const { user } = useAuth();
  const navigate = useNavigate();
  const starterPlan = subscriptionPlanMap.starter;
  const growthPlan = subscriptionPlanMap.growth;

  const handleGetStarted = (plan: 'free' | 'starter' | 'growth') => {
    if (!user) {
      navigate('/login?plan=' + plan);
    } else if (plan === 'free') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard/billing?upgrade=' + plan);
    }
  };

  return (
    <div className="public-page-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="public-hero text-center mb-12 p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business. Start free, upgrade as you grow.
          </p>

          <div className="inline-flex items-center rounded-xl p-1 border border-white/60 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg shadow-blue-100/30 dark:shadow-black/20">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="modern-glass-card border-2 border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">₹0</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">/forever</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Perfect for trying out Flood.chat</p>
            </div>

            <button
              onClick={() => handleGetStarted('free')}
              className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors mb-6"
            >
              Get Started Free
            </button>

            <ul className="space-y-4">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">3 bots maximum</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Leads Generator only</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited chats</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">First 30 leads visible</span>
              </li>
              <li className="flex items-start text-gray-500 dark:text-gray-400">
                <Lock className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span>Leads 31+ require a plan upgrade</span>
              </li>
            </ul>
          </div>

          <div className="modern-glass-card border-2 border-blue-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
              <div className="flex items-baseline mb-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₹{billingPeriod === 'monthly' ? starterPlan.monthlyPrice : starterPlan.yearlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  ₹{starterPlan.monthlyEquivalentOnYearly}/month • Save ₹{starterPlan.yearlySavings.toLocaleString('en-IN')}/year
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">Great for small businesses</p>
            </div>

            <button
              onClick={() => handleGetStarted('starter')}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-6"
            >
              Start Free Trial
            </button>

            <ul className="space-y-4">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">3 bots included</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited leads visible</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited chats</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Extra bots: +₹49/bot/month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-700 dark:text-gray-300">Page-Specific Rules</span>
                  <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">2x more leads</span>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Email support</span>
              </li>
              <li className="flex items-start text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Cannot remove Powered by Flood.chat</span>
              </li>
            </ul>
          </div>

          <div className="modern-glass-card border-2 border-blue-300 dark:border-blue-700 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                Growth <Sparkles className="w-5 h-5 text-yellow-500 ml-2" />
              </h3>
              <div className="flex items-baseline mb-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₹{billingPeriod === 'monthly' ? growthPlan.monthlyPrice : growthPlan.yearlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  /{billingPeriod === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  ₹{growthPlan.monthlyEquivalentOnYearly}/month • Save ₹{growthPlan.yearlySavings.toLocaleString('en-IN')}/year
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">For growing businesses</p>
            </div>

            <button
              onClick={() => handleGetStarted('growth')}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors mb-6"
            >
              Start Free Trial
            </button>

            <ul className="space-y-4">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">6 bots included</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited leads visible</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited chats</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Extra bots: +₹49/bot/month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-700 dark:text-gray-300">Page-Specific Rules</span>
                  <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">2x more leads</span>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Remove Powered by Flood.chat watermark</span>
              </li>
            </ul>
          </div>
        </div>

         <div className="modern-glass-card p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add-ons</h2>
          <div className="grid md:grid-cols-2 gap-6">
             <div className="rounded-xl border border-blue-100 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 p-6">
              <div className="flex items-center mb-3">
                <Bot className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Extra Bot Slot</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Add more lead generation bots to your plan
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{billingPeriod === 'monthly' ? '49' : '500'}{billingPeriod === 'monthly' ? '/month' : '/year'}
              </p>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Save ₹880/year
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 mb-16 text-white text-center shadow-xl shadow-blue-200/40 dark:shadow-black/30">
          <h2 className="text-3xl font-bold mb-4">Need More Than 30 Leads?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Upgrade to Starter or Growth to view and export all leads without limits.
          </p>
          <p className="text-blue-100">
            Best for teams that are ready to scale lead collection.
          </p>
        </div>

        <div className="modern-glass-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade or downgrade at any time from your dashboard. Changes take effect immediately, and billing is prorated based on your current billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens if my payment fails?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                If a subscription payment fails, all your bots will be immediately deactivated. You can reactivate them by updating your payment method and clearing any overdue amounts.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a refund policy?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monthly subscription payments are non-refundable, but you can cancel at any time to prevent future charges. Your service will continue until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our team is here to help you choose the right plan
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};
