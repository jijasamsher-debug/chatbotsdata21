import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, query, where, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Check, X, Eye, DollarSign, CreditCard as Edit2, Save, TrendingUp, Wallet, AlertCircle, CalendarDays } from 'lucide-react';

interface AffiliateApplication {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  websiteUrl?: string;
  socialMedia?: string;
  promotionPlan: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

interface Affiliate {
  id: string;
  userId: string;
  userEmail: string;
  affiliateCode: string;
  commissionRate: number;
  totalReferrals: number;
  totalEarnings: number;
  pendingBalance: number;
  paidBalance: number;
  isActive: boolean;
  lifetimeCommissions: boolean;
  minimumWithdrawal?: number;
  createdAt: Date;
}

interface WithdrawalRequest {
  id: string;
  affiliateId: string;
  affiliateEmail: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod?: string;
  paymentDetails?: string;
  requestedAt: Date;
  completedAt?: Date;
  adminNotes?: string;
}

interface PayoutSettings {
  minimumWithdrawal: number;
}

type WithdrawalStatsRange = '7d' | '1m' | '6m' | '1y' | 'custom';

export const AffiliateManagement = () => {
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'affiliates' | 'withdrawals' | 'settings'>('applications');
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionInput, setCommissionInput] = useState<number>(20);
  const [editingMinWithdrawal, setEditingMinWithdrawal] = useState<string | null>(null);
  const [minWithdrawalInput, setMinWithdrawalInput] = useState<number>(500);
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({ minimumWithdrawal: 500 });
  const [showPayoutSettingsModal, setShowPayoutSettingsModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showWithdrawalDetailsModal, setShowWithdrawalDetailsModal] = useState(false);
  const [withdrawalStatsRange, setWithdrawalStatsRange] = useState<WithdrawalStatsRange>('1m');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const appsSnapshot = await getDocs(collection(db, 'affiliateApplications'));
      const appsData = appsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          appliedAt: doc.data().appliedAt?.toDate(),
          reviewedAt: doc.data().reviewedAt?.toDate()
        }))
        .sort((a, b) => (b.appliedAt?.getTime() || 0) - (a.appliedAt?.getTime() || 0)) as AffiliateApplication[];
      setApplications(appsData);

      const affiliatesSnapshot = await getDocs(collection(db, 'affiliates'));
      const affiliatesData = affiliatesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          lifetimeCommissions: doc.data().lifetimeCommissions === true,
          createdAt: doc.data().createdAt?.toDate()
        }))
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)) as Affiliate[];
      setAffiliates(affiliatesData);

      const withdrawalsSnapshot = await getDocs(collection(db, 'withdrawalRequests'));
      const withdrawalsData = withdrawalsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate()
        }))
        .sort((a, b) => (b.requestedAt?.getTime() || 0) - (a.requestedAt?.getTime() || 0)) as WithdrawalRequest[];
      setWithdrawalRequests(withdrawalsData);

      const settingsDoc = await getDocs(collection(db, 'affiliateSettings'));
      if (!settingsDoc.empty) {
        const settingsData = settingsDoc.docs[0].data();
        setPayoutSettings({
          minimumWithdrawal: settingsData.minimumWithdrawal || 500
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load affiliate data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: AffiliateApplication) => {
    if (!confirm(`Approve affiliate application for ${app.userEmail}?`)) return;

    try {
      const affiliateCode = generateAffiliateCode();

      await updateDoc(doc(db, 'affiliateApplications', app.id), {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        adminNotes: adminNotes
      });

      await setDoc(doc(db, 'affiliates', app.userId || `temp_${Date.now()}`), {
        userId: app.userId,
        userEmail: app.userEmail,
        affiliateCode: affiliateCode,
        commissionRate: 20,
        totalReferrals: 0,
        totalEarnings: 0,
        pendingBalance: 0,
        paidBalance: 0,
        isActive: true,
        createdAt: Timestamp.now()
      });

      alert('Affiliate approved successfully!');
      fetchData();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error approving affiliate:', error);
      alert('Failed to approve affiliate');
    }
  };

  const handleReject = async (app: AffiliateApplication) => {
    if (!confirm(`Reject affiliate application for ${app.userEmail}?`)) return;

    try {
      await updateDoc(doc(db, 'affiliateApplications', app.id), {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        adminNotes: adminNotes
      });

      alert('Application rejected');
      fetchData();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      alert('Failed to reject application');
    }
  };

  const generateAffiliateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const openDetails = (app: AffiliateApplication) => {
    setSelectedApp(app);
    setAdminNotes(app.adminNotes || '');
    setShowDetailsModal(true);
  };

  const updateCommissionRate = async (affiliateId: string) => {
    if (commissionInput < 0 || commissionInput > 100) {
      alert('Commission rate must be between 0 and 100');
      return;
    }

    try {
      await updateDoc(doc(db, 'affiliates', affiliateId), {
        commissionRate: commissionInput
      });
      setAffiliates(affiliates.map(a =>
        a.id === affiliateId ? { ...a, commissionRate: commissionInput } : a
      ));
      setEditingCommission(null);
      alert('Commission rate updated successfully');
    } catch (error) {
      console.error('Error updating commission rate:', error);
      alert('Failed to update commission rate');
    }
  };

  const updateMinimumWithdrawal = async (affiliateId: string) => {
    if (minWithdrawalInput < 0) {
      alert('Minimum withdrawal must be a positive number');
      return;
    }

    try {
      await updateDoc(doc(db, 'affiliates', affiliateId), {
        minimumWithdrawal: minWithdrawalInput
      });
      setAffiliates(affiliates.map(a =>
        a.id === affiliateId ? { ...a, minimumWithdrawal: minWithdrawalInput } : a
      ));
      setEditingMinWithdrawal(null);
      alert('Minimum withdrawal updated successfully');
    } catch (error) {
      console.error('Error updating minimum withdrawal:', error);
      alert('Failed to update minimum withdrawal');
    }
  };

  const toggleAffiliateStatus = async (affiliateId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'affiliates', affiliateId), {
        isActive: !currentStatus
      });
      setAffiliates(affiliates.map(a =>
        a.id === affiliateId ? { ...a, isActive: !currentStatus } : a
      ));
    } catch (error) {
      console.error('Error toggling affiliate status:', error);
      alert('Failed to update affiliate status');
    }
  };

  const toggleLifetimeCommissions = async (affiliateId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'affiliates', affiliateId), {
        lifetimeCommissions: !currentValue
      });
      setAffiliates(affiliates.map(a =>
        a.id === affiliateId ? { ...a, lifetimeCommissions: !currentValue } : a
      ));
    } catch (error) {
      console.error('Error toggling lifetime commissions:', error);
      alert('Failed to update lifetime commissions');
    }
  };

  const handleApproveWithdrawal = async (withdrawal: WithdrawalRequest) => {
    if (!confirm(`Approve withdrawal of ₹${withdrawal.amount} for ${withdrawal.affiliateEmail}?`)) return;

    try {
      const affiliate = affiliates.find(a => a.id === withdrawal.affiliateId);
      if (!affiliate) {
        alert('Affiliate not found');
        return;
      }

      if (affiliate.pendingBalance < withdrawal.amount) {
        alert('Insufficient balance');
        return;
      }

      await updateDoc(doc(db, 'withdrawalRequests', withdrawal.id), {
        status: 'completed',
        completedAt: Timestamp.now(),
        adminNotes: adminNotes
      });

      await updateDoc(doc(db, 'affiliates', withdrawal.affiliateId), {
        pendingBalance: affiliate.pendingBalance - withdrawal.amount,
        paidBalance: affiliate.paidBalance + withdrawal.amount
      });

      alert('Withdrawal approved and processed!');
      fetchData();
      setShowWithdrawalDetailsModal(false);
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (withdrawal: WithdrawalRequest) => {
    if (!confirm(`Reject withdrawal request for ${withdrawal.affiliateEmail}?`)) return;

    try {
      await updateDoc(doc(db, 'withdrawalRequests', withdrawal.id), {
        status: 'rejected',
        completedAt: Timestamp.now(),
        adminNotes: adminNotes
      });

      alert('Withdrawal request rejected');
      fetchData();
      setShowWithdrawalDetailsModal(false);
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Failed to reject withdrawal');
    }
  };

  const savePayoutSettings = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'affiliateSettings'));

      if (settingsSnapshot.empty) {
        await addDoc(collection(db, 'affiliateSettings'), {
          minimumWithdrawal: payoutSettings.minimumWithdrawal,
          updatedAt: Timestamp.now()
        });
      } else {
        await updateDoc(doc(db, 'affiliateSettings', settingsSnapshot.docs[0].id), {
          minimumWithdrawal: payoutSettings.minimumWithdrawal,
          updatedAt: Timestamp.now()
        });
      }

      alert('Payout settings saved successfully');
      setShowPayoutSettingsModal(false);
    } catch (error) {
      console.error('Error saving payout settings:', error);
      alert('Failed to save payout settings');
    }
  };

  const openWithdrawalDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNotes(withdrawal.adminNotes || '');
    setShowWithdrawalDetailsModal(true);
  };

  const stats = {
    totalApplications: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    activeAffiliates: affiliates.filter(a => a.isActive).length,
    totalEarnings: affiliates.reduce((sum, a) => sum + a.totalEarnings, 0),
    pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length,
    totalPendingAmount: withdrawalRequests
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0)
  };

  const completedWithdrawals = withdrawalRequests.filter(
    (w) => w.status === 'completed' && w.completedAt
  );

  const totalDistributedAmount = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const getDateRangeForStats = () => {
    const now = new Date();

    if (withdrawalStatsRange === 'custom') {
      if (!customStartDate || !customEndDate) {
        return { start: null as Date | null, end: null as Date | null };
      }

      const start = new Date(`${customStartDate}T00:00:00`);
      const end = new Date(`${customEndDate}T23:59:59.999`);
      return { start, end };
    }

    const start = new Date(now);
    if (withdrawalStatsRange === '7d') {
      start.setDate(start.getDate() - 7);
    } else if (withdrawalStatsRange === '1m') {
      start.setMonth(start.getMonth() - 1);
    } else if (withdrawalStatsRange === '6m') {
      start.setMonth(start.getMonth() - 6);
    } else if (withdrawalStatsRange === '1y') {
      start.setFullYear(start.getFullYear() - 1);
    }

    return { start, end: now };
  };

  const selectedDateRange = getDateRangeForStats();

  const distributedInRange = completedWithdrawals.filter((w) => {
    if (!selectedDateRange.start || !selectedDateRange.end || !w.completedAt) return false;
    return w.completedAt >= selectedDateRange.start && w.completedAt <= selectedDateRange.end;
  });

  const distributedInRangeAmount = distributedInRange.reduce((sum, w) => sum + w.amount, 0);

  const rangeLabelMap: Record<WithdrawalStatsRange, string> = {
    '7d': 'Last 7 Days',
    '1m': 'Last 1 Month',
    '6m': 'Last 6 Months',
    '1y': 'Last 1 Year',
    custom: 'Custom Date Range'
  };

  const hasValidCustomRange =
    withdrawalStatsRange !== 'custom' ||
    (!!customStartDate && !!customEndDate && new Date(customStartDate) <= new Date(customEndDate));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Affiliate Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage affiliate applications and commission rates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Applications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeAffiliates}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalEarnings.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'affiliates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Active Affiliates
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors relative ${
              activeTab === 'withdrawals'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Withdrawals
            {stats.pendingWithdrawals > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {stats.pendingWithdrawals}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === 'applications' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {app.appliedAt?.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {app.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {app.userEmail}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            app.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              : app.status === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetails(app)}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  handleApprove(app);
                                }}
                                className="text-green-600 hover:text-green-700 font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  handleReject(app);
                                }}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'affiliates' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Commission %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Referrals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Total Earned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Min Withdrawal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Lifetime Commissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {affiliate.userEmail}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">
                        {affiliate.affiliateCode}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingCommission === affiliate.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={commissionInput}
                              onChange={(e) => setCommissionInput(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              onClick={() => updateCommissionRate(affiliate.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingCommission(null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-900 dark:text-white font-bold">
                              {affiliate.commissionRate}%
                            </span>
                            <button
                              onClick={() => {
                                setEditingCommission(affiliate.id);
                                setCommissionInput(affiliate.commissionRate);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {affiliate.totalReferrals}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        ₹{affiliate.totalEarnings.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        ₹{affiliate.pendingBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingMinWithdrawal === affiliate.id ? (
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-900 dark:text-white">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={minWithdrawalInput}
                              onChange={(e) => setMinWithdrawalInput(parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              onClick={() => updateMinimumWithdrawal(affiliate.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingMinWithdrawal(null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-900 dark:text-white font-bold">
                              ₹{affiliate.minimumWithdrawal || payoutSettings.minimumWithdrawal}
                            </span>
                            <button
                              onClick={() => {
                                setEditingMinWithdrawal(affiliate.id);
                                setMinWithdrawalInput(affiliate.minimumWithdrawal || payoutSettings.minimumWithdrawal);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleLifetimeCommissions(affiliate.id, affiliate.lifetimeCommissions)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            affiliate.lifetimeCommissions
                              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                              : 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {affiliate.lifetimeCommissions ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.isActive)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            affiliate.isActive
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {affiliate.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.isActive)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Pending Withdrawals</h3>
                  <p className="text-blue-100">Total amount pending: ₹{stats.totalPendingAmount.toFixed(2)}</p>
                </div>
                <Wallet className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Distributed Withdrawal Stats
                </h3>

                <div className="flex flex-wrap gap-2">
                  {([
                    { key: '7d', label: '7 Days' },
                    { key: '1m', label: '1 Month' },
                    { key: '6m', label: '6 Months' },
                    { key: '1y', label: '1 Year' },
                    { key: 'custom', label: 'Custom' }
                  ] as { key: WithdrawalStatsRange; label: string }[]).map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setWithdrawalStatsRange(option.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        withdrawalStatsRange === option.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {withdrawalStatsRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {!hasValidCustomRange && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Please select a valid custom date range (start date should be before end date).
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Distributed (Till Date)</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalDistributedAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {completedWithdrawals.length} completed withdrawals
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Distributed ({rangeLabelMap[withdrawalStatsRange]})</p>
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{hasValidCustomRange ? distributedInRangeAmount.toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {hasValidCustomRange ? distributedInRange.length : 0} withdrawals in selected range
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Affiliate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {withdrawalRequests.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {withdrawal.requestedAt?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {withdrawal.affiliateEmail}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          ₹{withdrawal.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {withdrawal.paymentMethod || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              withdrawal.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                : withdrawal.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openWithdrawalDetails(withdrawal)}
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    handleApproveWithdrawal(withdrawal);
                                  }}
                                  className="text-green-600 hover:text-green-700 font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    handleRejectWithdrawal(withdrawal);
                                  }}
                                  className="text-red-600 hover:text-red-700 font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {withdrawalRequests.length === 0 && (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No withdrawal requests yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payout Settings</h2>

            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Minimum Withdrawal Amount
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={payoutSettings.minimumWithdrawal}
                    onChange={(e) => setPayoutSettings({ ...payoutSettings, minimumWithdrawal: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Default minimum amount affiliates can withdraw. This can be customized per affiliate in the Active Affiliates tab.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={savePayoutSettings}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Application Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedApp.fullName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedApp.userEmail}</p>
              </div>

              {selectedApp.websiteUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <a
                    href={selectedApp.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 mt-1 block"
                  >
                    {selectedApp.websiteUrl}
                  </a>
                </div>
              )}

              {selectedApp.socialMedia && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Social Media
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">{selectedApp.socialMedia}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Promotion Plan
                </label>
                <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {selectedApp.promotionPlan}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Add notes about this application..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedApp)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawalDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Withdrawal Request Details
              </h3>
              <button
                onClick={() => setShowWithdrawalDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Affiliate Email
                </label>
                <p className="text-gray-900 dark:text-white mt-1">{selectedWithdrawal.affiliateEmail}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Withdrawal Amount
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ₹{selectedWithdrawal.amount.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Method
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {selectedWithdrawal.paymentMethod || 'Not specified'}
                </p>
              </div>

              {selectedWithdrawal.paymentDetails && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Details
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                    {selectedWithdrawal.paymentDetails}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requested Date
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {selectedWithdrawal.requestedAt?.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <p className="mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedWithdrawal.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        : selectedWithdrawal.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {selectedWithdrawal.status}
                  </span>
                </p>
              </div>

              {selectedWithdrawal.completedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Completed Date
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedWithdrawal.completedAt?.toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Add notes about this withdrawal..."
                  disabled={selectedWithdrawal.status !== 'pending'}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleRejectWithdrawal(selectedWithdrawal)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveWithdrawal(selectedWithdrawal)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Approve & Process
                  </button>
                </>
              )}
              <button
                onClick={() => setShowWithdrawalDetailsModal(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
