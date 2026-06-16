const form = document.querySelector("#chatForm");
const input = document.querySelector("#userInput");
const messages = document.querySelector("#messages");
const clearButton = document.querySelector("#clearChat");
const promptButtons = document.querySelectorAll(".prompt-chips button");
const modeButtons = document.querySelectorAll(".mode-toggle button");

const defaultGreeting =
  "Hi, I’m Zenith AI. Choose a mode or ask me for ideas, summaries, plans, code help, or a creative spark.";

let activeMode = "strategist";

const modeIntros = {
  strategist:
    "Strategist mode helps turn goals into focused plans and next actions.",
  creator:
    "Creator mode helps shape drafts, names, stories, and polished messages.",
  analyst: "Analyst mode helps summarize, compare, and reason through options.",
};

const responseLibrary = [
  {
    keywords: ["morning", "productive", "routine", "plan"],
    reply:
      "Here’s a peak-performance morning: hydrate, choose your top three priorities, work for one focused 45-minute sprint, then review what needs momentum next.",
  },
  {
    keywords: ["startup", "idea", "business"],
    reply:
      "Try this startup angle: a micro-planning assistant for small teams that turns messy chat notes into owners, deadlines, and weekly progress summaries.",
  },
  {
    keywords: ["email", "write", "friendly"],
    reply:
      "Absolutely. Start warm, state the purpose in one sentence, add the useful details, and close with a clear next step. Friendly clarity wins.",
  },
  {
    keywords: ["summarize", "summary", "shorten"],
    reply:
      "Send the text and I’ll condense it into three parts: the main point, the critical details, and the recommended next step.",
  },
  {
    keywords: ["code", "debug", "javascript", "html", "css"],
    reply:
      "Share the snippet, expected behavior, and what is happening now. I’ll help isolate the bug, explain the fix, and suggest a cleaner version.",
  },
  {
    keywords: ["hello", "hi", "hey"],
    reply:
      "Hello! I’m Zenith AI—ready to help you brainstorm, organize, or polish whatever you’re working on.",
  },
];

const fallbackReplies = {
  strategist: [
    "Let’s take it higher: define the outcome, identify blockers, pick the highest-leverage action, and schedule the first move.",
    "I’d break this into context, options, recommendation, and an action plan so you can move with confidence.",
  ],
  creator: [
    "I can shape that into something memorable. Tell me the audience, tone, and format, and I’ll draft a strong first pass.",
    "Creative path: start with one vivid hook, add useful detail, then close with a line that makes the next step obvious.",
  ],
  analyst: [
    "A clear analysis starts with the question, assumptions, evidence, tradeoffs, and a concise recommendation.",
    "I can compare the options. Share the criteria that matter most—cost, speed, quality, risk, or effort—and I’ll rank them.",
  ],
};

function createMessage(text, sender = "bot") {
  const article = document.createElement("article");
  article.className = `message ${sender === "user" ? "user-message" : "bot-message"}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = sender === "user" ? "You" : "Z";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  const meta = document.createElement("time");
  meta.dateTime = new Date().toISOString();
  meta.textContent = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  bubble.append(paragraph, meta);
  article.append(avatar, bubble);

  return article;
}

function getZenithReply(message) {
  const normalizedMessage = message.toLowerCase();
  const matchedResponse = responseLibrary.find(({ keywords }) =>
    keywords.some((keyword) => normalizedMessage.includes(keyword)),
  );

  if (matchedResponse) {
    return matchedResponse.reply;
  }

  const modeReplies = fallbackReplies[activeMode];
  const fallbackIndex = Math.floor(Math.random() * modeReplies.length);
  return modeReplies[fallbackIndex];
}

function scrollToLatestMessage() {
  messages.scrollTop = messages.scrollHeight;
}

function addBotReply(userMessage) {
  const typingMessage = createMessage("Zenith AI is thinking…");
  typingMessage.classList.add("typing");
  messages.append(typingMessage);
  scrollToLatestMessage();

  window.setTimeout(() => {
    typingMessage.replaceWith(createMessage(getZenithReply(userMessage)));
    scrollToLatestMessage();
  }, 650);
}

function submitMessage(message) {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return;
  }

  messages.append(createMessage(trimmedMessage, "user"));
  scrollToLatestMessage();
  addBotReply(trimmedMessage);
}

function setMode(mode) {
  activeMode = mode;
  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  messages.append(createMessage(modeIntros[mode]));
  scrollToLatestMessage();
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitMessage(input.value);
  input.value = "";
  input.style.height = "auto";
  input.focus();
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent;
    form.requestSubmit();
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

clearButton.addEventListener("click", () => {
  messages.replaceChildren(createMessage(defaultGreeting));
  input.focus();
});
