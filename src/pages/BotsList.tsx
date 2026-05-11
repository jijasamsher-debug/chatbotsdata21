import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Plus, Trash2, CreditCard as Edit, Code, X, Copy, Check, Upload, Download } from 'lucide-react';
import { Bot as BotType } from '../types';

export const BotsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotType | null>(null);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBots();
  }, [user]);

  const fetchBots = async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'bots', botId));
      setBots(bots.filter(b => b.id !== botId));
    } catch (error) {
      console.error('Error deleting bot:', error);
      alert('Failed to delete bot');
    }
  };

  const openEmbedModal = (bot: BotType) => {
    setSelectedBot(bot);
    setShowEmbedModal(true);
  };

  const getIframeCode = (botId: string) => {
    const widgetUrl = `${window.location.origin}/widget/${botId}`;
    return `<iframe
  src="${widgetUrl}"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 999999;"
></iframe>`;
  };

  const getScriptCode = (botId: string) => {
    const widgetUrl = `${window.location.origin}/widget/${botId}`;
    return `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${widgetUrl}';
    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;';
    document.body.appendChild(iframe);
  })();
</script>`;
  };

  const getWidgetUrl = (botId: string) => {
    return `${window.location.origin}/widget/${botId}`;
  };

  const copyToClipboard = (text: string, type: 'iframe' | 'script' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleImportBot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.config || !data.name || !data.type) {
        alert('Invalid bot template file. Missing required fields.');
        return;
      }

      // Check bot limits before importing
      const botsQuery = query(
        collection(db, 'bots'),
        where('ownerId', '==', user.uid)
      );
      const botsSnapshot = await getDocs(botsQuery);
      const botCount = botsSnapshot.docs.length;
      const botLimit = user?.botLimit || 3;

      if (botCount >= botLimit) {
        alert(`You've reached your bot limit (${botLimit} bots). Delete an existing bot or upgrade your plan to import more.`);
        return;
      }

      const botId = `bot_${Date.now()}`;
      const botData = {
        ownerId: user.uid,
        name: data.name + ' (Imported)',
        type: data.type,
        config: data.config,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'bots', botId), botData);
      navigate(`/dashboard/bots/${botId}`);
    } catch (error) {
      console.error('Error importing bot:', error);
      alert('Failed to import bot. Make sure the file is a valid bot template.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportBot = (bot: BotType) => {
    const exportData = {
      name: bot.name,
      type: bot.type,
      config: bot.config,
      exportedAt: new Date().toISOString(),
      version: 1
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot.name.replace(/\s+/g, '_')}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Bots</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your chatbots and embed codes</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportBot}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Import Bot'}
            </button>
            <Link
              to="/dashboard/bots/new"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : bots.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No bots yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first chatbot
            </p>
            <Link
              to="/dashboard/bots/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Bot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bot.type === 'leads'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    }`}
                  >
                    Leads Generator
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{bot.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Created {bot.createdAt?.toLocaleDateString()}
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => openEmbedModal(bot)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Script Integrate - Connect bot to site
                  </button>
                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/bots/${bot.id}`}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                    <button
                      onClick={() => exportBot(bot)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      title="Export bot template"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBot(bot.id)}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEmbedModal && selectedBot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white pr-2">
                Script Integrate - {selectedBot.name}
              </h2>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Choose one of the integration methods below to add your chatbot to your website
            </p>

            <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
              {/* Option 1: IFrame Embed */}
              <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Option 1: IFrame Embed (Recommended)
                  </label>
                  <button
                    onClick={() => copyToClipboard(getIframeCode(selectedBot.id), 'iframe')}
                    className="flex items-center justify-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copiedIframe ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                  <code>{getIframeCode(selectedBot.id)}</code>
                </pre>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Add this code anywhere in your HTML, preferably before the closing {'</body>'} tag.
                </p>
              </div>

              {/* Option 2: Script Tag */}
              <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Option 2: Script Tag
                  </label>
                  <button
                    onClick={() => copyToClipboard(getScriptCode(selectedBot.id), 'script')}
                    className="flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                  <code>{getScriptCode(selectedBot.id)}</code>
                </pre>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Add this code before the closing {'</body>'} tag. The script will inject the widget automatically.
                </p>
              </div>

              {/* Option 3: Widget URL */}
              <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Widget URL (Direct Link)
                  </label>
                  <button
                    onClick={() => copyToClipboard(getWidgetUrl(selectedBot.id), 'url')}
                    className="flex items-center justify-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Copy URL
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm mb-2 break-all">
                  <code>{getWidgetUrl(selectedBot.id)}</code>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
                  Use this URL to test your widget or share it directly with users.
                </p>
                <a
                  href={getWidgetUrl(selectedBot.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                >
                  Open Widget in New Tab
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowEmbedModal(false)}
                className="w-full sm:w-auto px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
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
