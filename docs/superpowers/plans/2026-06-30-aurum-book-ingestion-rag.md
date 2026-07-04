# Aurum Book Ingestion RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the built-in book ingestion, chunk storage, embedding, and retrieval pipeline used by source-grounded answers and author mode.

**Architecture:** Keep book preprocessing as versioned JSONL files under `data/books/`, then import those chunks into Postgres with pgvector embeddings. Runtime retrieval reads only imported chunks and returns source references that can be converted into citations.

**Tech Stack:** Next.js 15, TypeScript, Node scripts, Drizzle ORM, PostgreSQL, pgvector, OpenAI-compatible embeddings adapter, Vitest.

## Global Constraints

- The v1 book library is built in and seeded by product-owned files.
- The initial seed books are test books chosen by the team; the list can be replaced later by the user's final book list.
- Only authorized, public-domain, or private test texts may be imported for a public deployment.
- Every retrieved chunk must include `bookId`, `title`, `author`, `chapter`, `sourceRef`, and `text`.
- Retrieval must never return chunks without a source reference.
- Embedding calls must happen server-side only.

---

## File Structure

- Create `data/books/seed-manifest.json` to list books imported by default.
- Create `data/books/sample-book.jsonl` as the first test book fixture.
- Modify `src/lib/db/schema.ts` to add `bookChunks`.
- Create `src/lib/books/types.ts` for JSONL and retrieval types.
- Create `src/lib/books/validate-book-jsonl.ts` for preprocessing validation.
- Create `src/lib/ai/embeddings.ts` for OpenAI-compatible embeddings.
- Create `src/lib/books/import-books.ts` for import orchestration.
- Create `src/lib/books/retriever.ts` for question-time retrieval.
- Create `scripts/import-books.ts` for CLI import.
- Create `tests/unit/book-jsonl.test.ts`, `tests/unit/book-retriever.test.ts`, and `tests/fixtures/books/valid-book.jsonl`.

## Tasks

### Task 1: Define Book JSONL Contract

**Files:**
- Create: `data/books/seed-manifest.json`
- Create: `data/books/sample-book.jsonl`
- Create: `src/lib/books/types.ts`
- Create: `src/lib/books/validate-book-jsonl.ts`
- Create: `tests/fixtures/books/valid-book.jsonl`
- Create: `tests/unit/book-jsonl.test.ts`

**Interfaces:**
- Produces `BookChunkJsonl` type.
- Produces `parseBookChunkLine(line: string): BookChunkJsonl`.
- Produces `validateBookJsonlFile(filePath: string): Promise<BookChunkJsonl[]>`.

- [ ] **Step 1: Create the chunk type**

```ts
export type BookChunkJsonl = {
  bookId: string;
  title: string;
  author: string;
  chapter: string;
  sourceRef: string;
  text: string;
  language: "zh" | "en" | "other";
  rights: "authorized" | "public_domain" | "private_test";
};
```

- [ ] **Step 2: Add validation schema**

```ts
import { z } from "zod";

export const bookChunkJsonlSchema = z.object({
  bookId: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  chapter: z.string().min(1),
  sourceRef: z.string().min(1),
  text: z.string().min(20),
  language: z.enum(["zh", "en", "other"]),
  rights: z.enum(["authorized", "public_domain", "private_test"])
});
```

- [ ] **Step 3: Create seed manifest**

`data/books/seed-manifest.json` must contain:

```json
{
  "version": 1,
  "books": [
    {
      "bookId": "sample-book",
      "path": "data/books/sample-book.jsonl",
      "enabled": true
    }
  ]
}
```

- [ ] **Step 4: Add tests**

`tests/unit/book-jsonl.test.ts` must verify valid chunks parse and missing `sourceRef` is rejected.

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/book-jsonl.test.ts
```

Expected: validation tests pass.

- [ ] **Step 6: Commit**

```bash
git add data/books src/lib/books/types.ts src/lib/books/validate-book-jsonl.ts tests/fixtures/books tests/unit/book-jsonl.test.ts
git commit -m "feat: define book ingestion contract"
```

### Task 2: Add Book Chunk Storage

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `tests/unit/book-schema.test.ts`

**Interfaces:**
- Produces `bookChunks` table.
- Produces vector column with 1536 dimensions unless the configured embedding model requires a different dimension.

- [ ] **Step 1: Enable vector schema support**

Add `vector` import from `drizzle-orm/pg-core` and define:

```ts
export const bookChunks = pgTable("book_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  bookId: text("book_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  chapter: text("chapter").notNull(),
  sourceRef: text("source_ref").notNull(),
  text: text("text").notNull(),
  language: text("language").notNull(),
  rights: text("rights").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

- [ ] **Step 2: Add migration**

Run:

```bash
npm run db:generate
```

Expected: migration enables pgvector extension and creates `book_chunks`.

- [ ] **Step 3: Add schema test**

Assert `bookChunks` exports and includes the required metadata fields.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts tests/unit/book-schema.test.ts drizzle
git commit -m "feat: add book chunk storage"
```

### Task 3: Add Server-Side Embeddings Adapter

**Files:**
- Create: `src/lib/ai/embeddings.ts`
- Modify: `.env.example`
- Create: `tests/unit/embeddings.test.ts`

**Interfaces:**
- Produces `embedText(input: string): Promise<number[]>`.
- Produces `embedTexts(inputs: string[]): Promise<number[][]>`.

- [ ] **Step 1: Add env variables**

Append to `.env.example`:

```bash
EMBEDDINGS_BASE_URL="https://api.openai.com/v1"
EMBEDDINGS_API_KEY="sk_xxx"
EMBEDDINGS_MODEL="text-embedding-3-small"
EMBEDDINGS_DIMENSIONS="1536"
```

- [ ] **Step 2: Implement embeddings adapter**

`embedTexts` must call `${EMBEDDINGS_BASE_URL}/embeddings` with:

```ts
type EmbeddingRequest = {
  model: string;
  input: string[];
  dimensions: number;
};
```

It must return arrays in the same order as inputs.

- [ ] **Step 3: Add tests**

Mock `fetch` and verify:

```ts
expect(requestBody).toEqual({
  model: "text-embedding-3-small",
  input: ["chunk one"],
  dimensions: 1536
});
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/embeddings.test.ts
```

Expected: adapter test passes without making a real network call.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/ai/embeddings.ts tests/unit/embeddings.test.ts
git commit -m "feat: add embeddings adapter"
```

### Task 4: Implement Import Script

**Files:**
- Create: `src/lib/books/import-books.ts`
- Create: `scripts/import-books.ts`
- Create: `tests/unit/book-import.test.ts`

**Interfaces:**
- Produces `importBookFile(filePath: string): Promise<{ imported: number; skipped: number }>`
- Produces CLI command `tsx scripts/import-books.ts`.

- [ ] **Step 1: Implement import orchestration**

The importer must:

1. Validate every JSONL line.
2. Upsert a `sources` row with `type = "book"`.
3. Generate embeddings in batches of 64 chunks.
4. Insert chunks with metadata and embeddings.
5. Skip duplicate chunks with the same `bookId` and `sourceRef`.

- [ ] **Step 2: Add CLI script**

The CLI must read `data/books/seed-manifest.json`, import only `enabled: true` books, and print:

```text
Imported <number> chunks from <bookId>; skipped <number> duplicates.
```

- [ ] **Step 3: Add import tests**

Mock database and embeddings to verify duplicate `sourceRef` chunks are skipped.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/book-import.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/books/import-books.ts scripts/import-books.ts tests/unit/book-import.test.ts
git commit -m "feat: add book import pipeline"
```

### Task 5: Implement Book Retriever

**Files:**
- Create: `src/lib/books/retriever.ts`
- Create: `tests/unit/book-retriever.test.ts`

**Interfaces:**
- Produces `retrieveBookChunks(input: RetrieveBookChunksInput): Promise<RetrievedBookChunk[]>`.

```ts
export type RetrieveBookChunksInput = {
  query: string;
  bookSourceIds: string[];
  limit?: number;
};

export type RetrievedBookChunk = {
  sourceId: string;
  bookId: string;
  title: string;
  author: string;
  chapter: string;
  sourceRef: string;
  text: string;
  score: number;
};
```

- [ ] **Step 1: Implement retrieval**

The retriever must embed the query, filter by selected `bookSourceIds`, sort by vector distance, and return at most `limit ?? 8` chunks.

- [ ] **Step 2: Enforce source references**

Throw `BookRetrievalSourceError` if a returned row has an empty `sourceRef`.

- [ ] **Step 3: Add tests**

Cover:

- selected book ids are passed into the query filter;
- limit defaults to 8;
- empty `sourceRef` causes a rejection.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/book-retriever.test.ts
npm run build
```

Expected: retriever tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/books/retriever.ts tests/unit/book-retriever.test.ts
git commit -m "feat: add book chunk retriever"
```

## Acceptance Criteria

- A versioned JSONL file can represent a built-in book.
- Invalid chunks without `sourceRef` cannot be imported.
- Import creates book sources and vectorized chunks.
- Retrieval can return relevant chunks from selected book sources only.
- Every retrieved chunk includes enough metadata to create a citation.

