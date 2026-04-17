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
  applyEditorCategoryChange,
  createEmptyEditorDraft,
  formatEditorFileSize,
  normalizeSlug,
  resolveEditorAssetKind,
  type EditorAssetKind,
  type EditorAccent,
  type EditorAttachmentAsset,
  type EditorCategory,
  type EditorDraft,
  type EditorProjectIcon,
} from "@/lib/editor";

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

export const PROJECT_ICON_LABELS: Record<EditorProjectIcon, string> = {
  grid: "Grid",
  spark: "Spark",
  pen: "Pen",
  layers: "Layers",
};

export const ACCENT_LABELS: Record<EditorAccent, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
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
  return applyEditorCategoryChange({
    draft: {
      ...createEmptyEditorDraft(),
      content: "",
    },
    nextCategory: "archive",
  });
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
