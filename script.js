const form = document.querySelector("#chatForm");
const input = document.querySelector("#userInput");
const messages = document.querySelector("#messages");
const clearButton = document.querySelector("#clearChat");
const promptButtons = document.querySelectorAll(".prompt-chips button");

const defaultGreeting =
  "Hi, I’m Zenith AI. Ask me for ideas, summaries, plans, code help, explanations, or a creative spark.";

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
    keywords: ["hello", "hi", "hey"],
    reply:
      "Hello! I’m Zenith AI—ready to help you brainstorm, organize, explain, summarize, or polish whatever you’re working on.",
  },
];

const promptHandlers = [
  {
    name: "summary",
    patterns: [/\bsummar(?:y|ize|ise|ise this|ize this)\b/i, /\btl;?dr\b/i],
    buildReply: (prompt) =>
      `Summary mode: I’d condense your prompt to this core idea: “${shortenPrompt(prompt)}.” Key takeaways: identify the main point, remove repetition, and keep only the details that change the conclusion.`,
  },
  {
    name: "explanation",
    patterns: [/\bexplain\b/i, /\bwhat is\b/i, /\bhow does\b/i, /\bwhy does\b/i],
    buildReply: (prompt) =>
      `Here’s a simple explanation: ${extractSubject(prompt)} is best understood by breaking it into purpose, moving parts, and outcome. Start with what it is for, then trace the steps that produce the result.`,
  },
  {
    name: "code",
    patterns: [/\bcode\b/i, /\bjavascript\b/i, /\bhtml\b/i, /\bcss\b/i, /\bfunction\b/i, /\bbug\b/i],
    buildReply: (prompt) =>
      `For code help, I’d approach “${shortenPrompt(prompt)}” by confirming the expected behavior, checking the smallest reproducible example, then changing one thing at a time. If you paste the code and error, I can help debug it step by step.`,
  },
  {
    name: "creative",
    patterns: [/\bstory\b/i, /\bpoem\b/i, /\bcreative\b/i, /\bname\b/i, /\btagline\b/i],
    buildReply: (prompt) =>
      `Creative take: build around the feeling of “${extractSubject(prompt)}.” Three directions: bold and futuristic, warm and human, or crisp and premium. Pick one tone and I’ll generate options.`,
  },
  {
    name: "comparison",
    patterns: [/\bcompare\b/i, /\bversus\b/i, /\bvs\.?\b/i, /\bpros and cons\b/i],
    buildReply: (prompt) =>
      `Comparison framework for “${shortenPrompt(prompt)}”: judge each option by cost, speed, quality, maintenance, and risk. The best choice is usually the one that performs well on your top two constraints.`,
  },
  {
    name: "list",
    patterns: [/\blist\b/i, /\bideas\b/i, /\bsteps\b/i, /\bexamples\b/i],
    buildReply: (prompt) =>
      `Here are useful starting points for “${shortenPrompt(prompt)}”: 1) define the outcome, 2) list constraints, 3) generate three options, 4) choose the lowest-friction next step, and 5) review what worked.`,
  },
];

const fallbackReplies = [
  (prompt) =>
    `I can respond to that. For “${shortenPrompt(prompt)},” I’d start by clarifying the goal, then give you a concise answer, options, and a practical next step.`,
  (prompt) =>
    `Let’s take it higher: your prompt is about “${extractSubject(prompt)}.” A strong answer should include context, a recommendation, and one action you can take now.`,
  (prompt) =>
    `Good prompt. I’d break “${shortenPrompt(prompt)}” into what you know, what you need, possible approaches, and the next decision to make.`,
];

function shortenPrompt(prompt, maxLength = 90) {
  const compactPrompt = prompt.replace(/\s+/g, " ").trim();

  if (compactPrompt.length <= maxLength) {
    return compactPrompt;
  }

  return `${compactPrompt.slice(0, maxLength - 1).trim()}…`;
}

function extractSubject(prompt) {
  const cleanedPrompt = prompt
    .replace(/^(please\s+)?(can you|could you|would you|will you|tell me|explain|summarize|write|make|create|give me)\s+/i, "")
    .replace(/[?.!]+$/g, "")
    .trim();

  return shortenPrompt(cleanedPrompt || prompt, 70);
}

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
  bubble.append(paragraph);
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

  const matchedHandler = promptHandlers.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(message)),
  );

  if (matchedHandler) {
    return matchedHandler.buildReply(message);
  }

  const fallbackIndex = Math.floor(Math.random() * fallbackReplies.length);
  return fallbackReplies[fallbackIndex](message);
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

clearButton.addEventListener("click", () => {
  messages.replaceChildren(createMessage(defaultGreeting));
  input.focus();
});
