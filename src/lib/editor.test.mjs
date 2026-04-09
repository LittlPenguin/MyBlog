import assert from "node:assert/strict";
import test from "node:test";
import {
  createEditorSubmitResult,
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

test("validateEditorDraft returns clear validation messages", () => {
  const errors = validateEditorDraft(createEmptyEditorDraft());

  assert.deepEqual(errors, {
    title: "请输入文章标题。",
    slug: "请输入文章 slug。",
    summary: "请输入文章摘要。",
    content: "请输入正文内容。",
  });
});

test("prepareEditorSubmitPayload trims fields and normalizes content", () => {
  const payload = prepareEditorSubmitPayload({
    title: "  Sunset Note  ",
    slug: "  Sunset Note / 01 ",
    summary: "  calm and bright  ",
    content: "Line 1\r\nLine 2\r\n",
    category: "resource",
    tags: [" #React ", "react", "UI "],
  });

  assert.deepEqual(payload, {
    title: "Sunset Note",
    slug: "sunset-note-01",
    summary: "calm and bright",
    content: "Line 1\nLine 2\n",
    category: "resource",
    tags: ["React", "UI"],
    scheduleAt: null,
    cover: null,
    assets: [],
  });
});

test("createEditorSubmitResult returns normalized preview payload when draft is valid", () => {
  const result = createEditorSubmitResult(
    {
      title: "  New Resource  ",
      slug: " New Resource ",
      summary: "  concise summary  ",
      content: "# Heading\n\nBody copy",
      category: "resource",
      tags: ["#Reading", "reading", "Design"],
      scheduleAt: "2026-04-08T10:30",
      isHidden: true,
      cover: {
        name: "cover.png",
        type: "image/png",
        size: 2048,
        previewUrl: "blob:cover",
      },
      assets: [
        {
          id: "asset-1",
          name: "notes.pdf",
          type: "application/pdf",
          size: 4096,
          previewUrl: null,
        },
      ],
    },
    () => "2026-04-07T12:00:00.000Z",
  );

  assert.deepEqual(result, {
    ok: true,
    message: "接口占位成功，文章发布请求已接收。",
    preview: {
      slug: "new-resource",
      category: "resource",
      receivedAt: "2026-04-07T12:00:00.000Z",
      scheduleAt: "2026-04-08T10:30",
      isHidden: true,
      coverName: "cover.png",
      assetCount: 1,
    },
  });
});

test("createEditorSubmitResult returns field errors when required content is missing", () => {
  const result = createEditorSubmitResult(
    {
      title: "Draft only",
      slug: "draft-only",
      summary: "",
      content: "",
      category: "archive",
      tags: [],
      scheduleAt: null,
      isHidden: false,
      cover: null,
      assets: [],
    },
    () => "2026-04-07T12:00:00.000Z",
  );

  assert.deepEqual(result, {
    ok: false,
    message: "发布失败，请先修正表单中的必填项。",
    errors: {
      summary: "请输入文章摘要。",
      content: "请输入正文内容。",
    },
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

  assert.deepEqual(errors, {
    scheduleAt: "请输入有效的发布时间。",
  });
});

test("prepareEditorSubmitPayload normalizes new metadata fields", () => {
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
    },
    assets: [
      {
        id: "asset-1",
        name: "Diagram.png",
        type: "image/png",
        size: 512,
        previewUrl: "blob:asset-1",
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
    },
    assets: [
      {
        id: "asset-1",
        name: "Diagram.png",
        type: "image/png",
        size: 512,
        previewUrl: "blob:asset-1",
      },
    ],
  });
});

test("deriveEditorDraftFromMarkdown uses frontmatter when present", () => {
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
