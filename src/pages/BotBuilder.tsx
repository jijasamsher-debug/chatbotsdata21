import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ArrowRight, Save, Check, AlertCircle, Download } from 'lucide-react';
import { BotType, BotConfig } from '../types';
import { StepChooseType } from '../components/bot-builder/StepChooseType';
import { StepGeneralSettings } from '../components/bot-builder/StepGeneralSettings';
import { StepQuestions } from '../components/bot-builder/StepQuestions';
import { StepTheme } from '../components/bot-builder/StepTheme';
import { StepPageRules } from '../components/bot-builder/StepPageRules';
import { StepEmbedCode } from '../components/bot-builder/StepEmbedCode';
import { BotPreview } from '../components/bot-builder/BotPreview';

const steps = [
  { id: 1, name: 'Type' },
  { id: 2, name: 'General' },
  { id: 3, name: 'Questions' },
  { id: 4, name: 'Theme' },
  { id: 5, name: 'Page Rules' },
  { id: 6, name: 'Integrate' }
];

export const BotBuilder = () => {
  const { botId } = useParams();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(!!botId);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  const [botName, setBotName] = useState('My Bot');
  const [botType, setBotType] = useState<BotType>('leads');
  const [config, setConfig] = useState<BotConfig>({
    theme: {
      primaryColor: '#2563eb',
      bgColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'sans-serif',
      typingSpeed: 50
    },
    welcomeMessage: 'Hi there! How can I help you today?',
    popupMessage: 'Have a question? Chat with us!',
    popupDelay: 5,
    questions: [],
    pageRules: [],
    collectLeadsFirst: true
  });

  useEffect(() => {
    if (botId) {
      loadBot();
    } else if (user) {
      checkBotLimits();
    }
  }, [botId, user]);

  const checkBotLimits = async () => {
    if (!user || botId) {
      setLoading(false);
      return;
    }

    try {
      const botsQuery = query(
        collection(db, 'bots'),
        where('ownerId', '==', user.uid)
      );
      const botsSnapshot = await getDocs(botsQuery);
      const userBots = botsSnapshot.docs.map(doc => doc.data());
      const botCount = userBots.length;
      const botLimit = user?.botLimit || 3;

      if (botCount >= botLimit) {
        setLimitMessage(`You've reached your bot limit (${botLimit} bots). Contact admin to increase your limit.`);
        setShowLimitModal(true);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking bot limits:', error);
      setLoading(false);
    }
  };

  const loadBot = async () => {
    if (!botId) return;

    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (botDoc.exists()) {
        const data = botDoc.data();
        setBotName(data.name);
        setBotType(data.type);
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBot = async () => {
    if (!user) return;

    if (currentStep === 6) {
      if (!botId) {
        const botsQuery = query(
          collection(db, 'bots'),
          where('ownerId', '==', user.uid)
        );
        const botsSnapshot = await getDocs(botsQuery);
        const userBots = botsSnapshot.docs.map(doc => doc.data());
        const botCount = userBots.length;

        const botLimit = user?.botLimit || 3;

        if (botCount >= botLimit) {
          alert(`You've reached your bot limit (${botLimit} bots). Contact admin to increase your limit.`);
          return;
        }

      }

      setSaving(true);
      try {
        const botData = {
          ownerId: user.uid,
          name: botName,
          type: botType,
          config,
          createdAt: Timestamp.now()
        };

        const id = botId || `bot_${Date.now()}`;
        await setDoc(doc(db, 'bots', id), botData);

        navigate('/dashboard/bots');
      } catch (error) {
        console.error('Error saving bot:', error);
        alert('Failed to save bot');
      } finally {
        setSaving(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const saveDraft = async () => {
    if (!user || !botId) return;

    setSaving(true);
    try {
      const botData = {
        ownerId: user.uid,
        name: botName,
        type: botType,
        config,
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(db, 'bots', botId), botData, { merge: true });
      alert('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    setConfig({ ...config, ...updates });
  };

  const exportBot = () => {
    const exportData = {
      name: botName,
      type: botType,
      config,
      exportedAt: new Date().toISOString(),
      version: 1
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${botName.replace(/\s+/g, '_')}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showLimitModal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Bot Limit Reached
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {limitMessage}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/pricing"
              className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors font-medium"
            >
              View Plans
            </Link>
            <Link
              to="/dashboard/billing"
              className="block w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg transition-colors font-medium"
            >
              Purchase Addons
            </Link>
            <button
              onClick={() => navigate('/dashboard/bots')}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Bots
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row h-screen">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            <button
              onClick={() => navigate('/dashboard/bots')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bots
            </button>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {botId ? 'Edit Bot' : 'Create New Bot'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Step {currentStep} of {steps.length}
            </p>
            {!botId && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Complete all 7 steps and click "Create Bot" to save your chatbot
                </p>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                        currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                    </button>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-1 mx-2 ${
                          currentStep > step.id ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                {steps.map((step) => (
                  <div key={step.id} className="text-xs text-gray-600 dark:text-gray-400 w-10 text-center">
                    {step.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              {currentStep === 1 && <StepChooseType botType={botType} setBotType={setBotType} />}
              {currentStep === 2 && (
                <StepGeneralSettings
                  botName={botName}
                  setBotName={setBotName}
                  config={config}
                  updateConfig={updateConfig}
                />
              )}
              {currentStep === 3 && <StepQuestions config={config} updateConfig={updateConfig} />}
              {currentStep === 4 && <StepTheme config={config} updateConfig={updateConfig} />}
              {currentStep === 5 && (() => {
                const userPlan = userData?.subscription?.plan || userData?.plan || 'free';
                const isOnPaidPlan = userPlan !== 'free';
                const isOnActiveTrial = userData?.trialActive === true && userData?.trialEndsAt && new Date(userData.trialEndsAt) > new Date();
                const isPremium = isOnPaidPlan || isOnActiveTrial;
                return <StepPageRules config={config} updateConfig={updateConfig} isPremiumUser={isPremium} />;
              })()}
              {currentStep === 6 && botId && <StepEmbedCode botId={botId} />}
              {currentStep === 6 && !botId && (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Save Your Bot First
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                      Click "Create Bot" below to save your chatbot and get the embed code.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              <div className="flex gap-3">
                <button
                  onClick={exportBot}
                  className="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Export bot as template"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>

                {botId && currentStep < 6 && (
                  <button
                    onClick={saveDraft}
                    disabled={saving}
                    className="flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </button>
                )}

                <button
                  onClick={saveBot}
                  disabled={saving}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    'Saving...'
                  ) : currentStep === 6 ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {botId ? 'Update Bot' : 'Create Bot'}
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-96 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Live Preview</h3>
          <BotPreview config={config} botType={botType} />
        </div>
      </div>
    </div>
  );
};
