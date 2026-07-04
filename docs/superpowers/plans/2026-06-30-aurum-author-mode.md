# Aurum Author Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users enter a high-fidelity simulated author conversation from a book while preserving source grounding, citation requirements, and clear AI simulation boundaries.

**Architecture:** Author mode is a specialized conversation mode attached to a selected book source. It reuses book retrieval, chat completion, citation validation, and conversation history, but applies an author-style system prompt and an explicit UI disclosure that the speaker is an AI simulation based on the book.

**Tech Stack:** Next.js 15, TypeScript, OpenAI-compatible Chat Completions API, Drizzle ORM, PostgreSQL, pgvector, Vitest, Playwright.

## Global Constraints

- Author mode must never claim the real author is present.
- UI copy must label the interaction as an AI simulation based on selected works.
- The style can imitate tone and reasoning patterns, but factual claims must remain grounded in retrieved book evidence.
- Direct quotations must come from imported book text and must include citations.
- Every author-mode answer paragraph must include at least one citation marker.

---

## File Structure

- Modify `src/lib/db/schema.ts` to add author-mode metadata if not already represented in conversation metadata.
- Create `src/lib/author-mode/types.ts`.
- Create `src/lib/author-mode/prompts.ts`.
- Create `src/lib/author-mode/pipeline.ts`.
- Create `src/app/api/author-mode/start/route.ts`.
- Create `src/app/api/author-mode/message/route.ts`.
- Create `src/app/author/[sourceId]/page.tsx`.
- Create `src/components/author-mode/author-chat.tsx`.
- Create `src/components/author-mode/simulation-disclosure.tsx`.
- Create `tests/unit/author-mode-prompt.test.ts`, `tests/unit/author-mode-pipeline.test.ts`, and `tests/e2e/author-mode.spec.ts`.

## Tasks

### Task 1: Define Author Mode Contracts

**Files:**
- Create: `src/lib/author-mode/types.ts`
- Modify: `src/lib/db/schema.ts`
- Create: `tests/unit/author-mode-schema.test.ts`

**Interfaces:**
- Produces `AuthorModeSession`.
- Produces `startAuthorModeSession(input: StartAuthorModeInput)` in later task.

```ts
export type AuthorModeSession = {
  conversationId: string;
  branchId: string;
  sourceId: string;
  author: string;
  title: string;
};

export type StartAuthorModeInput = {
  userId: string;
  sourceId: string;
};
```

- [ ] **Step 1: Add conversation mode metadata**

If `conversations` already has a metadata JSON column, store:

```json
{ "mode": "author", "sourceId": "<book-source-id>" }
```

If it does not, add:

```ts
mode: text("mode").notNull().default("standard"),
metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({})
```

- [ ] **Step 2: Add schema test**

Assert conversations can represent `mode = "author"` and a `sourceId` metadata value.

- [ ] **Step 3: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: migration adds missing mode/metadata fields only if they do not already exist.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts src/lib/author-mode/types.ts tests/unit/author-mode-schema.test.ts drizzle
git commit -m "feat: define author mode session model"
```

### Task 2: Build Author Simulation Prompt

**Files:**
- Create: `src/lib/author-mode/prompts.ts`
- Create: `tests/unit/author-mode-prompt.test.ts`

**Interfaces:**
- Produces `buildAuthorModeSystemPrompt(input: BuildAuthorPromptInput): string`.

```ts
export type BuildAuthorPromptInput = {
  author: string;
  title: string;
  userDisplayName: string;
  aiCallsUser: string;
  aiTone: "calm" | "direct" | "friendly" | "academic";
};
```

- [ ] **Step 1: Implement prompt builder**

The prompt must include these rules:

- speak as a high-fidelity AI simulation inspired by `${author}`;
- do not claim to be the real `${author}`;
- answer using only provided book evidence;
- cite every paragraph with evidence markers;
- short direct quotes are allowed only from supplied evidence;
- when evidence is insufficient, say there is not enough source evidence.

- [ ] **Step 2: Add tests**

Verify the generated prompt includes:

```ts
expect(prompt).toContain("AI simulation");
expect(prompt).toContain("do not claim to be the real");
expect(prompt).toContain("cite every paragraph");
```

- [ ] **Step 3: Verify**

Run:

```bash
npm test tests/unit/author-mode-prompt.test.ts
```

Expected: prompt tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/author-mode/prompts.ts tests/unit/author-mode-prompt.test.ts
git commit -m "feat: add author simulation prompt"
```

### Task 3: Start Author Mode Session

**Files:**
- Create: `src/lib/author-mode/pipeline.ts`
- Create: `src/app/api/author-mode/start/route.ts`
- Create: `tests/unit/author-mode-pipeline.test.ts`

**Interfaces:**
- Produces `startAuthorModeSession(input: StartAuthorModeInput): Promise<AuthorModeSession>`.

- [ ] **Step 1: Validate source**

`startAuthorModeSession` must load the source and reject non-book sources with:

```text
Author mode requires a book source.
```

- [ ] **Step 2: Create conversation**

Create a conversation with `mode = "author"`, title `Chat with <author> on <title>`, and a root branch.

- [ ] **Step 3: Add start API**

`POST /api/author-mode/start` accepts:

```ts
{ "sourceId": "uuid" }
```

It returns `AuthorModeSession`.

- [ ] **Step 4: Add tests**

Cover successful session creation and rejection of media sources.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/author-mode-pipeline.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/author-mode/pipeline.ts src/app/api/author-mode/start tests/unit/author-mode-pipeline.test.ts
git commit -m "feat: start author mode sessions"
```

### Task 4: Generate Author Mode Replies

**Files:**
- Modify: `src/lib/author-mode/pipeline.ts`
- Create: `src/app/api/author-mode/message/route.ts`
- Modify: `tests/unit/author-mode-pipeline.test.ts`

**Interfaces:**
- Produces `sendAuthorModeMessage(input: SendAuthorModeMessageInput): Promise<AuthorModeAnswer>`.

```ts
export type SendAuthorModeMessageInput = {
  userId: string;
  conversationId: string;
  branchId: string;
  message: string;
};

export type AuthorModeAnswer = {
  messageId: string;
  markdown: string;
  citations: Array<{
    sourceId: string;
    sourceRef: string;
    quotedText: string;
  }>;
};
```

- [ ] **Step 1: Retrieve book evidence**

Use the author-mode conversation metadata to retrieve chunks only from the selected book source.

- [ ] **Step 2: Generate cited response**

Call `createChatCompletion` with the author simulation prompt and evidence block. Run `validateCitedAnswer` before persisting.

- [ ] **Step 3: Persist messages and citations**

Persist the user message, assistant message, and citations in the author-mode branch.

- [ ] **Step 4: Add tests**

Cover:

- answer only retrieves selected source;
- uncited model response is rejected;
- valid answer persists citations.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/author-mode-pipeline.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/author-mode/pipeline.ts src/app/api/author-mode/message tests/unit/author-mode-pipeline.test.ts
git commit -m "feat: add author mode replies"
```

### Task 5: Build Author Mode UI

**Files:**
- Create: `src/app/author/[sourceId]/page.tsx`
- Create: `src/components/author-mode/author-chat.tsx`
- Create: `src/components/author-mode/simulation-disclosure.tsx`
- Create: `tests/e2e/author-mode.spec.ts`

**Interfaces:**
- Produces `/author/:sourceId`.
- Consumes `/api/author-mode/start` and `/api/author-mode/message`.

- [ ] **Step 1: Add disclosure component**

Display this copy near the chat header:

```text
This is an AI simulation based on the selected book source, not the real author.
```

- [ ] **Step 2: Add author chat**

The page starts or loads an author-mode session for the selected source and renders a chat composer.

- [ ] **Step 3: Render citations**

Render citations below each assistant answer, showing `sourceRef` and quoted text.

- [ ] **Step 4: Add E2E test**

Mock APIs and verify:

1. disclosure is visible;
2. user sends a message;
3. answer appears with citation marker and citation list.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test:e2e -- tests/e2e/author-mode.spec.ts
```

Expected: author-mode browser test passes.

- [ ] **Step 6: Commit**

```bash
git add src/app/author src/components/author-mode tests/e2e/author-mode.spec.ts
git commit -m "feat: add author mode ui"
```

## Acceptance Criteria

- User can start author mode from a book source.
- Author mode cannot start from a media source.
- UI clearly says the interaction is an AI simulation.
- Replies use only selected book evidence.
- Every paragraph has a valid citation marker.
- Direct quotes are traceable to imported book chunks.

