# Aurum Memory System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build user-controlled memory so Aurum Agent can suggest useful remembered facts while requiring explicit user approval before memory affects future answers.

**Architecture:** Memory has three states: suggested, active, and deleted. The answer pipeline may propose memory candidates after a conversation turn, but only active memories are injected into future prompts. Users can approve, edit, delete, and audit memories from settings.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, OpenAI-compatible Chat Completions API, Vitest, Playwright.

## Global Constraints

- No memory may become active without user confirmation.
- Deleted memory must never be injected into model context.
- Memory content must be editable before approval.
- Memory suggestions must be tied to a source message when possible.
- Memory must store user preferences and stable facts, not transient conversation details.

---

## File Structure

- Modify `src/lib/db/schema.ts` if the memory table from the data plan needs additional fields.
- Create `src/lib/memory/types.ts`.
- Create `src/lib/memory/repository.ts`.
- Create `src/lib/memory/suggestion.ts`.
- Create `src/lib/memory/context.ts`.
- Create `src/app/api/memory/route.ts`.
- Create `src/app/api/memory/[memoryId]/route.ts`.
- Create `src/app/settings/memory/page.tsx`.
- Create `src/components/memory/memory-suggestion-card.tsx`.
- Create `src/components/memory/memory-list.tsx`.
- Create `tests/unit/memory-repository.test.ts`, `tests/unit/memory-context.test.ts`, `tests/unit/memory-suggestion.test.ts`, and `tests/e2e/memory-settings.spec.ts`.

## Tasks

### Task 1: Define Memory Contracts

**Files:**
- Create: `src/lib/memory/types.ts`
- Modify: `src/lib/db/schema.ts`
- Create: `tests/unit/memory-schema.test.ts`

**Interfaces:**
- Produces memory status union: `"suggested" | "active" | "deleted"`.
- Produces memory category union: `"profile" | "preference" | "instruction"`.

```ts
export type MemoryStatus = "suggested" | "active" | "deleted";
export type MemoryCategory = "profile" | "preference" | "instruction";

export type UserMemory = {
  id: string;
  userId: string;
  status: MemoryStatus;
  category: MemoryCategory;
  content: string;
  sourceMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

- [ ] **Step 1: Add missing schema fields**

Ensure `memories` includes:

```ts
category: text("category").notNull().default("preference"),
content: text("content").notNull(),
status: memoryStatus("status").notNull().default("suggested")
```

- [ ] **Step 2: Add schema test**

Assert memory status values are exactly `suggested`, `active`, and `deleted`.

- [ ] **Step 3: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: migration includes missing memory category field only if absent.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts src/lib/memory/types.ts tests/unit/memory-schema.test.ts drizzle
git commit -m "feat: define memory contracts"
```

### Task 2: Implement Memory Repository

**Files:**
- Create: `src/lib/memory/repository.ts`
- Create: `tests/unit/memory-repository.test.ts`

**Interfaces:**
- Produces `suggestMemory(input: SuggestMemoryInput): Promise<UserMemory>`.
- Produces `approveMemory(userId: string, memoryId: string, editedContent?: string): Promise<UserMemory>`.
- Produces `deleteMemory(userId: string, memoryId: string): Promise<void>`.
- Produces `listMemories(userId: string, status?: MemoryStatus): Promise<UserMemory[]>`.

- [ ] **Step 1: Define inputs**

```ts
export type SuggestMemoryInput = {
  userId: string;
  category: MemoryCategory;
  content: string;
  sourceMessageId?: string;
};
```

- [ ] **Step 2: Implement suggestion**

`suggestMemory` must always create memories with `status = "suggested"` regardless of caller input.

- [ ] **Step 3: Implement approval**

`approveMemory` must:

- verify the memory belongs to the current user;
- trim optional edited content;
- reject empty edited content;
- update status to `active`.

- [ ] **Step 4: Implement delete**

`deleteMemory` must soft-delete by setting `status = "deleted"`.

- [ ] **Step 5: Add tests**

Cover:

- suggestions are not active by default;
- approval can edit content;
- another user's memory cannot be approved;
- deleted memories are excluded from active list.

- [ ] **Step 6: Verify**

Run:

```bash
npm test tests/unit/memory-repository.test.ts
```

Expected: repository tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/memory/repository.ts tests/unit/memory-repository.test.ts
git commit -m "feat: add user controlled memory repository"
```

### Task 3: Generate Memory Suggestions

**Files:**
- Create: `src/lib/memory/suggestion.ts`
- Create: `tests/unit/memory-suggestion.test.ts`

**Interfaces:**
- Produces `suggestMemoriesFromTurn(input: SuggestMemoriesFromTurnInput): Promise<UserMemory[]>`.

```ts
export type SuggestMemoriesFromTurnInput = {
  userId: string;
  userMessageId: string;
  userMessage: string;
  assistantMessage: string;
};
```

- [ ] **Step 1: Build suggestion prompt**

The prompt must extract only durable preferences or stable user facts. It must return JSON:

```json
{
  "memories": [
    {
      "category": "preference",
      "content": "The user prefers direct answers."
    }
  ]
}
```

- [ ] **Step 2: Reject weak suggestions**

Do not create a memory when content is shorter than 8 characters, duplicates an active memory, or describes a one-off task.

- [ ] **Step 3: Persist as suggested**

Every accepted candidate must call `suggestMemory`, not direct insertion.

- [ ] **Step 4: Add tests**

Cover:

- one-off task text returns no memories;
- stable preference creates a suggested memory;
- duplicate active memory is skipped.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/memory-suggestion.test.ts
```

Expected: suggestion tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/memory/suggestion.ts tests/unit/memory-suggestion.test.ts
git commit -m "feat: suggest memories from conversation turns"
```

### Task 4: Inject Active Memory Into Prompt Context

**Files:**
- Create: `src/lib/memory/context.ts`
- Modify: `src/lib/ai/prompts/answer.ts`
- Modify: `src/lib/author-mode/prompts.ts`
- Create: `tests/unit/memory-context.test.ts`

**Interfaces:**
- Produces `getActiveMemoryContext(userId: string): Promise<string>`.

- [ ] **Step 1: Implement context builder**

`getActiveMemoryContext` must load only `status = "active"` rows and render:

```md
User memory:
- [preference] The user prefers direct answers.
- [profile] The user's name is Rainfox.
```

- [ ] **Step 2: Exclude suggested and deleted memory**

Add tests proving suggested and deleted rows are not included.

- [ ] **Step 3: Inject into prompts**

Answer and author-mode prompts must include memory context after user settings and before source evidence.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/memory-context.test.ts
npm run build
```

Expected: memory context tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/memory/context.ts src/lib/ai/prompts/answer.ts src/lib/author-mode/prompts.ts tests/unit/memory-context.test.ts
git commit -m "feat: inject approved memory into prompts"
```

### Task 5: Add Memory API And Settings UI

**Files:**
- Create: `src/app/api/memory/route.ts`
- Create: `src/app/api/memory/[memoryId]/route.ts`
- Create: `src/app/settings/memory/page.tsx`
- Create: `src/components/memory/memory-suggestion-card.tsx`
- Create: `src/components/memory/memory-list.tsx`
- Create: `tests/e2e/memory-settings.spec.ts`

**Interfaces:**
- Produces `GET /api/memory`.
- Produces `POST /api/memory/:memoryId` for approval/edit.
- Produces `DELETE /api/memory/:memoryId` for soft delete.
- Produces `/settings/memory`.

- [ ] **Step 1: Add API handlers**

Handlers must require auth and scope all memory operations to the session user.

- [ ] **Step 2: Add settings page**

Render sections for suggested memories and active memories. Suggested cards include editable text, approve, and delete controls.

- [ ] **Step 3: Add E2E test**

Mock API data and verify:

1. suggested memory appears;
2. user edits it;
3. user approves it;
4. memory appears in active list;
5. delete removes it from active list.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test:e2e -- tests/e2e/memory-settings.spec.ts
```

Expected: memory settings browser test passes.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/memory src/app/settings/memory src/components/memory tests/e2e/memory-settings.spec.ts
git commit -m "feat: add memory management ui"
```

## Acceptance Criteria

- AI can suggest memories but cannot activate them automatically.
- User can approve, edit, and delete memories.
- Only active memories enter future answer and author-mode prompts.
- Suggested and deleted memories are excluded from model context.
- Memory operations are scoped to the authenticated user.

