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

Cloudflare deployments cannot write directly into the deployed Worker bundle. Public posts, projects, and resources are bundled at build time through `src/content/generated/static-content-registry.*`.

Online `/editor` publishing on Cloudflare writes content back to the GitHub repository, then Cloudflare's Git integration rebuilds the Worker from `main`. Configure these Worker runtime variables/secrets before using online publishing:

- `ADMIN_ACCESS_CODE`
- `ADMIN_SESSION_SECRET`
- `MYBLOG_GITHUB_REPOSITORY`, for example `LittlPenguin/MyBlog`
- `MYBLOG_GITHUB_BRANCH`, usually `main`
- `MYBLOG_GITHUB_TOKEN`, as a secret with repository Contents read/write permission

If `MYBLOG_GITHUB_TOKEN` is missing, online publishing and deletion return a configuration error instead of trying to write files locally.

Production builds use Webpack because the current OpenNext Cloudflare adapter does not reliably load Next 16 Turbopack server chunks in the Worker runtime.

Use this build command in Cloudflare:

```powershell
npm run cf:build
```

Message persistence still requires moving storage to D1/R2 or another durable service. On Workers, message write/manage APIs return `501` instead of attempting to write into the deployed bundle.

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
