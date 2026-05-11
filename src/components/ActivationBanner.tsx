import { AlertCircle, Clock, CreditCard, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const ActivationBanner = () => {
  const { userData } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!userData || dismissed) return null;

  const isOnTrial = userData.trialEndsAt && new Date(userData.trialEndsAt) > new Date();
  const trialExpired = userData.trialEndsAt && new Date(userData.trialEndsAt) < new Date();
  const hasSubscription = userData.plan && userData.plan !== 'free';

  const trialDaysLeft = isOnTrial
    ? Math.ceil((new Date(userData.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isOnTrial && !hasSubscription) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                Trial Active - {trialDaysLeft} {trialDaysLeft === 1 ? 'Day' : 'Days'} Remaining
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your trial ends on {new Date(userData.trialEndsAt!).toLocaleDateString()}.
                Subscribe now to keep your premium features.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              View Plans
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (trialExpired && !hasSubscription) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-orange-900 dark:text-orange-100">Trial Expired</h3>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Subscribe to a plan to continue using premium features.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/billing#available-plans"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              Subscribe Now
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userData.subscriptionStatus === 'payment_failed') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-100">Payment Failed</h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Your last payment failed. Please update your payment method to continue using premium features.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/billing"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              Update Payment
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
