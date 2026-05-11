import { useState, useEffect } from 'react';
import { CreditCard, Check, X, User, Mail, Calendar, Link as LinkIcon, Send, ArrowDown, Settings, DollarSign, CheckCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import type { PaymentRequest } from '../types';
import { trackSubscriptionCommission, getPlanAmount } from '../utils/affiliateCommissions';

interface UserData {
  id: string;
  name: string;
  email: string;
  subscription: {
    plan: string;
    status: string;
    paymentLink?: string;
    billingPeriod?: 'monthly' | 'yearly';
  };
  payoutMinimum?: number;
}

export const PaymentManagement = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showGlobalPayoutModal, setShowGlobalPayoutModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryMonths, setExpiryMonths] = useState(1);
  const [addonCount, setAddonCount] = useState(1);
  const [downgradePlan, setDowngradePlan] = useState('free');
  const [payoutMinimum, setPayoutMinimum] = useState(1000);
  const [globalPayoutMinimum, setGlobalPayoutMinimum] = useState(5000);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'pending' | 'all'>('pending');

  useEffect(() => {
    loadRequests();
    loadUsers();
    loadGlobalSettings();
  }, []);

  const loadGlobalSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'adminSettings', 'global'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setGlobalPayoutMinimum(data.globalPayoutMinimum || 5000);
      }
    } catch (error) {
      console.error('Error loading global settings:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'paymentRequests'));
      const requestsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          processedAt: data.processedAt?.toDate?.() || data.processedAt,
          expiryDate: data.expiryDate?.toDate?.() || data.expiryDate
        } as PaymentRequest;
      }).sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.email,
          email: data.email,
          subscription: data.subscription || { plan: 'free', status: 'inactive' },
          payoutMinimum: data.payoutMinimum
        } as UserData;
      }).filter(user => user.subscription.plan !== 'free');
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSendPaymentLink = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setExpiryMonths(1);
    setAddonCount(1);
    setPaymentLink(request.paymentLink || '');
    setIsRecurring(request.isRecurring !== false);
    setShowLinkModal(true);
  };

  const sendPaymentLink = async () => {
    if (!selectedRequest || !paymentLink) {
      alert('Please enter payment link');
      return;
    }

    setProcessing(selectedRequest.id);
    try {
      const requestRef = doc(db, 'paymentRequests', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'payment_link_sent',
        paymentLink,
        isRecurring,
        processedAt: serverTimestamp(),
        notes,
      });

      alert('Payment link sent to user!');
      await loadRequests();

      setPaymentLink('');
      setNotes('');
      setShowLinkModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error sending payment link:', error);
      const errorMessage = error.message || 'Failed to send payment link. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmPayment = async (request: PaymentRequest) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', request.userId));
      const userData = userDoc.data();
      const enrichedRequest = {
        ...request,
        userSubscriptionId: userData?.subscriptionId
      };
      setSelectedRequest(enrichedRequest);
      setExpiryMonths(1);
      setAddonCount(1);
      setTransactionId((request as any).userTransactionId || '');
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error loading user data:', error);
      setSelectedRequest(request);
      setExpiryMonths(1);
      setAddonCount(1);
      setTransactionId((request as any).userTransactionId || '');
      setShowConfirmModal(true);
    }
  };

  const confirmPayment = async () => {
    if (!selectedRequest || !transactionId) {
      alert('Please enter transaction ID');
      return;
    }

    setProcessing(selectedRequest.id);
    try {
      const requestRef = doc(db, 'paymentRequests', selectedRequest.id);
      const userRef = doc(db, 'users', selectedRequest.userId);

      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      let expiryDate: Date | undefined;

      if (selectedRequest.type === 'subscription' && selectedRequest.plan) {
        expiryDate = new Date();
        const isYearly = selectedRequest.plan.includes('yearly');
        expiryDate.setMonth(expiryDate.getMonth() + (isYearly ? 12 : expiryMonths));

        const userData = userDoc.data();
        const existingSubscription = userData?.subscription || {};

        await updateDoc(userRef, {
          subscription: {
            ...existingSubscription,
            plan: selectedRequest.plan,
            status: 'active',
            billingPeriod: isYearly ? 'yearly' : 'monthly',
            paymentLink: selectedRequest.isRecurring ? selectedRequest.paymentLink : null,
            nextBillingDate: Timestamp.fromDate(expiryDate),
          }
        });
      } else if (selectedRequest.type === 'addon' && selectedRequest.addonType) {
        const userData = userDoc.data();
        const existingSubscription = userData?.subscription || {};
        const currentAddons = existingSubscription.addons || {};

        const updatedAddons = {
          ...currentAddons,
          [selectedRequest.addonType === 'bot' ? 'extraBots' : 'aiBots']: addonCount
        };

        await updateDoc(userRef, {
          subscription: {
            ...existingSubscription,
            addons: updatedAddons,
          }
        });
      }

      await updateDoc(requestRef, {
        status: 'paid',
        processedAt: serverTimestamp(),
        transactionId,
        expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
      });

      const paymentAmount = selectedRequest.amount || (selectedRequest.plan ? getPlanAmount(selectedRequest.plan) : 0);

      const metadata: Record<string, any> = {};
      if (selectedRequest.plan) {
        metadata.planId = selectedRequest.plan;
      }
      if (selectedRequest.addonType) {
        metadata.addonType = selectedRequest.addonType;
      }
      if (expiryDate) {
        metadata.expiryDate = Timestamp.fromDate(expiryDate);
      }
      if (selectedRequest.type === 'subscription') {
        metadata.expiryMonths = expiryMonths;
        metadata.billingPeriod = selectedRequest.plan?.includes('yearly') ? 'yearly' : 'monthly';
      }
      if (selectedRequest.type === 'addon') {
        metadata.addonCount = addonCount;
      }

      await setDoc(doc(collection(db, 'payments')), {
        userId: selectedRequest.userId,
        userEmail: selectedRequest.userEmail,
        userName: selectedRequest.userName,
        type: selectedRequest.type,
        amount: paymentAmount,
        status: 'captured',
        transactionId,
        createdAt: serverTimestamp(),
        metadata,
      });

      if (selectedRequest.type === 'subscription' && selectedRequest.plan) {
        await trackSubscriptionCommission(
          selectedRequest.userId,
          selectedRequest.plan,
          paymentAmount
        );
      }

      if (selectedRequest.type === 'addon' && selectedRequest.addonType) {
        await trackSubscriptionCommission(
          selectedRequest.userId,
          selectedRequest.addonType === 'bot' ? 'addon_bot' : 'addon_ai_bot',
          paymentAmount
        );
      }

      alert('Payment confirmed and user plan activated!');
      await loadRequests();
      await loadUsers();
      setShowConfirmModal(false);
      setSelectedRequest(null);
      setTransactionId('');
      setExpiryMonths(1);
      setAddonCount(1);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      const errorMessage = error.message || 'Failed to confirm payment. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this payment request?')) {
      return;
    }

    setProcessing(requestId);
    try {
      const requestRef = doc(db, 'paymentRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: serverTimestamp(),
      });

      alert('Payment request rejected.');
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDowngrade = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setSelectedUser(null);
    setDowngradePlan('free');
    setShowDowngradeModal(true);
  };

  const handleDowngradeUser = (user: UserData) => {
    setSelectedUser(user);
    setSelectedRequest(null);
    setDowngradePlan('free');
    setShowDowngradeModal(true);
  };

  const confirmDowngrade = async () => {
    const userName = selectedRequest?.userName || selectedUser?.name || '';
    const userId = selectedRequest?.userId || selectedUser?.id || '';

    if (!userId) return;

    if (!confirm(`Are you sure you want to downgrade ${userName} to ${downgradePlan} plan?`)) {
      return;
    }

    setProcessing(userId);
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const existingSubscription = userData?.subscription || {};

      await updateDoc(userRef, {
        subscription: {
          ...existingSubscription,
          plan: downgradePlan,
          status: downgradePlan === 'free' ? 'inactive' : 'active',
          paymentLink: null,
          addons: {},
        }
      });

      alert(`User downgraded to ${downgradePlan} plan successfully!`);
      setShowDowngradeModal(false);
      setSelectedRequest(null);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error downgrading plan:', error);
      alert('Failed to downgrade plan. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleEditPayoutLimit = (user: UserData) => {
    setSelectedUser(user);
    setPayoutMinimum(user.payoutMinimum || globalPayoutMinimum);
    setShowPayoutModal(true);
  };

  const savePayoutLimit = async () => {
    if (!selectedUser) return;

    setProcessing(selectedUser.id);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        payoutMinimum: payoutMinimum
      });

      alert('Payout minimum updated successfully!');
      setShowPayoutModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating payout limit:', error);
      alert('Failed to update payout limit. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const saveGlobalPayoutLimit = async () => {
    try {
      const settingsRef = doc(db, 'adminSettings', 'global');
      await updateDoc(settingsRef, {
        globalPayoutMinimum: globalPayoutMinimum
      });

      alert('Global payout minimum updated successfully!');
      setShowGlobalPayoutModal(false);
    } catch (error) {
      console.error('Error updating global payout limit:', error);
      alert('Failed to update global payout limit. Please try again.');
    }
  };

  const handleEditPaymentLink = async (user: UserData) => {
    const newLink = prompt('Enter new recurring payment link:', user.subscription.paymentLink || '');
    if (newLink === null) return;

    setProcessing(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const existingSubscription = userData?.subscription || {};

      await updateDoc(userRef, {
        subscription: {
          ...existingSubscription,
          paymentLink: newLink || null,
        }
      });

      alert('Payment link updated successfully!');
      await loadUsers();
    } catch (error) {
      console.error('Error updating payment link:', error);
      alert('Failed to update payment link. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      payment_link_sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'payment_link_sent');
  const allRequests = requests;
  const getRequestTimestamp = (request: PaymentRequest) => {
    const processedAtTime = request.processedAt instanceof Date ? request.processedAt.getTime() : 0;
    const createdAtTime = request.createdAt instanceof Date ? request.createdAt.getTime() : 0;
    return processedAtTime || createdAtTime;
  };
  const recentUpgrades = requests
    .filter((request) => request.type === 'subscription' && request.status === 'paid' && request.plan)
    .sort((a, b) => getRequestTimestamp(b) - getRequestTimestamp(a))
    .slice(0, 8);

  const renderTabContent = () => {
    if (activeTab === 'subscriptions') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Subscriptions</h2>
            <button
              onClick={() => setShowGlobalPayoutModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Global Payout Limit
            </button>
          </div>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">New Upgrades</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {recentUpgrades.length} recent
              </span>
            </div>
            {recentUpgrades.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent paid upgrades yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentUpgrades.map((upgrade) => (
                  <div
                    key={upgrade.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{upgrade.userName}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{upgrade.userEmail}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 capitalize">
                        {upgrade.plan?.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(getRequestTimestamp(upgrade)).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No active subscriptions yet
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Current Plan</p>
                          <p className="font-semibold text-gray-900 dark:text-white capitalize">
                            {user.subscription.plan.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Status</p>
                          <p className="font-semibold text-gray-900 dark:text-white capitalize">{user.subscription.status}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Payout Minimum</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ₹{user.payoutMinimum || globalPayoutMinimum}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Payment Link</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.subscription.paymentLink ? 'Active' : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleEditPaymentLink(user)}
                        disabled={processing !== null}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Edit Link
                      </button>
                      <button
                        onClick={() => handleEditPayoutLimit(user)}
                        disabled={processing !== null}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        <DollarSign className="w-4 h-4" />
                        Payout Limit
                      </button>
                      <button
                        onClick={() => handleDowngradeUser(user)}
                        disabled={processing !== null}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        <ArrowDown className="w-4 h-4" />
                        Downgrade
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'pending') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Requests</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No pending requests
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{request.userName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {request.userEmail}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Type</p>
                          <p className="font-semibold text-gray-900 dark:text-white capitalize">{request.type}</p>
                        </div>
                        {request.plan && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Plan</p>
                            <p className="font-semibold text-gray-900 dark:text-white capitalize">
                              {request.plan.replace('_', ' ')}
                            </p>
                          </div>
                        )}
                        {request.addonType && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Addon</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {request.addonType === 'bot' ? 'Extra Bot' : 'AI Bot'}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Date</p>
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {request.paymentLink && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                            Payment Link Sent {request.isRecurring && <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">Recurring</span>}
                          </p>
                          <a href={request.paymentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                            {request.paymentLink}
                          </a>
                        </div>
                      )}
                      {(request as any).userMarkedPaidAt && (request as any).userTransactionId && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            User Reported Payment
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Transaction ID:</strong> {(request as any).userTransactionId}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Reported: {new Date((request as any).userMarkedPaidAt?.toDate?.() || (request as any).userMarkedPaidAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleSendPaymentLink(request)}
                          disabled={processing !== null}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          <Send className="w-4 h-4" />
                          Send Link
                        </button>
                      )}
                      {request.status === 'payment_link_sent' && (
                        <button
                          onClick={() => handleConfirmPayment(request)}
                          disabled={processing !== null}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          <Check className="w-4 h-4" />
                          Confirm
                        </button>
                      )}
                      {request.type === 'subscription' && (
                        <button
                          onClick={() => handleDowngrade(request)}
                          disabled={processing !== null}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          <ArrowDown className="w-4 h-4" />
                          Downgrade
                        </button>
                      )}
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processing !== null}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Payment Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading payment requests...
                  </td>
                </tr>
              ) : allRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No payment requests yet
                  </td>
                </tr>
              ) : (
                allRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{request.userName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{request.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                      {request.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.plan && `${request.plan.replace('_', ' ')}`}
                      {request.addonType && `${request.addonType === 'bot' ? 'Extra Bot' : 'AI Bot'} Addon`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.expiryDate ? new Date(request.expiryDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage subscriptions, payment links, and user accounts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {requests.filter(r => r.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Active Subscriptions
            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All Requests
          </button>
        </nav>
      </div>

      {renderTabContent()}

      {showLinkModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Send Payment Link
            </h3>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedRequest.userName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {selectedRequest.type} - {selectedRequest.plan?.replace('_', ' ') || selectedRequest.addonType}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Link *
                </label>
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://payment-link.com/xyz"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recurring subscription link (works after expiry)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPaymentLink('');
                  setNotes('');
                  setShowLinkModal(false);
                  setSelectedRequest(null);
                }}
                disabled={processing !== null}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={sendPaymentLink}
                disabled={processing !== null || !paymentLink}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {processing ? 'Sending...' : 'Send Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Confirm Payment
            </h3>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedRequest.userName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.userEmail}</p>
                {(selectedRequest as any).userSubscriptionId && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded font-mono text-xs font-semibold">
                      {(selectedRequest as any).userSubscriptionId}
                    </span>
                  </div>
                )}
              </div>
              {(selectedRequest as any).userMarkedPaidAt && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    User reported payment on {new Date((selectedRequest as any).userMarkedPaidAt?.toDate?.() || (selectedRequest as any).userMarkedPaidAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Transaction ID has been pre-filled from user's report
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter transaction ID"
                  required
                />
              </div>
              {selectedRequest.type === 'subscription' && !selectedRequest.plan?.includes('yearly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subscription Duration (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expiryMonths}
                    onChange={(e) => setExpiryMonths(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Expires: {new Date(Date.now() + expiryMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedRequest.type === 'addon' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of {selectedRequest.addonType === 'bot' ? 'Bot' : 'AI Bot'} Slots *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addonCount}
                    onChange={(e) => setAddonCount(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTransactionId('');
                  setExpiryMonths(1);
                  setAddonCount(1);
                  setShowConfirmModal(false);
                  setSelectedRequest(null);
                }}
                disabled={processing !== null}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                disabled={processing !== null || !transactionId}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {processing ? 'Processing...' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDowngradeModal && (selectedRequest || selectedUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Downgrade Plan
            </h3>
            <div className="space-y-4 mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">Warning</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Downgrading will remove all addons, payment links, and reset the user plan limits. This action cannot be undone.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedRequest?.userName || selectedUser?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRequest?.userEmail || selectedUser?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Plan</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {selectedRequest?.plan?.replace('_', ' ') || selectedUser?.subscription.plan.replace('_', ' ') || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Downgrade To *
                </label>
                <select
                  value={downgradePlan}
                  onChange={(e) => setDowngradePlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="starter_yearly">Starter Yearly</option>
                  <option value="growth">Growth</option>
                  <option value="growth_yearly">Growth Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDowngradePlan('free');
                  setShowDowngradeModal(false);
                  setSelectedRequest(null);
                  setSelectedUser(null);
                }}
                disabled={processing !== null}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDowngrade}
                disabled={processing !== null}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDown className="w-5 h-5" />
                {processing ? 'Processing...' : 'Downgrade Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayoutModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Set Payout Minimum
            </h3>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={payoutMinimum}
                  onChange={(e) => setPayoutMinimum(parseInt(e.target.value) || 1000)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Global default: ₹{globalPayoutMinimum}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedUser(null);
                }}
                disabled={processing !== null}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={savePayoutLimit}
                disabled={processing !== null}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {processing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGlobalPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Global Payout Minimum
            </h3>
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This sets the default minimum payout amount for all affiliates. Individual limits can be set per user.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Global Minimum Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={globalPayoutMinimum}
                  onChange={(e) => setGlobalPayoutMinimum(parseInt(e.target.value) || 5000)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGlobalPayoutModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveGlobalPayoutLimit}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
