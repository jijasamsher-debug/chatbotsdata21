import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Settings, BarChart3, CreditCard, Key, Eye, EyeOff, X, Save, Bot as BotIcon, DollarSign, FileText, Mail } from 'lucide-react';
import { User, Lead, AdminSettings as AdminSettingsType, Bot, ContactMessage } from '../types';
import { Link } from 'react-router-dom';
import { BlogManagement } from '../components/BlogManagement';
import { TemplateManagement } from '../components/TemplateManagement';

interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  plan?: string;
  addonType?: string;
  amount?: number;
  status: string;
  createdAt: Date;
}

export const Admin = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'leads' | 'subscriptions' | 'contact' | 'blogs' | 'templates'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [settings, setSettings] = useState<AdminSettingsType>({ geminiApiKey: '', trialDurationDays: 14 });
  const [loading, setLoading] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showGlobalKey, setShowGlobalKey] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userBots, setUserBots] = useState<Bot[]>([]);
  const [userLeads, setUserLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubscriptionIdModal, setShowSubscriptionIdModal] = useState(false);
  const [subscriptionIdInput, setSubscriptionIdInput] = useState('');
  const [planSelections, setPlanSelections] = useState<Record<string, 'free' | 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly'>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            trialEndsAt: data.trialEndsAt?.toDate()
          };
        })
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)) as User[];
      setUsers(usersData);

      const leadsSnapshot = await getDocs(collection(db, 'leads'));
      const leadsData = leadsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          collectedAt: doc.data().collectedAt?.toDate()
        }))
        .sort((a, b) => (b.collectedAt?.getTime() || 0) - (a.collectedAt?.getTime() || 0)) as Lead[];
      setLeads(leadsData);

      try {
        const contactSnapshot = await getDocs(collection(db, 'contactMessages'));
        const contactData = contactSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)) as ContactMessage[];
        setContactMessages(contactData);
      } catch (contactError) {
        console.error('Error fetching contact messages (non-critical):', contactError);
        setContactMessages([]);
      }

      const settingsDoc = await getDoc(doc(db, 'adminSettings', 'global'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as AdminSettingsType);
      }

      try {
        const requestsSnapshot = await getDocs(collection(db, 'paymentRequests'));
        const requestsData = requestsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)) as PaymentRequest[];
        setPaymentRequests(requestsData);
      } catch (requestError) {
        console.error('Error fetching payment requests (non-critical):', requestError);
        setPaymentRequests([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading admin data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserTrial = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { trialActive: !currentStatus });
      setUsers(users.map(u => (u.uid === userId ? { ...u, trialActive: !currentStatus } : u)));
    } catch (error) {
      console.error('Error updating trial status:', error);
      alert('Failed to update trial status');
    }
  };

  const openApiKeyModal = (user: User) => {
    setSelectedUser(user);
    setApiKeyInput(user.geminiApiKey || '');
    setShowApiKeyModal(true);
  };

  const saveUserApiKey = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        geminiApiKey: apiKeyInput || null
      });
      setUsers(users.map(u => (u.uid === selectedUser.uid ? { ...u, geminiApiKey: apiKeyInput } : u)));
      setShowApiKeyModal(false);
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Failed to save API key');
    }
  };

  const openSubscriptionIdModal = (user: User) => {
    setSelectedUser(user);
    setSubscriptionIdInput(user.subscriptionId || '');
    setShowSubscriptionIdModal(true);
  };

  const saveSubscriptionId = async () => {
    if (!selectedUser) return;

    try {
      const trimmedId = subscriptionIdInput.trim();

      if (trimmedId) {
        const usersWithSameId = users.filter(u => u.subscriptionId === trimmedId && u.uid !== selectedUser.uid);
        if (usersWithSameId.length > 0) {
          alert(`Subscription ID "${trimmedId}" is already assigned to ${usersWithSameId[0].email}`);
          return;
        }
      }

      await updateDoc(doc(db, 'users', selectedUser.uid), {
        subscriptionId: trimmedId || null
      });
      setUsers(users.map(u => (u.uid === selectedUser.uid ? { ...u, subscriptionId: trimmedId } : u)));
      setShowSubscriptionIdModal(false);
      alert('Subscription ID saved successfully');
    } catch (error) {
      console.error('Error saving subscription ID:', error);
      alert('Failed to save subscription ID');
    }
  };

  const saveGlobalSettings = async () => {
    try {
      await setDoc(doc(db, 'adminSettings', 'global'), settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const updateUserTrialDays = async (userId: string, days: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), { trialDurationDays: days });
      setUsers(users.map(u => (u.uid === userId ? { ...u, trialDurationDays: days } : u)));
    } catch (error) {
      console.error('Error updating trial days:', error);
      alert('Failed to update trial days');
    }
  };

  const toggleUserPoweredBy = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { removePoweredBy: !currentStatus });
      setUsers(users.map(u => (u.uid === userId ? { ...u, removePoweredBy: !currentStatus } : u)));
    } catch (error) {
      console.error('Error updating powered by status:', error);
      alert('Failed to update powered by status');
    }
  };

  const updateUserBotLimit = async (userId: string, limit: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), { botLimit: limit });
      setUsers(users.map(u => (u.uid === userId ? { ...u, botLimit: limit } : u)));
    } catch (error) {
      console.error('Error updating bot limit:', error);
      alert('Failed to update bot limit');
    }
  };

  const updateUserAiBotLimit = async (userId: string, limit: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), { aiBotLimit: limit });
      setUsers(users.map(u => (u.uid === userId ? { ...u, aiBotLimit: limit } : u)));
    } catch (error) {
      console.error('Error updating AI bot limit:', error);
      alert('Failed to update AI bot limit');
    }
  };

  const getUserPlan = (user: User): 'free' | 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly' => {
    const plan = user.subscription?.plan;
    if (
      plan === 'starter' ||
      plan === 'growth' ||
      plan === 'starter_yearly' ||
      plan === 'growth_yearly'
    ) {
      return plan;
    }
    return 'free';
  };

  const updateUserPlan = async (
    user: User,
    targetPlan: 'free' | 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly'
  ) => {
    const currentPlan = getUserPlan(user);
    if (currentPlan === targetPlan) {
      alert(`User is already on ${targetPlan} plan`);
      return;
    }

    const direction = targetPlan === 'free' ? 'downgrade' : 'upgrade';
    if (!confirm(`Are you sure you want to ${direction} ${user.email} to ${targetPlan} plan?`)) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const existingSubscription = user.subscription;
      const isPaidPlan = targetPlan !== 'free';
      const nextBillingPeriod: 'monthly' | 'yearly' = targetPlan.includes('yearly') ? 'yearly' : 'monthly';

      await updateDoc(userRef, {
        subscription: {
          ...existingSubscription,
          plan: targetPlan,
          status: isPaidPlan ? 'active' : 'cancelled',
          billingPeriod: nextBillingPeriod,
          paymentLink: isPaidPlan ? existingSubscription?.paymentLink || null : null,
          addons: isPaidPlan ? existingSubscription?.addons || {} : {}
        }
      });

      setUsers(users.map((u) =>
        u.uid === user.uid
          ? {
              ...u,
              subscription: {
                ...u.subscription,
                plan: targetPlan,
                status: isPaidPlan ? 'active' : 'cancelled',
                billingPeriod: nextBillingPeriod,
                paymentLink: isPaidPlan ? u.subscription?.paymentLink : undefined,
                addons: isPaidPlan ? u.subscription?.addons || {} : {}
              }
            }
          : u
      ));

      setPlanSelections((prev) => ({
        ...prev,
        [user.uid]: targetPlan
      }));

      alert(`Plan updated successfully to ${targetPlan}`);
    } catch (error) {
      console.error('Error updating user plan:', error);
      alert('Failed to update user plan');
    }
  };

  const openUserDetails = async (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);

    try {
      const botsQuery = query(collection(db, 'bots'), where('ownerId', '==', user.uid));
      const botsSnapshot = await getDocs(botsQuery);
      const botsData = botsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Bot[];
      setUserBots(botsData);

      const leadsQuery = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
      const leadsSnapshot = await getDocs(leadsQuery);
      const leadsData = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collectedAt: doc.data().collectedAt?.toDate()
      })).sort((a, b) => (b.collectedAt?.getTime() || 0) - (a.collectedAt?.getTime() || 0)) as Lead[];
      setUserLeads(leadsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const tabs = [
    { id: 'users' as const, name: 'Users', icon: Users },
    { id: 'settings' as const, name: 'Global Settings', icon: Settings },
    { id: 'leads' as const, name: 'All Leads', icon: BarChart3 },
    { id: 'subscriptions' as const, name: 'Subscriptions', icon: CreditCard },
    { id: 'contact' as const, name: 'Contact Messages', icon: Mail },
    { id: 'blogs' as const, name: 'Blog Posts', icon: FileText },
    { id: 'templates' as const, name: 'Templates', icon: BotIcon }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <div className="flex gap-3">
            <Link
              to="/admin/affiliates"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Affiliates
            </Link>
            <Link
              to="/admin/payments"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Payments
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Search by email, name, or subscription ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Subscription ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Trial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Trial Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Bot Limit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      AI Bot Limit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Remove Watermark
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Manage Plan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.filter(user => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    return (
                      user.email.toLowerCase().includes(search) ||
                      user.name?.toLowerCase().includes(search) ||
                      user.subscriptionId?.toLowerCase().includes(search)
                    );
                  }).map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 text-sm">
                        {user.subscriptionId ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded font-mono text-xs font-semibold">
                              {user.subscriptionId}
                            </span>
                            <button
                              onClick={() => openSubscriptionIdModal(user)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Edit Subscription ID"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openSubscriptionIdModal(user)}
                            className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline"
                          >
                            Assign ID
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscription?.plan && user.subscription?.plan !== 'free'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {user.subscription?.plan
                            ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)
                            : 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.trialActive
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {user.trialActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <input
                          type="number"
                          min="1"
                          value={user.trialDurationDays || settings.trialDurationDays || 14}
                          onChange={(e) => updateUserTrialDays(user.uid, parseInt(e.target.value) || 14)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <input
                          type="number"
                          min="1"
                          value={user.botLimit || 3}
                          onChange={(e) => updateUserBotLimit(user.uid, parseInt(e.target.value) || 3)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <input
                          type="number"
                          min="0"
                          value={user.aiBotLimit || 0}
                          onChange={(e) => updateUserAiBotLimit(user.uid, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleUserPoweredBy(user.uid, user.removePoweredBy || false)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.removePoweredBy
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {user.removePoweredBy ? 'Removed' : 'Visible'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.geminiApiKey
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {user.geminiApiKey ? 'Personal key' : 'Using global'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => openUserDetails(user)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => toggleUserTrial(user.uid, user.trialActive)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            Toggle Trial
                          </button>
                          <button
                            onClick={() => openApiKeyModal(user)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            Assign Key
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2 min-w-[250px]">
                          <select
                            value={planSelections[user.uid] || getUserPlan(user)}
                            onChange={(e) =>
                              setPlanSelections((prev) => ({
                                ...prev,
                                [user.uid]: e.target.value as 'free' | 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly'
                              }))
                            }
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white"
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter (Monthly)</option>
                            <option value="growth">Growth (Monthly)</option>
                            <option value="starter_yearly">Starter (Yearly)</option>
                            <option value="growth_yearly">Growth (Yearly)</option>
                          </select>
                          <button
                            onClick={() =>
                              updateUserPlan(
                                user,
                                (planSelections[user.uid] || getUserPlan(user)) as
                                  | 'free'
                                  | 'starter'
                                  | 'growth'
                                  | 'starter_yearly'
                                  | 'growth_yearly'
                              )
                            }
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Global Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Global Gemini API Key (Fallback)
                </label>
                <div className="flex gap-2">
                  <input
                    type={showGlobalKey ? 'text' : 'password'}
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter global Gemini API key"
                  />
                  <button
                    onClick={() => setShowGlobalKey(!showGlobalKey)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {showGlobalKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Used when users don't have a personal API key assigned
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trial Duration (Days)
                </label>
                <input
                  type="number"
                  value={settings.trialDurationDays}
                  onChange={(e) =>
                    setSettings({ ...settings, trialDurationDays: parseInt(e.target.value) || 14 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={saveGlobalSettings}
                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Page URL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leads.map((lead) => {
                    const owner = users.find(u => u.uid === lead.ownerId);
                    return (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {lead.collectedAt?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {owner?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {lead.answers.email || lead.answers.name || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {lead.pageUrl}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'blogs' && <BlogManagement />}

        {activeTab === 'templates' && <TemplateManagement />}

        {activeTab === 'subscriptions' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Requests</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage user payment requests and subscriptions
              </p>
            </div>

            {paymentRequests.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Payment Requests Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Payment requests from users will appear here
                </p>
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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paymentRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {request.createdAt?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900 dark:text-white">{request.userName}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">{request.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white capitalize">
                          {request.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {request.plan && <div className="capitalize">{request.plan} Plan</div>}
                          {request.addonType && <div className="capitalize">{request.addonType}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {request.amount ? `₹${request.amount}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                : request.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Get in Touch Messages</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Messages submitted from the Contact page form
              </p>
            </div>

            {contactMessages.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Messages Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">New contact form submissions will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contactMessages.map((message) => (
                      <tr key={message.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {message.createdAt ? message.createdAt.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">{message.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">{message.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">{message.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md">
                          <div className="max-h-20 overflow-y-auto whitespace-pre-wrap">{message.message}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showApiKeyModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign API Key</h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">User: {selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter API key or leave empty to use global key"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to use the global fallback key
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUserApiKey}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Key className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubscriptionIdModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign Subscription ID</h3>
              <button
                onClick={() => setShowSubscriptionIdModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">User: {selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription ID
                </label>
                <input
                  type="text"
                  value={subscriptionIdInput}
                  onChange={(e) => setSubscriptionIdInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono"
                  placeholder="e.g., SUB001, SUB002"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Assign a unique ID to easily search and identify this user
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Use formats like SUB001, CUST-2024-001, or any format that works for your business.
                  This ID will be searchable in the users list.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowSubscriptionIdModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSubscriptionId}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.email}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Member since {selectedUser.createdAt?.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trial Status</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedUser.trialActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trial Days</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedUser.trialDurationDays || settings.trialDurationDays || 14}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Bots</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{userBots.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Leads</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{userLeads.length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BotIcon className="w-5 h-5" />
                  Bots ({userBots.length})
                </h4>
                {userBots.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No bots created yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {userBots.map((bot) => (
                      <div
                        key={bot.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-gray-900 dark:text-white">{bot.name}</h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bot.type === 'leads'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            }`}
                          >
                            Leads
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {bot.createdAt?.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Questions: {bot.config.questions.length}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Recent Leads ({userLeads.length})
                </h4>
                {userLeads.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No leads collected yet</p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                            Contact
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                            Page
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {userLeads.slice(0, 50).map((lead) => (
                          <tr key={lead.id}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                              {lead.collectedAt?.toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {lead.answers.email || lead.answers.name || 'Anonymous'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {lead.pageUrl}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowUserDetailsModal(false)}
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
