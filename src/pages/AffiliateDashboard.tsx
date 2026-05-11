import { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Copy, Check, Link as LinkIcon, BarChart3, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AffiliateData {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_balance: number;
  paid_balance: number;
  is_active: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  referred_user_email: string;
  status: 'visited' | 'signed_up' | 'subscribed' | 'churned';
  subscription_plan?: string;
  subscription_amount?: number;
  commission_earned: number;
  commission_paid: boolean;
  visit_date: string;
  signup_date?: string;
  subscription_date?: string;
}

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string;
  requested_at: string;
  processed_at?: string;
}

export const AffiliateDashboard = () => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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
      const affiliateResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/affiliates?user_id=eq.${user.uid}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      const affiliateDataArray = await affiliateResponse.json();
      const affiliate = affiliateDataArray[0];

      if (!affiliate) {
        setLoading(false);
        return;
      }

      setAffiliateData(affiliate);

      const referralsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/affiliate_referrals?affiliate_id=eq.${affiliate.id}&order=visit_date.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      const referralsData = await referralsResponse.json();
      setReferrals(referralsData);

      const payoutsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/affiliate_payouts?affiliate_id=eq.${affiliate.id}&order=requested_at.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      const payoutsData = await payoutsResponse.json();
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = () => {
    if (!affiliateData) return;

    const link = `${window.location.origin}?ref=${affiliateData.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestPayout = async () => {
    if (!affiliateData || payoutAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (payoutAmount > affiliateData.pending_balance) {
      alert('Payout amount exceeds pending balance');
      return;
    }

    if (!paymentDetails) {
      alert('Please enter payment details');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/affiliate_payouts`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            affiliate_id: affiliateData.id,
            amount: payoutAmount,
            payment_method: paymentMethod,
            payment_details: paymentDetails,
            status: 'pending'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to request payout');

      alert('Payout request submitted successfully!');
      setShowPayoutModal(false);
      setPayoutAmount(0);
      setPaymentDetails('');
      fetchAffiliateData();
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Not an Affiliate
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You are not currently enrolled in the affiliate program. Apply to become an affiliate and start earning commissions!
          </p>
          <button
            onClick={() => navigate('/affiliates')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalEarnings: affiliateData.total_earnings,
    pendingBalance: affiliateData.pending_balance,
    paidBalance: affiliateData.paid_balance,
    totalReferrals: affiliateData.total_referrals,
    activeReferrals: referrals.filter(r => r.status === 'subscribed').length,
    commissionRate: affiliateData.commission_rate
  };

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
              value={`${window.location.origin}?ref=${affiliateData.affiliate_code}`}
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
              <span className="font-mono font-bold">{affiliateData.affiliate_code}</span>
            </div>
            <div>
              <span className="text-blue-100">Status:</span>{' '}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                affiliateData.is_active
                  ? 'bg-green-500/20 text-green-100'
                  : 'bg-red-500/20 text-red-100'
              }`}>
                {affiliateData.is_active ? 'Active' : 'Inactive'}
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
              {stats.pendingBalance >= 500 && (
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
            {stats.pendingBalance < 500 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Minimum payout amount is ₹500. Current balance: ₹{stats.pendingBalance.toFixed(2)}
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
                        {new Date(payout.requested_at).toLocaleDateString()}
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
                      {new Date(referral.visit_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {referral.referred_user_email}
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
                      {referral.subscription_plan || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      ₹{referral.commission_earned.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          referral.commission_paid
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {referral.commission_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                Available balance: ₹{stats.pendingBalance.toFixed(2)}
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
                  min="500"
                  max={stats.pendingBalance}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Minimum ₹500"
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
