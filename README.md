# MyBlog

A personal blog built with Next.js 16, MDX content, and Cloudflare Workers.

**Live site:** [smartxb.fun](https://smartxb.fun)

## Features

- Three content collections: archive posts, projects, and resources
- MDX-based content with frontmatter metadata
- Admin-gated editor for publishing and managing all content types
- Visitor message board on the About page
- Custom animated route transitions with Framer Motion
- Light/dark theme with persistent toggle
- URL-synced search and category filters on the archive page
- Cloudflare D1 for online content persistence (no rebuild needed for new posts)
- Static content registry fallback for builds without filesystem access

## Pages

| Route | Description |
|---|---|
| `/` | Home board |
| `/archive` | Post archive with search and category filters |
| `/posts/[slug]` | Individual post |
| `/projects` | Project listing |
| `/projects/[slug]` | Project detail |
| `/resources` | Resource listing |
| `/resources/[slug]` | Resource detail |
| `/about` | Profile page with message submission form |
| `/admin` | Admin login |
| `/editor` | Content editor (archive / project / resource) |

## Stack

- **Framework:** Next.js 16.2.3 (App Router, React 19, React Compiler)
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **Content:** MDX via `@next/mdx` + `next-mdx-remote`
- **Deployment:** Cloudflare Workers via `@opennextjs/cloudflare`
- **Database:** Cloudflare D1 (optional, for online writes)

## Local Development

Requires Windows with Node.js and npm installed.

```powershell
# Install dependencies
npm install

# Create environment file
Copy-Item .env.example .env
```

Set the required variables in `.env`:

```env
ADMIN_ACCESS_CODE=<your access code>
ADMIN_SESSION_SECRET=<a long random string>
```

Start the dev server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```powershell
npm run dev          # Dev server
npm test             # Run tests (Node test runner)
npm run typecheck    # TypeScript check (run sequentially, not in parallel)
npm run build        # Production build
npm run lint         # ESLint
npm run cf:build     # Cloudflare build
npm run cf:deploy    # Cloudflare build + deploy
```

Run a single test:

```powershell
node --experimental-specifier-resolution=node --test --experimental-strip-types src/lib/content.test.mjs
```

## Cloudflare Workers Deployment

The site deploys to Cloudflare Workers. Public content is bundled into a static registry at build time so the Worker can serve pages without filesystem access. When a D1 database binding is configured, the editor can publish content directly to D1 without a rebuild cycle.

### Setup

```powershell
# Create D1 database
npx wrangler d1 create myblog

# Apply schema
npx wrangler d1 execute myblog --remote --file migrations/0001_d1_r2_content.sql

# Export existing content to D1
node scripts/export-content-for-d1.mjs | Out-File -FilePath .\d1-content-import.sql -Encoding utf8
npx wrangler d1 execute myblog --remote --file .\d1-content-import.sql
```

Configure Worker secrets:

```powershell
npx wrangler secret put ADMIN_ACCESS_CODE
npx wrangler secret put ADMIN_SESSION_SECRET
```

Build and deploy:

```powershell
npm run cf:deploy
```

The `wrangler.jsonc` contains the D1 database binding (`MYBLOG_DB`). Replace the `database_id` if you recreate the database.

### Notes

- Production builds use Webpack (`--webpack`) because the OpenNext adapter does not reliably load Next 16 Turbopack server chunks in the Worker runtime.
- R2 is not currently configured. New file uploads (covers, attachments) are rejected on Cloudflare; publish text-only content for now.
- Visitor messages are stored in D1 when the binding is available; locally they are JSON files under `src/content/messages`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_ACCESS_CODE` | Yes | Admin login code |
| `ADMIN_SESSION_SECRET` | Yes | Session signing secret |
| `MYBLOG_DB` | CF only | D1 database binding (set in `wrangler.jsonc`) |
| `MYBLOG_GITHUB_REPOSITORY` | No | Legacy GitHub publishing target |
| `MYBLOG_GITHUB_TOKEN` | No | Legacy GitHub publishing token |

## Project Docs

- [Current state](docs/current-state.md) — product state and recent decisions
- [Architecture](docs/architecture.md) — subsystem map and data flow
