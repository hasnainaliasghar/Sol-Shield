/**
 * controlChat.js — Mission Control chat panel component.
 */
import { S } from '../strings.js';

/**
 * Create the control chat panel.
 * @param {object[]} messages - Array of { kind: 'sent'|'received'|'pending', text, sol? }
 * @returns {HTMLElement}
 */
export function createControlChat(messages = []) {
  const wrap = document.createElement('div');
  wrap.className = 'control-chat';

  wrap.innerHTML = `
    <div class="control-chat-header">📡 Mission Control</div>
    <div class="control-chat-messages" id="chat-messages" role="log" aria-live="polite" aria-label="Mission Control chat"></div>
  `;

  const msgContainer = wrap.querySelector('#chat-messages');
  messages.forEach(msg => appendChatBubble(msgContainer, msg));

  return wrap;
}

/**
 * Append a message bubble to an existing chat container.
 */
export function appendChatBubble(container, { kind, text }) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${kind}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

/**
 * Show animated sending dots, then replace with received message.
 * @param {HTMLElement} container - The .control-chat-messages element.
 * @param {string} replyText - The reply to show.
 * @param {number} delayMs   - Delay before showing reply (0 for Moon).
 * @returns {Promise<void>}
 */
export function animateMoonReply(container, replyText, delayMs = 1200) {
  return new Promise(resolve => {
    // "Sending..." animation
    const sending = document.createElement('div');
    sending.className = 'chat-bubble sent';
    sending.textContent = S.mcSending;
    container.appendChild(sending);
    container.scrollTop = container.scrollHeight;

    // Dots
    const dots = document.createElement('div');
    dots.className = 'chat-bubble received';
    dots.innerHTML = `<div class="chat-sending-anim">
      <div class="chat-dot"></div>
      <div class="chat-dot"></div>
      <div class="chat-dot"></div>
    </div>`;
    setTimeout(() => {
      container.appendChild(dots);
      container.scrollTop = container.scrollHeight;
    }, 300);

    // Replace with actual reply
    setTimeout(() => {
      dots.remove();
      const reply = document.createElement('div');
      reply.className = 'chat-bubble received';
      reply.textContent = replyText;
      container.appendChild(reply);
      container.scrollTop = container.scrollHeight;
      resolve();
    }, delayMs);
  });
}

