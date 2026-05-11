import { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DollarSign, Users, TrendingUp, Copy, Check, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AffiliateData {
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
  minimumWithdrawal?: number;
  createdAt: Date;
}

interface Referral {
  id: string;
  affiliateId: string;
  referredUserEmail: string;
  referredUserId?: string;
  status: 'visited' | 'signed_up' | 'subscribed' | 'churned';
  subscriptionPlan?: string;
  subscriptionAmount?: number;
  commissionEarned: number;
  commissionPaid: boolean;
  visitDate: Date;
  signupDate?: Date;
  subscriptionDate?: Date;
}

interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: string;
  paymentDetails: string;
  requestedAt: Date;
  processedAt?: Date;
}

export const AffiliateDashboardNew = () => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [effectiveMinimumWithdrawal, setEffectiveMinimumWithdrawal] = useState(500);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    socialMedia: '',
    promotionPlan: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || user.displayName || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAffiliateData();
  }, [user, navigate]);

  const fetchAffiliateData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const affiliatesSnapshot = await getDocs(
        query(collection(db, 'affiliates'), where('userId', '==', user.uid))
      );

      if (affiliatesSnapshot.empty) {
        setLoading(false);
        return;
      }

      const affiliateDoc = affiliatesSnapshot.docs[0];
      const affiliate = {
        id: affiliateDoc.id,
        ...affiliateDoc.data(),
        createdAt: affiliateDoc.data().createdAt?.toDate()
      } as AffiliateData;

      setAffiliateData(affiliate);

      const settingsSnapshot = await getDocs(collection(db, 'affiliateSettings'));
      let globalMinimumWithdrawal = 500;
      if (!settingsSnapshot.empty) {
        const settings = settingsSnapshot.docs[0].data();
        globalMinimumWithdrawal = settings.minimumWithdrawal || 500;
      }

      const userMinimumWithdrawal =
        typeof affiliate.minimumWithdrawal === 'number' ? affiliate.minimumWithdrawal : globalMinimumWithdrawal;
      setEffectiveMinimumWithdrawal(userMinimumWithdrawal);

      const referralsSnapshot = await getDocs(
        query(collection(db, 'affiliateReferrals'), where('affiliateId', '==', affiliateDoc.id))
      );
      const referralsData = referralsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          visitDate: doc.data().visitDate?.toDate(),
          signupDate: doc.data().signupDate?.toDate(),
          subscriptionDate: doc.data().subscriptionDate?.toDate()
        }))
        .sort((a, b) => (b.visitDate?.getTime() || 0) - (a.visitDate?.getTime() || 0)) as Referral[];
      setReferrals(referralsData);

      const payoutsSnapshot = await getDocs(
        query(collection(db, 'withdrawalRequests'), where('affiliateId', '==', affiliateDoc.id))
      );
      const payoutsData = payoutsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          requestedAt: doc.data().requestedAt?.toDate(),
          processedAt: doc.data().completedAt?.toDate()
        }))
        .sort((a, b) => (b.requestedAt?.getTime() || 0) - (a.requestedAt?.getTime() || 0)) as Payout[];
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = () => {
    if (!affiliateData) return;

    const link = `${window.location.origin}?ref=${affiliateData.affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestPayout = async () => {
    if (!affiliateData || payoutAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const hasOpenPayoutRequest = payouts.some(
      (payout) => payout.status === 'pending' || payout.status === 'processing'
    );

    if (hasOpenPayoutRequest) {
      alert('You already have a payout request in process. Please wait for it to complete.');
      return;
    }

    const userMinWithdrawal = effectiveMinimumWithdrawal;

    if (payoutAmount < userMinWithdrawal) {
      alert(`Minimum withdrawal amount is ₹${userMinWithdrawal}`);
      return;
    }

    if (payoutAmount > affiliateData.pendingBalance) {
      alert('Withdrawal amount exceeds pending balance');
      return;
    }

    if (!paymentDetails) {
      alert('Please enter payment details');
      return;
    }

    try {
      await addDoc(collection(db, 'withdrawalRequests'), {
        affiliateId: affiliateData.id,
        affiliateEmail: affiliateData.userEmail,
        amount: payoutAmount,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails,
        status: 'pending',
        requestedAt: Timestamp.now()
      });

      alert('Withdrawal request submitted successfully! Admin will review and process it soon.');
      setShowPayoutModal(false);
      setPayoutAmount(0);
      setPaymentDetails('');
      fetchAffiliateData();
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
    }
  };

  const handleAffiliateApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'affiliateApplications'), {
        userId: user.uid,
        userEmail: formData.email || user.email,
        fullName: formData.name,
        websiteUrl: formData.website,
        socialMedia: formData.socialMedia,
        promotionPlan: formData.promotionPlan,
        status: 'pending',
        appliedAt: Timestamp.now()
      });

      setSubmitted(true);
      setFormData({
        name: user.name || user.displayName || '',
        email: user.email || '',
        website: '',
        socialMedia: '',
        promotionPlan: ''
      });
    } catch (error) {
      console.error('Error submitting affiliate application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Apply to Join Our Affiliate Program
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
            Submit your application to become an affiliate partner and start earning commissions.
          </p>

          {submitted ? (
            <div className="text-center py-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ll review your application and get back to you within 2-3 business days.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleAffiliateApplicationSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website / Social Media URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Social Media / Additional URL
                </label>
                <input
                  type="text"
                  value={formData.socialMedia}
                  onChange={(e) => setFormData({ ...formData, socialMedia: e.target.value })}
                  placeholder="e.g., Twitter, LinkedIn, YouTube channel"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How will you promote Flood.chat? *
                </label>
                <textarea
                  required
                  value={formData.promotionPlan}
                  onChange={(e) => setFormData({ ...formData, promotionPlan: e.target.value })}
                  rows={4}
                  placeholder="Describe your audience and promotion strategy"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-semibold text-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const stats = {
    totalEarnings: affiliateData.totalEarnings,
    pendingBalance: affiliateData.pendingBalance,
    paidBalance: affiliateData.paidBalance,
    totalReferrals: affiliateData.totalReferrals,
    activeReferrals: referrals.filter(r => r.status === 'subscribed').length,
    commissionRate: affiliateData.commissionRate
  };
  const processingPayoutAmount = payouts
    .filter((payout) => payout.status === 'pending' || payout.status === 'processing')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const withdrawableBalance = Math.max(0, stats.pendingBalance - processingPayoutAmount);
  const hasOpenPayoutRequest = processingPayoutAmount > 0;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Affiliate Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your referrals and earnings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₹{stats.totalEarnings.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Balance</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              ₹{stats.pendingBalance.toFixed(2)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</p>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalReferrals}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Commission Rate</p>
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.commissionRate}%
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Your Affiliate Link</h3>
              <p className="text-blue-100">Share this link to earn {stats.commissionRate}% commission</p>
            </div>
            <LinkIcon className="w-8 h-8" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${window.location.origin}?ref=${affiliateData.affiliateCode}`}
              readOnly
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
            <button
              onClick={copyAffiliateLink}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div>
              <span className="text-blue-100">Code:</span>{' '}
              <span className="font-mono font-bold">{affiliateData.affiliateCode}</span>
            </div>
            <div>
              <span className="text-blue-100">Status:</span>{' '}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                affiliateData.isActive
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-red-500/20 text-red-100'
              }`}>
                {affiliateData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Payout Summary
              </h3>
              {!hasOpenPayoutRequest && withdrawableBalance >= effectiveMinimumWithdrawal && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Request Payout
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pending Balance</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  ₹{stats.pendingBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">In Processing</span>
                <span className="font-bold text-yellow-600">
                  ₹{processingPayoutAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Available to Withdraw</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  ₹{withdrawableBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Paid Out</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  ₹{stats.paidBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Earned</span>
                <span className="font-bold text-blue-600">
                  ₹{stats.totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>
            {hasOpenPayoutRequest && (
              <p className="text-sm text-yellow-600 mt-4">
                A payout request is already in process. New requests are disabled until it is completed.
              </p>
            )}
            {!hasOpenPayoutRequest && withdrawableBalance < effectiveMinimumWithdrawal && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Minimum payout amount is ₹{effectiveMinimumWithdrawal}. Available balance: ₹{withdrawableBalance.toFixed(2)}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recent Payouts
            </h3>
            {payouts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No payout requests yet
              </p>
            ) : (
              <div className="space-y-3">
                {payouts.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹{payout.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payout.requestedAt?.toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : payout.status === 'processing'
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : payout.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Referrals ({referrals.length})
            </h3>
          </div>
          {referrals.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No referrals yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {referrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {referral.visitDate?.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {referral.referredUserEmail}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'subscribed'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : referral.status === 'signed_up'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : referral.status === 'churned'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white capitalize">
                        {referral.subscriptionPlan || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        ₹{referral.commissionEarned.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            referral.commissionPaid
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          }`}
                        >
                          {referral.commissionPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Request Payout
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Available balance: ₹{withdrawableBalance.toFixed(2)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  min={effectiveMinimumWithdrawal}
                  max={withdrawableBalance}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={`Minimum ₹${effectiveMinimumWithdrawal}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {paymentMethod === 'upi' ? 'UPI ID' : 'Bank Account Details'}
                </label>
                <textarea
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder={
                    paymentMethod === 'upi'
                      ? 'yourname@upi'
                      : 'Account Number, IFSC, Account Holder Name'
                  }
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={requestPayout}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Request Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
