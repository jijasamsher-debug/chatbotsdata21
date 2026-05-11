import { useEffect, useState, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { Bot, Question } from '../types';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import floodLogo from '../assets/flood-logo.png';

interface ModernUIWidgetProps {
  bot: Bot;
  owner?: {
    removePoweredBy?: boolean;
    trialActive?: boolean;
    subscription?: {
      status: string;
      plan?: string;
    };
  };
}

export const ModernUIWidget = ({ bot, owner }: ModernUIWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'bot' | 'user'; text: string; gifUrl?: string; ctas?: Array<{ text: string; url: string }> }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [multiSelectChoices, setMultiSelectChoices] = useState<string[]>([]);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = bot.config;
  const theme = config.theme;

  const isBotPaused = owner && !owner.trialActive && owner.subscription?.status !== 'active';

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

  const currentPageRule = config.pageRules.find(rule => {
    const pattern = rule.urlPattern.replace(/\*/g, '.*');
    const regex = new RegExp(pattern);
    const hostUrl = getHostPageUrl();
    try {
      const url = new URL(hostUrl);
      return regex.test(url.pathname) || regex.test(hostUrl);
    } catch {
      return regex.test(hostUrl);
    }
  });

  const activeQuestions = (currentPageRule?.questions && currentPageRule.questions.length > 0)
    ? currentPageRule.questions
    : config.questions;

  useEffect(() => {
    if (!isOpen && config.popupDelay > 0) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, config.popupDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, config.popupDelay]);

  useEffect(() => {
    if (!isOpen && !hasAutoOpened && theme.autoOpenDelay && theme.autoOpenDelay > 0) {
      const timer = setTimeout(() => {
        setHasAutoOpened(true);
        openWidget();
      }, theme.autoOpenDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasAutoOpened, theme.autoOpenDelay]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const typeMessage = async (text: string, gifUrl?: string, ctas?: Array<{ text: string; url: string }>) => {
    setIsTyping(true);
    const typingSpeed = theme.typingSpeed || 50;
    const delay = Math.min(text.length * typingSpeed, 3000);
    await new Promise(resolve => setTimeout(resolve, Math.max(delay, 300)));
    setMessages(prev => [...prev, { type: 'bot', text, gifUrl, ctas }]);
    setIsTyping(false);
  };

  const sendFollowUpMessages = async (question: Question, selectedOption?: string) => {
    const collected: NonNullable<Question['followUpMessages']> = [];
    if (question.followUpMessages?.length) collected.push(...question.followUpMessages);
    if (selectedOption && question.optionFollowUps) {
      const parts = selectedOption.split(',').map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (question.optionFollowUps[p]?.length) collected.push(...question.optionFollowUps[p]);
      }
    }
    if (collected.length === 0) return;
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

  const advanceToNextQuestion = async (currentIdx: number, newAnswers: Record<string, string>, selectedOption?: string) => {
    const currentQuestion = activeQuestions[currentIdx];
    // Send follow-up messages for current question (with optional per-option follow-ups)
    await sendFollowUpMessages(currentQuestion, selectedOption);

    if (currentIdx < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentIdx + 1);
      await askQuestion(activeQuestions[currentIdx + 1]);
    } else {
      await saveLead(newAnswers);
      const thankYouMsg = currentPageRule?.customThankYouMessage || theme.thankYouMessage || 'Thank you! We\'ll get back to you soon.';
      const thankYouGifUrl = currentPageRule?.thankYouGifUrl || theme.thankYouGifUrl;
      // Determine primary CTA — page rule overrides theme
      const ctaText = currentPageRule?.thankYouCtaText || theme.thankYouCtaText;
      const ctaUrlRaw = currentPageRule?.thankYouCtaUrl || theme.thankYouCtaUrl;
      // Build all CTAs array — page rule CTAs override theme CTAs
      const allCtas: Array<{text: string; url: string}> = [];
      if (ctaText && ctaUrlRaw) {
        allCtas.push({ text: ctaText, url: ctaUrlRaw.startsWith('http') ? ctaUrlRaw : `https://${ctaUrlRaw}` });
      }
      const extraCtas = currentPageRule?.thankYouCtas || theme.thankYouCtas || [];
      for (const cta of extraCtas) {
        if (cta.text && cta.url) {
          allCtas.push({ text: cta.text, url: cta.url.startsWith('http') ? cta.url : `https://${cta.url}` });
        }
      }
      const ctaSuffix = allCtas.map(c => `__PGCTA__${c.text}__URL__${c.url}`).join('');
      const gifSuffix = thankYouGifUrl ? `__TYGIF__${thankYouGifUrl}` : '';
      setIsTyping(true);
      const typingDelay = Math.min(thankYouMsg.length * (theme.typingSpeed || 50), 3000);
      await new Promise(resolve => setTimeout(resolve, Math.max(typingDelay, 300)));
      setMessages(prev => [...prev, { type: 'bot', text: `__THANKYOU__${thankYouMsg}${ctaSuffix}${gifSuffix}` }]);
      setIsTyping(false);
      setLeadSubmitted(true);
    }
  };

  const openWidget = async () => {
    setIsOpen(true);
    setShowPopup(false);

    if (messages.length === 0) {
      await typeMessage(config.welcomeMessage, config.welcomeGifUrl);

      if (activeQuestions.length > 0 && theme.ctaMessage) {
        await typeMessage(`__CTA__${theme.ctaMessage}`);
      } else if (activeQuestions.length > 0) {
        setCurrentQuestionIndex(0);
        await askQuestion(activeQuestions[0]);
      }
    }
  };

  const handleCtaClick = async () => {
    setMessages(prev => prev.filter(m => !m.text.startsWith('__CTA__')));
    setMessages(prev => [...prev, { type: 'user', text: theme.ctaText || theme.ctaMessage || 'Yes, let\'s go' }]);

    if (activeQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      await askQuestion(activeQuestions[0]);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleOptionSelect = async (option: string) => {
    const currentQuestion = activeQuestions[currentQuestionIndex];
    setMessages(prev => [...prev, { type: 'user', text: option }]);

    const questionKey = currentQuestion.columnHeader || currentQuestion.text;
    const newAnswers = { ...answers, [questionKey]: option };
    setAnswers(newAnswers);

    await advanceToNextQuestion(currentQuestionIndex, newAnswers, option);
  };

  const handleSubmit = async () => {
    if (!currentInput.trim()) return;

    const currentQuestion = activeQuestions[currentQuestionIndex];

    if (currentQuestion.type === 'email' && !validateEmail(currentInput)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (currentQuestion.type === 'phone' && !validatePhone(currentInput)) {
      setValidationError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setValidationError('');
    setMessages(prev => [...prev, { type: 'user', text: currentInput }]);

    const questionKey = currentQuestion.columnHeader || currentQuestion.text;
    const newAnswers = { ...answers, [questionKey]: currentInput };
    setAnswers(newAnswers);
    setCurrentInput('');

    await advanceToNextQuestion(currentQuestionIndex, newAnswers);
  };

  const handleSkipQuestion = async () => {
    const currentQuestion = activeQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    setValidationError('');
    setMessages(prev => [...prev, { type: 'user', text: 'Skipped' }]);
    const questionKey = currentQuestion.columnHeader || currentQuestion.text;
    const newAnswers = { ...answers, [questionKey]: 'Skipped' };
    setAnswers(newAnswers);
    setCurrentInput('');

    await advanceToNextQuestion(currentQuestionIndex, newAnswers);
  };

  const saveLead = async (finalAnswers: Record<string, string>) => {
    try {
      const emailQuestion = activeQuestions.find(q => q.type === 'email');
      const phoneQuestion = activeQuestions.find(q => q.type === 'phone');

      const emailKey = emailQuestion ? (emailQuestion.columnHeader || emailQuestion.text) : '';
      const phoneKey = phoneQuestion ? (phoneQuestion.columnHeader || phoneQuestion.text) : '';

      const email = emailKey ? finalAnswers[emailKey] : '';
      const phone = phoneKey ? finalAnswers[phoneKey] : '';

      const leadId = `${bot.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'leads', leadId), {
        botId: bot.id,
        ownerId: bot.ownerId,
        collectedAt: Timestamp.now(),
        pageUrl: window.location.href,
        email: email,
        phone: phone,
        answers: finalAnswers,
        sessionId: leadId
      });
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const renderMessage = (msg: { type: 'bot' | 'user'; text: string; gifUrl?: string; ctas?: Array<{ text: string; url: string }> }, index: number) => {
    if (msg.text.startsWith('__CTA__')) {
      const ctaMessage = msg.text.replace('__CTA__', '');
      return (
        <div key={index} className="tapwell-cta-container" style={{
          alignSelf: 'flex-start',
          background: '#f5f5f5',
          padding: '6px 10px',
          borderRadius: '14px',
          maxWidth: '85%',
          margin: '4px 0',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          <span>{ctaMessage}</span>
          <div style={{ marginTop: '4px' }}>
            <button
              onClick={handleCtaClick}
              style={{
                backgroundColor: theme.primaryColor,
                color: '#fff',
                border: `1px solid ${theme.primaryColor}`,
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {theme.ctaText || 'YES, LET\'S GO ➔'}
            </button>
          </div>
        </div>
      );
    }

    if (msg.text.startsWith('__THANKYOU__')) {
      const raw = msg.text.replace('__THANKYOU__', '');
      // Parse GIF
      const gifMatch = raw.match(/__TYGIF__(.+)$/);
      const thankYouGif = gifMatch ? gifMatch[1] : null;
      const withoutGif = thankYouGif ? raw.replace(`__TYGIF__${thankYouGif}`, '') : raw;
      // Parse all embedded CTAs
      const ctaRegex = /__PGCTA__(.+?)__URL__(.+?)(?=__PGCTA__|__TYGIF__|$)/g;
      const thankYouText = withoutGif.split('__PGCTA__')[0];
      const ctas: Array<{text: string; url: string}> = [];
      let match;
      while ((match = ctaRegex.exec(withoutGif)) !== null) {
        ctas.push({ text: match[1], url: match[2] });
      }
      // Fall back to theme CTA if none embedded
      if (ctas.length === 0 && theme.thankYouCtaText && theme.thankYouCtaUrl) {
        const url = theme.thankYouCtaUrl.startsWith('http') ? theme.thankYouCtaUrl : `https://${theme.thankYouCtaUrl}`;
        ctas.push({ text: theme.thankYouCtaText, url });
      }
      return (
        <div key={index} style={{
          alignSelf: 'flex-start',
          background: '#f1f0f0',
          padding: '10px 14px',
          borderRadius: '18px 18px 18px 0',
          fontSize: '14px',
          color: '#333',
          maxWidth: '80%'
        }}>
          {thankYouGif && (
            <img src={thankYouGif} alt="Thank you" style={{ maxHeight: '120px', borderRadius: '12px', marginBottom: '8px' }} />
          )}
          <div>{thankYouText}</div>
          {ctas.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ctas.map((cta, ci) => (
                <a
                  key={ci}
                  href={cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'inline-block',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  {cta.text}
                </a>
              ))}
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        style={{
          alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
          background: msg.type === 'user' ? '#dcf8c6' : '#f1f0f0',
          padding: '10px 14px',
          borderRadius: msg.type === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
          fontSize: '14px',
          color: msg.type === 'user' ? '#222' : '#333',
          maxWidth: '80%',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      >
        {msg.gifUrl && (
          <img
            src={msg.gifUrl}
            alt="GIF"
            style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '6px' : '0' }}
          />
        )}
        {msg.text && <span>{msg.text}</span>}
        {msg.ctas && msg.ctas.length > 0 && (
          <div style={{ marginTop: msg.text || msg.gifUrl ? '8px' : '0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {msg.ctas.map((cta, ci) => (
              <a
                key={ci}
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: theme.primaryColor,
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
        <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };

  const popupAnim = theme.popupAnimation || 'bounce';
  const widgetAnim = theme.widgetAnimation || 'fade';

  const popupAnimStyle: React.CSSProperties = {
    bounce: { animation: 'popupBounce 1s ease infinite' },
    fade: { animation: 'popupSlideIn 0.3s ease' },
    slide: { animation: 'popupSlideIn 0.3s ease' },
    none: {}
  }[popupAnim];

  const widgetAnimStyle: React.CSSProperties = {
    fade: { animation: 'widgetFadeIn 0.3s ease' },
    slide: { animation: 'widgetSlideIn 0.3s ease' },
    scale: { animation: 'widgetScaleIn 0.3s ease' },
    none: {}
  }[widgetAnim];

  return (
    <>
      <style>{`
        @keyframes pulseGreen {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        @keyframes pulse {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popupBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes widgetFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes widgetSlideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes widgetScaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {showPopup && !isOpen && (
        <div
          onClick={openWidget}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            background: '#fff',
            color: '#333',
            padding: '12px 16px',
            fontSize: '15px',
            maxWidth: '260px',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            border: '1px solid #e0e0e0',
            zIndex: 999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            ...popupAnimStyle
          }}
        >
          <div style={{ flex: 1 }}>
            {config.popupGifUrl && (
              <img src={config.popupGifUrl} alt="GIF" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '6px' }} />
            )}
            <span>{config.popupMessage}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: '0',
              fontSize: '18px',
              lineHeight: '1',
              flexShrink: 0
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      <button
        onClick={openWidget}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '72px',
          height: '72px',
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 999,
          display: isOpen ? 'none' : 'block'
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src={theme.botAvatarUrl || floodLogo}
            alt="Chat"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '20px',
              height: '20px',
              backgroundColor: isBotPaused ? '#999' : '#4CAF50',
              borderRadius: '50%',
              animation: isBotPaused ? 'none' : 'pulseGreen 2s infinite',
              border: '3px solid white'
            }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '320px',
            height: '480px',
            background: 'white',
            border: '1px solid #ccc',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...widgetAnimStyle
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: theme.primaryColor,
              color: 'white',
              padding: '8px 12px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'white',
                marginRight: '10px',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img
                src={theme.logoUrl || floodLogo}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', flexGrow: 1 }}>
              {bot.name}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '22px',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ textAlign: 'center', userSelect: 'none', marginBottom: '12px' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 8px' }}>
                <img
                  src={theme.botAvatarUrl || floodLogo}
                  alt="Bot"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: isBotPaused ? '#999' : '#4CAF50',
                    borderRadius: '50%',
                    animation: isBotPaused ? 'none' : 'pulse 1.5s infinite',
                    border: '2px solid white'
                  }}
                />
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: theme.primaryColor, marginBottom: '4px' }}>
                {theme.botName || 'Assistant'}
              </div>
              <div style={{ fontSize: '14px', color: isBotPaused ? '#000000' : '#666' }}>
                {isBotPaused ? 'This bot is currently paused. Please contact the site owner.' : (theme.botSubtitle || 'Customer Support')}
              </div>
            </div>

            {messages.map(renderMessage)}

            {isTyping && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f0f0',
                  borderRadius: '18px 18px 18px 0',
                  padding: '10px 14px',
                  alignSelf: 'flex-start'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      style={{
                        width: '6px',
                        height: '6px',
                        background: '#666',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'bounce 1.2s infinite ease-in-out both',
                        animationDelay: `${-0.32 + i * 0.16}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inline options for select/qualify questions */}
            {!isTyping && !leadSubmitted && currentQuestionIndex >= 0 && (activeQuestions[currentQuestionIndex]?.type === 'select' || activeQuestions[currentQuestionIndex]?.type === 'qualify') && activeQuestions[currentQuestionIndex]?.options?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
                {activeQuestions[currentQuestionIndex].options!.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(option)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: `1px solid ${theme.primaryColor}`,
                      background: 'white',
                      color: theme.primaryColor,
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {option}
                  </button>
                ))}
                {!activeQuestions[currentQuestionIndex].required && (
                  <button
                    onClick={handleSkipQuestion}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid #ccc',
                      background: 'white',
                      color: '#999',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Skip →
                  </button>
                )}
              </div>
            ) : null}

            {/* Inline checkboxes for multiselect questions */}
            {!isTyping && !leadSubmitted && currentQuestionIndex >= 0 && activeQuestions[currentQuestionIndex]?.type === 'multiselect' && activeQuestions[currentQuestionIndex]?.options?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeQuestions[currentQuestionIndex].options!.map((option, i) => {
                    const checked = multiSelectChoices.includes(option);
                    return (
                      <button
                        key={i}
                        onClick={() => setMultiSelectChoices(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.primaryColor}`,
                          background: checked ? theme.primaryColor : 'white',
                          color: checked ? 'white' : theme.primaryColor,
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{
                          width: 14, height: 14, border: `1.5px solid ${checked ? 'white' : theme.primaryColor}`,
                          borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: checked ? 'white' : 'transparent', color: theme.primaryColor, fontSize: 10, fontWeight: 700
                        }}>{checked ? '✓' : ''}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => {
                      if (multiSelectChoices.length === 0) return;
                      const joined = multiSelectChoices.join(', ');
                      setMultiSelectChoices([]);
                      handleOptionSelect(joined);
                    }}
                    disabled={multiSelectChoices.length === 0}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      background: theme.primaryColor,
                      color: 'white',
                      fontSize: '13px',
                      cursor: multiSelectChoices.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: multiSelectChoices.length === 0 ? 0.5 : 1,
                      fontWeight: '500'
                    }}
                  >
                    Submit ({multiSelectChoices.length})
                  </button>
                  {!activeQuestions[currentQuestionIndex].required && (
                    <button
                      onClick={() => { setMultiSelectChoices([]); handleSkipQuestion(); }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid #ccc',
                        background: 'white',
                        color: '#999',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Skip →
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {!leadSubmitted && currentQuestionIndex >= 0 && (
            <div style={{ borderTop: '1px solid #ccc', background: 'white' }}>
              {validationError && (
                <div style={{
                  padding: '8px 12px',
                  background: '#fee',
                  color: '#c33',
                  fontSize: '12px',
                  borderBottom: '1px solid #fcc'
                }}>
                  {validationError}
                </div>
              )}
              {(activeQuestions[currentQuestionIndex]?.type === 'select' || activeQuestions[currentQuestionIndex]?.type === 'qualify' || activeQuestions[currentQuestionIndex]?.type === 'multiselect') && activeQuestions[currentQuestionIndex]?.options?.length ? (
                null
              ) : activeQuestions[currentQuestionIndex]?.type === 'date' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '50px'
                  }}
                >
                  <input
                    type="date"
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      setValidationError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    style={{
                      flex: 1,
                      height: '100%',
                      padding: '0 12px',
                      fontSize: '14px',
                      border: 'none',
                      outline: 'none',
                      background: 'white',
                      color: '#333'
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    style={{
                      width: '70px',
                      height: '100%',
                      background: theme.primaryColor,
                      color: 'white',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    SEND
                  </button>
                  {!activeQuestions[currentQuestionIndex]?.required && (
                    <button
                      onClick={handleSkipQuestion}
                      style={{
                        width: '50px',
                        height: '100%',
                        background: '#f5f5f5',
                        color: '#999',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Skip
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '50px'
                  }}
                >
                  <input
                    type={activeQuestions[currentQuestionIndex]?.type === 'email' ? 'email' : activeQuestions[currentQuestionIndex]?.type === 'phone' ? 'tel' : 'text'}
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      setValidationError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      height: '100%',
                      padding: '0 12px',
                      fontSize: '14px',
                      border: 'none',
                      outline: 'none',
                      background: 'white',
                      color: '#333'
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    style={{
                      width: '70px',
                      height: '100%',
                      background: theme.primaryColor,
                      color: 'white',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    SEND
                  </button>
                  {!activeQuestions[currentQuestionIndex]?.required && (
                    <button
                      onClick={handleSkipQuestion}
                      style={{
                        width: '50px',
                        height: '100%',
                        background: '#f5f5f5',
                        color: '#999',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {(() => {
            const canRemove = owner?.subscription?.plan === 'growth' || owner?.subscription?.plan === 'growth_yearly';
            const hide = canRemove && (theme?.removePoweredBy || owner?.removePoweredBy);
            return !hide;
          })() && (
            <div
              style={{
                padding: '6px 12px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#999',
                borderTop: '1px solid #eee',
                background: 'white'
              }}
            >
              Powered by <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: '#666', textDecoration: 'none' }}>Flood.chat</a>
            </div>
          )}
        </div>
      )}
    </>
  );
};
