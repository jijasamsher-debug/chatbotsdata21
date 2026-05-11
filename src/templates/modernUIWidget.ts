export interface ModernUIConfig {
  companyName: string;
  botName: string;
  botSubtitle: string;
  logoUrl: string;
  botAvatarUrl: string;
  primaryColor: string;
  webhookUrl: string;
  welcomeMessage: string;
  secondaryPrompt: string;
  buttonText: string;
  popupMessage: string;
  removePoweredBy?: boolean;
}

export function generateModernUIWidget(config: ModernUIConfig): string {
  return `(function() {
  const container = document.createElement('div');
  container.id = 'chatbot-widget-container';

  container.innerHTML = \`
    <style>
      #chatbot-widget-container * {
        box-sizing: border-box !important;
      }

      #chatbot-widget-container { font-family: Arial, sans-serif; }

      #chat-toggle {
        position: fixed;
        bottom: 19px;
        right: 20px;
        width: 72px;
        height: 72px;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        border-radius: 50%;
        overflow: visible;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 99999 !important;
      }

      #chat-toggle img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        display: block !important;
        position: relative;
        z-index: 100000 !important;
        border-radius: 50%;
      }

      #chat-toggle .toggle-online-indicator {
        position: absolute !important;
        bottom: 2px !important;
        right: 2px !important;
        width: 20px !important;
        height: 20px !important;
        background-color: #4CAF50 !important;
        border-radius: 50% !important;
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7) !important;
        animation: pulseGreen 2s infinite !important;
        border: 3px solid white !important;
        z-index: 100001 !important;
      }

      @keyframes pulseGreen {
        0% {
          transform: scale(0.95) !important;
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7) !important;
        }
        70% {
          transform: scale(1) !important;
          box-shadow: 0 0 0 10px rgba(76, 175, 80, 0) !important;
        }
        100% {
          transform: scale(0.95) !important;
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0) !important;
        }
      }

      #chat-popup {
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: #fff;
        color: #333;
        padding: 8px 12px !important;
        font-size: 15px !important;
        line-height: 1.4 !important;
        text-align: left !important;
        white-space: normal !important;
        word-break: break-word !important;
        max-width: 260px !important;
        border-radius: 12px;
        z-index: 1000;
        display: none;
        align-items: flex-start;
        gap: 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        user-select: none;
        cursor: pointer;
        border: 1px solid #e0e0e0;
        font-weight: 400;
        font-family: Arial, sans-serif;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      #chat-popup.show {
        opacity: 1;
        transform: translateY(0);
      }

      .popup-loading-dots {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        padding: 8px 12px !important;
      }

      .popup-loading-dots span {
        width: 8px !important;
        height: 8px !important;
        background: #666 !important;
        border-radius: 50% !important;
        display: inline-block !important;
        animation: popupBounce 1.4s infinite ease-in-out both !important;
      }

      .popup-loading-dots span:nth-child(1) { animation-delay: -0.32s !important; }
      .popup-loading-dots span:nth-child(2) { animation-delay: -0.16s !important; }
      .popup-loading-dots span:nth-child(3) { animation-delay: 0 !important; }

      @keyframes popupBounce {
        0%, 80%, 100% {
          transform: scale(0) !important;
          opacity: 0.5 !important;
        }
        40% {
          transform: scale(1) !important;
          opacity: 1 !important;
        }
      }

      #chat-popup button {
        background: transparent;
        color: #666;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        margin-left: auto;
      }

      #chat-widget {
        display: none;
        flex-direction: column;
        position: fixed !important;
        bottom: 80px !important;
        right: 20px !important;
        width: 320px !important;
        height: 480px !important;
        background: white !important;
        border: 1px solid #ccc !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
        border-radius: 8px !important;
        z-index: 1000 !important;
        overflow: hidden !important;
        font-family: Arial, sans-serif !important;
      }

      #chat-header {
        display: flex !important;
        align-items: center !important;
        background: ${config.primaryColor} !important;
        color: white !important;
        padding: 8px 12px !important;
        flex-shrink: 0 !important;
      }

      #chat-header .logo {
        width: 36px !important;
        height: 36px !important;
        border-radius: 50% !important;
        background: white !important;
        color: ${config.primaryColor} !important;
        font-weight: bold !important;
        font-size: 20px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        user-select: none !important;
        margin-right: 10px !important;
        flex-shrink: 0 !important;
        overflow: hidden !important;
      }

      #chat-header .logo img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }

      #chat-header .company-name {
        font-weight: bold !important;
        font-size: 18px !important;
        flex-grow: 1 !important;
        user-select: none !important;
      }

      #chat-header button.close-btn {
        background: transparent !important;
        border: none !important;
        color: white !important;
        font-size: 22px !important;
        cursor: pointer !important;
        padding: 0 !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      }

      #chat-messages {
        flex: 1 !important;
        padding: 12px !important;
        overflow-y: auto !important;
        background: #fafafa !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
      }

      .message {
        max-width: 80% !important;
        word-wrap: break-word !important;
        line-height: 1.4 !important;
      }

      .user {
        align-self: flex-end !important;
        background: #dcf8c6 !important;
        padding: 10px 14px !important;
        border-radius: 18px 18px 0 18px !important;
        font-size: 14px !important;
        color: #222 !important;
        white-space: pre-wrap !important;
      }

      .bot {
        align-self: flex-start !important;
        background: #f1f0f0 !important;
        padding: 10px 14px !important;
        border-radius: 18px 18px 18px 0 !important;
        font-size: 14px !important;
        color: #333 !important;
        white-space: pre-wrap !important;
        max-width: 80% !important;
      }

      .bot a {
        color: #007BFF !important;
        text-decoration: underline !important;
      }

      .timestamp {
        font-size: 10px !important;
        color: #888 !important;
        margin-top: 3px !important;
        user-select: none !important;
      }

      #chat-input {
        display: flex !important;
        border-top: 1px solid #ccc !important;
        background: white !important;
        flex-shrink: 0 !important;
        height: 50px !important;
        align-items: center !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      #messageInput {
        width: calc(100% - 70px) !important;
        height: 100% !important;
        border: none !important;
        padding: 0 12px !important;
        font-size: 14px !important;
        outline: none !important;
        border-radius: 0 !important;
        background: white !important;
        color: #333 !important;
        font-family: Arial, sans-serif !important;
        box-sizing: border-box !important;
      }

      #messageInput::placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }

      #messageInput:focus {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
      }

      #chat-input.options-active {
        display: none !important;
      }

      #chat-input button {
        width: 70px !important;
        height: 100% !important;
        background: ${config.primaryColor} !important;
        color: white !important;
        border: none !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        cursor: pointer !important;
        font-family: Arial, sans-serif !important;
        border-radius: 0 !important;
        box-sizing: border-box !important;
      }

      #chat-input button:hover {
        opacity: 0.9 !important;
      }

      .loading {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        background: #f1f0f0 !important;
        border-radius: 18px 18px 18px 0 !important;
        padding: 10px 14px !important;
        align-self: flex-start !important;
      }

      .typing-dots {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 24px !important;
        height: 8px !important;
      }

      .typing-dots span {
        width: 6px !important;
        height: 6px !important;
        background: #666 !important;
        border-radius: 50% !important;
        display: inline-block !important;
        animation: bounce 1.2s infinite ease-in-out both !important;
      }

      .typing-dots span:nth-child(1) { animation-delay: -0.32s !important; }
      .typing-dots span:nth-child(2) { animation-delay: -0.16s !important; }
      .typing-dots span:nth-child(3) { animation-delay: 0 !important; }

      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0) !important; }
        40% { transform: scale(1) !important; }
      }

      #bot-identity {
        text-align: center !important;
        margin-bottom: 10px !important;
        user-select: none !important;
      }

      #bot-identity .logo {
        position: relative !important;
        width: 72px !important;
        height: 72px !important;
        border-radius: 50% !important;
        background: ${config.primaryColor} !important;
        color: white !important;
        font-weight: bold !important;
        font-size: 36px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        margin: 0 auto 8px !important;
        overflow: hidden !important;
      }

      #bot-identity .logo img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }

      .online-indicator {
        position: absolute !important;
        bottom: 4px !important;
        right: 4px !important;
        width: 12px !important;
        height: 12px !important;
        background-color: #4CAF50 !important;
        border-radius: 50% !important;
        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7) !important;
        animation: pulse 1.5s infinite !important;
        border: 2px solid white !important;
      }

      @keyframes pulse {
        0% { transform: scale(0.9) !important; box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7) !important; }
        70% { transform: scale(1) !important; box-shadow: 0 0 0 6px rgba(76, 175, 80, 0) !important; }
        100% { transform: scale(0.9) !important; box-shadow: 0 0 0 0 rgba(76, 175, 80, 0) !important; }
      }

      #bot-identity .bot-title {
        font-weight: bold !important;
        font-size: 18px !important;
        color: ${config.primaryColor} !important;
        margin-bottom: 4px !important;
      }

      #bot-identity .bot-subtitle {
        font-size: 14px !important;
        color: #666 !important;
      }

      #powered-by {
        text-align: center !important;
        font-size: 11px !important;
        padding: 6px 12px !important;
        background: white !important;
        color: #999 !important;
        border-top: 1px solid #eee !important;
        flex-shrink: 0 !important;
        display: ${config.removePoweredBy ? 'none' : 'block'} !important;
      }

      #powered-by a {
        color: #666 !important;
        text-decoration: none !important;
        font-weight: 600 !important;
      }
    </style>

    <button id="chat-toggle" aria-label="Open chat">
      <img src="${config.botAvatarUrl}" alt="Chat Icon" />
      <div class="toggle-online-indicator" title="Online"></div>
    </button>

    <div id="chat-popup" role="alert" aria-live="polite">
      <div class="popup-loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span id="popup-message" style="display: none;">${config.popupMessage}</span>
      <button aria-label="Close greeting popup" id="popup-close" style="display: none;">✖</button>
    </div>

    <div id="chat-widget" role="region" aria-label="Chat widget" aria-hidden="true">
      <div id="chat-header">
        <div class="logo">
          <img src="${config.logoUrl}" alt="Logo" />
        </div>
        <div class="company-name">${config.companyName}</div>
        <button class="close-btn" aria-label="Close chat widget">✖</button>
      </div>
      <div id="chat-messages">
        <div id="bot-identity">
          <div class="logo">
            <img src="${config.botAvatarUrl}" alt="Bot Logo" />
            <div class="online-indicator" title="Online"></div>
          </div>
          <div class="bot-title">${config.botName}</div>
          <div class="bot-subtitle">${config.botSubtitle}</div>
        </div>
      </div>
      <div id="chat-input">
        <input
          type="text"
          id="messageInput"
          placeholder="Type a message..."
          autocomplete="off"
        />
        <button id="send-btn">SEND</button>
      </div>
      <div id="powered-by">
        Powered by <a href="/" target="_blank" rel="noopener noreferrer">Powered by <a href="/" target="_blank" rel="noopener noreferrer">Flood.chat</a></a>
      </div>
    </div>

    <audio id="notify-sound" src="" preload="auto"></audio>
  \`;

  document.body.appendChild(container);

  requestAnimationFrame(() => {
    const chatId = crypto.randomUUID();
    const toggleBtn = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('send-btn');
    const chatPopup = document.getElementById('chat-popup');
    const popupCloseBtn = document.getElementById('popup-close');
    const notifySound = document.getElementById('notify-sound');
    const closeBtn = document.querySelector('#chat-header .close-btn');
    const popupLoadingDots = document.querySelector('.popup-loading-dots');
    const popupMessageElement = document.getElementById('popup-message');
    const chatInput = document.getElementById('chat-input');

    let welcomeShown = false;

    function toggleChat(open) {
      if (open === undefined) open = chatWidget.style.display !== 'flex';
      chatWidget.style.display = open ? 'flex' : 'none';
      chatWidget.setAttribute('aria-hidden', !open);
      if (open && !welcomeShown) {
        showWelcomeMessage();
        welcomeShown = true;
      }
      if (open) {
        setTimeout(() => messageInput.focus(), 100);
      }
    }

    toggleBtn.onclick = () => { toggleChat(); chatPopup.style.display = 'none'; };
    closeBtn.onclick = () => toggleChat(false);
    popupCloseBtn.onclick = e => { e.stopPropagation(); chatPopup.style.display = 'none'; };
    chatPopup.onclick = () => { toggleChat(true); chatPopup.style.display = 'none'; };

    setTimeout(() => {
      chatPopup.style.display = 'flex';
      chatPopup.classList.add('show');

      setTimeout(() => {
        if (popupLoadingDots && popupLoadingDots.parentNode) {
          popupLoadingDots.remove();
        }
        popupMessageElement.style.display = 'block';
        popupCloseBtn.style.display = 'block';
        notifySound.play().catch(() => {});
      }, 1500);
    }, 2000);

    sendBtn.onclick = sendMessage;
    messageInput.onkeypress = e => { if (e.key === 'Enter') sendMessage(); };

    function escapeHtml(text) {
      return text.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[m]);
    }

    function parseMarkdown(text) {
      const escaped = escapeHtml(text);
      const withBold = escaped.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
      const withLinks = withBold.replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      return withLinks;
    }

    function appendMessage(msg, isUser = true) {
      chatInput.classList.remove('options-active');

      const div = document.createElement('div');
      div.className = \`message \${isUser ? 'user' : 'bot'}\`;

      if (isUser) {
        div.textContent = msg;
      } else {
        div.innerHTML = parseMarkdown(msg);
      }

      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      timestamp.textContent = new Date().toLocaleTimeString();
      div.appendChild(timestamp);

      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    window.sendMessageFromButton = function(text) {
      messageInput.value = text;
      chatInput.classList.remove('options-active');
      sendMessage();
    };

    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;

      appendMessage(message, true);
      messageInput.value = "";

      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message bot loading';
      loadingDiv.innerHTML = \`<div class="typing-dots"><span></span><span></span><span></span></div>\`;
      chatMessages.appendChild(loadingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const res = await fetch('${config.webhookUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: chatId,
            message: message,
            url: window.location.href,
            timestamp: new Date().toISOString()
          })
        });

        const text = await res.text();
        chatMessages.removeChild(loadingDiv);
        try {
          const data = JSON.parse(text);
          appendMessage(data.reply || "No reply.", false);
        } catch {
          appendMessage(text, false);
        }
        notifySound.play().catch(() => {});
      } catch (e) {
        console.error("Send failed:", e);
        chatMessages.removeChild(loadingDiv);
        appendMessage("Failed to send message.", false);
      } finally {
        messageInput.focus();
      }
    }

    function showWelcomeMessage() {
      const welcome = document.createElement('div');
      welcome.className = 'message bot loading';
      welcome.innerHTML = \`<div class="typing-dots"><span></span><span></span><span></span></div>\`;
      chatMessages.appendChild(welcome);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      setTimeout(() => {
        chatMessages.removeChild(welcome);
        appendMessage("${config.welcomeMessage}", false);
        notifySound.play().catch(() => {});

        ${config.secondaryPrompt ? `setTimeout(() => {
          const secondMsg = document.createElement('div');
          secondMsg.className = 'message bot';
          secondMsg.style.padding = '6px 10px';
          secondMsg.style.borderRadius = '14px';
          secondMsg.style.background = '#f5f5f5';
          secondMsg.style.maxWidth = '85%';
          secondMsg.style.margin = '4px 0';
          secondMsg.style.fontSize = '14px';
          secondMsg.style.lineHeight = '1.4';

          secondMsg.innerHTML = \\\`<span>${config.secondaryPrompt}</span>${config.buttonText ? `<div style="margin-top: 4px;"><button onclick="sendMessageFromButton('Yes lets go')" style="background-color:${config.primaryColor};color:#fff;border:1px solid ${config.primaryColor};padding:6px 14px;border-radius:20px;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1);">${config.buttonText} <span style='font-size:16px;'>➔</span></button></div>` : ''}\\\`;

          const timestamp = document.createElement('div');
          timestamp.className = 'timestamp';
          timestamp.textContent = new Date().toLocaleTimeString();
          secondMsg.appendChild(timestamp);

          chatMessages.appendChild(secondMsg);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          notifySound.play().catch(() => {});
        }, 1200);` : `
          if (window.currentQuestionIndex === undefined) {
            window.currentQuestionIndex = 0;
          }
          setTimeout(() => { askNextQuestion(); }, 1200);
        `}
      }, 1500);
    }
  });
})();`;
}
