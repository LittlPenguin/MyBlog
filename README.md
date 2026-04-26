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

Cloudflare deployments are read-only for this repo's file-backed publishing model. Public posts, projects, and resources are bundled at build time through `src/content/generated/static-content-registry.*`, so update MDX locally, commit, and redeploy.

Production builds use Webpack because the current OpenNext Cloudflare adapter does not reliably load Next 16 Turbopack server chunks in the Worker runtime.

Use this build command in Cloudflare:

```powershell
npm run cf:build
```

Online `/editor` publishing, deletion, and message persistence require moving storage to D1/R2 or another durable service. On Workers, those write APIs return `501` instead of attempting to write into the deployed bundle.

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
