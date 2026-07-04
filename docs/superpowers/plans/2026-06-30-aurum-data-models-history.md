# Aurum Data Models History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared database schema and history APIs for conversations, messages, sources, citations, branches, sidechats, and memory records.

**Architecture:** Store all durable product state in Postgres through Drizzle ORM. Keep conversation lineage explicit by modeling root conversations, branches, sidechats, and parent messages separately. Later answer, author, memory, and search features depend on these tables and typed repository functions.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, pgvector, Vitest.

## Global Constraints

- The app is a web product built with Next.js 15 + TypeScript.
- The database is Postgres with pgvector enabled.
- Every message that claims information from a source must be able to link to one or more citation rows.
- Sidechat messages must not pollute the main branch unless a later feature explicitly merges them.
- Branches must preserve the source message they forked from.
- All repository functions must require an authenticated `userId`.

---

## File Structure

- Modify `src/lib/db/schema.ts` to add core product tables.
- Create `src/lib/db/types.ts` for exported TypeScript row and domain types.
- Create `src/lib/conversations/repository.ts` for conversation persistence.
- Create `src/lib/conversations/history.ts` for read models used by UI.
- Create `src/app/api/conversations/route.ts` and `src/app/api/conversations/[conversationId]/route.ts` for history API endpoints.
- Create `tests/unit/conversation-schema.test.ts` and `tests/unit/conversation-repository.test.ts`.

## Tasks

### Task 1: Add Source And Citation Tables

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `tests/unit/conversation-schema.test.ts`

**Interfaces:**
- Produces `sources` table.
- Produces `citations` table.
- Produces source type union: `"book" | "media"`.

- [ ] **Step 1: Define source tables**

Add these schema objects:

```ts
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const sourceType = pgEnum("source_type", ["book", "media"]);

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  type: sourceType("type").notNull(),
  title: text("title").notNull(),
  authorOrDomain: text("author_or_domain").notNull(),
  canonicalUrl: text("canonical_url"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  messageId: uuid("message_id").notNull(),
  sourceRef: text("source_ref").notNull(),
  quotedText: text("quoted_text").notNull(),
  url: text("url"),
  retrievedAt: timestamp("retrieved_at").defaultNow().notNull()
});
```

- [ ] **Step 2: Add schema tests**

Create a test that asserts exported schema names exist:

```ts
import { describe, expect, it } from "vitest";
import { citations, sources, sourceType } from "@/lib/db/schema";

describe("source schema", () => {
  it("exports source and citation tables", () => {
    expect(sources).toBeDefined();
    expect(citations).toBeDefined();
    expect(sourceType.enumValues).toEqual(["book", "media"]);
  });
});
```

- [ ] **Step 3: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: Drizzle creates a migration containing `source_type`, `sources`, and `citations`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts tests/unit/conversation-schema.test.ts drizzle
git commit -m "feat: add source and citation schema"
```

### Task 2: Add Conversations, Branches, Sidechats, And Messages

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `tests/unit/conversation-schema.test.ts`

**Interfaces:**
- Produces `conversations`, `conversationBranches`, `sidechats`, and `messages`.
- Produces message role union: `"user" | "assistant" | "system" | "tool"`.

- [ ] **Step 1: Define conversation tables**

Add:

```ts
export const messageRole = pgEnum("message_role", ["user", "assistant", "system", "tool"]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const conversationBranches = pgTable("conversation_branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  parentBranchId: uuid("parent_branch_id"),
  forkedFromMessageId: uuid("forked_from_message_id"),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const sidechats = pgTable("sidechats", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  anchorMessageId: uuid("anchor_message_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  branchId: uuid("branch_id").references(() => conversationBranches.id),
  sidechatId: uuid("sidechat_id").references(() => sidechats.id),
  role: messageRole("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

- [ ] **Step 2: Add invariant test**

Add a unit test documenting the data model rule:

```ts
describe("message location model", () => {
  it("supports main branch messages and sidechat messages", () => {
    expect(messageRole.enumValues).toEqual(["user", "assistant", "system", "tool"]);
    expect(conversationBranches).toBeDefined();
    expect(sidechats).toBeDefined();
    expect(messages).toBeDefined();
  });
});
```

- [ ] **Step 3: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: migration contains conversation, branch, sidechat, and message tables.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts tests/unit/conversation-schema.test.ts drizzle
git commit -m "feat: add conversation history schema"
```

### Task 3: Add Memory Base Table

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `tests/unit/conversation-schema.test.ts`

**Interfaces:**
- Produces `memories` table.
- Produces memory status union: `"suggested" | "active" | "deleted"`.

- [ ] **Step 1: Define memory schema**

Add:

```ts
export const memoryStatus = pgEnum("memory_status", ["suggested", "active", "deleted"]);

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  status: memoryStatus("status").notNull().default("suggested"),
  content: text("content").notNull(),
  sourceMessageId: uuid("source_message_id").references(() => messages.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
```

- [ ] **Step 2: Add memory schema test**

```ts
describe("memory schema", () => {
  it("exports user-controlled memory statuses", () => {
    expect(memoryStatus.enumValues).toEqual(["suggested", "active", "deleted"]);
    expect(memories).toBeDefined();
  });
});
```

- [ ] **Step 3: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: migration contains `memory_status` and `memories`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts tests/unit/conversation-schema.test.ts drizzle
git commit -m "feat: add memory schema"
```

### Task 4: Implement Conversation Repository

**Files:**
- Create: `src/lib/db/types.ts`
- Create: `src/lib/conversations/repository.ts`
- Create: `src/lib/conversations/history.ts`
- Create: `tests/unit/conversation-repository.test.ts`

**Interfaces:**
- Produces `createConversation(userId: string, title: string): Promise<{ conversationId: string; branchId: string }>`
- Produces `appendMessage(input: AppendMessageInput): Promise<{ messageId: string }>`
- Produces `getConversationHistory(userId: string, conversationId: string): Promise<ConversationHistory>`

- [ ] **Step 1: Define repository types**

Create:

```ts
export type AppendMessageInput = {
  userId: string;
  conversationId: string;
  branchId?: string;
  sidechatId?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

export type ConversationHistory = {
  id: string;
  title: string;
  branches: Array<{ id: string; title: string; parentBranchId: string | null }>;
  sidechats: Array<{ id: string; title: string; anchorMessageId: string }>;
  messages: Array<{ id: string; role: string; content: string; branchId: string | null; sidechatId: string | null }>;
};
```

- [ ] **Step 2: Implement create conversation**

`createConversation` must insert a conversation and a root branch titled `"Main"`, then return both ids.

- [ ] **Step 3: Implement append message**

`appendMessage` must reject inputs that provide both `branchId` and `sidechatId`, because a message belongs to exactly one context.

- [ ] **Step 4: Add repository tests**

Use mocked Drizzle methods or a test database. Cover:

```ts
describe("appendMessage", () => {
  it("rejects messages assigned to both branch and sidechat", async () => {
    await expect(
      appendMessage({
        userId: "user-1",
        conversationId: "conversation-1",
        branchId: "branch-1",
        sidechatId: "sidechat-1",
        role: "user",
        content: "Explain this"
      })
    ).rejects.toThrow("Message cannot belong to both branch and sidechat");
  });
});
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/conversation-repository.test.ts
```

Expected: repository tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/types.ts src/lib/conversations tests/unit/conversation-repository.test.ts
git commit -m "feat: add conversation repository"
```

### Task 5: Add History API Endpoints

**Files:**
- Create: `src/app/api/conversations/route.ts`
- Create: `src/app/api/conversations/[conversationId]/route.ts`
- Create: `tests/unit/conversation-api.test.ts`

**Interfaces:**
- Produces `GET /api/conversations`.
- Produces `POST /api/conversations`.
- Produces `GET /api/conversations/:conversationId`.

- [ ] **Step 1: Implement authenticated handlers**

Each handler must call `auth()` and return `401` when there is no session user.

- [ ] **Step 2: Implement list and detail responses**

`GET /api/conversations` returns:

```ts
type ConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
};
```

`GET /api/conversations/:conversationId` returns `ConversationHistory`.

- [ ] **Step 3: Add API tests**

Cover unauthenticated access and successful history read.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/conversation-api.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/conversations tests/unit/conversation-api.test.ts
git commit -m "feat: add conversation history api"
```

## Acceptance Criteria

- Database migrations create all source, citation, conversation, branch, sidechat, message, and memory tables.
- A signed-in user can create a conversation and retrieve its history.
- A message cannot be assigned to both a branch and a sidechat.
- Branch and sidechat lineage is stored explicitly for later UI management.

