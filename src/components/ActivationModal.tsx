import { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { createActivationOrder } from '../lib/razorpay';
import { useAuth } from '../contexts/AuthContext';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ActivationModal = ({ isOpen, onClose, onSuccess }: ActivationModalProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleActivation = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await createActivationOrder(user.uid);
      onSuccess();
    } catch (error) {
      console.error('Activation failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Activate Your Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Get started with just ₹10 and unlock your 7-day trial
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">₹10</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">One-time activation fee</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">7 days premium trial access</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">Create up to 3 chatbots</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">Unlimited leads collection</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">Full customization options</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">No watermark on widgets</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Trial Benefits:</strong> After activation, enjoy 7 days of premium access.
            Choose to upgrade to a paid plan anytime or continue with the free plan.
          </p>
        </div>

        <button
          onClick={handleActivation}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
        >
          {loading ? 'Processing...' : 'Activate Now for ₹10'}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Secure payment powered by Razorpay. You can cancel anytime.
        </p>
      </div>
    </div>
  );
};
