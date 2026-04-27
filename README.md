# MyBlog

MyBlog is a content-driven Next.js site with three public content surfaces, an admin-gated MDX publishing editor, custom animated route transitions, and a shared light/dark theme system.

## Main Surfaces

- `/archive`: grouped post archive with URL-synced search and category filters
- `/projects`: project listing and project detail pages
- `/resources`: resource listing and resource detail pages
- `/about`: profile page with a live message form that posts to the local message store
- `/posts/[slug]`, `/projects/[slug]`, `/resources/[slug]`: public detail routes
- `/editor`: content creation, editing, deletion, and embedded message management for archive posts, projects, and resources
- `/admin`: administrator access entry for editor and content-management actions

## Stack

- Next.js 16.2.3
- React 19
- Tailwind CSS 4
- Framer Motion
- MDX content files under `src/content`

## Local Development

Develop this repo from the Windows local workspace. Use Windows-installed Node.js and npm from PowerShell or another Windows-native terminal.

Recommended runtime:

```powershell
node -v
npm -v
```

Create local environment variables before starting the app:

```powershell
Copy-Item .env.example .env
```

Set:

- `ADMIN_ACCESS_CODE` to the administrator access code you want to use
- `ADMIN_SESSION_SECRET` to a long, high-entropy session secret

Message submissions from `/about` are stored as JSON files under `src/content/messages`. Runtime message files are ignored by Git and are managed only through the local admin flow in `/editor`.

Then start the app:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudflare Workers Deployment

Cloudflare deployments cannot write directly into the deployed Worker bundle. Public posts, projects, and resources are still bundled at build time through `src/content/generated/static-content-registry.*` as a fallback, but the online runtime uses Cloudflare D1 when this binding is configured:

- `MYBLOG_DB`: D1 database binding for posts, projects, resources, and visitor messages

Create and initialize the storage:

```powershell
npx wrangler d1 create myblog
npx wrangler d1 execute myblog --remote --file migrations/0001_d1_r2_content.sql
node scripts/export-content-for-d1.mjs | Out-File -FilePath .\d1-content-import.sql -Encoding utf8
npx wrangler d1 execute myblog --remote --file .\d1-content-import.sql
```

The current `wrangler.jsonc` is configured with the `myblog` D1 database id for this deployment. If you recreate the database later, replace the `database_id` with the new id returned by Wrangler.

Configure these Worker runtime secrets before using admin and editor flows:

- `ADMIN_ACCESS_CODE`
- `ADMIN_SESSION_SECRET`

When D1 is bound, online `/editor` publishing writes text content directly to D1. Newly published content is visible without a GitHub commit/rebuild cycle. Because R2 is not configured, new cover and attachment uploads are rejected on Cloudflare with a clear error; publish without new files for now. If D1 is not bound, public pages fall back to bundled static content and the legacy GitHub publishing path can still be used when its variables are configured.

Production builds use Webpack because the current OpenNext Cloudflare adapter does not reliably load Next 16 Turbopack server chunks in the Worker runtime.

Use this build command in Cloudflare:

```powershell
npm run cf:build
```

Visitor messages use D1 on Workers when `MYBLOG_DB` is bound. Local development continues to use JSON files under `src/content/messages`.

## Verification

```powershell
npm test
npm run typecheck
npm run build
```

Run these sequentially. `npm run typecheck` regenerates Next type metadata and is more reliable when it is not run in parallel with other commands.

## Working Tree Flow

- `main` is the only integration baseline.
- Create every new feature or fix branch from the latest `main`.
- Prefer a dedicated Git worktree per task instead of reusing a dirty main worktree.
- Keep unfinished work on its branch or worktree. Do not leave `main` dirty between tasks.
- Before merge review, return to `main`, inspect the diff, and rerun:
  - `npm test`
  - `npm run typecheck`
  - `npm run build`

Example worktree flow:

```powershell
git switch main
git pull --ff-only
git worktree add ..\MyBlog-feature -b codex\feature-name main
```

## Project Docs

- Current product and implementation status: `docs/current-state.md`
- Architecture and subsystem map: `docs/architecture.md`
- Agent/project entry instructions: `AGENTS.md`

## Working Baseline

Use `main` as the current development baseline. Older Codex feature branches are historical references only.
