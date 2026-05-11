import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { BotConfig, BotType } from '../../types';
import floodLogo from '../../assets/flood-logo.png';

interface BotPreviewProps {
  config: BotConfig;
  botType: BotType;
}

// Typing dots animation hook - shows dots for a duration based on speed, then reveals full text
function useTypingAnimation(text: string, speed: number = 50) {
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIsTyping(false);
    setDone(false);
    if (!text) { setDone(true); return; }
    setIsTyping(true);
    const delay = Math.min(text.length * speed, 3000);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setDone(true);
    }, Math.max(delay, 300));
    return () => clearTimeout(timer);
  }, [text, speed]);

  return { isTyping, done };
}

export const BotPreview = ({ config, botType }: BotPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isModern = config.theme.template === 'modernui';
  const typingSpeed = config.theme.typingSpeed || 50;

  if (isModern) {
    return <ModernPreview config={config} isOpen={isOpen} setIsOpen={setIsOpen} typingSpeed={typingSpeed} />;
  }

  return <StandardPreview config={config} isOpen={isOpen} setIsOpen={setIsOpen} typingSpeed={typingSpeed} />;
};

function StandardPreview({
  config,
  isOpen,
  setIsOpen,
  typingSpeed
}: {
  config: BotConfig;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  typingSpeed: number;
}) {
  const botName = config.theme.botName || 'Chat';
  const botAvatar = config.theme.botAvatarUrl || floodLogo;
  const { isTyping: welcomeTyping, done: welcomeDone } = useTypingAnimation(
    isOpen ? config.welcomeMessage : '',
    typingSpeed
  );

  return (
    <div className="relative">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Preview of your chatbot widget
        </p>
      </div>

      <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {!isOpen && (
          <div className="p-4">
            <button
              onClick={() => setIsOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: config.theme.primaryColor, color: '#ffffff' }}
            >
              <img src={botAvatar} alt="Bot" className="w-6 h-6 rounded-full object-cover" />
              <span className="font-medium">{botName}</span>
            </button>
          </div>
        )}

        {isOpen && (
          <div className="flex flex-col h-96">
            <div
              className="p-3 flex items-center gap-3"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              <img src={botAvatar} alt="Bot" className="w-8 h-8 rounded-full object-cover border-2 border-white/30" />
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm" style={{ fontFamily: config.theme.fontFamily }}>
                  {botName}
                </h3>
                <span className="text-white/70 text-xs">Online</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 p-4 overflow-y-auto space-y-3"
              style={{ backgroundColor: '#ffffff' }}
            >
              {/* Typing dots indicator */}
              {welcomeTyping && (
                <div className="flex items-start gap-2">
                  <img src={botAvatar} alt="Bot" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1" />
                  <div className="max-w-[80%] px-4 py-2 rounded-lg rounded-bl-none" style={{ backgroundColor: '#f3f4f6' }}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Welcome message */}
              {welcomeDone && (
                <div className="flex items-start gap-2">
                  <img src={botAvatar} alt="Bot" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1" />
                  <div
                    className="max-w-[80%] px-4 py-2 rounded-lg rounded-bl-none"
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                      fontFamily: config.theme.fontFamily
                    }}
                  >
                    {config.welcomeMessage}
                  </div>
                </div>
              )}

              {/* Welcome GIF */}
              {config.welcomeGifUrl && welcomeDone && (
                <div className="flex items-start gap-2">
                  <div className="w-6 flex-shrink-0" />
                  <img src={config.welcomeGifUrl} alt="Welcome" className="max-w-[60%] rounded-lg" />
                </div>
              )}

              {/* First question preview */}
              {welcomeDone && config.questions.length > 0 && (
                <div className="flex items-start gap-2">
                  <img src={botAvatar} alt="Bot" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1" />
                  <div
                    className="max-w-[80%] px-4 py-2 rounded-lg rounded-bl-none"
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                      fontFamily: config.theme.fontFamily
                    }}
                  >
                    {config.questions[0].text || 'Your first question...'}
                  </div>
                </div>
              )}

              {/* Dropdown options preview */}
              {welcomeDone && config.questions.find(q => q.type === 'select' && q.options?.length) && (() => {
                const selectQ = config.questions.find(q => q.type === 'select' && q.options?.length)!;
                return (
                  <div className="flex flex-wrap gap-1.5 px-8">
                    {selectQ.options!.map((opt, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium border"
                        style={{
                          borderColor: config.theme.primaryColor,
                          color: config.theme.primaryColor
                        }}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  style={{ fontFamily: config.theme.fontFamily }}
                  readOnly
                />
                <button
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: config.theme.primaryColor, color: '#ffffff' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Type:</strong> Leads Generator
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          <strong>Questions:</strong> {config.questions.length}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          <strong>Typing Speed:</strong> {config.theme.typingSpeed || 50}ms
        </p>
      </div>
    </div>
  );
}

function ModernPreview({
  config,
  isOpen,
  setIsOpen,
  typingSpeed
}: {
  config: BotConfig;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  typingSpeed: number;
}) {
  const theme = config.theme;
  const botName = theme.botName || 'Assistant';
  const botSubtitle = theme.botSubtitle || 'Online';
  const botAvatar = theme.botAvatarUrl || floodLogo;
  const logoUrl = theme.logoUrl || floodLogo;

  const { isTyping: welcomeTyping, done: welcomeDone } = useTypingAnimation(
    isOpen ? config.welcomeMessage : '',
    typingSpeed
  );

  return (
    <div className="relative">
      <style>{`
        @keyframes modernPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(76, 175, 80, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        @keyframes modernFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>

      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Preview — Modern UI with animations
        </p>
      </div>

      <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg p-6 min-h-[28rem] flex items-end justify-end">
        {/* Floating avatar button */}
        {!isOpen && (
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => setIsOpen(true)}
              style={{
                width: '64px',
                height: '64px',
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={botAvatar}
                  alt="Chat"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '1px',
                    right: '1px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '50%',
                    animation: 'modernPulse 2s infinite',
                    border: '2px solid white'
                  }}
                />
              </div>
            </button>
          </div>
        )}

        {/* Open chat window */}
        {isOpen && (
          <div
            style={{
              width: '300px',
              height: '420px',
              background: '#ffffff',
              border: '1px solid #ccc',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'modernFadeIn 0.3s ease'
            }}
          >
            {/* Header */}
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
                  src={logoUrl}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{botName}</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>{botSubtitle}</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar intro */}
            <div style={{ textAlign: 'center', padding: '16px 12px 8px', background: '#fafafa' }}>
              <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 6px' }}>
                <img
                  src={botAvatar}
                  alt={botName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
                <div style={{
                  position: 'absolute', bottom: '0', right: '0',
                  width: '14px', height: '14px',
                  backgroundColor: '#4CAF50', borderRadius: '50%',
                  border: '2px solid white',
                  animation: 'modernPulse 2s infinite'
                }} />
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{botName}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{botSubtitle}</div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Typing dots indicator */}
              {welcomeTyping && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#f1f0f0',
                    padding: '10px 14px',
                    borderRadius: '18px 18px 18px 0',
                    animation: 'modernFadeIn 0.3s ease'
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

              {/* Welcome message */}
              {welcomeDone && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#f1f0f0',
                    padding: '10px 14px',
                    borderRadius: '18px 18px 18px 0',
                    fontSize: '13px',
                    color: '#333',
                    maxWidth: '80%',
                    animation: 'modernFadeIn 0.3s ease'
                  }}
                >
                  {config.welcomeMessage}
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              {/* Welcome GIF */}
              {config.welcomeGifUrl && welcomeDone && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
                  <img src={config.welcomeGifUrl} alt="Welcome" style={{ borderRadius: '12px', width: '100%' }} />
                </div>
              )}

              {/* CTA message */}
              {welcomeDone && theme.ctaMessage && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#f5f5f5',
                    padding: '6px 10px',
                    borderRadius: '14px',
                    maxWidth: '85%',
                    margin: '4px 0',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    animation: 'modernFadeIn 0.3s ease'
                  }}
                >
                  <span>{theme.ctaMessage}</span>
                  {theme.ctaText && (
                    <div style={{ marginTop: '4px' }}>
                      <button
                        style={{
                          backgroundColor: theme.primaryColor,
                          color: '#fff',
                          border: `1px solid ${theme.primaryColor}`,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        {theme.ctaText} <span style={{ fontSize: '14px' }}>➔</span>
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '3px' }}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              {/* First question preview */}
              {welcomeDone && config.questions.length > 0 && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#f1f0f0',
                    padding: '10px 14px',
                    borderRadius: '18px 18px 18px 0',
                    fontSize: '13px',
                    color: '#333',
                    maxWidth: '80%'
                  }}
                >
                  {config.questions[0].text || 'Your first question...'}
                </div>
              )}

              {/* Dropdown options */}
              {welcomeDone && config.questions.find(q => q.type === 'select' && q.options?.length) && (() => {
                const selectQ = config.questions.find(q => q.type === 'select' && q.options?.length)!;
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 4px' }}>
                    {selectQ.options!.map((opt, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${theme.primaryColor}`,
                          color: theme.primaryColor,
                          fontSize: '11px',
                          fontWeight: '500'
                        }}
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Input */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid #eee', background: '#fff' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  readOnly
                />
                <button
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: theme.primaryColor,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send style={{ width: 16, height: 16 }} />
                </button>
              </div>
              {!theme.removePoweredBy && (
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                  Powered by Flood.chat
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Type:</strong> Leads Generator
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          <strong>Questions:</strong> {config.questions.length}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          <strong>Typing Speed:</strong> {config.theme.typingSpeed || 50}ms
        </p>
      </div>
    </div>
  );
}
