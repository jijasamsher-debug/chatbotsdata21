import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import floodLogo from '../assets/flood-logo.png';

interface Message {
  type: 'bot' | 'user';
  text: string;
}

type DemoStep = 'welcome' | 'free_input' | 'ask_name' | 'ask_email' | 'done';

export const HomeDemoWidget = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<DemoStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [emailError, setEmailError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    addBotMessage('Hey! This is Anaya 👋 How can I help you today?');
    setStep('free_input');
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  const addBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text }]);
      setIsTyping(false);
    }, 800);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    setEmailError('');

    setMessages(prev => [...prev, { type: 'user', text: userText }]);

    if (step === 'free_input') {
      setStep('ask_name');
      setTimeout(() => addBotMessage('Thanks for reaching out! Before I help you, may I know your name?'), 300);
    } else if (step === 'ask_name') {
      setStep('ask_email');
      setTimeout(() => addBotMessage(`Nice to meet you, ${userText}! Could you share your email so we can follow up?`), 300);
    } else if (step === 'ask_email') {
      if (!validateEmail(userText)) {
        setEmailError('Please enter a valid email address');
        // Remove the invalid user message and re-prompt
        setTimeout(() => addBotMessage('That doesn\'t look like a valid email. Please enter a valid email address.'), 300);
        return;
      }
      setStep('done');
      setTimeout(() => addBotMessage('See? It\'s that easy to collect leads data! 🎉\n\nThis is just a demo — no data is stored. Refresh to try again!'), 300);
    }
  };

  const getPlaceholder = () => {
    switch (step) {
      case 'free_input': return 'Type anything...';
      case 'ask_name': return 'Enter your name...';
      case 'ask_email': return 'Enter your email...';
      default: return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto border border-gray-200 dark:border-gray-700 w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          <img src={floodLogo} alt="Flood.chat" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">Anaya</h3>
          <p className="text-blue-100 text-xs">Live Demo • No data stored</p>
        </div>
        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
      </div>

      {/* Chat area */}
      <div className="h-[320px] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {step !== 'done' ? (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {emailError && (
            <p className="text-xs text-red-500 mb-2 px-1">{emailError}</p>
          )}
          <div className="flex gap-2">
            <input
              type={step === 'ask_email' ? 'email' : 'text'}
              value={input}
              onChange={(e) => { setInput(e.target.value); setEmailError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={getPlaceholder()}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
            Demo complete • Refresh page to restart
          </p>
        </div>
      )}
    </div>
  );
};
