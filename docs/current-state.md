# Current State

This file summarizes the current product state for new Codex sessions and parallel agents. It should describe what is true now on `main`, not the full history of how the repo got here.

## Product State

- The site exposes three content collections: archive posts, projects, and resources.
- Each collection has a list page and a detail page.
- The `/about` page now includes a live message submission form.
- The editor at `/editor` is the single publishing entry for all three content types.
- The admin entry at `/admin` unlocks editor access and content-management actions.
- Theme switching is implemented globally and persisted with `myblog.theme.v1`.
- Route transitions are custom and use a shared shell instead of stock Next.js page swaps.

## Content Model and Publishing

- Content is file-based and stored as local MDX under:
  - `src/content/posts`
  - `src/content/projects`
  - `src/content/resources`
- Shared frontmatter fields are:
  - `title`
  - `slug`
  - `summary`
  - `description`
  - `date`
  - `category`
  - `tags`
  - `cover`
  - `featured`
  - `assetNames`
  - `assetPaths`
- Project-only frontmatter fields are:
  - `href`
  - `github`
  - `docs`
  - `year`
  - `stack`
  - `icon`
  - `accent`
- Resource-only frontmatter fields are:
  - `url`
  - `rating`
  - `monogram`
  - `accent`
- Private publishing semantics have been removed from the editor flow. New content is written as public content.
- Editor publishing is handled by `src/app/editor/api/posts/route.ts`, which writes files through the shared content helpers in `src/lib/content.ts`.
- Content deletion also flows through the editor API and removes the matching content file plus its uploads directory.
- Visitor messages are stored separately from MDX content under `src/content/messages`.
- Each message is persisted as one JSON file with:
  - `id`
  - `name`
  - `email`
  - `body`
  - `createdAt`
  - `readAt`

## Admin Access State

- Admin access is guarded by `ADMIN_ACCESS_CODE` and `ADMIN_SESSION_SECRET`.
- Successful admin login creates a signed session cookie and unlocks editor and destructive management actions.
- `/editor` redirects unauthenticated visitors to `/admin?next=...`.
- Archive, project, and resource management affordances are visible only while the request is in an admin session.
- Admin-only message APIs also require the same session state:
  - `GET /api/messages`
  - `POST /api/messages/[id]/read`
  - `DELETE /api/messages/[id]`

## Editor State

- The editor supports three categories: `archive`, `project`, and `resource`.
- The draft model contains shared fields plus category-specific metadata blocks:
  - `projectMeta`
  - `resourceMeta`
  - `archiveMeta`
- Category switches update the sidebar fields immediately.
- Category body templates only auto-replace content when the draft is still near empty.
- After publishing, the editor can build the correct public detail href for the selected category.
- The editor can load persisted content from `/editor?category=<...>&slug=<...>` and reopen it as an editable draft.
- Existing content can be deleted directly from the editor while preserving category-aware redirect behavior.
- The old hidden/private toggle is no longer part of the editor model.
- The editor header now includes a `查看留言` action that opens an embedded message-management panel without leaving the current draft route.
- The embedded message panel groups items into `未读` and `已读`, both sorted newest first.
- Opening an unread message detail automatically marks it as read through the message API while keeping the current selection stable.
- Message deletion reuses the shared centered confirmation dialog and removes the item from panel state immediately after success.

## About Message State

- `/about` submits visitor messages through `POST /api/messages`.
- The public form requires:
  - `name`
  - `email`
  - `body`
- Successful submission clears the form and shows confirmation feedback.
- Validation and network failures preserve user input and show inline error or failure feedback.
- Messages are not shown publicly, do not send email, and do not support replies or spam controls in the current version.

## Archive State

- `/archive` now uses real content instead of placeholder controls.
- Search and category filters sync to the URL with:
  - `q`
  - `category`
- Search matches post title, summary, tags, and category.
- Archive detail links preserve filter state so the post page can return to the filtered archive view.
- The search and category controls are custom floating panels triggered by icon buttons.
- In admin mode, archive list and detail views expose `编辑` and `删除` actions.

## Project and Resource State

- `/projects` and `/resources` are driven by real MDX content collections.
- In admin mode, project and resource list/detail views expose `编辑` and `删除` actions.
- Resource and archive topics are now first-class editor inputs instead of inferred-only labels.
- Project and resource link fields validate as absolute public `http` or `https` URLs before publish.

## Theme and Shell State

- Theme mode is `light` or `dark` and is stored in `localStorage` under `myblog.theme.v1`.
- The theme toggle is a fixed floating control rather than a scrolling top-bar action.
- The shell has custom route transition logic, including:
  - normalized pathname comparison for encoded and decoded slugs
  - minimum-height locking during route transitions
  - reduced waiting-state motion to prevent sidebar and content drift

## Known Constraints

- The repo still contains some mojibake Chinese text in older metadata, labels, and helper strings. Do not assume all Chinese copy is clean.
- `main` is the active baseline. Old Codex branches should not be used to infer the current state.
- `npm run build` may still show an existing Turbopack tracing warning related to content imports; this is known history and not necessarily caused by the current task.
- `.codex/` is local workspace state and should not be committed unless explicitly requested.

## Development Baseline

- Windows local development is the only supported day-to-day environment for this repo.
- Use Windows-installed `node` and `npm` from PowerShell or another Windows-native terminal.
- `main` should stay clean and reviewable between tasks. Do not use `main` as a scratch worktree.
- New implementation work starts from the latest committed `main`, usually in a fresh `codex/<topic>` branch or dedicated worktree.
- Before merge or handoff, rerun `npm test`, `npm run typecheck`, and `npm run build` from the Windows local workspace in that order.

## Branch Baseline

- Keep `main` as the only long-lived integration branch.
- Historical branches that are already merged into `main` can be deleted locally after verification.
- `codex/the-real-article` is the only known local branch that still contains unfinished feature work worth preserving for later review.
- `codex/data-real-content` and `codex/real-article` should not be used as future baselines for new work.
