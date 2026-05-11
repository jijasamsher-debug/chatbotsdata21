import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, ExternalLink, X, CreditCard, AlertCircle } from 'lucide-react';

interface PaymentRequest {
  id: string;
  type: string;
  plan?: string;
  addonType?: string;
  amount?: number;
  status: string;
  paymentLink?: string;
  isRecurring?: boolean;
  billingPeriod?: 'monthly' | 'yearly';
  createdAt: any;
  expiryDate?: any;
}

export const PaymentRequestBanner = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'paymentRequests'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'payment_link_sent']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          expiryDate: doc.data().expiryDate?.toDate?.() || doc.data().expiryDate
        })) as PaymentRequest[];

        setRequests(requestsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching payment requests:', error);
        setRequests([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsPaid = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const transactionId = prompt('Please enter your payment transaction ID or reference number:');
    if (!transactionId?.trim()) {
      alert('Transaction ID is required to mark payment as complete.');
      return;
    }

    setMarkingPaid(requestId);
    try {
      const requestRef = doc(db, 'paymentRequests', requestId);
      await updateDoc(requestRef, {
        status: 'payment_link_sent',
        userMarkedPaidAt: serverTimestamp(),
        userTransactionId: transactionId.trim(),
        userNotes: 'User marked as paid, awaiting admin verification'
      });

      alert('Payment marked as complete! Admin will verify and activate your subscription shortly.');
    } catch (error) {
      console.error('Error marking payment:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleReportPayment = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || !request.paymentLink) return;

    const transactionId = prompt('Please enter your payment transaction ID or reference number:');
    if (!transactionId?.trim()) {
      alert('Transaction ID is required.');
      return;
    }

    setMarkingPaid(requestId);
    try {
      const requestRef = doc(db, 'paymentRequests', requestId);
      await updateDoc(requestRef, {
        userMarkedPaidAt: serverTimestamp(),
        userTransactionId: transactionId.trim(),
        userNotes: 'User completed payment, awaiting admin verification'
      });

      alert('Payment reported! Admin will verify and activate your subscription shortly.');
    } catch (error) {
      console.error('Error reporting payment:', error);
      alert('Failed to report payment. Please try again.');
    } finally {
      setMarkingPaid(null);
    }
  };

  if (loading || requests.length === 0) {
    return null;
  }

  const getPlanName = (request: PaymentRequest) => {
    if (request.plan) {
      const planName = request.plan.replace('_', ' ');
      return planName.charAt(0).toUpperCase() + planName.slice(1);
    }
    if (request.addonType) {
      return request.addonType === 'bot' ? 'Bot Addon' : 'AI Bot Addon';
    }
    return 'Subscription';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'payment_link_sent') {
      return <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'payment_link_sent') {
      return 'Payment Link Sent';
    }
    return 'Pending Admin Review';
  };

  return (
    <div className="mb-6 space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className={`rounded-xl border-2 ${
            request.status === 'payment_link_sent'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getStatusIcon(request.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {getPlanName(request)} Request
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      request.status === 'payment_link_sent'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {getStatusText(request.status)}
                    </span>
                    {request.isRecurring && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Recurring
                      </span>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Your request is being reviewed. You'll receive a payment link soon.
                    </p>
                  )}

                  {request.status === 'payment_link_sent' && (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        Click the link below to complete your payment, then mark as paid.
                      </p>

                      {request.paymentLink && (
                        <div className="space-y-3">
                          <a
                            href={request.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Pay Now
                          </a>

                          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>
                                After completing payment, click "I Have Paid" and enter your transaction ID.
                                Admin will verify and activate your subscription.
                              </span>
                            </p>
                            <button
                              onClick={() => handleReportPayment(request.id)}
                              disabled={markingPaid === request.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {markingPaid === request.id ? 'Processing...' : 'I Have Paid'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {showDetails === request.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p><strong>Type:</strong> {request.type}</p>
                      {request.plan && <p><strong>Plan:</strong> {getPlanName(request)}</p>}
                      {request.billingPeriod && (
                        <p><strong>Billing:</strong> {request.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}</p>
                      )}
                      <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                      {request.expiryDate && (
                        <p><strong>Valid Until:</strong> {new Date(request.expiryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowDetails(showDetails === request.id ? null : request.id)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline"
                >
                  {showDetails === request.id ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
            </div>
          </div>

          {request.isRecurring && request.status === 'payment_link_sent' && (
            <div className="px-4 pb-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-800 dark:text-green-200 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Recurring Payment Link:</strong> This link can be used for future renewals.
                    Save it for when your subscription expires!
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
