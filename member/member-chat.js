/**
 * ============================================================
 * MEMBER PORTAL — AI Assistant Chat Widget
 * File: member-chat.js
 * Injects a floating chat button + panel on every member app-shell
 * page. Talks to POST /api/chat (ChatHandler.java / Gemini). History
 * persists per-tab via sessionStorage so it survives page navigation.
 * ============================================================ */

'use strict';

const CHAT_HISTORY_KEY = 'carepoint_chat_history';
const CHAT_SUGGESTIONS = [
  'How does booking work?',
  'What services do you offer?',
  'Recommend a nurse for elderly care',
];

function loadChatHistory() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAT_HISTORY_KEY)) || [];
  } catch (err) {
    return [];
  }
}

function saveChatHistory(history) {
  try {
    sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    /* storage unavailable — chat still works, just won't persist */
  }
}

function initChatWidget() {
  if (document.getElementById('chatFabWrap')) return;

  const fabWrap = document.createElement('div');
  fabWrap.className = 'chat-fab-wrap';
  fabWrap.id = 'chatFabWrap';
  fabWrap.innerHTML = `
    <button class="chat-fab" id="chatFabBtn" aria-label="Open AI Assistant">
      <i class="fa-solid fa-comment-medical"></i>
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'chat-panel-overlay';
  overlay.id = 'chatPanelOverlay';
  overlay.innerHTML = `
    <div class="chat-panel">
      <div class="chat-panel-header">
        <div class="chat-panel-avatar"><i class="fa-solid fa-robot"></i></div>
        <div>
          <div class="chat-panel-title">CarePoint Assistant</div>
          <div class="chat-panel-subtitle">Ask about bookings, services, or nurses</div>
        </div>
        <button class="chat-panel-close" id="chatPanelClose" aria-label="Close chat">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-suggestions" id="chatSuggestions"></div>
      <div class="chat-input-row">
        <input type="text" class="chat-input" id="chatInput" placeholder="Type a message…" autocomplete="off" />
        <button class="chat-send-btn" id="chatSendBtn" aria-label="Send message">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(fabWrap);
  document.body.appendChild(overlay);

  const fabBtn = document.getElementById('chatFabBtn');
  const closeBtn = document.getElementById('chatPanelClose');
  const messagesEl = document.getElementById('chatMessages');
  const suggestionsEl = document.getElementById('chatSuggestions');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  let history = loadChatHistory();

  function renderMessages() {
    messagesEl.innerHTML = history
      .map((turn) => `<div class="chat-bubble ${turn.role === 'assistant' ? 'assistant' : 'user'}">${escapeHtml(turn.text)}</div>`)
      .join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
    suggestionsEl.style.display = history.length === 0 ? 'flex' : 'none';
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = CHAT_SUGGESTIONS
      .map((s) => `<button class="chat-suggestion-chip" type="button">${escapeHtml(s)}</button>`)
      .join('');
    suggestionsEl.querySelectorAll('.chat-suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => sendMessage(chip.textContent));
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showTyping() {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble assistant typing';
    bubble.id = 'chatTypingBubble';
    bubble.innerHTML = '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const bubble = document.getElementById('chatTypingBubble');
    if (bubble) bubble.remove();
  }

  async function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    inputEl.value = '';
    sendBtn.disabled = true;

    history.push({ role: 'user', text: trimmed });
    renderMessages();
    saveChatHistory(history);
    showTyping();

    try {
      const result = await api.post('/chat', { message: trimmed, history });
      hideTyping();
      history.push({ role: 'assistant', text: result.reply });
      renderMessages();
      saveChatHistory(history);
    } catch (err) {
      hideTyping();
      history.push({ role: 'assistant', text: "Sorry, I couldn't reach the assistant. Please try again." });
      renderMessages();
      saveChatHistory(history);
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  function openPanel() {
    overlay.classList.add('open');
    fabBtn.classList.add('open');
    inputEl.focus();
  }

  function closePanel() {
    overlay.classList.remove('open');
    fabBtn.classList.remove('open');
  }

  fabBtn.addEventListener('click', () => {
    if (overlay.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePanel();
  });

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(inputEl.value);
  });

  renderSuggestions();
  renderMessages();
}

document.addEventListener('DOMContentLoaded', initChatWidget);
