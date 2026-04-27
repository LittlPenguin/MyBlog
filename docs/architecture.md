# Architecture

This document maps the main subsystems that new agents need before changing behavior on `main`.

## Content Source

- The site is file-based. Content is stored under `src/content`.
- Collections are split by surface:
  - `posts`
  - `projects`
  - `resources`
- Shared content read and write helpers live in `src/lib/content.ts`.
- `scripts/generate-static-content-registry.mjs` generates `src/content/generated/static-content-registry.*` before production and Cloudflare builds. Public readers fall back to this registry when runtime filesystem access is unavailable.
- Collection-specific readers live in:
  - `src/lib/posts.ts`
  - `src/lib/projects.ts`
  - `src/lib/resources.ts`
- Slug lookup and normalization are centralized in `src/lib/content-slug.ts` and related helpers, which support non-ASCII slugs.

## Admin Access Flow

- The admin entry UI lives at `/admin`.
- Session creation and teardown are handled by `src/app/admin/api/session/route.ts`.
- Server-side session validation is handled by `src/lib/admin-auth-server.ts`.
- Token signing, access-code validation, and next-path sanitization live in `src/lib/admin-auth.ts`.
- Editor writes and deletes now require an active admin session.
- On Cloudflare Workers, deployed bundles remain read-only. Editor writes and deletes use Cloudflare D1 when `MYBLOG_DB` is bound. R2 support is optional in code, but this deployment currently runs without an R2 bucket, so new uploaded covers/assets are rejected online instead of being silently dropped. The older GitHub commit publishing path remains only as a fallback when D1 is unavailable.

## Editor Publishing Flow

- The UI entry is `/editor`.
- The editor draft model is defined through shared editor utilities in `src/lib/editor-shared.ts` and `src/lib/editor.ts`.
- The publish endpoint is `src/app/editor/api/posts/route.ts`.
- Publish flow:
  1. UI builds an `EditorSubmitPayload`
  2. Server validates and normalizes the draft
  3. Shared content helpers generate frontmatter and MDX output
  4. Files are written into the correct collection directory
  5. Uploaded assets are copied into `public/uploads/<collection>/<slug>`
  6. Related routes are revalidated
- Delete flow:
  1. UI sends the original content source to `DELETE /editor/api/posts`
  2. Shared content helpers resolve the current file path by slug
  3. The content file and its matching uploads directory are removed
  4. Related routes are revalidated and the client redirects to the collection page
- Category-specific fields are written into frontmatter only for the relevant collection.
- Existing content can be reloaded into the editor from category + slug query parameters.
- Cloudflare deployments can read bundled existing content for public routes as a fallback. When D1 is bound, public content readers prefer D1 rows over bundled static content. Editor text changes and visitor messages are persisted directly into D1 on Workers.

## Public Routes

- Archive posts resolve to `/posts/[slug]`
- Projects resolve to `/projects/[slug]`
- Resources resolve to `/resources/[slug]`
- The editor uses category-aware detail href generation so post-publish navigation lands on the correct detail page.
- Admin-only edit and delete affordances are injected into archive, project, and resource list/detail surfaces after server-side session checks.

## Shared Shell and Navigation

- The layout shell is centered around `src/components/site/frame.tsx`.
- The shell owns:
  - left navigation
  - route progress meter
  - route transition overlays
  - transition-stage height locking
  - the fixed theme toggle
- Links use `src/components/site/route-link.tsx` instead of raw `next/link` for animated transitions and path normalization.
- Encoded and decoded pathnames are normalized through `src/lib/route-path.ts` so Chinese slugs do not break transition state comparisons.

## Transition Model

- Transition state is coordinated through the site transition context and stage helpers.
- During route changes, the shell can hold a snapshot of the outgoing stage.
- `src/lib/transition-stage.ts` provides:
  - minimum-height locking for the stage during loading windows
  - waiting-state motion values that keep content stable while the next route is still loading
- This is important for avoiding sidebar and main-content drift during fast scrolls mid-transition.

## Theme System

- Theme state is handled by `src/lib/theme.ts`.
- The document root uses `data-theme="light"` or `data-theme="dark"`.
- Theme selection is initialized early and persisted in local storage.
- The UI control is `src/components/site/theme-toggle.tsx`.
- Shared visual tokens and theme-specific styling live in `src/app/globals.css`.

## Archive Filters

- Archive filter helpers live in `src/lib/posts-shared.ts`.
- `/archive` reads URL state on the server and hydrates a client filtering shell.
- Filters are represented by:
  - `q`
  - `category`
- Post detail routes can carry the same query state so "back to archive" preserves context.

## High-Conflict Files

These files affect multiple surfaces and should be treated as shared ownership areas:

- `src/app/globals.css`
- `src/components/site/frame.tsx`
- `src/components/site/route-link.tsx`
- `src/lib/content.ts`
- `src/lib/theme.ts`
- `src/lib/transition-stage.ts`

If a task touches one of these files, check whether another agent is already modifying the same subsystem before editing.

## Branch and Review Workflow

- `main` is the only integration branch and the only source of truth for current behavior.
- New work should branch from the latest committed `main`, preferably in a separate Git worktree.
- The main worktree in this conversation is the review and integration workspace:
  - stabilize the baseline
  - inspect branch diffs
  - run verification
  - merge approved work
- Feature worktrees should own one subsystem at a time and avoid concurrent edits in the high-conflict files above.
- Merge review priority is:
  - behavior regressions or broken routes
  - conflicts with shared shell, theme, content, or transition architecture
  - missing tests for changed behavior
  - docs drifting from implementation
