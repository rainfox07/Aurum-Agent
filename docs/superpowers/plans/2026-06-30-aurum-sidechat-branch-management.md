# Aurum Sidechat Branch Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build sidechat follow-up, branch chat, and overall conversation management so users can explore questions without losing the main thread.

**Architecture:** Branches are first-class conversation paths forked from a message. Sidechats are anchored follow-up panels that do not affect the main branch unless the user later starts a branch from them. The overall management view renders conversations as a tree with branch and sidechat metadata.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, OpenAI-compatible Chat Completions API, Vitest, Playwright.

## Global Constraints

- A branch must record the message it forked from.
- A sidechat must record the message it is anchored to.
- Sidechat messages must not appear in the main branch transcript.
- Branch messages must be generated with the selected branch context only.
- The UI must let users switch branches and return to the main thread.
- Overall management must show conversation, branch, sidechat, and history structure.

---

## File Structure

- Create `src/lib/branches/types.ts`.
- Create `src/lib/branches/repository.ts`.
- Create `src/lib/branches/context.ts`.
- Create `src/lib/sidechats/types.ts`.
- Create `src/lib/sidechats/repository.ts`.
- Create `src/lib/sidechats/pipeline.ts`.
- Create `src/app/api/branches/route.ts`.
- Create `src/app/api/sidechats/route.ts`.
- Create `src/app/conversations/page.tsx`.
- Create `src/app/conversations/[conversationId]/page.tsx`.
- Create `src/components/conversations/conversation-tree.tsx`.
- Create `src/components/conversations/branch-switcher.tsx`.
- Create `src/components/sidechat/sidechat-panel.tsx`.
- Create `tests/unit/branch-repository.test.ts`, `tests/unit/sidechat-repository.test.ts`, `tests/unit/branch-context.test.ts`, and `tests/e2e/branch-sidechat.spec.ts`.

## Tasks

### Task 1: Implement Branch Repository

**Files:**
- Create: `src/lib/branches/types.ts`
- Create: `src/lib/branches/repository.ts`
- Create: `tests/unit/branch-repository.test.ts`

**Interfaces:**
- Produces `createBranch(input: CreateBranchInput): Promise<BranchRecord>`.
- Produces `listBranches(userId: string, conversationId: string): Promise<BranchRecord[]>`.

```ts
export type CreateBranchInput = {
  userId: string;
  conversationId: string;
  parentBranchId: string;
  forkedFromMessageId: string;
  title?: string;
};

export type BranchRecord = {
  id: string;
  conversationId: string;
  parentBranchId: string | null;
  forkedFromMessageId: string | null;
  title: string;
};
```

- [ ] **Step 1: Implement ownership validation**

`createBranch` must verify the conversation belongs to the current user and the fork message belongs to the same conversation.

- [ ] **Step 2: Implement default title**

When title is absent, use:

```ts
`Branch from ${forkedFromMessageId.slice(0, 8)}`
```

- [ ] **Step 3: Add tests**

Cover:

- branch records parent branch and forked message;
- wrong user cannot create branch;
- fork message from another conversation is rejected.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/branch-repository.test.ts
```

Expected: branch repository tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/branches tests/unit/branch-repository.test.ts
git commit -m "feat: add branch repository"
```

### Task 2: Build Branch Context And Messaging

**Files:**
- Create: `src/lib/branches/context.ts`
- Modify: `src/lib/answers/pipeline.ts`
- Create: `tests/unit/branch-context.test.ts`

**Interfaces:**
- Produces `getBranchTranscript(input: GetBranchTranscriptInput): Promise<BranchTranscriptMessage[]>`.

```ts
export type GetBranchTranscriptInput = {
  userId: string;
  conversationId: string;
  branchId: string;
};

export type BranchTranscriptMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};
```

- [ ] **Step 1: Build branch transcript**

The transcript must include messages from the branch lineage up to the fork point, then messages from the selected branch.

- [ ] **Step 2: Exclude sidechat messages**

The transcript query must filter `sidechatId IS NULL`.

- [ ] **Step 3: Use branch transcript in answers**

When `answerPendingQuestion` receives a branch id, prompt context must use `getBranchTranscript`.

- [ ] **Step 4: Add tests**

Cover:

- branch transcript includes ancestor messages before fork;
- branch transcript excludes unrelated sibling branch messages;
- branch transcript excludes sidechat messages.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/branch-context.test.ts
npm run build
```

Expected: context tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/branches/context.ts src/lib/answers/pipeline.ts tests/unit/branch-context.test.ts
git commit -m "feat: isolate branch transcripts"
```

### Task 3: Implement Sidechat Repository And Pipeline

**Files:**
- Create: `src/lib/sidechats/types.ts`
- Create: `src/lib/sidechats/repository.ts`
- Create: `src/lib/sidechats/pipeline.ts`
- Create: `tests/unit/sidechat-repository.test.ts`
- Create: `tests/unit/sidechat-pipeline.test.ts`

**Interfaces:**
- Produces `createSidechat(input: CreateSidechatInput): Promise<SidechatRecord>`.
- Produces `sendSidechatMessage(input: SendSidechatMessageInput): Promise<SidechatAnswer>`.

```ts
export type CreateSidechatInput = {
  userId: string;
  conversationId: string;
  anchorMessageId: string;
  title?: string;
};

export type SendSidechatMessageInput = {
  userId: string;
  sidechatId: string;
  message: string;
};
```

- [ ] **Step 1: Create sidechat**

Validate that the anchor message belongs to the conversation and create a sidechat titled `Follow-up`.

- [ ] **Step 2: Build sidechat context**

Sidechat context must include the anchor message, its immediate surrounding main-thread context, and prior sidechat messages for the same sidechat.

- [ ] **Step 3: Generate sidechat answer**

Reuse the grounded answer prompt and citation validator when sources are involved. Persist sidechat messages with `sidechatId` and no `branchId`.

- [ ] **Step 4: Add tests**

Cover:

- sidechat is anchored to the correct message;
- sidechat answer messages do not receive a branch id;
- main branch transcript does not include sidechat messages.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/sidechat-repository.test.ts tests/unit/sidechat-pipeline.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sidechats tests/unit/sidechat-repository.test.ts tests/unit/sidechat-pipeline.test.ts
git commit -m "feat: add sidechat follow ups"
```

### Task 4: Add Branch And Sidechat APIs

**Files:**
- Create: `src/app/api/branches/route.ts`
- Create: `src/app/api/sidechats/route.ts`
- Create: `src/app/api/sidechats/[sidechatId]/messages/route.ts`
- Create: `tests/unit/branch-sidechat-api.test.ts`

**Interfaces:**
- Produces `POST /api/branches`.
- Produces `POST /api/sidechats`.
- Produces `POST /api/sidechats/:sidechatId/messages`.

- [ ] **Step 1: Implement branch route**

`POST /api/branches` accepts:

```ts
{
  "conversationId": "uuid",
  "parentBranchId": "uuid",
  "forkedFromMessageId": "uuid",
  "title": "optional string"
}
```

- [ ] **Step 2: Implement sidechat routes**

`POST /api/sidechats` creates a sidechat. `POST /api/sidechats/:sidechatId/messages` sends a sidechat message.

- [ ] **Step 3: Add API tests**

Cover unauthenticated access, successful branch creation, and successful sidechat message creation.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/branch-sidechat-api.test.ts
npm run build
```

Expected: API tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/branches src/app/api/sidechats tests/unit/branch-sidechat-api.test.ts
git commit -m "feat: add branch and sidechat api"
```

### Task 5: Build Overall Conversation Management UI

**Files:**
- Create: `src/app/conversations/page.tsx`
- Create: `src/app/conversations/[conversationId]/page.tsx`
- Create: `src/components/conversations/conversation-tree.tsx`
- Create: `src/components/conversations/branch-switcher.tsx`
- Create: `src/components/sidechat/sidechat-panel.tsx`
- Create: `tests/e2e/branch-sidechat.spec.ts`

**Interfaces:**
- Produces `/conversations`.
- Produces `/conversations/:conversationId`.

- [ ] **Step 1: Add conversation list**

Render conversation titles sorted by `updatedAt` descending and link to detail pages.

- [ ] **Step 2: Add conversation tree**

Display the main branch, child branches, and sidechats anchored to messages. Branches are selectable; sidechats open in a side panel.

- [ ] **Step 3: Add branch creation control**

Each assistant and user message has a branch action. Clicking it creates a branch from that message and switches the UI to the new branch.

- [ ] **Step 4: Add sidechat panel**

Each message has a sidechat action. Sidechat opens beside the thread and sends follow-up messages without changing the selected branch transcript.

- [ ] **Step 5: Add E2E test**

Mock APIs and verify:

1. open conversation detail;
2. create branch from a message;
3. switch back to main branch;
4. open sidechat on a message;
5. sidechat reply appears only in the side panel.

- [ ] **Step 6: Verify**

Run:

```bash
npm run test:e2e -- tests/e2e/branch-sidechat.spec.ts
```

Expected: branch and sidechat browser flow passes.

- [ ] **Step 7: Commit**

```bash
git add src/app/conversations src/components/conversations src/components/sidechat tests/e2e/branch-sidechat.spec.ts
git commit -m "feat: add branch and sidechat management ui"
```

## Acceptance Criteria

- Users can create a branch from any message.
- Branch context is isolated from sibling branches.
- Users can open sidechat from a message and ask follow-up questions.
- Sidechat messages do not appear in the main branch transcript.
- Overall conversation view shows conversations, branches, and sidechats in one manageable structure.

