import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import floodLogo from '../assets/flood-logo.png';
import { Bot, BotConfig, Question, User, FollowUpMessage } from '../types';
import { ModernUIWidget } from '../components/ModernUIWidget';

export const Widget = () => {
  const { botId } = useParams();
  const [bot, setBot] = useState<Bot | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'bot' | 'user'; text: string; gifUrl?: string; ctas?: Array<{ text: string; url: string }> }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [multiSelectChoices, setMultiSelectChoices] = useState<string[]>([]);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canRemovePoweredBy = owner?.subscription?.plan === 'growth' || owner?.subscription?.plan === 'growth_yearly';

  useEffect(() => {
    loadBot();
  }, [botId]);

  useEffect(() => {
    if (bot && !isOpen && bot.config.popupDelay > 0) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, bot.config.popupDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [bot, isOpen]);

  useEffect(() => {
    if (bot && !isOpen && !hasAutoOpened && bot.config.theme.autoOpenDelay && bot.config.theme.autoOpenDelay > 0) {
      const timer = setTimeout(() => {
        setHasAutoOpened(true);
        setIsOpen(true);
        setShowPopup(false);
      }, bot.config.theme.autoOpenDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [bot, isOpen, hasAutoOpened]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadBot = async () => {
    if (!botId) return;

    try {
      const botDoc = await getDoc(doc(db, 'bots', botId));
      if (!botDoc.exists()) {
        setError('Bot not found');
        setLoading(false);
        return;
      }

      const botData = { id: botDoc.id, ...botDoc.data() } as Bot;
      setBot(botData);

      const ownerDoc = await getDoc(doc(db, 'users', botData.ownerId));
      if (ownerDoc.exists()) {
        const ownerData = {
          uid: ownerDoc.id,
          ...ownerDoc.data(),
          trialEndsAt: ownerDoc.data().trialEndsAt?.toDate()
        } as User;
        setOwner(ownerData);

        if (!ownerData.trialActive && ownerData.subscription?.status !== 'active') {
          setError('This bot is currently paused. Please contact the site owner.');
        }
      }

      if (botData.config.theme.template !== 'modernui') {
        setMessages([{ type: 'bot', text: botData.config.welcomeMessage, gifUrl: botData.config.welcomeGifUrl }]);
      }
    } catch (err) {
      console.error('Error loading bot:', err);
      setError('Failed to load bot');
    } finally {
      setLoading(false);
    }
  };

  const getHostPageUrl = (): string => {
    try {
      if (window.parent !== window) {
        return window.parent.location.href;
      }
    } catch {
      // Cross-origin iframe
    }
    return document.referrer || window.location.href;
  };

  const getCurrentPageRule = () => {
    if (!bot) return null;
    const hostUrl = getHostPageUrl();
    return bot.config.pageRules.find(rule => {
      const pattern = rule.urlPattern.replace(/\*/g, '.*');
      const regex = new RegExp(pattern);
      try {
        const url = new URL(hostUrl);
        return regex.test(url.pathname) || regex.test(hostUrl);
      } catch {
        return regex.test(hostUrl);
      }
    });
  };

  const getActiveQuestions = (): Question[] => {
    if (!bot) return [];
    const pageRule = getCurrentPageRule();
    if (pageRule?.questions && pageRule.questions.length > 0) {
      return pageRule.questions;
    }
    return bot.config.questions;
  };

  const typeMessage = async (text: string, gifUrl?: string, ctas?: Array<{ text: string; url: string }>) => {
    setIsTyping(true);
    const typingSpeed = config.theme.typingSpeed || 50;
    const delay = Math.min(text.length * typingSpeed, 3000);
    await new Promise(resolve => setTimeout(resolve, Math.max(delay, 300)));
    setMessages(prev => [...prev, { type: 'bot', text, gifUrl, ctas }]);
    setIsTyping(false);
  };

  const sendFollowUpMessages = async (question: Question, selectedOption?: string) => {
    const collected: NonNullable<Question['followUpMessages']> = [];
    if (question.followUpMessages?.length) collected.push(...question.followUpMessages);
    if (selectedOption && question.optionFollowUps) {
      // Support multi-select: selectedOption may be a comma-joined list
      const parts = selectedOption.split(',').map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (question.optionFollowUps[p]?.length) collected.push(...question.optionFollowUps[p]);
      }
    }
    if (!collected || collected.length === 0) return;
    for (const fm of collected) {
      const ctas = (fm.ctas || [])
        .filter(c => c.text && c.url)
        .map(c => ({ text: c.text, url: c.url.startsWith('http') ? c.url : `https://${c.url}` }));
      if (fm.text || fm.gifUrl || ctas.length) {
        await typeMessage(fm.text || '', fm.gifUrl, ctas.length ? ctas : undefined);
      }
    }
  };

  const askQuestion = async (q: Question) => {
    await typeMessage(q.text, q.imageUrl);
  };

  const validateInput = (question: Question, input: string): string | null => {
    if (question.required && !input.trim()) {
      return 'This field is required';
    }

    if (question.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        return 'Please enter a valid email address';
      }
    }

    if (question.type === 'phone') {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(input) || input.replace(/\D/g, '').length < 10) {
        return 'Please enter a valid phone number';
      }
    }

    return null;
  };

  const advanceToNextQuestion = async (currentIdx: number, newAnswers: Record<string, string>, selectedOption?: string) => {
    const currentQuestion = getActiveQuestions()[currentIdx];
    // Send follow-up messages for current question (with optional per-option follow-ups)
    await sendFollowUpMessages(currentQuestion, selectedOption);

    if (currentIdx < getActiveQuestions().length - 1) {
      setCurrentQuestionIndex(currentIdx + 1);
      await askQuestion(getActiveQuestions()[currentIdx + 1]);
    } else {
      await saveLead(newAnswers);
      if (bot?.type === 'smart' && !bot.config.collectLeadsFirst) {
        setAiMode(true);
        await typeMessage('Thank you! How can I help you today?');
      } else {
        setLeadSubmitted(true);
        const currentPageRule = getCurrentPageRule();
        const thankYouMsg = currentPageRule?.customThankYouMessage || bot?.config.theme.thankYouMessage || 'Thank you for your information! We\'ll get back to you soon.';
        // Show thank you GIF if configured — page rule overrides theme
        const thankYouGifUrl = currentPageRule?.thankYouGifUrl || bot?.config.theme.thankYouGifUrl;
        if (thankYouGifUrl) {
          setMessages(prev => [...prev, { type: 'bot', text: '', gifUrl: thankYouGifUrl }]);
        }
        await typeMessage(thankYouMsg);
        // Show primary CTA if configured — page rule overrides theme
        const ctaText = currentPageRule?.thankYouCtaText || bot?.config.theme.thankYouCtaText;
        const ctaUrlRaw = currentPageRule?.thankYouCtaUrl || bot?.config.theme.thankYouCtaUrl;
        if (ctaText && ctaUrlRaw) {
          const ctaUrl = ctaUrlRaw.startsWith('http') ? ctaUrlRaw : `https://${ctaUrlRaw}`;
          setMessages(prev => [...prev, { type: 'bot', text: `__CTA__${ctaText}__URL__${ctaUrl}` }]);
        }
        // Show additional CTAs from page rule first, then theme
        const extraCtas = currentPageRule?.thankYouCtas || bot?.config.theme.thankYouCtas || [];
        for (const cta of extraCtas) {
          if (cta.text && cta.url) {
            const url = cta.url.startsWith('http') ? cta.url : `https://${cta.url}`;
            setMessages(prev => [...prev, { type: 'bot', text: `__CTA__${cta.text}__URL__${url}` }]);
          }
        }
      }
    }
  };

  const handleQuestionSubmit = async () => {
    if (!bot || !currentInput.trim()) return;

    const currentQuestion = getActiveQuestions()[currentQuestionIndex];
    if (!currentQuestion) return;

    const error = validateInput(currentQuestion, currentInput);
    if (error) {
      setValidationError(error);
      await typeMessage(error);
      return;
    }

    setValidationError('');
    setMessages(prev => [...prev, { type: 'user', text: currentInput }]);
    const columnKey = currentQuestion.columnHeader || currentQuestion.text;
    const updatedAnswers = { ...answers, [columnKey]: currentInput };
    setAnswers(updatedAnswers);
    setCurrentInput('');

    await advanceToNextQuestion(currentQuestionIndex, updatedAnswers);
  };

  const handleSkipQuestion = async () => {
    if (!bot) return;
    const currentQuestion = getActiveQuestions()[currentQuestionIndex];
    if (!currentQuestion) return;

    setValidationError('');
    setMessages(prev => [...prev, { type: 'user', text: 'Skipped' }]);
    const columnKey = currentQuestion.columnHeader || currentQuestion.text;
    const updatedAnswers = { ...answers, [columnKey]: 'Skipped' };
    setAnswers(updatedAnswers);
    setCurrentInput('');

    await advanceToNextQuestion(currentQuestionIndex, updatedAnswers);
  };

  const handleOptionSelect = async (option: string) => {
    const currentQuestion = getActiveQuestions()[currentQuestionIndex];
    setMessages(prev => [...prev, { type: 'user', text: option }]);
    const columnKey = currentQuestion.columnHeader || currentQuestion.text;
    const updatedAnswers = { ...answers, [columnKey]: option };
    setAnswers(updatedAnswers);

    await advanceToNextQuestion(currentQuestionIndex, updatedAnswers, option);
  };

  const handleAiMessage = async () => {
    if (!aiInput.trim() || !bot || !owner) return;

    const userMessage = aiInput;
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setAiInput('');
    setIsTyping(true);

    try {
      let apiKey = owner.geminiApiKey;
      if (!apiKey) {
        const settingsDoc = await getDoc(doc(db, 'adminSettings', 'global'));
        apiKey = settingsDoc.exists() ? settingsDoc.data().geminiApiKey : '';
      }

      if (!apiKey) {
        await typeMessage('AI service is currently unavailable. Please try again later.');
        return;
      }

      let context = '';
      if (bot.config.knowledgeBaseId) {
        const kbDoc = await getDoc(doc(db, 'knowledgeBases', bot.config.knowledgeBaseId));
        if (kbDoc.exists()) {
          const kb = kbDoc.data();
          context = kb.articles.map((a: any) => `${a.title}\n${a.content}`).join('\n\n');
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: context
                  ? `Using this context:\n${context}\n\nAnswer this question: ${userMessage}`
                  : userMessage
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I couldn\'t generate a response.';

      await typeMessage(aiResponse);
    } catch (err) {
      console.error('AI error:', err);
      await typeMessage('I apologize, but I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const saveLead = async (leadAnswers: Record<string, string>) => {
    if (!bot) return;

    try {
      const leadId = `lead_${Date.now()}`;
      const pageUrl = document.referrer || window.location.href;

      await setDoc(doc(db, 'leads', leadId), {
        botId: bot.id,
        ownerId: bot.ownerId,
        collectedAt: Timestamp.now(),
        pageUrl,
        answers: leadAnswers,
        sessionId: `session_${Date.now()}`
      });

      console.log('Lead saved successfully:', leadAnswers);
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const openWidget = () => {
    setIsOpen(true);
    setShowPopup(false);
    if (bot && messages.length === 1) {
      const q = getActiveQuestions()[0];
      if (q) askQuestion(q);
    }
  };

  if (loading) {
    return null;
  }

  if (error || !bot) {
    return (
      <div className="fixed bottom-6 right-6 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-sm">
        <p className="text-red-800 dark:text-red-200">{error || 'Bot not found'}</p>
      </div>
    );
  }

  if (bot.config.theme.template === 'modernui') {
    return <ModernUIWidget bot={bot} owner={owner || undefined} />;
  }

  const config = bot.config;
  const activeQuestions = getActiveQuestions();
  const currentQuestion = activeQuestions[currentQuestionIndex];

  const popupAnim = config.theme.popupAnimation || 'bounce';
  const widgetAnim = config.theme.widgetAnimation || 'fade';

  const popupAnimClass = {
    bounce: 'animate-bounce',
    fade: 'animate-fade-in',
    slide: 'animate-fade-in',
    none: ''
  }[popupAnim];

  const widgetAnimStyle: React.CSSProperties = {
    fade: { animation: 'fadeInUp 0.3s ease' },
    slide: { animation: 'slideInUp 0.3s ease' },
    scale: { animation: 'scaleIn 0.3s ease' },
    none: {}
  }[widgetAnim];

  return (
    <div style={{ fontFamily: config.theme.fontFamily }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {showPopup && !isOpen && (
        <div
          onClick={openWidget}
          className={`fixed bottom-24 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-xs border border-gray-200 dark:border-gray-700 cursor-pointer ${popupAnimClass}`}
        >
          <div className="flex items-start justify-between">
            <div>
              {config.popupGifUrl && (
                <img src={config.popupGifUrl} alt="GIF" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '6px' }} />
              )}
              <p className="text-gray-900 dark:text-white">{config.popupMessage}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!isOpen ? (
        <button
          onClick={openWidget}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 overflow-hidden"
          style={{ backgroundColor: config.theme.primaryColor }}
        >
          <img src={floodLogo} alt="Chat" className="w-10 h-10 object-contain" />
        </button>
      ) : (
        <div
          className="fixed bottom-6 right-6 w-[380px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: '#ffffff', ...widgetAnimStyle }}
        >
          <div
            className="p-4 flex items-center justify-between"
            style={{ backgroundColor: config.theme.primaryColor }}
          >
            <div className="flex items-center">
              <img src={floodLogo} alt="Logo" className="w-6 h-6 object-contain mr-2 rounded-full" />
              <h3 className="font-semibold text-white">{bot.name}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-lg ${
                    msg.type === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                  }`}
                  style={{
                    backgroundColor: msg.type === 'user' ? config.theme.primaryColor : '#f3f4f6',
                    color: msg.type === 'user' ? '#ffffff' : config.theme.textColor
                  }}
                >
                  {msg.gifUrl && (
                    <img
                      src={msg.gifUrl}
                      alt="GIF"
                      style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '6px' : '0' }}
                    />
                  )}
                  {msg.text && msg.text.startsWith('__CTA__') ? (
                    (() => {
                      const ctaMatch = msg.text.match(/^__CTA__(.+?)__URL__(.+)$/);
                      if (ctaMatch) {
                        return (
                          <a
                            href={ctaMatch[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: config.theme.primaryColor,
                              color: '#fff',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: '500',
                              display: 'inline-block',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {ctaMatch[1]}
                          </a>
                        );
                      }
                      return null;
                    })()
                  ) : msg.text ? <span>{msg.text}</span> : null}
                  {msg.ctas && msg.ctas.length > 0 && (
                    <div style={{ marginTop: msg.text || msg.gifUrl ? '8px' : '0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.ctas.map((cta, ci) => (
                        <a
                          key={ci}
                          href={cta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: config.theme.primaryColor,
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          {cta.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Inline options for select/qualify questions */}
            {!isTyping && !leadSubmitted && !aiMode && (currentQuestion?.type === 'select' || currentQuestion?.type === 'qualify') && currentQuestion?.options?.length ? (
              <div className="flex flex-wrap gap-2 px-2">
                {currentQuestion.options!.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(option)}
                    className="px-4 py-2 rounded-full text-sm font-medium border transition-colors hover:text-white"
                    style={{
                      borderColor: config.theme.primaryColor,
                      color: config.theme.primaryColor,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = config.theme.primaryColor;
                      (e.target as HTMLButtonElement).style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.target as HTMLButtonElement).style.color = config.theme.primaryColor;
                    }}
                    disabled={isTyping}
                  >
                    {option}
                  </button>
                ))}
                {!currentQuestion.required && (
                  <button
                    onClick={handleSkipQuestion}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
                    disabled={isTyping}
                  >
                    Skip →
                  </button>
                )}
              </div>
            ) : null}

            {/* Inline checkboxes for multiselect questions */}
            {!isTyping && !leadSubmitted && !aiMode && currentQuestion?.type === 'multiselect' && currentQuestion?.options?.length ? (
              <div className="flex flex-col gap-2 px-2">
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options!.map((option, i) => {
                    const checked = multiSelectChoices.includes(option);
                    return (
                      <button
                        key={i}
                        onClick={() => setMultiSelectChoices(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])}
                        className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2"
                        style={{
                          borderColor: config.theme.primaryColor,
                          color: checked ? '#fff' : config.theme.primaryColor,
                          backgroundColor: checked ? config.theme.primaryColor : 'transparent',
                        }}
                        disabled={isTyping}
                      >
                        <span style={{
                          width: 14, height: 14, border: `1.5px solid ${checked ? '#fff' : config.theme.primaryColor}`,
                          borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: checked ? '#fff' : 'transparent', color: config.theme.primaryColor, fontSize: 10
                        }}>{checked ? '✓' : ''}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (multiSelectChoices.length === 0) return;
                      const joined = multiSelectChoices.join(', ');
                      setMultiSelectChoices([]);
                      handleOptionSelect(joined);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: config.theme.primaryColor }}
                    disabled={isTyping || multiSelectChoices.length === 0}
                  >
                    Submit ({multiSelectChoices.length})
                  </button>
                  {!currentQuestion.required && (
                    <button
                      onClick={() => { setMultiSelectChoices([]); handleSkipQuestion(); }}
                      className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
                      disabled={isTyping}
                    >
                      Skip →
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {!leadSubmitted && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {validationError && (
                <div className="mb-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                  {validationError}
                </div>
              )}
              {!aiMode && (currentQuestion?.type === 'select' || currentQuestion?.type === 'qualify' || currentQuestion?.type === 'multiselect') && currentQuestion?.options?.length ? (
                null
              ) : !aiMode && currentQuestion?.type === 'date' ? (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      setValidationError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuestionSubmit()}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                    style={{ color: config.theme.textColor }}
                  />
                  <button
                    onClick={handleQuestionSubmit}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: config.theme.primaryColor }}
                    disabled={isTyping}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                  {!currentQuestion?.required && (
                    <button
                      onClick={handleSkipQuestion}
                      className="px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-300 hover:bg-gray-100 transition-colors"
                      disabled={isTyping}
                    >
                      Skip
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type={
                      aiMode
                        ? 'text'
                        : currentQuestion?.type === 'email'
                        ? 'email'
                        : currentQuestion?.type === 'phone'
                        ? 'tel'
                        : 'text'
                    }
                    value={aiMode ? aiInput : currentInput}
                    onChange={(e) => {
                      if (aiMode) {
                        setAiInput(e.target.value);
                      } else {
                        setCurrentInput(e.target.value);
                        setValidationError('');
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && (aiMode ? handleAiMessage() : handleQuestionSubmit())}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                    style={{ color: config.theme.textColor }}
                  />
                  <button
                    onClick={aiMode ? handleAiMessage : handleQuestionSubmit}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: config.theme.primaryColor }}
                    disabled={isTyping}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                  {!aiMode && currentQuestion && !currentQuestion.required && (
                    <button
                      onClick={handleSkipQuestion}
                      className="px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-300 hover:bg-gray-100 transition-colors"
                      disabled={isTyping}
                    >
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!(canRemovePoweredBy && (bot.config.theme?.removePoweredBy || owner?.removePoweredBy)) && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              {bot.type === 'smart' && (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by AI •{' '}
                </>
              )}
              Powered by <a href="/" target="_blank" rel="noopener noreferrer" className="ml-1 font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Flood.chat</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
