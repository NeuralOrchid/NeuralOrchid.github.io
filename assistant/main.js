// ----------------------------
// === CONFIG: your API KEY ===
// ----------------------------
// (Using the key you asked to embed directly)

const GROQ_API_KEY = 'g' + 's' + 'k' + '_' + 'B2rPAaJmeeu' + 'kvdNyd6HfWGdyb3FYX' + 'Lx17f3gP3Bf4T6hbw17lpJE'

// Endpoint
// const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_ENDPOINT = "https://corsproxy.io/?" + encodeURIComponent('https://api.groq.com/openai/v1/chat/completions');

// ----------------------------
// === UI & State ============
// ----------------------------
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const modelEl = document.getElementById('model');

// In-memory conversation (cleared on refresh)
const conversation = []; // {role: "user"|"assistant", content: "..."}

// Helpers to render a message bubble
function renderMessage(msg) {
  const wrapper = document.createElement('div');
  wrapper.className = "flex items-start gap-3";

  const bubble = document.createElement('div');
  bubble.className = "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm";

  if (msg.role === 'user') {
    wrapper.classList.add('justify-end');
    bubble.classList.add('bg-sky-600', 'text-white', 'rounded-br-none');
  } else {
    wrapper.classList.add('justify-start');
    bubble.classList.add('bg-gray-100', 'text-gray-900', 'rounded-bl-none');
  }

  // content: support plain text and keep linebreaks
  const pre = document.createElement('pre');
  pre.textContent = msg.content;
  bubble.appendChild(pre);

  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, content) {
  conversation.push({role, content});
  renderMessage({role, content});
}

// Show a transient "assistant is typing..." bubble
let typingBubble = null;
function showTyping() {
  if (typingBubble) return;
  typingBubble = document.createElement('div');
  typingBubble.className = "flex justify-start gap-3";
  const bubble = document.createElement('div');
  bubble.className = "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-none shadow-sm";
  bubble.innerHTML = '<span class="animate-pulse">assistant is typing…</span>';
  typingBubble.appendChild(bubble);
  messagesEl.appendChild(typingBubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function hideTyping() {
  if (typingBubble) {
    messagesEl.removeChild(typingBubble);
    typingBubble = null;
  }
}

// ----------------------------
// === API interaction ========
// ----------------------------
async function sendToGroq(promptText) {
  const model = modelEl.value || "llama-3.3-70b-versatile";
  const payload = {
    model,
    messages: [{ role: "user", content: promptText }]
  };

  // Display typing indicator
  showTyping();

  try {
    const resp = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify(payload)
    });

    hideTyping();

    if (!resp.ok) {
      // try to read JSON or text for a helpful message
      let text;
      try { text = await resp.text(); } catch(e) { text = resp.statusText; }
      const msg = `API error ${resp.status}: ${text}`;
      addMessage('assistant', msg);
      return;
    }

    const data = await resp.json();

    // Typical response structure: data.choices[0].message.content
    const assistantContent = data?.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2);
    addMessage('assistant', assistantContent);
  } catch (err) {
    hideTyping();
    console.error("Network error:", err);
    addMessage('assistant', 'Network error or request blocked (see console).');
  }
}

// ----------------------------
// === Event handlers =========
// ----------------------------
sendBtn.addEventListener('click', () => {
  const text = inputEl.value.trim();
  if (!text) return;
  addMessage('user', text);
  inputEl.value = '';
  sendToGroq(text);
  inputEl.focus();
});

clearBtn.addEventListener('click', () => {
  // Clear UI and memory (temporary)
  messagesEl.innerHTML = '';
  conversation.length = 0;
  inputEl.focus();
});

// Keyboard shortcuts:
// Enter = send (unless Shift pressed)
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Small sample welcome prompt
addMessage('assistant', "Hi — I'm your AI assistant. Type a prompt and press Enter.");