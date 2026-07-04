# Aurum Agent Answer Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the main question-answering flow: user asks, system presents book source candidates, user confirms sources, the agent retrieves evidence, and the answer includes source citations.

**Architecture:** Separate source selection from answer generation. The first request creates a pending question and returns candidate book sources. The second request accepts selected source ids, retrieves book chunks and allowlisted media results, calls an OpenAI-compatible LLM adapter, validates citations, and persists the answer.

**Tech Stack:** Next.js 15, TypeScript, OpenAI-compatible Chat Completions API, DeepSeek-compatible configuration, Drizzle ORM, PostgreSQL, Vitest, Playwright.

## Global Constraints

- LLM calls must go through a server-only OpenAI-compatible adapter.
- The adapter must support configurable `baseUrl`, `apiKey`, `model`, and headers.
- The browser must never receive provider API keys.
- The main v1 source picker displays books only.
- User-configured media domains are searched in the background during answer generation.
- Every answer paragraph must contain at least one citation marker.
- If the system cannot find usable evidence, it must not invent an answer.

---

## File Structure

- Create `src/lib/ai/chat-client.ts` for OpenAI-compatible chat calls.
- Create `src/lib/ai/prompts/answer.ts` for answer prompts.
- Create `src/lib/answers/types.ts` for answer pipeline contracts.
- Create `src/lib/answers/source-selection.ts` for book candidate generation.
- Create `src/lib/answers/citation-validator.ts` for citation checks.
- Create `src/lib/answers/pipeline.ts` for full answer orchestration.
- Create `src/app/api/ask/route.ts` and `src/app/api/answer/route.ts`.
- Create `src/app/chat/page.tsx`, `src/components/chat/source-picker.tsx`, and `src/components/chat/chat-thread.tsx`.
- Create `tests/unit/chat-client.test.ts`, `tests/unit/citation-validator.test.ts`, `tests/unit/answer-pipeline.test.ts`, and `tests/e2e/source-grounded-answer.spec.ts`.

## Tasks

### Task 1: Add OpenAI-Compatible Chat Adapter

**Files:**
- Create: `src/lib/ai/chat-client.ts`
- Modify: `.env.example`
- Create: `tests/unit/chat-client.test.ts`

**Interfaces:**
- Produces `createChatCompletion(input: ChatCompletionInput): Promise<ChatCompletionOutput>`.

```ts
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionInput = {
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: "text" | "json_object";
};

export type ChatCompletionOutput = {
  content: string;
  raw: unknown;
};
```

- [ ] **Step 1: Add environment variables**

Append:

```bash
LLM_BASE_URL="https://api.deepseek.com/v1"
LLM_API_KEY="sk_xxx"
LLM_MODEL="deepseek-chat"
```

- [ ] **Step 2: Implement adapter**

The adapter must call:

```ts
await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.LLM_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: env.LLM_MODEL,
    messages: input.messages,
    temperature: input.temperature ?? 0.2,
    response_format:
      input.responseFormat === "json_object" ? { type: "json_object" } : undefined
  })
});
```

- [ ] **Step 3: Add tests**

Mock `fetch` and assert the adapter sends an OpenAI-compatible request and returns `choices[0].message.content`.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/chat-client.test.ts
```

Expected: adapter tests pass without real network calls.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/ai/chat-client.ts tests/unit/chat-client.test.ts
git commit -m "feat: add openai compatible chat adapter"
```

### Task 2: Implement Book Source Selection

**Files:**
- Create: `src/lib/answers/types.ts`
- Create: `src/lib/answers/source-selection.ts`
- Create: `src/app/api/ask/route.ts`
- Create: `tests/unit/source-selection.test.ts`

**Interfaces:**
- Produces `createPendingQuestion(input: CreatePendingQuestionInput): Promise<SourceSelectionResponse>`.

```ts
export type CreatePendingQuestionInput = {
  userId: string;
  conversationId?: string;
  question: string;
};

export type SourceCandidate = {
  sourceId: string;
  type: "book";
  title: string;
  author: string;
  reason: string;
};

export type SourceSelectionResponse = {
  pendingQuestionId: string;
  conversationId: string;
  branchId: string;
  candidates: SourceCandidate[];
};
```

- [ ] **Step 1: Implement candidate generation**

Use book chunk retrieval or metadata matching to return up to 6 book candidates. Only `type: "book"` candidates may be returned in v1.

- [ ] **Step 2: Persist pending question**

Persist the user question as a `messages` row with role `user` and attach metadata in a new `pending_questions` table or equivalent typed record. The chosen approach must preserve `pendingQuestionId`, `conversationId`, and `branchId`.

- [ ] **Step 3: Add ask API**

`POST /api/ask` accepts:

```ts
{ "question": "string", "conversationId": "optional string" }
```

It returns `SourceSelectionResponse`.

- [ ] **Step 4: Add tests**

Cover:

- empty question is rejected;
- candidates are books only;
- unauthenticated request returns `401`.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/source-selection.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/answers src/app/api/ask tests/unit/source-selection.test.ts
git commit -m "feat: add book source selection"
```

### Task 3: Build Citation Validator

**Files:**
- Create: `src/lib/answers/citation-validator.ts`
- Create: `tests/unit/citation-validator.test.ts`

**Interfaces:**
- Produces `validateCitedAnswer(input: ValidateCitedAnswerInput): ValidatedCitedAnswer`.

```ts
export type EvidenceItem = {
  evidenceId: string;
  sourceId: string;
  sourceRef: string;
  quotedText: string;
  url?: string;
};

export type ValidateCitedAnswerInput = {
  markdown: string;
  evidence: EvidenceItem[];
};

export type ValidatedCitedAnswer = {
  markdown: string;
  citationIds: string[];
};
```

- [ ] **Step 1: Define citation marker format**

Use this citation format inside answers:

```md
This is a grounded paragraph. [^ev_1]
```

Evidence ids must match `evidenceId` values supplied to the model.

- [ ] **Step 2: Implement paragraph validation**

Rules:

- Each non-empty paragraph must include at least one marker like `[^ev_1]`.
- Every marker must refer to an existing evidence item.
- The answer must not contain markers absent from the evidence list.

- [ ] **Step 3: Add tests**

Cover:

```ts
expect(() =>
  validateCitedAnswer({
    markdown: "A paragraph with no citation.",
    evidence: [{ evidenceId: "ev_1", sourceId: "s1", sourceRef: "ch1", quotedText: "quote" }]
  })
).toThrow("Every answer paragraph must include a citation");
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/citation-validator.test.ts
```

Expected: citation validation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/answers/citation-validator.ts tests/unit/citation-validator.test.ts
git commit -m "feat: enforce cited answer format"
```

### Task 4: Implement Answer Pipeline

**Files:**
- Create: `src/lib/ai/prompts/answer.ts`
- Create: `src/lib/answers/pipeline.ts`
- Create: `src/app/api/answer/route.ts`
- Create: `tests/unit/answer-pipeline.test.ts`

**Interfaces:**
- Produces `answerPendingQuestion(input: AnswerPendingQuestionInput): Promise<AnswerResult>`.

```ts
export type AnswerPendingQuestionInput = {
  userId: string;
  pendingQuestionId: string;
  selectedBookSourceIds: string[];
};

export type AnswerResult = {
  messageId: string;
  markdown: string;
  citations: Array<{
    sourceId: string;
    sourceRef: string;
    quotedText: string;
    url?: string;
  }>;
};
```

- [ ] **Step 1: Build prompt**

The system prompt must require:

- answer only with provided evidence;
- cite every paragraph;
- say `I don't have enough source evidence to answer this.` when evidence is insufficient;
- produce markdown with citation markers.

- [ ] **Step 2: Retrieve evidence**

For selected books, call `retrieveBookChunks`. For media, call `searchUserMediaSources` with the same user question and append results as evidence items.

- [ ] **Step 3: Call model and validate**

Call `createChatCompletion`, run `validateCitedAnswer`, then persist the assistant message and citation rows.

- [ ] **Step 4: Add answer API**

`POST /api/answer` accepts:

```ts
{
  "pendingQuestionId": "uuid",
  "selectedBookSourceIds": ["uuid"]
}
```

Return `AnswerResult`.

- [ ] **Step 5: Add tests**

Cover:

- no selected sources returns `400`;
- no evidence returns the insufficient-evidence sentence;
- uncited model output is rejected and not persisted;
- valid output persists message and citations.

- [ ] **Step 6: Verify**

Run:

```bash
npm test tests/unit/answer-pipeline.test.ts
npm run build
```

Expected: pipeline tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/prompts src/lib/answers/pipeline.ts src/app/api/answer tests/unit/answer-pipeline.test.ts
git commit -m "feat: add grounded answer pipeline"
```

### Task 5: Build Chat UI Flow

**Files:**
- Create: `src/app/chat/page.tsx`
- Create: `src/components/chat/source-picker.tsx`
- Create: `src/components/chat/chat-thread.tsx`
- Create: `tests/e2e/source-grounded-answer.spec.ts`

**Interfaces:**
- Produces `/chat`.
- Consumes `/api/ask` and `/api/answer`.

- [ ] **Step 1: Implement ask form**

The user enters a question and submits. The UI calls `/api/ask` and renders book source candidates.

- [ ] **Step 2: Implement source picker**

Users can select one or more book candidates. The answer button is disabled until at least one book is selected.

- [ ] **Step 3: Render answer and citations**

Display markdown answer and a citation list showing title, author/domain, sourceRef or URL, and quoted text.

- [ ] **Step 4: Add E2E test**

Mock API responses and verify the flow:

1. open `/chat`;
2. ask a question;
3. select a book;
4. generate answer;
5. see paragraph citation and citation list.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test:e2e -- tests/e2e/source-grounded-answer.spec.ts
```

Expected: browser test passes.

- [ ] **Step 6: Commit**

```bash
git add src/app/chat src/components/chat tests/e2e/source-grounded-answer.spec.ts
git commit -m "feat: add source selection chat flow"
```

## Acceptance Criteria

- User asks a question and receives book candidates before any answer is generated.
- User must confirm at least one book source.
- Answer generation uses selected book evidence and user allowlisted media evidence.
- Every non-empty answer paragraph contains a valid citation marker.
- Uncited or unsupported model output is rejected.
- Answer, citations, and message history are persisted.

