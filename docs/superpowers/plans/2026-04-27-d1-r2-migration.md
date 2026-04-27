# D1/R2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move online publishing, public content reads, uploaded assets, and visitor messages from GitHub/file writes to Cloudflare D1/R2.

**Architecture:** Add a narrow Cloudflare storage layer that adapts D1 rows and R2 objects to the existing content/editor/message types. Public routes prefer D1 on Cloudflare and fall back to bundled static content; local development continues to use file-backed content unless bindings are available.

**Tech Stack:** Next.js 16 App Router, OpenNext Cloudflare `getCloudflareContext`, Cloudflare D1, Cloudflare R2, Node test runner.

---

### Task 1: Storage Schema And Binding Access

**Files:**
- Create: `migrations/0001_d1_r2_content.sql`
- Create: `src/lib/cloudflare-bindings.ts`
- Create: `src/lib/cloudflare-content-store.ts`
- Test: `src/lib/cloudflare-content-store.test.mjs`
- Modify: `wrangler.jsonc`

- [x] Add D1 schema for `content_items` and `messages`.
- [x] Add typed binding lookup for `MYBLOG_DB` and `MYBLOG_ASSETS`.
- [x] Test D1 content row parsing, ordering, slug lookup, upsert, delete, and message mutations with a fake in-memory D1.

### Task 2: Public Content Reads

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/lib/posts.ts`
- Modify: `src/lib/projects.ts`
- Modify: `src/lib/resources.ts`
- Test: `src/lib/cloudflare-content-store.test.mjs`

- [x] Prefer Cloudflare D1 collection reads when `MYBLOG_DB` is bound.
- [x] Fall back to file/static registry when D1 is unavailable or empty.
- [x] Preserve current Markdown rendering and slug normalization behavior.

### Task 3: Editor Publish/Delete

**Files:**
- Modify: `src/app/editor/api/posts/route.ts`
- Modify: `src/app/editor/page.tsx`
- Test: `src/lib/cloudflare-content-store.test.mjs`

- [x] On Cloudflare, publish content directly to D1.
- [x] Store new uploaded cover/assets in R2 under `uploads/<collection>/<slug>/...`.
- [x] Preserve existing public asset paths.
- [x] Delete D1 content and matching R2 prefix for editor deletes.
- [x] Load existing editor drafts from D1 when editing online.

### Task 4: Asset Serving

**Files:**
- Create: `src/app/uploads/[...path]/route.ts`

- [x] Serve `/uploads/...` from R2 when bound.
- [x] Return `404` when the R2 object is missing.
- [x] Keep static public uploads working locally.

### Task 5: Messages

**Files:**
- Modify: `src/app/api/messages/route.ts`
- Modify: `src/app/api/messages/[id]/route.ts`
- Modify: `src/app/api/messages/[id]/read/route.ts`
- Test: `src/lib/cloudflare-content-store.test.mjs`

- [x] On Cloudflare, create/list/read/delete messages through D1.
- [x] Keep existing file-backed message behavior for local development.

### Task 6: Import And Docs

**Files:**
- Create: `scripts/export-content-for-d1.mjs`
- Modify: `README.md`
- Modify: `docs/current-state.md`
- Modify: `docs/architecture.md`

- [x] Add a script that emits SQL for current MDX content import.
- [x] Document Cloudflare D1/R2 creation, migration, import, and required bindings.

### Verification

- [x] `npm test`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run cf:build`
- [x] `npx wrangler deploy --dry-run`
