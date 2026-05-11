import { useState, useEffect } from 'react';
import { Bot, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export const Usage = () => {
  const { user } = useAuth();
  const [botCount, setBotCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, [user]);

  const loadUsageData = async () => {
    if (!user) return;

    try {
      const botsQuery = query(
        collection(db, 'bots'),
        where('ownerId', '==', user.uid)
      );
      const botsSnapshot = await getDocs(botsQuery);
      setBotCount(botsSnapshot.size);

      const leadsQuery = query(
        collection(db, 'leads'),
        where('ownerId', '==', user.uid)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      setLeadCount(leadsSnapshot.size);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const chatsQuery = query(
        collection(db, 'chats'),
        where('userId', '==', user.uid),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      setChatCount(chatsSnapshot.size);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const plan = user.subscription?.plan || 'free';
  const addons = user.subscription?.addons || {};

  const defaultBotLimit = plan === 'free' ? 3 : plan === 'starter' ? 3 + (addons.extraBots || 0) : 6 + (addons.extraBots || 0);

  const botLimit = user.botLimit ?? defaultBotLimit;

  const getProgressColor = (used: number, limit: number) => {
    if (limit <= 0) return 'bg-blue-600';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usage & Limits</h1>
        <Link
          to="/billing"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          Upgrade Plan
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Lead Gen Bots</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {botCount} of {botLimit} used
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {botCount}/{botLimit}
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${getProgressColor(botCount, botLimit)} transition-all duration-300`}
              style={{ width: `${botLimit > 0 ? Math.min((botCount / botLimit) * 100, 100) : 0}%` }}
            ></div>
          </div>
          {botCount >= botLimit && botLimit > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              You've reached your bot limit. Upgrade to create more bots.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Total Leads</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">All time</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{leadCount}</div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span>Collecting leads</span>
          </div>
          {plan === 'free' && leadCount > 30 && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
              Free plan: Only first 30 leads are visible. Upgrade to unlock all.
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Chats This Month</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleString('default', { month: 'long' })}
              </p>
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{chatCount}</div>
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span>Conversations</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Need More Resources?</h2>
        <p className="mb-6 text-blue-100">
          Upgrade your plan to get more bots and unlock all your leads.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/billing"
            className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-colors"
          >
            View Plans
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
          >
            Compare Plans
          </Link>
        </div>
      </div>
    </div>
  );
};
