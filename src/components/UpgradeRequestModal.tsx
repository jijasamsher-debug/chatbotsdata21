import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UpgradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
}

export const UpgradeRequestModal = ({ isOpen, onClose, planName, planPrice }: UpgradeRequestModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitted(false);
    setMessage('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const planMap: Record<string, { plan: string; amount: number }> = {
        'Basic': { plan: 'starter', amount: 499 },
        'Pro': { plan: 'growth', amount: 999 }
      };

      const planInfo = planMap[planName] || { plan: 'starter', amount: 499 };

      await addDoc(collection(db, 'paymentRequests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        type: 'subscription',
        plan: planInfo.plan,
        amount: planInfo.amount,
        planName,
        planPrice,
        message,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Sent!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Admin will contact you soon with payment details.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Request {planName} Plan
            </h3>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Admin will review your request and send you payment details via email.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Details
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-gray-900 dark:text-white font-medium">{planName}</p>
                <p className="text-gray-600 dark:text-gray-400">{planPrice}/month</p>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Message (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Any special requirements or questions..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
