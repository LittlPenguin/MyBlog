import assert from "node:assert/strict";
import test from "node:test";
import {
  applyEditorTitleChange,
  createEmptyEditorDraft,
  deriveEditorDraftFromMarkdown,
  formatEditorFileSize,
  isImageEditorFile,
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
      isHidden: true,
    }),
    {
      title: "",
      slug: "",
      summary: "",
      content: "",
      category: "project",
      tags: [],
      scheduleAt: null,
      isHidden: true,
      cover: null,
      assets: [],
    },
  );
});

test("validateEditorDraft returns the required error keys for an empty draft", () => {
  const errors = validateEditorDraft(createEmptyEditorDraft());

  assert.deepEqual(Object.keys(errors).sort(), ["content", "slug", "summary", "title"]);
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
    isHidden: true,
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
    isHidden: true,
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
    isHidden: false,
    cover: null,
    assets: [],
  });

  assert.deepEqual(Object.keys(errors), ["scheduleAt"]);
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
    isHidden: false,
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
    isHidden: false,
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
