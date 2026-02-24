/**
 * Tiger Claw Scout - Web Chat Channel
 * Embeddable widget for websites
 */

import { v4 as uuidv4 } from 'uuid';

// In-memory session store (use Redis in production)
const sessions = new Map<string, WebSession>();

export interface WebSession {
  sessionId: string;
  tenantId: string;
  startedAt: Date;
  lastActivity: Date;
  messages: Array<{ role: 'user' | 'bot'; content: string; timestamp: Date }>;
}

/**
 * Create or get a web chat session
 */
export function getOrCreateSession(sessionId: string | null, tenantId: string): WebSession {
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    session.lastActivity = new Date();
    return session;
  }

  const newSession: WebSession = {
    sessionId: uuidv4(),
    tenantId,
    startedAt: new Date(),
    lastActivity: new Date(),
    messages: []
  };

  sessions.set(newSession.sessionId, newSession);
  return newSession;
}

/**
 * Add message to session
 */
export function addMessage(sessionId: string, role: 'user' | 'bot', content: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.messages.push({ role, content, timestamp: new Date() });
    session.lastActivity = new Date();
  }
}

/**
 * Get session history
 */
export function getSessionHistory(sessionId: string): WebSession['messages'] {
  return sessions.get(sessionId)?.messages || [];
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupSessions(maxAgeMinutes: number = 60): number {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  let cleaned = 0;

  for (const [id, session] of sessions) {
    if (session.lastActivity < cutoff) {
      sessions.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Generate embeddable widget script
 */
export function generateWidgetScript(tenantId: string, apiUrl: string): string {
  return `
<!-- Tiger Claw Chat Widget -->
<script>
(function() {
  var t = '${tenantId}';
  var u = '${apiUrl}';
  var w = document.createElement('div');
  w.id = 'tiger-bot-widget';
  w.innerHTML = \`
    <style>
      #tiger-bot-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: system-ui, sans-serif; }
      #tiger-bot-toggle { width: 60px; height: 60px; border-radius: 50%; background: #f97316; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      #tiger-bot-toggle:hover { transform: scale(1.05); }
      #tiger-bot-toggle svg { width: 30px; height: 30px; fill: white; }
      #tiger-bot-chat { display: none; width: 350px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); flex-direction: column; overflow: hidden; }
      #tiger-bot-chat.open { display: flex; }
      #tiger-bot-header { background: #f97316; color: white; padding: 16px; font-weight: 600; }
      #tiger-bot-messages { flex: 1; overflow-y: auto; padding: 16px; }
      .tiger-msg { margin: 8px 0; padding: 10px 14px; border-radius: 12px; max-width: 80%; }
      .tiger-msg.bot { background: #f3f4f6; }
      .tiger-msg.user { background: #f97316; color: white; margin-left: auto; }
      #tiger-bot-input { display: flex; border-top: 1px solid #e5e7eb; }
      #tiger-bot-input input { flex: 1; border: none; padding: 14px; outline: none; }
      #tiger-bot-input button { background: #f97316; color: white; border: none; padding: 14px 20px; cursor: pointer; }
    </style>
    <div id="tiger-bot-chat">
      <div id="tiger-bot-header">🐯 Tiger Claw</div>
      <div id="tiger-bot-messages"></div>
      <div id="tiger-bot-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
      </div>
    </div>
    <button id="tiger-bot-toggle"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></button>
  \`;
  document.body.appendChild(w);

  var chat = document.getElementById('tiger-bot-chat');
  var messages = document.getElementById('tiger-bot-messages');
  var input = document.querySelector('#tiger-bot-input input');
  var btn = document.querySelector('#tiger-bot-input button');
  var toggle = document.getElementById('tiger-bot-toggle');
  var sessionId = null;

  toggle.onclick = function() { chat.classList.toggle('open'); };

  function addMsg(role, text) {
    var div = document.createElement('div');
    div.className = 'tiger-msg ' + role;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('user', text);

    try {
      var res = await fetch(u + '/chat/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: t, sessionId: sessionId, message: text })
      });
      var data = await res.json();
      sessionId = data.sessionId;
      addMsg('bot', data.response);
    } catch (e) {
      addMsg('bot', 'Connection error. Please try again.');
    }
  }

  btn.onclick = send;
  input.onkeypress = function(e) { if (e.key === 'Enter') send(); };

  // Welcome message
  setTimeout(function() { addMsg('bot', 'Hey! I\\'m Tiger Claw. How can I help you today?'); }, 500);
})();
</script>
`;
}
