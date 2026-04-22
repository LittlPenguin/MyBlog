# MyBlog

MyBlog is a content-driven Next.js site with three public content surfaces, a local MDX publishing editor, custom animated route transitions, and a shared light/dark theme system.

## Main Surfaces

- `/archive`: grouped post archive with URL-synced search and category filters
- `/projects`: project listing and project detail pages
- `/resources`: resource listing and resource detail pages
- `/posts/[slug]`, `/projects/[slug]`, `/resources/[slug]`: public detail routes
- `/editor`: local publishing workflow for archive posts, projects, and resources

## Stack

- Next.js 16.2.1
- React 19
- Tailwind CSS 4
- Framer Motion
- MDX content files under `src/content`

## Local Development

Develop this repo from WSL. Do not use Windows-native Node.js, npm, or terminal sessions for this project.

Recommended runtime:

```bash
nvm install 24.15.0
nvm alias default 24.15.0
nvm use 24.15.0
```

Confirm the shell resolves WSL tools before starting work:

```bash
which node
which npm
node -v
npm -v
```

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
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

```bash
git switch main
git pull --ff-only
git worktree add ../MyBlog-feature -b codex/feature-name main
```

## Project Docs

- Current product and implementation status: `docs/current-state.md`
- Architecture and subsystem map: `docs/architecture.md`
- Agent/project entry instructions: `AGENTS.md`

## Working Baseline

Use `main` as the current development baseline. Older Codex feature branches are historical references only.
