const form = document.querySelector("#chatForm");
const input = document.querySelector("#userInput");
const messages = document.querySelector("#messages");
const clearButton = document.querySelector("#clearChat");
const promptButtons = document.querySelectorAll(".prompt-chips button");

const defaultGreeting =
  "Hi, I’m Zenith AI. Ask me for ideas, summaries, plans, or a creative spark.";

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
      "Hello! I’m Zenith AI—ready to help you brainstorm, organize, or polish whatever you’re working on.",
  },
];

const fallbackReplies = [
  "I can help shape that. Tell me the goal, audience, and tone, and I’ll turn it into a clear next step.",
  "Let’s take it higher: I’d break this into context, options, recommendation, and an action plan.",
  "Great prompt. A useful way forward is to define the outcome, list constraints, then choose the smallest next action.",
];

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

  const fallbackIndex = Math.floor(Math.random() * fallbackReplies.length);
  return fallbackReplies[fallbackIndex];
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
