import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, QueryConstraint, Timestamp, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions as cloudFunctions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Plus, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { Bot as BotType, Lead } from '../types';
import { PaymentRequestBanner } from '../components/PaymentRequestBanner';

export const Dashboard = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [profileTotalLeadsCount, setProfileTotalLeadsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isFreePlan = (user?.subscription?.plan || user?.plan || 'free') === 'free';
  const effectiveTotalLeadsCount = profileTotalLeadsCount ?? user?.totalLeadsCount ?? totalLeadsCount;
  const hiddenLeadsCount = isFreePlan ? Math.max((user?.totalLeadsCount ?? totalLeadsCount) - 30, 0) : 0;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        let resolvedTotalCount: number | null = null;
        let resolvedCutoffDate: Date | null = user.freeLeadVisibleUntil || null;

        const userProfileSnap = await getDoc(doc(db, 'users', user.uid));
        if (userProfileSnap.exists()) {
          const profileData = userProfileSnap.data();
          const profileCount = profileData.totalLeadsCount;
          const profileCutoff = profileData.freeLeadVisibleUntil?.toDate?.();
          resolvedTotalCount = typeof profileCount === 'number' ? profileCount : null;
          resolvedCutoffDate = profileCutoff || resolvedCutoffDate;
        }

        if (isFreePlan && (resolvedTotalCount === null || (resolvedTotalCount > 30 && !resolvedCutoffDate))) {
          try {
            const syncLeadStats = httpsCallable(cloudFunctions, 'syncMyLeadStats');
            const syncResult = await syncLeadStats();
            const syncData = syncResult.data as {
              totalLeadsCount?: number;
              freeLeadVisibleUntil?: string | null;
            };

            if (typeof syncData.totalLeadsCount === 'number') {
              resolvedTotalCount = syncData.totalLeadsCount;
            }
            if (syncData.freeLeadVisibleUntil) {
              resolvedCutoffDate = new Date(syncData.freeLeadVisibleUntil);
            }
          } catch (syncError) {
            console.warn('syncMyLeadStats failed, using fallback lead queries', syncError);
          }
        }

        if (resolvedTotalCount === null) {
          const fallbackCountSnapshot = await getCountFromServer(
            query(collection(db, 'leads'), where('ownerId', '==', user.uid))
          );
          resolvedTotalCount = fallbackCountSnapshot.data().count;
        }

        setProfileTotalLeadsCount(resolvedTotalCount);

        const botsQuery = query(
          collection(db, 'bots'),
          where('ownerId', '==', user.uid)
        );
        const botsSnapshot = await getDocs(botsQuery);
        const botsData = botsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
          .filter(bot => bot.createdAt)
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)) as BotType[];
        setBots(botsData);

        if (!isFreePlan) {
          const totalCountSnapshot = await getCountFromServer(
            query(collection(db, 'leads'), where('ownerId', '==', user.uid))
          );
          const serverTotalCount = totalCountSnapshot.data().count;
          setTotalLeadsCount(serverTotalCount);
        } else {
          setTotalLeadsCount(resolvedTotalCount);
        }

        const leadConstraints: QueryConstraint[] = [where('ownerId', '==', user.uid)];

        if (isFreePlan && resolvedCutoffDate) {
          leadConstraints.push(where('collectedAt', '<=', Timestamp.fromDate(resolvedCutoffDate)));
        }

        const leadsQuery = query(collection(db, 'leads'), ...leadConstraints);
        const leadsSnapshot = await getDocs(leadsQuery);
        let leadsData = leadsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            collectedAt: doc.data().collectedAt?.toDate()
          }))
          .sort((a, b) => (b.collectedAt?.getTime() || 0) - (a.collectedAt?.getTime() || 0)) as Lead[];

        if (isFreePlan && !resolvedCutoffDate) {
          leadsData = [...leadsData]
            .sort((a, b) => (a.collectedAt?.getTime() || 0) - (b.collectedAt?.getTime() || 0))
            .slice(0, 30)
            .sort((a, b) => (b.collectedAt?.getTime() || 0) - (a.collectedAt?.getTime() || 0));
        }

        leadsData = leadsData.slice(0, 10);
        setLeads(leadsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isFreePlan, user?.freeLeadVisibleUntil]);

  const getDaysRemaining = () => {
    if (!user?.trialEndsAt) return 0;
    const now = new Date();
    const diff = user.trialEndsAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();
  const showTrialBanner = user?.trialActive && user?.subscription?.plan === 'free' && daysRemaining > 0;

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <PaymentRequestBanner />

        {showTrialBanner && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              daysRemaining < 3
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle
                  className={`w-5 h-5 ${
                    daysRemaining < 3 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                  }`}
                />
                <p
                  className={`ml-3 ${
                    daysRemaining < 3 ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'
                  }`}
                >
                  Your free trial ends in <strong>{daysRemaining} days</strong>
                </p>
              </div>
              <Link
                to="/dashboard/upgrade"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  daysRemaining < 3
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400">Here's an overview of your chatbots and leads.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{bots.length}</h3>
            <p className="text-gray-600 dark:text-gray-400">Active Bots</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{effectiveTotalLeadsCount}</h3>
            <p className="text-gray-600 dark:text-gray-400">Total Leads (All Time)</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
              {user?.trialActive && user?.subscription?.status === 'trial' && daysRemaining > 0
                ? `${user?.subscription?.plan || 'Free'} (Trial)`
                : user?.subscription?.plan || 'Free'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.trialActive && user?.subscription?.status === 'trial' && daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : 'Current Plan'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Bots</h2>
              <Link
                to="/dashboard/bots/new"
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Bot
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : bots.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No bots yet</p>
                <Link
                  to="/dashboard/bots/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Bot
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bots.map((bot) => (
                  <Link
                    key={bot.id}
                    to={`/dashboard/bots/${bot.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{bot.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Leads Generator
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {bot.createdAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Leads</h2>
              <Link
                to="/dashboard/leads"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No leads collected yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hiddenLeadsCount > 0 && (
                  <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      {hiddenLeadsCount} newest lead{hiddenLeadsCount !== 1 ? 's are' : ' is'} hidden on free plan.
                      Upgrade to unlock full access.
                    </p>
                  </div>
                )}
                {leads.map((lead) => {
                  const getDisplayName = () => {
                    const answers = lead.answers || {};
                    const keys = Object.keys(answers);

                    const nameKey = keys.find(k =>
                      k.toLowerCase().includes('name') ||
                      k.toLowerCase() === 'name'
                    );
                    const emailKey = keys.find(k =>
                      k.toLowerCase().includes('email') ||
                      k.toLowerCase() === 'email'
                    );

                    return answers[nameKey || ''] || answers[emailKey || ''] || 'Anonymous';
                  };

                  return (
                    <div
                      key={lead.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lead.collectedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.pageUrl}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
