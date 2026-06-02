const settingsForm = document.querySelector("#settingsForm");
const gatewayUrlInput = document.querySelector("#gatewayUrl");
const accessTokenInput = document.querySelector("#accessToken");
const modelInput = document.querySelector("#model");
const systemPromptInput = document.querySelector("#systemPrompt");
const saveSettingsBtn = document.querySelector("#saveSettingsBtn");
const clearSettingsBtn = document.querySelector("#clearSettingsBtn");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const messagesEl = document.querySelector("#messages");
const sendBtn = document.querySelector("#sendBtn");
const statusCard = document.querySelector("#statusCard");
const statusTitle = document.querySelector("#statusTitle");
const statusCopy = document.querySelector("#statusCopy");
const copyLastBtn = document.querySelector("#copyLastBtn");
const clearChatBtn = document.querySelector("#clearChatBtn");
const promptChips = document.querySelectorAll(".prompt-chip");

const STORAGE_KEY = "wso2-ai-gateway-chat-settings";

let conversation = [];
let lastAssistantText = "";

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (saved.gatewayUrl) gatewayUrlInput.value = saved.gatewayUrl;
    if (saved.model) modelInput.value = saved.model;
    if (saved.systemPrompt) systemPromptInput.value = saved.systemPrompt;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveSettings() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      gatewayUrl: gatewayUrlInput.value.trim(),
      model: modelInput.value.trim(),
      systemPrompt: systemPromptInput.value.trim()
    })
  );
  setStatus("ready", "Settings saved", "Your token is kept only in this browser session.");
}

function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
  gatewayUrlInput.value = "";
  accessTokenInput.value = "";
  modelInput.value = "llama-3.1-8b-instant";
  systemPromptInput.value = "You are a helpful government service assistant. Explain steps clearly, ask for missing details, and keep answers concise.";
  setStatus("", "Not connected", "Add your APIM gateway URL and token.");
}

function setStatus(state, title, copy) {
  statusCard.className = "status-card";
  if (state) statusCard.classList.add(state);
  statusTitle.textContent = title;
  statusCopy.textContent = copy;
}

function addMessage(role, text, options = {}) {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  if (options.error) article.classList.add("error");

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "YOU" : options.error ? "ERR" : "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (options.typing) {
    bubble.innerHTML = '<div class="typing" aria-label="Assistant is thinking"><span></span><span></span><span></span></div>';
  } else {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);
  }

  article.appendChild(avatar);
  article.appendChild(bubble);
  messagesEl.appendChild(article);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return article;
}

function resetChat() {
  conversation = [];
  lastAssistantText = "";
  messagesEl.innerHTML = "";
  addMessage("assistant", "Conversation cleared. Ask a question when you are ready.");
}

function getAssistantText(payload) {
  const choice = payload?.choices?.[0];
  const messageContent = choice?.message?.content;
  if (typeof messageContent === "string") return messageContent;

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((item) => item.text || item.content || "")
      .filter(Boolean)
      .join("\n");
  }

  if (typeof payload?.output_text === "string") return payload.output_text;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.result === "string") return payload.result;

  return JSON.stringify(payload, null, 2);
}

function buildPayload(userText) {
  const messages = [
    {
      role: "system",
      content: systemPromptInput.value.trim()
    },
    ...conversation,
    {
      role: "user",
      content: userText
    }
  ];

  return {
    model: modelInput.value.trim(),
    messages,
    temperature: 0.4,
    stream: false
  };
}

async function sendMessage(userText) {
  const gatewayUrl = gatewayUrlInput.value.trim();
  const token = accessTokenInput.value.trim();

  if (!gatewayUrl || !token || !modelInput.value.trim()) {
    setStatus("error", "Missing connection details", "Add gateway URL, APIM token, and model.");
    addMessage("assistant", "Add the AI Gateway URL, APIM access token, and model before sending.", { error: true });
    return;
  }

  addMessage("user", userText);
  const typing = addMessage("assistant", "", { typing: true });
  sendBtn.disabled = true;
  setStatus("ready", "Calling AI Gateway", "Request is going through WSO2 API Manager.");

  try {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildPayload(userText))
    });

    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }

    if (!response.ok) {
      const message = payload?.error?.message || payload?.error || payload?.message || `HTTP ${response.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }

    const assistantText = getAssistantText(payload);
    typing.remove();
    addMessage("assistant", assistantText);
    lastAssistantText = assistantText;
    conversation.push({ role: "user", content: userText });
    conversation.push({ role: "assistant", content: assistantText });
    setStatus("ready", "Connected", "Last response came through WSO2 AI Gateway.");
  } catch (error) {
    typing.remove();
    addMessage("assistant", error.message, { error: true });
    setStatus("error", "Request failed", "Check URL, token, CORS, certificate, and API deployment.");
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSettings();
});

saveSettingsBtn.addEventListener("click", saveSettings);
clearSettingsBtn.addEventListener("click", clearSettings);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const userText = messageInput.value.trim();
  if (!userText) return;
  messageInput.value = "";
  sendMessage(userText);
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

promptChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    messageInput.value = chip.dataset.prompt;
    messageInput.focus();
  });
});

copyLastBtn.addEventListener("click", async () => {
  if (!lastAssistantText) {
    setStatus("", "Nothing to copy", "Ask a question first.");
    return;
  }

  await navigator.clipboard.writeText(lastAssistantText);
  setStatus("ready", "Copied", "Last assistant response copied to clipboard.");
});

clearChatBtn.addEventListener("click", resetChat);

loadSettings();
if (gatewayUrlInput.value) {
  setStatus("ready", "Settings loaded", "Paste a fresh APIM token to start chatting.");
}
