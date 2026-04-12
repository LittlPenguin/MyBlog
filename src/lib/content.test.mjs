import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import test from "node:test";
import tsconfig from "../../tsconfig.json" with { type: "json" };
import {
  CONTENT_CATEGORY_DIRECTORY,
  buildContentFileSource,
  buildEditorWriteResult,
  collectEditorMediaReferences,
  createBaseContentFrontmatter,
  createContentFileBody,
  createEditorWritePayload,
  getEditorDraftLists,
  parseEditorDraftForEditing,
  getContentDirectoryForCategory,
  parseContentCollectionItem,
  resolvePublishDate,
  updateEditorContentFile,
  validateEditorWriteTarget,
  writeEditorDraftPublishedState,
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

test("getEditorDraftLists returns hidden or draft content sorted by mtime descending", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-drafts-"));
  const postsDir = path.join(tmpRoot, "posts");
  const resourcesDir = path.join(tmpRoot, "resources");
  await mkdir(postsDir, { recursive: true });
  await mkdir(resourcesDir, { recursive: true });

  await writeFile(
    path.join(postsDir, "calm-note.mdx"),
    `---
title: "Calm Note"
slug: "calm-note"
summary: "Quiet archive note"
date: "2026-04-10"
category: "褰掓。"
tags:
  - Notes
featured: false
draft: true
hidden: false
assetNames: []
---

# Calm Note
`,
    "utf8",
  );

  await new Promise((resolve) => setTimeout(resolve, 30));

  await writeFile(
    path.join(resourcesDir, "private-library.mdx"),
    `---
title: "Private Library"
slug: "private-library"
summary: "Saved resource"
date: "2026-04-11"
category: "璧勬簮"
tags:
  - Library
featured: false
draft: false
hidden: true
assetNames:
  - "notes.pdf"
url: "/resources/private-library"
rating: 4
accent: "primary"
monogram: "PL"
---

# Private Library
`,
    "utf8",
  );

  const drafts = await getEditorDraftLists(tmpRoot);

  assert.equal(drafts.length, 2);
  assert.equal(drafts[0]?.slug, "private-library");
  assert.equal(drafts[0]?.category, "resource");
  assert.equal(drafts[0]?.statusLabel, "hidden");
  assert.equal(drafts[1]?.slug, "calm-note");
  assert.equal(drafts[1]?.statusLabel, "draft");
  assert.match(drafts[0]?.updatedAt ?? "", /^20/);
});

test("parseEditorDraftForEditing converts persisted MDX into editor draft and source metadata", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-edit-source-"));
  const projectDir = path.join(tmpRoot, "projects");
  await mkdir(projectDir, { recursive: true });

  await writeFile(
    path.join(projectDir, "studio-notes.mdx"),
    `---
title: "Studio Notes"
slug: "studio-notes"
summary: "Build log"
description: "Build log"
date: "2026-04-12"
category: "椤圭洰"
tags:
  - Motion
  - UI
cover: "cover.webp"
featured: false
draft: true
hidden: true
assetNames:
  - "diagram.pdf"
year: "2026"
stack:
  - Motion
  - UI
icon: "grid"
accent: "primary"
---

# Studio Notes

Detailed body.
`,
    "utf8",
  );

  const result = await parseEditorDraftForEditing({
    rootDir: tmpRoot,
    category: "project",
    slug: "studio-notes",
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
        previewUrl: null,
      },
      assets: [
        {
          id: "diagram-pdf-0-file",
          name: "diagram.pdf",
          type: "",
          size: 0,
          previewUrl: null,
        },
      ],
    },
    source: {
      originalCategory: "project",
      originalSlug: "studio-notes",
    },
  });
});

test("collectEditorMediaReferences aggregates cover and assets across content", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-media-"));
  const postsDir = path.join(tmpRoot, "posts");
  const projectsDir = path.join(tmpRoot, "projects");
  await mkdir(postsDir, { recursive: true });
  await mkdir(projectsDir, { recursive: true });

  await writeFile(
    path.join(postsDir, "quiet-essay.mdx"),
    `---
title: "Quiet Essay"
slug: "quiet-essay"
summary: "Archive body"
date: "2026-04-09"
category: "褰掓。"
tags: ["Essay"]
cover: "quiet-cover.webp"
featured: false
draft: false
hidden: false
assetNames:
  - "archive-notes.pdf"
---

# Quiet Essay
`,
    "utf8",
  );

  await writeFile(
    path.join(projectsDir, "draft-project.mdx"),
    `---
title: "Draft Project"
slug: "draft-project"
summary: "Project body"
date: "2026-04-10"
category: "椤圭洰"
tags: ["Project"]
cover: "project-cover.png"
featured: false
draft: true
hidden: false
assetNames:
  - "prototype.fig"
year: "2026"
stack: ["Project"]
icon: "grid"
accent: "primary"
---

# Draft Project
`,
    "utf8",
  );

  const media = await collectEditorMediaReferences(tmpRoot);

  assert.equal(media.length, 4);
  assert.deepEqual(
    media.map((item) => ({
      name: item.name,
      role: item.role,
      category: item.category,
      sourceSlug: item.sourceSlug,
      isDraft: item.isDraft,
    })),
    [
      {
        name: "project-cover.png",
        role: "cover",
        category: "project",
        sourceSlug: "draft-project",
        isDraft: true,
      },
      {
        name: "prototype.fig",
        role: "asset",
        category: "project",
        sourceSlug: "draft-project",
        isDraft: true,
      },
      {
        name: "quiet-cover.webp",
        role: "cover",
        category: "archive",
        sourceSlug: "quiet-essay",
        isDraft: false,
      },
      {
        name: "archive-notes.pdf",
        role: "asset",
        category: "archive",
        sourceSlug: "quiet-essay",
        isDraft: false,
      },
    ],
  );
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
category: "褰掓。"
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
category: "褰掓。"
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
});

test("writeEditorDraftPublishedState flips draft and hidden flags to false", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-publish-draft-"));
  const projectDir = path.join(tmpRoot, "projects");
  await mkdir(projectDir, { recursive: true });

  const filePath = path.join(projectDir, "private-project.mdx");
  await writeFile(
    filePath,
    `---
title: "Private Project"
slug: "private-project"
summary: "Summary"
date: "2026-04-09"
category: "椤圭洰"
tags:
  - Internal
featured: false
draft: true
hidden: true
assetNames: []
year: "2026"
stack: ["Internal"]
icon: "grid"
accent: "primary"
---

# Private Project
`,
    "utf8",
  );

  const result = await writeEditorDraftPublishedState({
    rootDir: tmpRoot,
    category: "project",
    slug: "private-project",
  });

  assert.equal(result.ok, true);
  assert.equal(result.message, "草稿已发布为公开内容。");
  const persisted = await readFile(filePath, "utf8");
  assert.match(persisted, /draft: false/);
  assert.match(persisted, /hidden: false/);
});

test("writeEditorDraftPublishedState returns a clear message when the draft file is missing", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "myblog-publish-missing-"));
  await mkdir(path.join(tmpRoot, "posts"), { recursive: true });

  const result = await writeEditorDraftPublishedState({
    rootDir: tmpRoot,
    category: "archive",
    slug: "missing-entry",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "未找到目标草稿文件。",
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
