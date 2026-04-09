import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import test from "node:test";
import tsconfig from "../../tsconfig.json" with { type: "json" };
import {
  CONTENT_CATEGORY_DIRECTORY,
  buildContentFileSource,
  buildEditorWriteResult,
  createBaseContentFrontmatter,
  createContentFileBody,
  createEditorWritePayload,
  getContentDirectoryForCategory,
  parseContentCollectionItem,
  resolvePublishDate,
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

  assert.deepEqual(result, {
    ok: false,
    message: "slug 已存在，请更换后再发布。",
    errors: {
      slug: "当前 slug 已存在对应内容文件。",
    },
  });
});

test("buildEditorWriteResult returns path metadata for a successful write", () => {
  const result = buildEditorWriteResult({
    slug: "new-resource",
    category: "resource",
    outputPath: "src/content/resources/new-resource.mdx",
  });

  assert.deepEqual(result, {
    ok: true,
    message: "内容已写入资源目录。",
    slug: "new-resource",
    category: "resource",
    outputPath: "src/content/resources/new-resource.mdx",
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
