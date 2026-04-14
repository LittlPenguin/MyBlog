import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import test from "node:test";
import tsconfig from "../../tsconfig.json" with { type: "json" };
import {
  CONTENT_CATEGORY_DIRECTORY,
  buildContentFileSource,
  buildEditorWriteResult,
  createBaseContentFrontmatter,
  createContentFileBody,
  createEditorWritePayload,
  createPersistedEditorDraft,
  getContentDirectoryForCategory,
  parseContentCollectionItem,
  resolvePublishDate,
  updateEditorContentFile,
  validateEditorWriteTarget,
} from "./content.ts";

test("getContentDirectoryForCategory resolves editor categories to content folders", () => {
  assert.equal(getContentDirectoryForCategory("archive"), "posts");
  assert.equal(getContentDirectoryForCategory("resource"), "resources");
  assert.equal(getContentDirectoryForCategory("project"), "projects");
});

test("createBaseContentFrontmatter maps editor draft into persisted metadata", () => {
  const frontmatter = createBaseContentFrontmatter(
    createEditorWritePayload({
      title: "Sunset Archive",
      slug: "sunset-archive",
      summary: "Quiet note",
      content: "# Hello",
      category: "archive",
      tags: ["quiet", "writing"],
      scheduleAt: "2026-04-10T08:30",
      isHidden: true,
      cover: {
        name: "cover.webp",
        type: "image/webp",
        size: 1024,
        previewUrl: "blob:cover",
      },
      assets: [
        {
          id: "file-1",
          name: "diagram.png",
          type: "image/png",
          size: 2048,
          previewUrl: "blob:diagram",
        },
      ],
    }),
  );

  assert.deepEqual(frontmatter, {
    title: "Sunset Archive",
    slug: "sunset-archive",
    summary: "Quiet note",
    description: "Quiet note",
    date: "2026-04-10",
    category: "归档",
    tags: ["quiet", "writing"],
    cover: "cover.webp",
    featured: false,
    draft: true,
    hidden: true,
    assetNames: ["diagram.png"],
    assetPaths: [],
  });
});

test("createBaseContentFrontmatter adds resource defaults needed by public resource pages", () => {
  const frontmatter = createBaseContentFrontmatter(
    createEditorWritePayload({
      title: "Resource Draft",
      slug: "resource-draft",
      summary: "Useful link",
      content: "# Resource Draft",
      category: "resource",
      tags: ["Reference", "UI"],
      scheduleAt: null,
      isHidden: false,
      cover: null,
      assets: [],
    }),
    () => "2026-04-09T12:00:00.000Z",
  );

  assert.deepEqual(frontmatter, {
    title: "Resource Draft",
    slug: "resource-draft",
    summary: "Useful link",
    description: "Useful link",
    date: "2026-04-09",
    category: "资源",
    tags: ["Reference", "UI"],
    cover: undefined,
    featured: false,
    draft: false,
    hidden: false,
    assetNames: [],
    assetPaths: [],
    url: "/resources/resource-draft",
    rating: 4,
    accent: "primary",
    monogram: "RD",
  });
});

test("createBaseContentFrontmatter adds project defaults needed by public project pages", () => {
  const frontmatter = createBaseContentFrontmatter(
    createEditorWritePayload({
      title: "Project Draft",
      slug: "project-draft",
      summary: "Build notes",
      content: "# Project Draft",
      category: "project",
      tags: ["Next.js", "MDX"],
      scheduleAt: null,
      isHidden: false,
      cover: null,
      assets: [],
    }),
    () => "2026-04-09T12:00:00.000Z",
  );

  assert.deepEqual(frontmatter, {
    title: "Project Draft",
    slug: "project-draft",
    summary: "Build notes",
    description: "Build notes",
    date: "2026-04-09",
    category: "项目",
    tags: ["Next.js", "MDX"],
    cover: undefined,
    featured: false,
    draft: false,
    hidden: false,
    assetNames: [],
    assetPaths: [],
    year: "2026",
    stack: ["Next.js", "MDX"],
    href: undefined,
    github: undefined,
    docs: undefined,
    icon: "grid",
    accent: "primary",
  });
});

test("createContentFileBody builds frontmatter plus markdown body", () => {
  const source = createContentFileBody({
    frontmatter: {
      title: "Demo",
      slug: "demo",
      summary: "Summary",
      date: "2026-04-09",
      category: "资源",
      tags: ["demo"],
      cover: undefined,
      featured: false,
      draft: false,
      hidden: false,
      assetNames: [],
    },
    content: "# Demo\n\nBody",
  });

  assert.match(source, /^---\n/);
  assert.match(source, /title: Demo/);
  assert.match(source, /\n# Demo\n\nBody\n$/);
});

test("validateEditorWriteTarget rejects duplicate slugs in the target directory", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-content-"));
  const postsDir = path.join(tmpRoot, "posts");
  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, "existing-note.mdx"), "# Existing", "utf8");

  const result = await validateEditorWriteTarget({
    rootDir: tmpRoot,
    category: "archive",
    slug: "existing-note",
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.deepEqual(result.errors, {
    slug: "当前 slug 已存在对应内容文件。",
  });
});

test("buildEditorWriteResult returns path metadata and persisted compose payload", () => {
  const payload = createEditorWritePayload({
    title: "New Resource",
    slug: "new-resource",
    summary: "Summary",
    content: "# New Resource",
    category: "resource",
    tags: ["Reference"],
    scheduleAt: null,
    isHidden: false,
    cover: null,
    assets: [],
  });

  const result = buildEditorWriteResult({
    payload,
    outputPath: "src/content/resources/new-resource.mdx",
    now: () => "2026-04-14T09:00:00.000Z",
  });

  assert.deepEqual(result, {
    ok: true,
    message: "内容已写入资源目录。",
    slug: "new-resource",
    category: "resource",
    outputPath: "src/content/resources/new-resource.mdx",
    draft: {
      ...payload,
      scheduleAt: "2026-04-14T00:00",
    },
    source: {
      originalCategory: "resource",
      originalSlug: "new-resource",
    },
  });
});

test("parseContentCollectionItem reads frontmatter and preserves body text", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-content-"));
  const sourceDir = path.join(tmpRoot, "resources");
  await mkdir(sourceDir, { recursive: true });
  const filePath = path.join(sourceDir, "quiet-library.mdx");
  await writeFile(
    filePath,
    `---
title: "Quiet Library"
slug: "quiet-library"
summary: "Collected references"
date: "2026-04-09"
category: "参考"
tags:
  - Reading
cover: "/visuals/card.svg"
featured: true
draft: false
---

# Quiet Library

Body copy.
`,
    "utf8",
  );

  const item = await parseContentCollectionItem(filePath);

  assert.equal(item.meta.slug, "quiet-library");
  assert.equal(item.meta.title, "Quiet Library");
  assert.equal(item.meta.summary, "Collected references");
  assert.equal(item.meta.cover, "/visuals/card.svg");
  assert.match(item.content, /# Quiet Library/);
});

test("createPersistedEditorDraft maps persisted file metadata back to compose state", () => {
  const result = createPersistedEditorDraft({
    category: "project",
    slug: "studio-notes",
    frontmatter: {
      title: "Studio Notes",
      slug: "studio-notes",
      summary: "Build log",
      description: "Build log",
      date: "2026-04-12",
      category: "项目",
      tags: ["Motion", "UI"],
      cover: "/uploads/projects/studio-notes/cover.webp",
      featured: false,
      draft: true,
      hidden: true,
      assetNames: ["diagram.pdf"],
      assetPaths: ["/uploads/projects/studio-notes/assets/diagram.pdf"],
      year: "2026",
      stack: ["Motion", "UI"],
      icon: "grid",
      accent: "primary",
    },
    content: "# Studio Notes\n\nDetailed body.\n",
  });

  assert.deepEqual(result, {
    draft: {
      title: "Studio Notes",
      slug: "studio-notes",
      summary: "Build log",
      content: "# Studio Notes\n\nDetailed body.\n",
      category: "project",
      tags: ["Motion", "UI"],
      scheduleAt: "2026-04-12T00:00",
      isHidden: true,
      cover: {
        name: "cover.webp",
        type: "",
        size: 0,
        previewUrl: "/uploads/projects/studio-notes/cover.webp",
        persistedPath: "/uploads/projects/studio-notes/cover.webp",
      },
      assets: [
        {
          id: "diagram-pdf-0-file",
          name: "diagram.pdf",
          type: "",
          size: 0,
          previewUrl: "/uploads/projects/studio-notes/assets/diagram.pdf",
          persistedPath: "/uploads/projects/studio-notes/assets/diagram.pdf",
        },
      ],
    },
    source: {
      originalCategory: "project",
      originalSlug: "studio-notes",
    },
  });
});

test("updateEditorContentFile overwrites the original file when source matches slug and category", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-update-"));
  const postsDir = path.join(tmpRoot, "posts");
  await mkdir(postsDir, { recursive: true });

  const filePath = path.join(postsDir, "draft-note.mdx");
  await writeFile(
    filePath,
    `---
title: "Draft Note"
slug: "draft-note"
summary: "Initial summary"
date: "2026-04-09"
category: "归档"
tags:
  - Notes
featured: false
draft: true
hidden: true
assetNames: []
---

# Draft Note

First version.
`,
    "utf8",
  );

  const before = await stat(filePath);

  await updateEditorContentFile({
    rootDir: tmpRoot,
    payload: createEditorWritePayload({
      title: "Draft Note Updated",
      slug: "draft-note",
      summary: "Updated summary",
      content: "# Draft Note Updated\n\nSecond version.",
      category: "archive",
      tags: ["Notes", "Update"],
      scheduleAt: null,
      isHidden: true,
      cover: null,
      assets: [],
      source: {
        originalCategory: "archive",
        originalSlug: "draft-note",
      },
    }),
    now: () => "2026-04-12T12:00:00.000Z",
  });

  const after = await stat(filePath);
  const persisted = await readFile(filePath, "utf8");

  assert.ok(after.mtimeMs >= before.mtimeMs);
  assert.match(persisted, /title: Draft Note Updated/);
  assert.match(persisted, /draft: true/);
  assert.match(persisted, /hidden: true/);
  assert.match(persisted, /Second version\./);
});

test("updateEditorContentFile migrates files when category or slug changes", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-move-"));
  const postsDir = path.join(tmpRoot, "posts");
  const resourcesDir = path.join(tmpRoot, "resources");
  await mkdir(postsDir, { recursive: true });
  await mkdir(resourcesDir, { recursive: true });

  await writeFile(
    path.join(postsDir, "draft-note.mdx"),
    `---
title: "Draft Note"
slug: "draft-note"
summary: "Initial summary"
date: "2026-04-09"
category: "归档"
tags:
  - Notes
featured: false
draft: true
hidden: true
assetNames: []
---

# Draft Note
`,
    "utf8",
  );

  const result = await updateEditorContentFile({
    rootDir: tmpRoot,
    payload: createEditorWritePayload({
      title: "Resource Draft",
      slug: "resource-draft",
      summary: "Moved summary",
      content: "# Resource Draft",
      category: "resource",
      tags: ["Library"],
      scheduleAt: null,
      isHidden: false,
      cover: null,
      assets: [],
      source: {
        originalCategory: "archive",
        originalSlug: "draft-note",
      },
    }),
    now: () => "2026-04-12T12:00:00.000Z",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  await assert.rejects(readFile(path.join(postsDir, "draft-note.mdx"), "utf8"));
  const moved = await readFile(path.join(resourcesDir, "resource-draft.mdx"), "utf8");
  assert.match(moved, /title: Resource Draft/);
  assert.match(moved, /category: 资源/);
  assert.match(moved, /draft: false/);
  assert.deepEqual(result.source, {
    originalCategory: "resource",
    originalSlug: "resource-draft",
  });
});

test("updateEditorContentFile persists cover and assets into public uploads and returns persisted draft paths", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-assets-"));

  const result = await updateEditorContentFile({
    rootDir,
    payload: createEditorWritePayload({
      title: "Asset Rich Resource",
      slug: "asset-rich-resource",
      summary: "Summary",
      content: "# Asset Rich Resource\n\nBody",
      category: "resource",
      tags: ["Assets"],
      scheduleAt: null,
      isHidden: false,
      cover: {
        name: "cover.webp",
        type: "image/webp",
        size: 4,
        previewUrl: "blob:cover",
        persistedPath: null,
      },
      assets: [
        {
          id: "asset-1",
          name: "diagram.png",
          type: "image/png",
          size: 4,
          previewUrl: "blob:diagram",
          persistedPath: null,
        },
        {
          id: "asset-2",
          name: "brief.pdf",
          type: "application/pdf",
          size: 4,
          previewUrl: null,
          persistedPath: null,
        },
      ],
    }),
    coverUpload: {
      name: "cover.webp",
      type: "image/webp",
      size: 4,
      buffer: new Uint8Array([1, 2, 3, 4]),
    },
    assetUploads: [
      {
        name: "diagram.png",
        type: "image/png",
        size: 4,
        buffer: new Uint8Array([5, 6, 7, 8]),
      },
      {
        name: "brief.pdf",
        type: "application/pdf",
        size: 4,
        buffer: new Uint8Array([9, 10, 11, 12]),
      },
    ],
    now: () => "2026-04-12T12:00:00.000Z",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  const persisted = await readFile(path.join(rootDir, "resources", "asset-rich-resource.mdx"), "utf8");
  assert.match(persisted, /cover: \/uploads\/resources\/asset-rich-resource\/cover\.webp/);
  assert.match(persisted, /assetNames:/);
  assert.match(persisted, /- diagram\.png/);
  assert.match(persisted, /assetPaths:/);
  assert.match(persisted, /- \/uploads\/resources\/asset-rich-resource\/assets\/diagram\.png/);
  assert.match(persisted, /- \/uploads\/resources\/asset-rich-resource\/assets\/brief\.pdf/);
  assert.equal(result.draft.cover?.persistedPath, "/uploads/resources/asset-rich-resource/cover.webp");
  assert.deepEqual(
    result.draft.assets.map((asset) => ({
      name: asset.name,
      persistedPath: asset.persistedPath,
    })),
    [
      {
        name: "diagram.png",
        persistedPath: "/uploads/resources/asset-rich-resource/assets/diagram.png",
      },
      {
        name: "brief.pdf",
        persistedPath: "/uploads/resources/asset-rich-resource/assets/brief.pdf",
      },
    ],
  );

  const coverFile = await readFile(
    path.join(process.cwd(), "public", "uploads", "resources", "asset-rich-resource", "cover.webp"),
  );
  const assetFile = await readFile(
    path.join(process.cwd(), "public", "uploads", "resources", "asset-rich-resource", "assets", "diagram.png"),
  );
  assert.equal(coverFile.length, 4);
  assert.equal(assetFile.length, 4);

  await fs.rm(path.join(process.cwd(), "public", "uploads", "resources", "asset-rich-resource"), {
    recursive: true,
    force: true,
  });
});

test("buildContentFileSource produces a serializable write payload", async () => {
  const payload = createEditorWritePayload({
    title: "Project Log",
    slug: "project-log",
    summary: "Progress notes",
    content: "# Project Log\n\nUpdate",
    category: "project",
    tags: ["devlog"],
    scheduleAt: null,
    isHidden: false,
    cover: null,
    assets: [],
  });

  const source = buildContentFileSource(payload);
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-content-"));
  const outputPath = path.join(tempRoot, "project-log.mdx");
  await writeFile(outputPath, source, "utf8");
  const persisted = await readFile(outputPath, "utf8");

  assert.match(persisted, /category: 项目/);
  assert.match(persisted, /draft: false/);
  assert.match(persisted, /# Project Log/);
});

test("resolvePublishDate falls back to today when schedule is absent", () => {
  assert.equal(resolvePublishDate(null, () => "2026-04-09T12:00:00.000Z"), "2026-04-09");
  assert.equal(resolvePublishDate("2026-04-11T09:30", () => "2026-04-09T12:00:00.000Z"), "2026-04-11");
});

test("content category directory map is stable", () => {
  assert.deepEqual(CONTENT_CATEGORY_DIRECTORY, {
    archive: "posts",
    project: "projects",
    resource: "resources",
  });
});

test("tsconfig keeps the generated Next type directories included", () => {
  assert.equal(tsconfig.include.includes(".next/types/**/*.ts"), true);
  assert.equal(tsconfig.include.includes(".next/dev/types/**/*.ts"), true);
});
