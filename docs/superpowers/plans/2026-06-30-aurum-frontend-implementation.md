# Aurum Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Aurum Agent's source-centric web frontend with a modern academic workbench interface modeled after the provided `stitch_source_centric_knowledge_agent` prototype.

**Architecture:** Use Next.js 15 App Router with server-rendered pages for authenticated shells and client components for interactive chat, source picking, branch switching, sidechat, settings forms, and memory approval. The frontend consumes typed API routes from the implementation plans for auth, conversations, source selection, answer generation, author mode, media settings, and memory management.

**Tech Stack:** Next.js 15, TypeScript, React 19, Tailwind CSS, Auth.js client helpers, lucide-react icons, React Hook Form, Zod, Playwright, Vitest, Testing Library.

## Global Constraints

- Frontend must use Next.js 15 + TypeScript.
- The first screen after login is the usable chat workbench, not a marketing landing page.
- The visual style follows Modern Academic Minimalism: quiet surfaces, serif reading text, sans UI text, thin structural borders, minimal shadows.
- Primary accent color is Cinnabar Red `#b41f17`, used sparingly for active states, citation markers, and critical actions.
- Main desktop layout uses a structured three-column workbench: left navigation, center workbench, right context panel.
- Answer text must visually expose citations; cited claims cannot be hidden behind an untraceable summary.
- Author mode UI must clearly state that it is an AI simulation based on selected works, not the real author.
- Browser code must never contain LLM, Tavily, Resend, OAuth, or database secrets.

---

## Reference Prototype Mapping

Use `/Users/rainfox/Downloads/stitch_source_centric_knowledge_agent` as the visual reference:

- `knowledge_workbench_chat/code.html`: main chat workbench, selected sources, citations, memory summary, branch and sidechat actions.
- `source_library/code.html`: source library cards, category sections, search, stats panel, mobile bottom nav.
- `system_settings/code.html`: profile settings, AI personalization, minimal underline inputs.
- `user_authentication/code.html`: centered auth card, email verification, Google and WeChat options.
- `user_memory_manager/code.html`: memory grid, global memory toggle, edit/delete actions.
- `scholastic_intelligence/DESIGN.md`: design tokens, colors, typography, spacing, and component style.

## Design System

### Visual Tokens

Implement these tokens in `tailwind.config.ts` and expose matching CSS variables in `src/app/globals.css`:

```ts
const colors = {
  background: "#faf9f9",
  surface: "#faf9f9",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f4f3f3",
  surfaceContainer: "#efeeed",
  surfaceContainerHigh: "#e9e8e8",
  surfaceContainerHighest: "#e3e2e2",
  onSurface: "#1a1c1c",
  secondary: "#5f5e5e",
  outline: "#8f706b",
  outlineVariant: "#e3beb9",
  primary: "#b41f17",
  primaryContainer: "#d7392d",
  error: "#ba1a1a"
};
```

Typography:

- Use `Source Serif 4` for long-form AI answers, quotes, citations, book excerpts, and page display headings.
- Use `Inter` for navigation, labels, buttons, form controls, metadata, and table-like UI.
- Body answer text: `18px / 30px`.
- UI label text: `14px / 20px`.
- Small metadata: `12px / 16px`.
- Do not use negative letter spacing except the display heading value already present in the prototype.

Spacing and shape:

- 4px baseline grid.
- Left sidebar width: `280px`.
- Right context panel width: `280px`.
- Center reading max width: `800px`.
- Main gutter: `24px`.
- Page margin: `32px`.
- Cards and controls use `2px-8px` radius; large layout panels use square edges.
- Avoid decorative shadows; use `1px` borders and tonal surface changes.

### Shared UI Components

Create these shared components:

- `AppShell`: desktop layout with left nav, top bar, optional right context panel, and mobile bottom nav.
- `SideNav`: Workbench navigation items: New Chat, History, Branch Manager, Sources, Memory, Settings.
- `TopBar`: page title, search slot, notification button, account menu.
- `PageHeader`: serif title, short description, optional actions.
- `SurfaceCard`: bordered white card with no shadow.
- `PrimaryButton`: cinnabar filled button for primary actions.
- `SecondaryButton`: bordered neutral button.
- `IconButton`: square icon-only control with tooltip.
- `UnderlineInput`: transparent input with bottom-border focus.
- `StatusChip`: compact label for source credibility, memory status, branch state, or model state.
- `CitationMarker`: inline source marker like `[1]` or `[^ev_1]`.
- `EmptyState`: dashed border placeholder for empty library, memory, or branch states.

Use `lucide-react` icons for implementation. Map prototype Material Symbols to lucide:

- `add_comment` -> `MessageSquarePlus`
- `history` -> `History`
- `account_tree` -> `GitBranch`
- `library_books` -> `LibraryBig`
- `memory` -> `Brain`
- `settings` -> `Settings`
- `forum` -> `MessagesSquare`
- `edit_note` -> `PenLine`
- `notifications` -> `Bell`
- `search` -> `Search`

## Routes And Screens

### `/sign-in`

Purpose: allow email verification, Google OAuth, and WeChat OAuth entry.

Layout:

- Centered auth shell with max width `440px`.
- Brand icon and title at top.
- White bordered login card.
- Email field uses underline input.
- Primary action: `Send Verification Link`.
- OAuth actions: `Continue with Google`, `Continue with WeChat`.
- Success state: left red accent line and message showing target email.

Frontend behavior:

- Submit email to Auth.js sign-in flow.
- Show loading state on the submit button.
- After successful request, disable the form and show a verification email message.
- OAuth buttons call provider sign-in handlers.

### `/chat`

Purpose: main source-centric question answering workbench.

Desktop layout:

- Left: `SideNav`.
- Center: chat thread with constrained `800px` reading column.
- Right: context panel with selected sources, citations, and memory summary.

Main states:

- Empty new chat state with composer focused.
- User question submitted.
- Source selection state with book candidates and checkboxes.
- Answer loading state.
- Completed answer with inline citations and citation list.
- Insufficient evidence state.
- Error state with retry.

Core components:

- `ChatThread`
- `ChatMessage`
- `AssistantAnswer`
- `SourceSelectionPanel`
- `SelectedSourcesPanel`
- `CitationPanel`
- `MemorySummaryPanel`
- `ChatComposer`
- `BranchActionButton`
- `SidechatActionButton`
- `AuthorModeEntryButton`

Question flow:

1. User submits a question from `ChatComposer`.
2. Client calls `POST /api/ask`.
3. UI renders `SourceSelectionPanel` with book candidates only.
4. User selects at least one book source.
5. Client calls `POST /api/answer`.
6. UI renders cited answer and updates right-side citation/source panels.

Source picker rules:

- Book candidates show title, author, relevance reason, and selected checkbox.
- Answer button is disabled until at least one book is selected.
- Media sources are not shown in this picker in v1; media domains are configured under settings and searched server-side.

Citation rendering:

- Inline citation markers are red, clickable, and scroll/focus the right citation panel.
- Citation cards show source title, author or domain, sourceRef or URL, and quoted text.
- Missing citations are rendered as an error state, not as normal assistant output.

### `/sources`

Purpose: inspect built-in books and configured media source status.

Layout:

- Left nav + top bar.
- Main content max width `1200px`.
- Category sections with horizontal divider and uppercase status label.
- Grid of source cards.
- Optional right stats panel on wide screens.

Components:

- `SourceLibrary`
- `SourceCard`
- `SourceCategorySection`
- `SourceSearchInput`
- `SourceStatsPanel`
- `SourceHealthBadge`

V1 content:

- Published Books section is primary.
- Authoritative Media section links to `/settings/media` and shows configured domains, not arbitrary search results.
- Each book card shows title, author, tags, credibility, updated timestamp, and an entry action for author mode.

### `/author/[sourceId]`

Purpose: high-fidelity simulated author conversation for a selected book.

Layout:

- Same workbench shell as `/chat`.
- Header states selected author and book.
- A disclosure block is always visible above the thread.
- Right panel shows current book evidence and citations.

Required disclosure copy:

```text
This is an AI simulation based on the selected book source, not the real author.
```

Components:

- `AuthorChat`
- `SimulationDisclosure`
- `AuthorEvidencePanel`
- `AuthorComposer`

Behavior:

- On first load, call `POST /api/author-mode/start`.
- Messages call `POST /api/author-mode/message`.
- Every assistant paragraph must render citations.
- Direct quotes are visually styled as serif quote blocks with source references.

### `/conversations`

Purpose: overall history and conversation management.

Layout:

- List recent conversations by updated time.
- Include branch count, sidechat count, last source used, and last updated time.
- Search and filter by conversation title or source.

Components:

- `ConversationList`
- `ConversationListItem`
- `ConversationSearch`
- `ConversationMeta`

### `/conversations/[conversationId]`

Purpose: manage one conversation's branch tree, sidechats, and message history.

Layout:

- Left section: branch tree.
- Center section: selected branch transcript.
- Right section: sidechat panel or citations.

Components:

- `ConversationTree`
- `BranchSwitcher`
- `BranchTreeNode`
- `SidechatPanel`
- `MessageActions`

Rules:

- Creating a branch from a message switches to the new branch.
- Opening a sidechat does not alter the active branch.
- Sidechat messages appear only in the side panel.
- Branch lineage must be visible enough for users to return to main branch.

### `/settings`

Purpose: user profile and AI personalization.

Layout:

- Left nav + top bar.
- Main content max width `800px`.
- Sections separated by top borders.

Sections:

- User Profile: display name, email, avatar placeholder.
- AI Personalization: what AI should call the user, tone preference, response style.
- Account Providers: email, Google, WeChat connection status.

Components:

- `SettingsForm`
- `ProfileSection`
- `AiPersonalizationSection`
- `ProviderStatusSection`

### `/settings/media`

Purpose: configure authoritative media domains.

Layout:

- Same settings shell.
- One-domain-per-line textarea.
- Normalized saved-domain list.
- Validation errors inline.

Components:

- `MediaDomainsForm`
- `MediaDomainChip`
- `DomainValidationMessage`

Rules:

- Store only normalized domains.
- Reject localhost, IP addresses, protocol-only strings, and domains without a dot.
- Explain that media search is limited to this allowlist.

### `/settings/memory`

Purpose: manage suggested and active memories.

Layout:

- Page header with global memory toggle.
- Suggested memories section.
- Active memories grid.
- Integrity protocol note styled with red left border.

Components:

- `MemoryToggle`
- `MemorySuggestionCard`
- `MemoryList`
- `MemoryCard`
- `MemoryEditDialog`

Rules:

- Suggested memory has approve, edit, and delete actions.
- Active memory has edit and delete actions.
- Deleted memory disappears from normal lists.
- UI must make clear that unapproved suggestions are not used by the AI.

## Frontend Data Contracts

Create `src/types/frontend.ts` or colocated feature types with these shapes:

```ts
export type SourceCandidate = {
  sourceId: string;
  type: "book";
  title: string;
  author: string;
  reason: string;
};

export type CitationView = {
  id: string;
  sourceId: string;
  title: string;
  authorOrDomain: string;
  sourceRef: string;
  quotedText: string;
  url?: string;
};

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  citations?: CitationView[];
  createdAt: string;
};

export type MemoryView = {
  id: string;
  status: "suggested" | "active" | "deleted";
  category: "profile" | "preference" | "instruction";
  content: string;
  updatedAt: string;
};

export type BranchNodeView = {
  id: string;
  title: string;
  parentBranchId: string | null;
  forkedFromMessageId: string | null;
};
```

API consumption:

- `POST /api/ask`: create pending question and return book source candidates.
- `POST /api/answer`: generate source-grounded answer.
- `GET /api/conversations`: list conversation history.
- `GET /api/conversations/:conversationId`: load branches, sidechats, messages.
- `POST /api/branches`: create branch from a message.
- `POST /api/sidechats`: create sidechat from a message.
- `POST /api/sidechats/:sidechatId/messages`: send sidechat message.
- `POST /api/author-mode/start`: start author simulation.
- `POST /api/author-mode/message`: send author-mode message.
- `GET /api/memory`: list suggested and active memory.
- `POST /api/memory/:memoryId`: approve or edit memory.
- `DELETE /api/memory/:memoryId`: delete memory.

## Implementation Tasks

### Task 1: Frontend Foundation And Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Create: `src/components/ui/*`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/layout/side-nav.tsx`
- Create: `src/components/layout/top-bar.tsx`

- [ ] Add the color, spacing, radius, and typography tokens from this document.
- [ ] Import `Inter` and `Source Serif 4` through Next.js font loading.
- [ ] Build `AppShell`, `SideNav`, `TopBar`, and shared UI primitives.
- [ ] Add responsive behavior: desktop side nav, mobile bottom nav.
- [ ] Test shell rendering with Testing Library.

### Task 2: Auth UI

**Files:**
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/components/auth/sign-in-panel.tsx`

- [ ] Build centered auth card matching the prototype.
- [ ] Add email verification form with loading and success states.
- [ ] Add Google and WeChat buttons.
- [ ] Add validation and accessible form labels.
- [ ] Add Playwright flow for email submission success state.

### Task 3: Chat Workbench UI

**Files:**
- Create: `src/app/chat/page.tsx`
- Create: `src/components/chat/*`
- Create: `src/components/citations/*`

- [ ] Build three-column desktop workbench.
- [ ] Implement chat composer and message rendering.
- [ ] Implement source candidate picker after `POST /api/ask`.
- [ ] Implement answer rendering after `POST /api/answer`.
- [ ] Implement right panels for selected sources, citations, and memory summary.
- [ ] Add loading, empty, insufficient-evidence, and error states.
- [ ] Add Playwright test for ask -> select source -> answer with citations.

### Task 4: Source Library UI

**Files:**
- Create: `src/app/sources/page.tsx`
- Create: `src/components/sources/*`

- [ ] Build source library header, search input, category sections, and source cards.
- [ ] Show book sources as primary v1 content.
- [ ] Show media configuration callout linking to `/settings/media`.
- [ ] Add wide-screen stats panel and mobile bottom nav behavior.
- [ ] Add tests for source card rendering and author-mode entry link.

### Task 5: Settings And Media UI

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/media/page.tsx`
- Create: `src/components/settings/*`

- [ ] Build profile and AI personalization forms.
- [ ] Build provider status section for email, Google, and WeChat.
- [ ] Build media domain allowlist textarea and normalized domain list.
- [ ] Add inline validation states.
- [ ] Add tests for saving personalization and media domains.

### Task 6: Memory UI

**Files:**
- Create: `src/app/settings/memory/page.tsx`
- Create: `src/components/memory/*`

- [ ] Build memory management page with global toggle.
- [ ] Render suggested memory cards with edit, approve, and delete.
- [ ] Render active memory cards with edit and delete.
- [ ] Add integrity note with red left accent.
- [ ] Add Playwright test for approving and deleting memory.

### Task 7: Author Mode UI

**Files:**
- Create: `src/app/author/[sourceId]/page.tsx`
- Create: `src/components/author-mode/*`

- [ ] Build author-mode page using workbench shell.
- [ ] Render required simulation disclosure.
- [ ] Start author session and send author messages through APIs.
- [ ] Render cited author responses and quote blocks.
- [ ] Add Playwright test proving disclosure and citations are visible.

### Task 8: Branch And Sidechat UI

**Files:**
- Create: `src/app/conversations/page.tsx`
- Create: `src/app/conversations/[conversationId]/page.tsx`
- Create: `src/components/conversations/*`
- Create: `src/components/sidechat/*`

- [ ] Build conversation list and search.
- [ ] Build branch tree and branch switcher.
- [ ] Add create-branch action on every message.
- [ ] Add sidechat panel anchored to a selected message.
- [ ] Ensure sidechat messages never appear in main branch transcript.
- [ ] Add Playwright test for branch creation and sidechat isolation.

## Responsive Rules

- Desktop `>= 1280px`: full three-column workbench.
- Tablet `768px-1279px`: left nav remains, right context panel collapses into a drawer.
- Mobile `< 768px`: hide left nav, use bottom nav, center content full width, context panels open as full-screen sheets.
- Chat composer must remain reachable at the bottom of the viewport.
- Long answer text should keep readable line length and never span the full viewport on desktop.

## Accessibility And Interaction Rules

- Every icon-only button requires an accessible label and tooltip.
- Citation markers must be keyboard focusable.
- Source cards and memory cards must expose clear focus states.
- Loading states must preserve layout height where practical to prevent large jumps.
- Error states must explain what failed and provide retry where retry is possible.
- Destructive memory delete actions require confirmation.
- Branch and sidechat actions must announce the new active context.

## Test Plan

- Unit tests:
  - UI primitives render tokens and variants correctly.
  - Source picker disables answer button with no source selected.
  - Citation panel links markers to citation cards.
  - Media domain form shows validation errors.
  - Memory suggestion card supports edit, approve, delete.

- E2E tests:
  - Sign-in email success state.
  - Chat question -> source selection -> cited answer.
  - Source library -> author mode entry.
  - Author mode disclosure and cited response.
  - Memory approval and deletion.
  - Branch creation and sidechat isolation.

- Visual checks:
  - Desktop, tablet, and mobile screenshots for `/chat`, `/sources`, `/settings`, `/settings/memory`, and `/sign-in`.
  - Verify no text overlaps in navigation, source cards, memory cards, citation cards, or composer controls.
  - Verify the palette does not become a one-note red theme; red remains an accent.

## Acceptance Criteria

- Frontend matches the reference prototype's academic workbench feel while using Aurum Agent product names and flows.
- `/chat` implements source-first answering with visible source selection and citations.
- `/sources`, `/settings`, `/settings/media`, `/settings/memory`, `/author/[sourceId]`, and conversation management screens are reachable from navigation.
- Author mode is clearly labeled as AI simulation and displays citations.
- Memory UI makes user approval required before memory is active.
- Branch and sidechat UI make context boundaries visible.
- All primary flows have responsive layouts and automated tests.

