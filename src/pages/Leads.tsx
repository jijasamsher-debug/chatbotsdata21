import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, QueryConstraint, Timestamp, getCountFromServer } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db } from '../lib/firebase';
import { functions as cloudFunctions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Download, Filter, ChevronDown, ChevronUp, Eye, X, Lock, Globe, Layers } from 'lucide-react';
import { Lead, Bot } from '../types';
import { Link } from 'react-router-dom';

export const Leads = () => {
  const { user, userData } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bots, setBots] = useState<Record<string, Bot>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState<string>('all');
  const [showBotFilter, setShowBotFilter] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [groupByPage, setGroupByPage] = useState(false);
  const [collapsedPages, setCollapsedPages] = useState<Set<string>>(new Set());
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [profileTotalLeadsCount, setProfileTotalLeadsCount] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [user, userData?.freeLeadVisibleUntil, userData?.subscription?.plan, userData?.plan]);

  const isFreePlan = (userData?.subscription?.plan || userData?.plan || 'free') === 'free';
  const effectiveTotalLeadsCount = profileTotalLeadsCount ?? userData?.totalLeadsCount ?? totalLeadsCount;
  const hiddenLeadsCount = isFreePlan ? Math.max(effectiveTotalLeadsCount - 30, 0) : 0;
  const displayedHiddenLeadsCount = selectedBotId === 'all' ? hiddenLeadsCount : 0;

  const fetchData = async () => {
    if (!user) return;

    try {
      let resolvedTotalCount: number | null = null;
      let resolvedCutoffDate: Date | null = userData?.freeLeadVisibleUntil || null;

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

      if (!isFreePlan) {
        const totalCountSnapshot = await getCountFromServer(
          query(collection(db, 'leads'), where('ownerId', '==', user.uid))
        );
        setTotalLeadsCount(totalCountSnapshot.data().count);
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

      setLeads(leadsData);

      const uniqueBotIds = [...new Set(leadsData.map(lead => lead.botId))];
      const botsData: Record<string, Bot> = {};

      for (const botId of uniqueBotIds) {
        const botDoc = await getDoc(doc(db, 'bots', botId));
        if (botDoc.exists()) {
          botsData[botId] = {
            id: botDoc.id,
            ...botDoc.data(),
            createdAt: botDoc.data().createdAt?.toDate()
          } as Bot;
        }
      }
      setBots(botsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = selectedBotId === 'all'
    ? leads
    : leads.filter(lead => lead.botId === selectedBotId);

  const getColumnsForBot = (botId: string) => {
    const bot = bots[botId];
    if (!bot) return [];
    return bot.config.questions.map(q => {
      const columnHeader = q.columnHeader || q.text;
      return {
        header: columnHeader,
        key: columnHeader
      };
    });
  };

  const getAllColumns = () => {
    if (selectedBotId !== 'all' && bots[selectedBotId]) {
      return getColumnsForBot(selectedBotId);
    }

    const allQuestions = new Set<string>();
    filteredLeads.forEach(lead => {
      Object.keys(lead.answers).forEach(question => allQuestions.add(question));
    });
    return Array.from(allQuestions).map(q => ({ header: q, key: q }));
  };

  const columns = getAllColumns();

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;

    const csvColumns = getAllColumns();
    const headers = ['Date', 'Time', 'Page URL', 'Bot', ...csvColumns.map(c => c.header)];
    const rows = filteredLeads.map(lead => [
      lead.collectedAt?.toLocaleDateString() || '',
      lead.collectedAt?.toLocaleTimeString() || '',
      lead.pageUrl,
      bots[lead.botId]?.config?.leadsTableName || bots[lead.botId]?.name || 'Unknown',
      ...csvColumns.map(col => lead.answers[col.key] || '')
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const botName = selectedBotId !== 'all' && bots[selectedBotId]
      ? (bots[selectedBotId].config?.leadsTableName || bots[selectedBotId].name)
      : 'all-leads';
    a.download = `${botName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTableName = () => {
    if (selectedBotId === 'all') return 'All Leads';
    const bot = bots[selectedBotId];
    return bot?.config?.leadsTableName || bot?.name || 'Leads';
  };

  const getLeadName = (lead: Lead) => {
    const nameFields = ['name', 'Name', 'Full Name', 'full name', 'Your Name', 'your name'];
    for (const field of nameFields) {
      if (lead.answers[field]) return lead.answers[field];
    }
    return 'Anonymous';
  };

  const getLeadEmail = (lead: Lead) => {
    const emailFields = ['email', 'Email', 'Email Address', 'email address', 'Your Email', 'your email'];
    for (const field of emailFields) {
      if (lead.answers[field]) return lead.answers[field];
    }
    return '-';
  };

  const totalCollectedLeads = effectiveTotalLeadsCount || filteredLeads.length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {isFreePlan && displayedHiddenLeadsCount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 dark:text-orange-100 text-lg mb-2">
                    Free Plan Limit Reached
                  </h3>
                  <p className="text-orange-800 dark:text-orange-200 mb-4">
                    You've collected {totalCollectedLeads} leads. On free plan, only 30 leads are visible.
                    <strong className="ml-1">{displayedHiddenLeadsCount} lead{displayedHiddenLeadsCount !== 1 ? 's are' : ' is'} hidden.</strong>
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to="/dashboard/upgrade"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{getTableName()}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalCollectedLeads} lead{totalCollectedLeads !== 1 ? 's' : ''} collected
            </p>
          </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGroupByPage(!groupByPage)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                  groupByPage
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Layers className="w-4 h-4 mr-2" />
                Group by Page
              </button>
            </div>
            <div className="flex gap-3">
              <div className="relative">
              <button
                onClick={() => setShowBotFilter(!showBotFilter)}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter by Bot
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>

              {showBotFilter && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedBotId('all');
                        setShowBotFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedBotId === 'all'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      All Bots
                    </button>
                    {Object.values(bots).map(bot => (
                      <button
                        key={bot.id}
                        onClick={() => {
                          setSelectedBotId(bot.id);
                          setShowBotFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedBotId === bot.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {bot.config?.leadsTableName || bot.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {filteredLeads.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No leads yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedBotId === 'all'
                ? 'Leads will appear here once visitors interact with your chatbots'
                : 'No leads collected for this bot yet'}
            </p>
          </div>
        ) : groupByPage ? (
          // Grouped by page view
          (() => {
            const pageGroups: Record<string, Lead[]> = {};
            filteredLeads.forEach(lead => {
              const page = lead.pageUrl || 'Unknown Page';
              if (!pageGroups[page]) pageGroups[page] = [];
              pageGroups[page].push(lead);
            });

            const togglePage = (page: string) => {
              setCollapsedPages(prev => {
                const next = new Set(prev);
                if (next.has(page)) next.delete(page);
                else next.add(page);
                return next;
              });
            };

            const exportGroupToCSV = (pageUrl: string, pageLeads: Lead[]) => {
              if (pageLeads.length === 0) return;
              const groupColumns = new Set<string>();
              pageLeads.forEach(lead => Object.keys(lead.answers).forEach(k => groupColumns.add(k)));
              const cols = Array.from(groupColumns);
              const headers = ['Date', 'Time', 'Bot', ...cols];
              const rows = pageLeads.map(lead => [
                lead.collectedAt?.toLocaleDateString() || '',
                lead.collectedAt?.toLocaleTimeString() || '',
                bots[lead.botId]?.config?.leadsTableName || bots[lead.botId]?.name || 'Unknown',
                ...cols.map(col => lead.answers[col] || '')
              ]);
              const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const safeName = pageUrl.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
              a.download = `leads-${safeName}-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            };

            return (
              <div className="space-y-4">
                {Object.entries(pageGroups).map(([pageUrl, pageLeads]) => {
                  const isCollapsed = collapsedPages.has(pageUrl);
                  return (
                    <div key={pageUrl} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <button
                          onClick={() => togglePage(pageUrl)}
                          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                        >
                          <Globe className="w-5 h-5 text-blue-500 shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-md" title={pageUrl}>{pageUrl}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{pageLeads.length} lead{pageLeads.length !== 1 ? 's' : ''}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); exportGroupToCSV(pageUrl, pageLeads); }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title={`Export ${pageLeads.length} leads from this page`}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Export
                          </button>
                          <button onClick={() => togglePage(pageUrl)} className="p-1">
                            {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div className="border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {pageLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white font-medium">{lead.collectedAt?.toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{lead.collectedAt?.toLocaleTimeString()}</div>
                                  </td>
                                  <td className="px-6 py-4"><div className="text-sm text-gray-900 dark:text-white font-medium">{getLeadName(lead)}</div></td>
                                  <td className="px-6 py-4"><div className="text-sm text-gray-700 dark:text-gray-300">{getLeadEmail(lead)}</div></td>
                                  <td className="px-6 py-4 text-center">
                                    <button onClick={() => setSelectedLead(lead)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="View all details">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {displayedHiddenLeadsCount > 0 && (
                  <div className="bg-orange-50/70 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">{displayedHiddenLeadsCount} hidden lead{displayedHiddenLeadsCount !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">Upgrade plan to view them.</p>
                      </div>
                      <Link to="/dashboard/upgrade" className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors">
                        <Lock className="w-4 h-4 mr-2" />Upgrade
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Page URL</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">{lead.collectedAt?.toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lead.collectedAt?.toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900 dark:text-white font-medium">{getLeadName(lead)}</div></td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-700 dark:text-gray-300">{getLeadEmail(lead)}</div></td>
                      <td className="px-6 py-4 max-w-xs"><div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={lead.pageUrl}>{lead.pageUrl}</div></td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setSelectedLead(lead)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="View all details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {displayedHiddenLeadsCount > 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-5 bg-orange-50/70 dark:bg-orange-900/20 border-y border-orange-200 dark:border-orange-800">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 blur-[1px]">{displayedHiddenLeadsCount} hidden lead{displayedHiddenLeadsCount !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-orange-700 dark:text-orange-300">{displayedHiddenLeadsCount} lead{displayedHiddenLeadsCount !== 1 ? 's are' : ' is'} hidden. Upgrade plan to view them.</p>
                          </div>
                          <Link to="/dashboard/upgrade" className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors w-full md:w-auto">
                            <Lock className="w-4 h-4 mr-2" />Upgrade to View Hidden Leads
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Lead Details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedLead.collectedAt?.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bot
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {bots[selectedLead.botId]?.config?.leadsTableName || bots[selectedLead.botId]?.name || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Page URL
                    </label>
                    <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 break-all">
                      <a href={selectedLead.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {selectedLead.pageUrl}
                      </a>
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Collected Information
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selectedLead.answers).map(([question, answer]) => (
                        <div key={question} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {question}
                          </label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {answer || '-'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
