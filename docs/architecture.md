# Architecture

This document maps the main subsystems that new agents need before changing behavior on `main`.

## Content Source

- The site is file-based. Content is stored under `src/content`.
- Collections are split by surface:
  - `posts`
  - `projects`
  - `resources`
- Shared content read and write helpers live in `src/lib/content.ts`.
- Collection-specific readers live in:
  - `src/lib/posts.ts`
  - `src/lib/projects.ts`
  - `src/lib/resources.ts`
- Slug lookup and normalization are centralized in `src/lib/content-slug.ts` and related helpers, which support non-ASCII slugs.

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
- Category-specific fields are written into frontmatter only for the relevant collection.

## Public Routes

- Archive posts resolve to `/posts/[slug]`
- Projects resolve to `/projects/[slug]`
- Resources resolve to `/resources/[slug]`
- The editor uses category-aware detail href generation so post-publish navigation lands on the correct detail page.

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
