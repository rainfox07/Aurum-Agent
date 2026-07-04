# Aurum Foundation Auth Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js 15 foundation, authentication, and user AI personalization settings for Aurum Agent.

**Architecture:** Use the Next.js App Router with server-only auth and settings actions. Auth.js owns sessions and OAuth flows; Resend sends email verification links. User-facing settings are stored in Postgres and exposed through typed server actions.

**Tech Stack:** Next.js 15, TypeScript, React, Tailwind CSS, Auth.js, Resend, Drizzle ORM, PostgreSQL, Vitest, Playwright.

## Global Constraints

- The app is a web product built with Next.js 15 + TypeScript.
- Never expose LLM, Resend, OAuth, or database secrets in browser code.
- The default deployment target is Vercel with managed Postgres.
- Authentication must support email verification, Google OAuth, and documented WeChat OAuth setup.
- User settings must include display name, AI nickname for the user, and preferred AI tone.
- Every implementation task must include tests or a manual verification command.

---

## File Structure

- Create `package.json` for scripts and dependency declarations.
- Create `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, and `.env.example` for project configuration.
- Create `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(auth)/sign-in/page.tsx`, and `src/app/settings/page.tsx` for the initial UI.
- Create `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, and `src/lib/auth/providers.ts` for Auth.js setup.
- Create `src/lib/db/client.ts`, `src/lib/db/schema.ts`, and `src/lib/settings/actions.ts` for persistence and user settings.
- Create `src/components/settings/settings-form.tsx` and `src/components/auth/sign-in-panel.tsx` for client-facing forms.
- Create `tests/unit/settings.test.ts` and `tests/e2e/auth-settings.spec.ts` for coverage.
- Create `docs/auth/wechat-login.md` for the platform-side WeChat login setup tutorial.

## Tasks

### Task 1: Scaffold Next.js App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Interfaces:**
- Produces script commands: `dev`, `build`, `lint`, `test`, `test:e2e`, `db:generate`, `db:migrate`.
- Produces app shell used by all later plans.

- [ ] **Step 1: Initialize dependencies**

Run:

```bash
npm init -y
npm install next@15 react@19 react-dom@19 typescript tailwindcss postcss autoprefixer zod
npm install @auth/core next-auth resend drizzle-orm postgres
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom playwright eslint eslint-config-next drizzle-kit
```

Expected: `package.json` includes Next.js, Auth.js, Resend, Drizzle, Vitest, and Playwright packages.

- [ ] **Step 2: Add scripts**

Set `package.json` scripts to:

```json
{
  "dev": "next dev",
  "build": "next build",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

- [ ] **Step 3: Add app shell**

Create a minimal `src/app/page.tsx` that links to sign-in and settings:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Aurum Agent</h1>
      <nav>
        <Link href="/sign-in">Sign in</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </main>
  );
}
```

- [ ] **Step 4: Verify scaffold**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts src/app
git commit -m "chore: scaffold aurum web app"
```

### Task 2: Configure Environment And Database Client

**Files:**
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/db/client.ts`
- Create: `drizzle.config.ts`

**Interfaces:**
- Produces `env` object with validated server environment variables.
- Produces `db` Drizzle client for later plans.

- [ ] **Step 1: Define environment schema**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  WECHAT_CLIENT_ID: z.string().optional(),
  WECHAT_CLIENT_SECRET: z.string().optional()
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 2: Add `.env.example`**

```bash
DATABASE_URL="postgres://user:password@localhost:5432/aurum"
AUTH_SECRET="replace-with-32-plus-character-secret"
AUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxx"
EMAIL_FROM="Aurum Agent <login@example.com>"
GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"
WECHAT_CLIENT_ID=""
WECHAT_CLIENT_SECRET=""
```

- [ ] **Step 3: Create database client**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(queryClient);
```

- [ ] **Step 4: Verify env validation**

Run:

```bash
npm run build
```

Expected: build fails when required env vars are missing and succeeds after local `.env` values are provided.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/env.ts src/lib/db/client.ts drizzle.config.ts
git commit -m "chore: configure environment and database client"
```

### Task 3: Add Auth.js Email, Google, And WeChat Provider Setup

**Files:**
- Create: `src/auth.ts`
- Create: `src/lib/auth/providers.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/components/auth/sign-in-panel.tsx`
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `docs/auth/wechat-login.md`

**Interfaces:**
- Produces `auth`, `handlers`, `signIn`, and `signOut` exports from `src/auth.ts`.
- Produces `/sign-in` route with email and OAuth sign-in options.

- [ ] **Step 1: Create providers**

Implement `src/lib/auth/providers.ts` with Resend, Google, and conditional WeChat providers:

```ts
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import WeChat from "next-auth/providers/wechat";
import { env } from "@/lib/env";

export function getAuthProviders() {
  const providers = [
    Resend({ from: env.EMAIL_FROM, apiKey: env.RESEND_API_KEY }),
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    })
  ];

  if (env.WECHAT_CLIENT_ID && env.WECHAT_CLIENT_SECRET) {
    providers.push(
      WeChat({
        clientId: env.WECHAT_CLIENT_ID,
        clientSecret: env.WECHAT_CLIENT_SECRET
      })
    );
  }

  return providers;
}
```

- [ ] **Step 2: Create Auth.js route**

Implement `src/auth.ts`:

```ts
import NextAuth from "next-auth";
import { getAuthProviders } from "@/lib/auth/providers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: getAuthProviders(),
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" }
});
```

Implement `src/app/api/auth/[...nextauth]/route.ts`:

```ts
export { GET, POST } from "@/auth";
```

- [ ] **Step 3: Create sign-in UI**

Create a sign-in panel with an email field and Google/WeChat buttons. The WeChat button renders only when `WECHAT_CLIENT_ID` is present on the server.

- [ ] **Step 4: Document WeChat setup**

Write `docs/auth/wechat-login.md` with these exact sections:

```md
# WeChat Login Setup

## 1. Create WeChat Open Platform App
Register an app in WeChat Open Platform and obtain AppID and AppSecret.

## 2. Configure Callback URL
Set the OAuth callback URL to:
`https://<your-domain>/api/auth/callback/wechat`

## 3. Set Environment Variables
Add `WECHAT_CLIENT_ID` and `WECHAT_CLIENT_SECRET` to the deployment environment.

## 4. Verify
Open `/sign-in`, select WeChat, complete OAuth, and confirm the user lands in Aurum Agent.
```

- [ ] **Step 5: Verify auth routes**

Run:

```bash
npm run build
```

Expected: auth route compiles and `/sign-in` renders.

- [ ] **Step 6: Commit**

```bash
git add src/auth.ts src/lib/auth src/app/api/auth src/components/auth src/app/'(auth)' docs/auth
git commit -m "feat: add authentication flows"
```

### Task 4: Add User Personalization Settings

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/settings/actions.ts`
- Create: `src/components/settings/settings-form.tsx`
- Create: `src/app/settings/page.tsx`
- Create: `tests/unit/settings.test.ts`

**Interfaces:**
- Produces `updateUserSettings(input: UpdateUserSettingsInput): Promise<UserSettings>`.
- Produces `getUserSettings(userId: string): Promise<UserSettings>`.

- [ ] **Step 1: Define settings table**

Add `users` and `userSettings` tables to `src/lib/db/schema.ts`:

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  displayName: text("display_name").notNull(),
  aiCallsUser: text("ai_calls_user").notNull(),
  aiTone: text("ai_tone").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
```

- [ ] **Step 2: Add validation**

Use this input schema:

```ts
import { z } from "zod";

export const updateUserSettingsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  aiCallsUser: z.string().trim().min(1).max(80),
  aiTone: z.enum(["calm", "direct", "friendly", "academic"])
});
```

- [ ] **Step 3: Implement server actions**

`updateUserSettings` must read the current session, reject unauthenticated users, validate input, and upsert the settings row for the current user.

- [ ] **Step 4: Add tests**

`tests/unit/settings.test.ts` must cover:

```ts
import { describe, expect, it } from "vitest";
import { updateUserSettingsSchema } from "@/lib/settings/actions";

describe("updateUserSettingsSchema", () => {
  it("accepts valid personalization settings", () => {
    expect(
      updateUserSettingsSchema.parse({
        displayName: "Rainfox",
        aiCallsUser: "Rainfox",
        aiTone: "direct"
      })
    ).toEqual({
      displayName: "Rainfox",
      aiCallsUser: "Rainfox",
      aiTone: "direct"
    });
  });

  it("rejects unsupported tone values", () => {
    expect(() =>
      updateUserSettingsSchema.parse({
        displayName: "Rainfox",
        aiCallsUser: "Rainfox",
        aiTone: "random"
      })
    ).toThrow();
  });
});
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test tests/unit/settings.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/schema.ts src/lib/settings src/components/settings src/app/settings tests/unit/settings.test.ts
git commit -m "feat: add user personalization settings"
```

## Acceptance Criteria

- A user can sign in with email verification.
- A user can sign in with Google OAuth after provider credentials are configured.
- WeChat login is documented and conditionally available when credentials exist.
- A signed-in user can save display name, AI nickname, and AI tone.
- Browser code never contains provider secrets or API keys.

