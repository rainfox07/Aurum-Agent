# Aurum Media Source Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to configure authoritative media domains and retrieve cited web results from only those domains using Tavily.

**Architecture:** Store user-owned media domain allowlists in Postgres. At answer time, call a server-side Tavily adapter with domain restrictions, normalize results into source candidates, and persist media citations with URLs and retrieval timestamps.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Tavily API, Vitest.

## Global Constraints

- Media sources are configured in settings, not selected in the main source picker for v1.
- Real-time media search must be restricted to the user's configured allowlist domains.
- Tavily API keys must only be used server-side.
- Media results must include URL, title, domain, snippet or content, and retrieval timestamp.
- If no media domains are configured, media search returns an empty result set rather than searching the open web.

---

## File Structure

- Modify `src/lib/db/schema.ts` to add `mediaDomains`.
- Create `src/lib/media/types.ts` for allowlist and search result types.
- Create `src/lib/media/domain-validation.ts` for domain parsing.
- Create `src/lib/media/repository.ts` for settings persistence.
- Create `src/lib/media/tavily.ts` for search adapter.
- Create `src/lib/media/search.ts` for allowed-domain retrieval.
- Create `src/app/settings/media/page.tsx` and `src/components/settings/media-domains-form.tsx`.
- Create `tests/unit/media-domain-validation.test.ts`, `tests/unit/tavily.test.ts`, and `tests/unit/media-search.test.ts`.

## Tasks

### Task 1: Add Media Domain Allowlist Schema

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/media/types.ts`
- Create: `tests/unit/media-schema.test.ts`

**Interfaces:**
- Produces `mediaDomains` table.
- Produces `MediaDomain` type.

- [ ] **Step 1: Define table**

Add:

```ts
export const mediaDomains = pgTable("media_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

- [ ] **Step 2: Add type**

```ts
export type MediaDomain = {
  id: string;
  userId: string;
  domain: string;
  label: string;
};
```

- [ ] **Step 3: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: migration creates `media_domains`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts src/lib/media/types.ts tests/unit/media-schema.test.ts drizzle
git commit -m "feat: add media domain allowlist schema"
```

### Task 2: Validate And Persist Media Domains

**Files:**
- Create: `src/lib/media/domain-validation.ts`
- Create: `src/lib/media/repository.ts`
- Create: `tests/unit/media-domain-validation.test.ts`

**Interfaces:**
- Produces `normalizeMediaDomain(input: string): string`.
- Produces `saveMediaDomains(userId: string, domains: string[]): Promise<MediaDomain[]>`.
- Produces `listMediaDomains(userId: string): Promise<MediaDomain[]>`.

- [ ] **Step 1: Implement normalization**

Rules:

- Accept `nytimes.com`, `https://www.nytimes.com/world`, and `www.ft.com`.
- Store domains lowercased without protocol, path, query, hash, or leading `www.`.
- Reject empty strings, localhost, IP addresses, and strings without a dot.

- [ ] **Step 2: Add tests**

Use:

```ts
expect(normalizeMediaDomain("https://www.ft.com/world")).toBe("ft.com");
expect(() => normalizeMediaDomain("localhost:3000")).toThrow("Invalid media domain");
```

- [ ] **Step 3: Implement repository**

`saveMediaDomains` must replace the user's previous allowlist with the normalized unique set. The maximum is 20 domains per user.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/media-domain-validation.test.ts
```

Expected: validation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/media/domain-validation.ts src/lib/media/repository.ts tests/unit/media-domain-validation.test.ts
git commit -m "feat: persist media domain allowlists"
```

### Task 3: Build Media Settings UI

**Files:**
- Create: `src/app/settings/media/page.tsx`
- Create: `src/components/settings/media-domains-form.tsx`
- Create: `tests/unit/media-domains-form.test.tsx`

**Interfaces:**
- Produces `/settings/media`.
- Produces form action that calls `saveMediaDomains`.

- [ ] **Step 1: Add page**

The page must require `auth()`, load current domains, and render a textarea where users enter one domain per line.

- [ ] **Step 2: Add form behavior**

On submit, normalize domains and show validation errors inline. On success, show the saved normalized domains.

- [ ] **Step 3: Add component tests**

Test that duplicate values like `https://www.ft.com` and `ft.com` render as one saved value.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/media-domains-form.test.tsx
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/media src/components/settings/media-domains-form.tsx tests/unit/media-domains-form.test.tsx
git commit -m "feat: add media source settings"
```

### Task 4: Add Tavily Adapter

**Files:**
- Create: `src/lib/media/tavily.ts`
- Modify: `.env.example`
- Create: `tests/unit/tavily.test.ts`

**Interfaces:**
- Produces `searchTavily(input: TavilySearchInput): Promise<TavilySearchResult[]>`.

```ts
export type TavilySearchInput = {
  query: string;
  includeDomains: string[];
  maxResults?: number;
};

export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};
```

- [ ] **Step 1: Add env variable**

Append:

```bash
TAVILY_API_KEY="tvly_xxx"
```

- [ ] **Step 2: Implement adapter**

Call Tavily's search endpoint with `query`, `include_domains`, and `max_results`. Default `maxResults` to 5.

- [ ] **Step 3: Add tests**

Mock `fetch` and verify request body:

```ts
expect(requestBody.include_domains).toEqual(["ft.com", "nytimes.com"]);
expect(requestBody.max_results).toBe(5);
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/tavily.test.ts
```

Expected: adapter tests pass without a real network call.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/media/tavily.ts tests/unit/tavily.test.ts
git commit -m "feat: add tavily media search adapter"
```

### Task 5: Implement Allowlisted Media Search

**Files:**
- Create: `src/lib/media/search.ts`
- Create: `tests/unit/media-search.test.ts`

**Interfaces:**
- Produces `searchUserMediaSources(input: SearchUserMediaSourcesInput): Promise<MediaSearchCandidate[]>`.

```ts
export type SearchUserMediaSourcesInput = {
  userId: string;
  query: string;
  maxResults?: number;
};

export type MediaSearchCandidate = {
  sourceType: "media";
  title: string;
  domain: string;
  url: string;
  content: string;
  retrievedAt: Date;
  score: number;
};
```

- [ ] **Step 1: Implement search orchestration**

Load user domains. If the list is empty, return `[]`. Otherwise call `searchTavily` with `includeDomains` set to the exact allowlist.

- [ ] **Step 2: Normalize result domains**

Only return Tavily results whose URL host normalizes to one of the allowlisted domains.

- [ ] **Step 3: Add tests**

Cover:

- empty domain list returns `[]`;
- search uses only allowlisted domains;
- result from an unlisted domain is discarded.

- [ ] **Step 4: Verify**

Run:

```bash
npm test tests/unit/media-search.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/media/search.ts tests/unit/media-search.test.ts
git commit -m "feat: restrict media search to user allowlist"
```

## Acceptance Criteria

- Users can save up to 20 authoritative media domains.
- Domains are normalized and deduplicated.
- Media search never runs when the user has no configured media domains.
- Tavily requests include only the user's allowlisted domains.
- Returned media candidates include URL, title, domain, content, score, and retrieval timestamp.

