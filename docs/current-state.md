# Current State

This file summarizes the current product state for new Codex sessions and parallel agents. It should describe what is true now on `main`, not the full history of how the repo got here.

## Product State

- The site exposes three content collections: archive posts, projects, and resources.
- Each collection has a list page and a detail page.
- The editor at `/editor` is the single publishing entry for all three content types.
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

## Editor State

- The editor supports three categories: `archive`, `project`, and `resource`.
- The draft model contains shared fields plus category-specific metadata blocks:
  - `projectMeta`
  - `resourceMeta`
  - `archiveMeta`
- Category switches update the sidebar fields immediately.
- Category body templates only auto-replace content when the draft is still near empty.
- After publishing, the editor can build the correct public detail href for the selected category.
- The old hidden/private toggle is no longer part of the editor model.

## Archive State

- `/archive` now uses real content instead of placeholder controls.
- Search and category filters sync to the URL with:
  - `q`
  - `category`
- Search matches post title, summary, tags, and category.
- Archive detail links preserve filter state so the post page can return to the filtered archive view.
- The search and category controls are custom floating panels triggered by icon buttons.

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

- WSL is the only supported day-to-day development environment for this repo.
- Use WSL-managed `node` and `npm` via `nvm`; do not rely on Windows PATH shims inside WSL sessions.
- `main` should stay clean and reviewable between tasks. Do not use `main` as a scratch worktree.
- New implementation work starts from the latest committed `main`, usually in a fresh `codex/<topic>` branch or dedicated worktree.
- Before merge or handoff, rerun `npm test`, `npm run typecheck`, and `npm run build` from WSL in that order.

## Branch Baseline

- Keep `main` as the only long-lived integration branch.
- Historical branches that are already merged into `main` can be deleted locally after verification.
- `codex/the-real-article` is the only known local branch that still contains unfinished feature work worth preserving for later review.
- `codex/data-real-content` and `codex/real-article` should not be used as future baselines for new work.
