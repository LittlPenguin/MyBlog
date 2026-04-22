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

## Project Docs

- Current product and implementation status: `docs/current-state.md`
- Architecture and subsystem map: `docs/architecture.md`
- Agent/project entry instructions: `AGENTS.md`

## Working Baseline

Use `main` as the current development baseline. Older Codex feature branches are historical references only.
