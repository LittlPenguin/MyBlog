"use client";

import {
  FileArchive,
  FileCode2,
  FileImage,
  FileMusic,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";
import {
  createEmptyEditorDraft,
  formatEditorFileSize,
  normalizeSlug,
  resolveEditorAssetKind,
  type EditorAssetKind,
  type EditorAttachmentAsset,
  type EditorCategory,
  type EditorDraft,
} from "@/lib/editor";

export const INITIAL_TEMPLATE = `# 新文章标题

在这里开始写作。支持常见的 Markdown 语法：
- 列表
- **加粗**
- \`行内代码\`

## 一个小节

写下这篇文章真正想表达的核心观点。`;

export type AssetVisualMeta = {
  kind: EditorAssetKind;
  icon: LucideIcon;
  label: string;
};

export const CATEGORY_LABELS: Record<EditorCategory, string> = {
  archive: "归档",
  project: "项目",
  resource: "资源",
};

export const ASSET_VISUALS: Record<EditorAssetKind, AssetVisualMeta> = {
  image: { kind: "image", icon: FileImage, label: "图片" },
  pdf: { kind: "pdf", icon: FileText, label: "PDF" },
  code: { kind: "code", icon: FileCode2, label: "代码" },
  audio: { kind: "audio", icon: FileMusic, label: "音频" },
  video: { kind: "video", icon: FileVideo, label: "视频" },
  archive: { kind: "archive", icon: FileArchive, label: "压缩包" },
  file: { kind: "file", icon: FileText, label: "文件" },
};

export function buildInitialDraft(): EditorDraft {
  return {
    ...createEmptyEditorDraft(),
    content: INITIAL_TEMPLATE,
  };
}

export function countWords(input: string) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countLines(input: string) {
  return input.length === 0 ? 1 : input.split("\n").length;
}

export function describeAsset(asset: Pick<EditorAttachmentAsset, "name" | "type">): AssetVisualMeta {
  return ASSET_VISUALS[resolveEditorAssetKind(asset)];
}

export function buildAssetMetaLine(asset: Pick<EditorAttachmentAsset, "name" | "size" | "type">) {
  const visual = describeAsset(asset);
  return `${visual.label} / ${formatEditorFileSize(asset.size)}`;
}

export function isSlugCustom(draft: Pick<EditorDraft, "title" | "slug">) {
  return draft.slug !== normalizeSlug(draft.title);
}
