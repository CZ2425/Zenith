const form = document.querySelector("#chatForm");
const input = document.querySelector("#userInput");
const messages = document.querySelector("#messages");
const clearButton = document.querySelector("#clearChat");
const promptButtons = document.querySelectorAll(".prompt-chips button");

const defaultGreeting =
  "Hi, I’m Zenith AI. Ask me for ideas, summaries, plans, math help, code help, explanations, or a creative spark.";

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
    name: "math",
    patterns: [/\b(calculate|compute|solve|math|evaluate)\b/i, /[0-9][\d\s+\-*/^().=xX%]+/],
    buildReply: (prompt) => solveMathPrompt(prompt),
  },
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

const mathConstants = {
  e: Math.E,
  pi: Math.PI,
};

const mathFunctions = {
  abs: Math.abs,
  ceil: Math.ceil,
  cos: Math.cos,
  floor: Math.floor,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
};

function normalizeMathPrompt(prompt) {
  return prompt
    .toLowerCase()
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/\bplus\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/\btimes\b/g, "*")
    .replace(/\bmultiplied by\b/g, "*")
    .replace(/\bdivided by\b/g, "/")
    .replace(/\bover\b/g, "/")
    .replace(/\bto the power of\b/g, "^")
    .replace(/\bsquared\b/g, "^2")
    .replace(/\bcubed\b/g, "^3")
    .replace(/\bsquare root of\b/g, "sqrt")
    .replace(/%\s*of\b/g, "%*")
    .replace(/\bpercent of\b/g, "%*");
}

function extractMathExpression(prompt) {
  const normalizedPrompt = normalizeMathPrompt(prompt);
  const allowedToken = "(?:\\b(?:sqrt|sin|cos|tan|abs|round|floor|ceil|pi|e)\\b|x|\\d+(?:\\.\\d+)?|[+\\-*/^%().=])";
  const expressionPattern = new RegExp(`${allowedToken}(?:\\s*${allowedToken})+`, "gi");
  const matches = normalizedPrompt.match(expressionPattern) || [];

  return matches
    .map((expression) => expression.trim())
    .filter((expression) => /\d|pi|e|x/.test(expression) && /[+\-*/^%=]|sqrt|sin|cos|tan|abs|round|floor|ceil/.test(expression))
    .sort((a, b) => b.length - a.length)[0] || "";
}

function tokenizeMathExpression(expression) {
  const tokens = expression.match(/\d+(?:\.\d+)?|\b(?:sqrt|sin|cos|tan|abs|round|floor|ceil|pi|e)\b|x|[+\-*/^%()=]/gi) || [];
  return tokens.map((token) => token.toLowerCase());
}

function insertImplicitMultiplication(tokens) {
  const output = [];
  const isValueEnd = (token) => /^\d/.test(token) || token === "x" || token in mathConstants || token === ")" || token === "%";
  const isValueStart = (token) => /^\d/.test(token) || token === "x" || token in mathConstants || token === "(" || token in mathFunctions;

  tokens.forEach((token) => {
    const previousToken = output.at(-1);

    if (previousToken && isValueEnd(previousToken) && isValueStart(token)) {
      output.push("*");
    }

    output.push(token);
  });

  return output;
}

function createMathParser(tokens, variables = {}) {
  let position = 0;
  const peek = () => tokens[position];
  const consume = (expectedToken) => {
    if (expectedToken && peek() !== expectedToken) {
      return false;
    }

    position += 1;
    return true;
  };

  const parseExpression = () => {
    let value = parseTerm();

    while (peek() === "+" || peek() === "-") {
      const operator = tokens[position++];
      const nextValue = parseTerm();
      value = operator === "+" ? value + nextValue : value - nextValue;
    }

    return value;
  };

  const parseTerm = () => {
    let value = parsePower();

    while (peek() === "*" || peek() === "/") {
      const operator = tokens[position++];
      const nextValue = parsePower();
      value = operator === "*" ? value * nextValue : value / nextValue;
    }

    return value;
  };

  const parsePower = () => {
    let value = parseUnary();

    if (peek() === "^") {
      consume("^");
      value **= parsePower();
    }

    return value;
  };

  const parseUnary = () => {
    if (consume("+")) return parseUnary();
    if (consume("-")) return -parseUnary();
    return parsePercent();
  };

  const parsePercent = () => {
    let value = parsePrimary();

    while (consume("%")) {
      value /= 100;
    }

    return value;
  };

  const parsePrimary = () => {
    const token = tokens[position++];

    if (!token) {
      return Number.NaN;
    }

    if (/^\d/.test(token)) {
      return Number(token);
    }

    if (token === "x") {
      return variables.x;
    }

    if (token in mathConstants) {
      return mathConstants[token];
    }

    if (token in mathFunctions) {
      if (!consume("(")) {
        return mathFunctions[token](parseUnary());
      }

      const value = parseExpression();
      return consume(")") ? mathFunctions[token](value) : Number.NaN;
    }

    if (token === "(") {
      const value = parseExpression();
      return consume(")") ? value : Number.NaN;
    }

    return Number.NaN;
  };

  return {
    parse() {
      const value = parseExpression();
      return position === tokens.length ? value : Number.NaN;
    },
  };
}

function evaluateMathExpression(expression, variables = {}) {
  const tokens = insertImplicitMultiplication(tokenizeMathExpression(expression));

  if (!tokens.length) {
    return null;
  }

  const value = createMathParser(tokens, variables).parse();
  return Number.isFinite(value) ? value : null;
}

function solveLinearEquation(equation) {
  const [leftSide, rightSide] = equation.split("=");

  if (!leftSide || !rightSide || !/[x]/i.test(equation)) {
    return null;
  }

  const expression = `(${leftSide})-(${rightSide})`;
  const valueAtZero = evaluateMathExpression(expression, { x: 0 });
  const valueAtOne = evaluateMathExpression(expression, { x: 1 });

  if (valueAtZero === null || valueAtOne === null) {
    return null;
  }

  const coefficient = valueAtOne - valueAtZero;

  if (Math.abs(coefficient) < Number.EPSILON) {
    return null;
  }

  return -valueAtZero / coefficient;
}

function formatMathResult(value) {
  const roundedValue = Math.abs(value) < Number.EPSILON ? 0 : value;
  return Number.isInteger(roundedValue) ? String(roundedValue) : String(Number(roundedValue.toFixed(8)));
}

function solveMathPrompt(prompt) {
  const expression = extractMathExpression(prompt);

  if (!expression) {
    return "I can solve arithmetic like “24 / (3 + 5)”, percentages like “15% of 80”, square roots like “sqrt(144)”, and simple linear equations like “2x + 3 = 11.”";
  }

  if (expression.includes("=")) {
    const solution = solveLinearEquation(expression);

    if (solution !== null) {
      return `Math result: solving ${expression} gives x = ${formatMathResult(solution)}.`;
    }

    return `I found the equation “${expression},” but this local math engine currently solves one-variable linear equations only.`;
  }

  const result = evaluateMathExpression(expression);

  if (result === null) {
    return `I found “${expression},” but I could not calculate it. Try arithmetic with +, -, *, /, ^, %, parentheses, sqrt(), or a simple equation with x.`;
  }

  return `Math result: ${expression} = ${formatMathResult(result)}.`;
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
