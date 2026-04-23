import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import * as editorLib from "./editor.ts";
import {
  applyEditorCategoryChange,
  applyEditorTitleChange,
  buildEditorDetailHref,
  createEmptyEditorDraft,
  deriveEditorDraftFromMarkdown,
  formatEditorFileSize,
  isImageEditorFile,
  isEditorDraftNearEmpty,
  normalizeSlug,
  normalizeTags,
  prepareEditorSubmitPayload,
  resolveEditorAssetKind,
  validateEditorDraft,
} from "./editor.ts";

test("normalizeSlug strips punctuation and collapses spacing", () => {
  assert.equal(normalizeSlug("  Hello, Sunset Glass!  "), "hello-sunset-glass");
  assert.equal(normalizeSlug("中文 标题 2026"), "中文-标题-2026");
});

test("normalizeTags strips hashes and removes duplicate tags case-insensitively", () => {
  assert.deepEqual(normalizeTags([" #React ", "react", "Design", "#design", "", "  "]), [
    "React",
    "Design",
  ]);
});

test("createEmptyEditorDraft applies provided compose defaults", () => {
  assert.deepEqual(
    createEmptyEditorDraft({
      category: "project",
    }),
    {
      title: "",
      slug: "",
      summary: "",
      content: "",
      category: "project",
      tags: [],
      scheduleAt: null,
      featured: false,
      projectMeta: {
        href: "",
        github: "",
        docs: "",
        year: "",
        stack: [],
        icon: "grid",
        accent: "primary",
      },
      resourceMeta: {
        url: "",
        rating: 4,
        monogram: "",
        accent: "primary",
        topic: "",
      },
      archiveMeta: {
        topic: "",
      },
      cover: null,
      assets: [],
    },
  );
});

test("validateEditorDraft returns the required error keys for an empty draft", () => {
  const errors = validateEditorDraft(createEmptyEditorDraft());

  assert.deepEqual(Object.keys(errors).sort(), ["archiveTopic", "content", "slug", "summary", "title"]);
  assert.equal(typeof errors.title, "string");
  assert.equal(typeof errors.slug, "string");
  assert.equal(typeof errors.summary, "string");
  assert.equal(typeof errors.content, "string");
});

test("prepareEditorSubmitPayload trims fields and normalizes metadata", () => {
  const payload = prepareEditorSubmitPayload({
    title: "  Sunset Note  ",
    slug: "  Sunset Note / 01 ",
    summary: "  calm and bright  ",
    content: "Line 1\r\nLine 2\r\n",
    category: "resource",
    tags: [" #React ", "react", "UI "],
    scheduleAt: "",
    projectMeta: {
      href: " https://example.com/project ",
      github: " https://github.com/example/repo ",
      docs: " ",
      year: " 2026 ",
      stack: [" React  ", "react", " Motion "],
      icon: "spark",
      accent: "secondary",
    },
    resourceMeta: {
      url: " https://example.com/resource ",
      rating: 5,
      monogram: " fm ",
      accent: "tertiary",
    },
    archiveMeta: {},
    cover: {
      name: "cover.webp",
      type: "image/webp",
      size: 1024,
      previewUrl: "blob:cover",
      persistedPath: null,
    },
    assets: [
      {
        id: "asset-1",
        name: "Diagram.png",
        type: "image/png",
        size: 512,
        previewUrl: "blob:asset-1",
        persistedPath: null,
      },
    ],
  });

  assert.deepEqual(payload, {
    title: "Sunset Note",
    slug: "sunset-note-01",
    summary: "calm and bright",
    content: "Line 1\nLine 2\n",
    category: "resource",
    tags: ["React", "UI"],
    scheduleAt: null,
    featured: false,
    projectMeta: {
      href: "https://example.com/project",
      github: "https://github.com/example/repo",
      docs: "",
      year: "2026",
      stack: ["React", "Motion"],
      icon: "spark",
      accent: "secondary",
    },
    resourceMeta: {
      url: "https://example.com/resource",
      rating: 5,
      monogram: "FM",
      accent: "tertiary",
      topic: "",
    },
    archiveMeta: {
      topic: "",
    },
    cover: {
      name: "cover.webp",
      type: "image/webp",
      size: 1024,
      previewUrl: "blob:cover",
      persistedPath: null,
    },
    assets: [
      {
        id: "asset-1",
        name: "Diagram.png",
        type: "image/png",
        size: 512,
        previewUrl: "blob:asset-1",
        persistedPath: null,
      },
    ],
  });
});

test("validateEditorDraft rejects invalid schedule values", () => {
  const errors = validateEditorDraft({
    title: "Scheduled",
    slug: "scheduled",
    summary: "Summary",
    content: "Body",
    category: "archive",
    tags: [],
    scheduleAt: "not-a-date",
    featured: false,
    projectMeta: {
      href: "",
      github: "",
      docs: "",
      year: "",
      stack: [],
      icon: "grid",
      accent: "primary",
    },
    resourceMeta: {
      url: "",
      rating: 4,
      monogram: "",
      accent: "primary",
      topic: "",
    },
    archiveMeta: {
      topic: "",
    },
    cover: null,
    assets: [],
  });

  assert.deepEqual(Object.keys(errors).sort(), ["archiveTopic", "scheduleAt"]);
  assert.equal(typeof errors.scheduleAt, "string");
});

test("deriveEditorDraftFromMarkdown uses frontmatter when enabled", () => {
  const result = deriveEditorDraftFromMarkdown(`---
title: Imported Post
summary: Imported summary
tags:
  - React
  - Motion
category: project
slug: imported-post
href: https://example.com/project
github: https://github.com/example/repo
docs: https://example.com/project/docs
year: "2025"
stack:
  - React
  - Motion
icon: spark
accent: secondary
---

# Ignore this heading

Body line 1.
`);

  assert.deepEqual(result, {
    title: "Imported Post",
    slug: "imported-post",
    summary: "Imported summary",
    content: "# Ignore this heading\n\nBody line 1.\n",
    category: "project",
    tags: ["React", "Motion"],
    scheduleAt: null,
    featured: false,
    projectMeta: {
      href: "https://example.com/project",
      github: "https://github.com/example/repo",
      docs: "https://example.com/project/docs",
      year: "2025",
      stack: ["React", "Motion"],
      icon: "spark",
      accent: "secondary",
    },
      resourceMeta: {
        url: "",
        rating: 4,
        monogram: "",
        accent: "primary",
        topic: "",
      },
    archiveMeta: {
      topic: "",
    },
    cover: null,
    assets: [],
  });
});

test("deriveEditorDraftFromMarkdown can ignore frontmatter publishing metadata", () => {
  const result = deriveEditorDraftFromMarkdown(
    `---
title: Imported Post
summary: Imported summary
tags:
  - React
  - Motion
category: project
slug: imported-post
---

# Visible Heading

Body line 1.
`,
    { preferFrontmatter: false },
  );

  assert.deepEqual(result, {
    title: "Imported Post",
    slug: "imported-post",
    summary: "Imported summary",
    content: "# Visible Heading\n\nBody line 1.\n",
    category: "archive",
    tags: [],
    scheduleAt: null,
    featured: false,
    projectMeta: {
      href: "",
      github: "",
      docs: "",
      year: "",
      stack: [],
      icon: "grid",
      accent: "primary",
    },
    resourceMeta: {
      url: "",
      rating: 4,
      monogram: "",
      accent: "primary",
      topic: "",
    },
    archiveMeta: {
      topic: "",
    },
    cover: null,
    assets: [],
  });
});

test("deriveEditorDraftFromMarkdown falls back to first heading and inferred summary", () => {
  const result = deriveEditorDraftFromMarkdown(`# Gentle Motion

This paragraph becomes the summary.

- one
- two
`);

  assert.equal(result.title, "Gentle Motion");
  assert.equal(result.slug, "gentle-motion");
  assert.equal(result.summary, "This paragraph becomes the summary.");
  assert.equal(result.category, "archive");
  assert.deepEqual(result.tags, []);
});

test("formatEditorFileSize creates readable labels", () => {
  assert.equal(formatEditorFileSize(512), "512 B");
  assert.equal(formatEditorFileSize(2048), "2.0 KB");
  assert.equal(formatEditorFileSize(5 * 1024 * 1024), "5.0 MB");
});

test("isImageEditorFile accepts mime and filename-based image inputs", () => {
  assert.equal(
    isImageEditorFile({
      name: "cover.webp",
      type: "image/webp",
    }),
    true,
  );

  assert.equal(
    isImageEditorFile({
      name: "gallery-shot.PNG",
      type: "",
    }),
    true,
  );

  assert.equal(
    isImageEditorFile({
      name: "notes.pdf",
      type: "application/pdf",
    }),
    false,
  );
});

test("resolveEditorAssetKind distinguishes image and file categories", () => {
  assert.equal(
    resolveEditorAssetKind({
      name: "cover.avif",
      type: "image/avif",
    }),
    "image",
  );

  assert.equal(
    resolveEditorAssetKind({
      name: "spec.pdf",
      type: "application/pdf",
    }),
    "pdf",
  );

  assert.equal(
    resolveEditorAssetKind({
      name: "playground.ts",
      type: "text/typescript",
    }),
    "code",
  );

  assert.equal(
    resolveEditorAssetKind({
      name: "archive.zip",
      type: "application/zip",
    }),
    "archive",
  );

  assert.equal(
    resolveEditorAssetKind({
      name: "soundtrack.mp3",
      type: "audio/mpeg",
    }),
    "audio",
  );

  assert.equal(
    resolveEditorAssetKind({
      name: "misc.bin",
      type: "application/octet-stream",
    }),
    "file",
  );
});

test("applyEditorTitleChange syncs slug only while auto-sync is enabled and untouched", () => {
  const initialDraft = {
    ...createEmptyEditorDraft(),
    slug: "",
  };

  assert.deepEqual(
    applyEditorTitleChange({
      draft: initialDraft,
      nextTitle: "Sunset Motion Study",
      autoSyncSlug: true,
      isSlugTouched: false,
    }),
    {
      draft: {
        ...initialDraft,
        title: "Sunset Motion Study",
        slug: "sunset-motion-study",
      },
      isSlugTouched: false,
    },
  );

  assert.deepEqual(
    applyEditorTitleChange({
      draft: {
        ...initialDraft,
        slug: "custom-slug",
      },
      nextTitle: "Sunset Motion Study",
      autoSyncSlug: true,
      isSlugTouched: true,
    }),
    {
      draft: {
        ...initialDraft,
        title: "Sunset Motion Study",
        slug: "custom-slug",
      },
      isSlugTouched: true,
    },
  );
});

test("isEditorDraftNearEmpty identifies whether category switching may replace the template", () => {
  assert.equal(
    isEditorDraftNearEmpty({
      ...createEmptyEditorDraft(),
      content: "",
    }),
    true,
  );

  assert.equal(
    isEditorDraftNearEmpty({
      ...createEmptyEditorDraft(),
      title: "Working Draft",
      content: "# Working Draft\n\nReal content lives here.",
    }),
    false,
  );
});

test("applyEditorCategoryChange updates category template only when the draft is still near empty", () => {
  const emptyResult = applyEditorCategoryChange({
    draft: {
      ...createEmptyEditorDraft(),
      content: "",
    },
    nextCategory: "project",
  });

  assert.equal(emptyResult.category, "project");
  assert.match(emptyResult.content, /Website:/);
  assert.equal(emptyResult.projectMeta.year.length > 0, true);

  const filledResult = applyEditorCategoryChange({
    draft: {
      ...createEmptyEditorDraft(),
      title: "Already Writing",
      content: "# Custom body\n\nKeep me.",
      category: "archive",
    },
    nextCategory: "resource",
  });

  assert.equal(filledResult.category, "resource");
  assert.equal(filledResult.content, "# Custom body\n\nKeep me.");
  assert.equal(filledResult.resourceMeta.rating, 4);
});

test("buildEditorDetailHref maps editor categories to public detail routes", () => {
  assert.equal(buildEditorDetailHref("archive", "Hello World"), "/posts/hello-world");
  assert.equal(buildEditorDetailHref("project", "测试项目"), "/projects/测试项目");
  assert.equal(buildEditorDetailHref("resource", "UI Kit / 2026"), "/resources/ui-kit-2026");
});

test("editor surface copy does not contain known mojibake fragments", () => {
  const editorFiles = [
    join(process.cwd(), "src/app/editor/editor-client.tsx"),
    join(process.cwd(), "src/app/editor/editor-sections.tsx"),
    join(process.cwd(), "src/app/editor/editor-helpers.tsx"),
  ];

  const mojibakeTokens = ["鏂", "鍙", "褰", "璧", "瀵", "棰", "椤", "闊", "瑙", "缂", "灏", "鍑", "鍔"];

  for (const filePath of editorFiles) {
    const source = readFileSync(filePath, "utf8");
    for (const token of mojibakeTokens) {
      assert.equal(
        source.includes(token),
        false,
        `expected ${filePath} to not contain mojibake token ${token}`,
      );
    }
  }
});

test("editor library exposes editor deep-link loading helper", () => {
  assert.equal(typeof editorLib.buildEditorLoadHref, "function");
  assert.equal(editorLib.buildEditorLoadHref("archive", "Hello World"), "/editor?category=archive&slug=hello-world");
});

test("prepareEditorSubmitPayload preserves featured state and collection topics", () => {
  const payload = prepareEditorSubmitPayload({
    ...createEmptyEditorDraft({
      category: "resource",
    }),
    title: "Useful Resource",
    slug: "Useful Resource",
    summary: "Collected notes",
    content: "Body",
    featured: true,
    archiveMeta: {
      topic: "Archive Topic",
    },
    resourceMeta: {
      url: " https://example.com/reference ",
      rating: 5,
      monogram: " rs ",
      accent: "secondary",
      topic: "Animation",
    },
  });

  assert.equal(payload.featured, true);
  assert.deepEqual(payload.archiveMeta, { topic: "Archive Topic" });
  assert.deepEqual(payload.resourceMeta, {
    url: "https://example.com/reference",
    rating: 5,
    monogram: "RS",
    accent: "secondary",
    topic: "Animation",
  });
});

test("validateEditorDraft requires collection topics and valid absolute project or resource URLs", () => {
  const archiveErrors = validateEditorDraft({
    ...createEmptyEditorDraft({
      category: "archive",
    }),
    title: "Archive note",
    slug: "archive-note",
    summary: "Summary",
    content: "Body",
    featured: false,
    archiveMeta: {
      topic: "",
    },
  });

  assert.equal(typeof archiveErrors.archiveTopic, "string");

  const resourceErrors = validateEditorDraft({
    ...createEmptyEditorDraft({
      category: "resource",
    }),
    title: "Resource note",
    slug: "resource-note",
    summary: "Summary",
    content: "Body",
    featured: false,
    resourceMeta: {
      url: "example.com/resource-note",
      rating: 4,
      monogram: "RN",
      accent: "primary",
      topic: "Reference",
    },
  });

  assert.equal(typeof resourceErrors.resourceUrl, "string");

  const projectErrors = validateEditorDraft({
    ...createEmptyEditorDraft({
      category: "project",
    }),
    title: "Project note",
    slug: "project-note",
    summary: "Summary",
    content: "Body",
    featured: false,
    projectMeta: {
      href: "https://github.com/",
      github: "notaurl",
      docs: "",
      year: "2026",
      stack: ["React"],
      icon: "grid",
      accent: "primary",
    },
  });

  assert.equal(typeof projectErrors.projectHref, "string");
  assert.equal(typeof projectErrors.projectGithub, "string");
});
