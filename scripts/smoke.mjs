const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const routes = [
  "/chat",
  "/settings/api",
  "/settings/memory",
  "/sign-in"
];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }
  console.log(`OK ${route}`);
}

const ask = await fetch(`${baseUrl}/api/ask`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "What do the books say about better decisions?" })
});

if (!ask.ok) {
  throw new Error(`/api/ask returned ${ask.status}`);
}

const selection = await ask.json();
const selectedBookSourceIds = [selection.candidates[0].sourceId];

const answer = await fetch(`${baseUrl}/api/answer`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pendingQuestionId: selection.pendingQuestionId,
    selectedBookSourceIds
  })
});

if (!answer.ok) {
  throw new Error(`/api/answer returned ${answer.status}`);
}

const answerJson = await answer.json();
if (!answerJson.markdown.includes("[^ev_")) {
  throw new Error("answer response did not include citation markers");
}
if (!["live", "mock"].includes(answerJson.aiMode)) {
  throw new Error("answer response did not report aiMode");
}

console.log("OK source-first cited answer flow");

const presetBookAnswer = await fetch(`${baseUrl}/api/preset-book-answer`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "How should a startup validate a new product idea?",
    llmConfig: {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiKey: ""
    }
  })
});

if (!presetBookAnswer.ok) {
  throw new Error(`/api/preset-book-answer returned ${presetBookAnswer.status}`);
}

const presetBookAnswerJson = await presetBookAnswer.json();
if (presetBookAnswerJson.markdown.includes("[^book_1]") || presetBookAnswerJson.citations.length !== 3) {
  throw new Error("preset book answer response should hide citation markers and include three source cards");
}
if (
  !presetBookAnswerJson.markdown.includes("《") ||
  !presetBookAnswerJson.markdown.includes("> 摘录（位置：") ||
  !presetBookAnswerJson.markdown.includes("**")
) {
  throw new Error("preset book answer response did not include casual Chinese book output");
}

console.log("OK preset book auto-selection answer flow");

const chat = await fetch(`${baseUrl}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "hello",
    llmConfig: {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiKey: "replace-with-real-key"
    }
  })
});

if (chat.status !== 400) {
  throw new Error(`/api/chat expected configuration error, got ${chat.status}`);
}

console.log("OK direct chat endpoint validation");

const authProviderStatus = await fetch(`${baseUrl}/api/auth-provider-status`);
if (!authProviderStatus.ok) {
  throw new Error(`/api/auth-provider-status returned ${authProviderStatus.status}`);
}

const providerStatusJson = await authProviderStatus.json();
if (!providerStatusJson.providers || typeof providerStatusJson.providers.email !== "boolean") {
  throw new Error("auth provider status response did not include provider booleans");
}

console.log("OK auth provider status endpoint");

const aiStatus = await fetch(`${baseUrl}/api/ai/status`);
if (!aiStatus.ok) {
  throw new Error(`/api/ai/status returned ${aiStatus.status}`);
}

console.log("OK AI connection status endpoint");
