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
    patterns: [/\b(calculate|compute|solve|math|what is|evaluate)\b/i, /[0-9][\d\s+\-*/^().=xX]+/],
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

function normalizeMathPrompt(prompt) {
  return prompt
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\bplus\b/gi, "+")
    .replace(/\bminus\b/gi, "-")
    .replace(/\btimes\b/gi, "*")
    .replace(/\bmultiplied by\b/gi, "*")
    .replace(/\bdivided by\b/gi, "/")
    .replace(/\bto the power of\b/gi, "^")
    .replace(/\bsquared\b/gi, "^2")
    .replace(/\bcubed\b/gi, "^3");
}

function extractMathExpression(prompt) {
  const normalizedPrompt = normalizeMathPrompt(prompt);
  const equationMatch = normalizedPrompt.match(/[-+*/^().\dxX\s]+=[-+*/^().\dxX\s]+/);

  if (equationMatch) {
    return equationMatch[0].trim();
  }

  const expressionMatch = normalizedPrompt.match(/[-+*/^().\d\s]+/g);

  if (!expressionMatch) {
    return "";
  }

  return expressionMatch
    .map((expression) => expression.trim())
    .filter((expression) => /\d/.test(expression) && /[+\-*/^]/.test(expression))
    .sort((a, b) => b.length - a.length)[0] || "";
}

function tokenizeMathExpression(expression) {
  return expression.match(/\d+(?:\.\d+)?|[+\-*/^()]/g) || [];
}

function toReversePolishNotation(tokens) {
  const output = [];
  const operators = [];
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 3, "^": 4 };
  const rightAssociative = new Set(["^"]);
  let previousToken = "";

  tokens.forEach((token) => {
    if (/^\d/.test(token)) {
      output.push(token);
      previousToken = "number";
      return;
    }

    if (token === "(") {
      operators.push(token);
      previousToken = token;
      return;
    }

    if (token === ")") {
      while (operators.length && operators.at(-1) !== "(") {
        output.push(operators.pop());
      }
      operators.pop();
      previousToken = token;
      return;
    }

    const operator = token === "-" && (!previousToken || previousToken === "(" || precedence[previousToken])
      ? "u-"
      : token;

    while (
      operators.length &&
      operators.at(-1) !== "(" &&
      precedence[operators.at(-1)] >= precedence[operator] &&
      !rightAssociative.has(operator)
    ) {
      output.push(operators.pop());
    }

    operators.push(operator);
    previousToken = operator;
  });

  while (operators.length) {
    output.push(operators.pop());
  }

  return output;
}

function evaluateMathExpression(expression) {
  const explicitExpression = expression
    .replace(/(\d|\))\s*(\()/g, "$1*$2")
    .replace(/(\))\s*(\d)/g, "$1*$2");
  const tokens = tokenizeMathExpression(explicitExpression);
  const reversePolishNotation = toReversePolishNotation(tokens);
  const stack = [];

  reversePolishNotation.forEach((token) => {
    if (/^\d/.test(token)) {
      stack.push(Number(token));
      return;
    }

    if (token === "u-") {
      stack.push(-stack.pop());
      return;
    }

    const right = stack.pop();
    const left = stack.pop();

    if (token === "+") stack.push(left + right);
    if (token === "-") stack.push(left - right);
    if (token === "*") stack.push(left * right);
    if (token === "/") stack.push(left / right);
    if (token === "^") stack.push(left ** right);
  });

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    return null;
  }

  return stack[0];
}

function solveLinearEquation(equation) {
  const [leftSide, rightSide] = equation.split("=");

  if (!/[xX]/.test(leftSide + rightSide)) {
    return null;
  }

  const evaluateAt = (side, xValue) =>
    evaluateMathExpression(side.replace(/[xX]/g, `(${xValue})`));
  const leftAtZero = evaluateAt(leftSide, 0);
  const rightAtZero = evaluateAt(rightSide, 0);
  const leftAtOne = evaluateAt(leftSide, 1);
  const rightAtOne = evaluateAt(rightSide, 1);

  if ([leftAtZero, rightAtZero, leftAtOne, rightAtOne].some((value) => value === null)) {
    return null;
  }

  const coefficient = (leftAtOne - leftAtZero) - (rightAtOne - rightAtZero);
  const constant = rightAtZero - leftAtZero;

  if (coefficient === 0) {
    return null;
  }

  return constant / coefficient;
}

function formatMathResult(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(8)));
}

function solveMathPrompt(prompt) {
  const expression = extractMathExpression(prompt);

  if (!expression) {
    return "I can solve arithmetic like “24 / (3 + 5)” and simple linear equations like “2x + 3 = 11.” Send me the math problem and I’ll calculate it.";
  }

  if (expression.includes("=")) {
    const solution = solveLinearEquation(expression);

    if (solution !== null) {
      return `Math result: solving ${expression} gives x = ${formatMathResult(solution)}.`;
    }

    return `I found the equation “${expression},” but this local demo currently handles simple linear equations with one x variable.`;
  }

  const result = evaluateMathExpression(expression);

  if (result === null) {
    return `I found “${expression},” but I could not calculate it. Try a standard arithmetic expression with +, -, *, /, ^, and parentheses.`;
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
