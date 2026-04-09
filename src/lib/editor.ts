import matter from "gray-matter";
export { EDITOR_CATEGORIES } from "./editor-shared.js";
export type {
  EditorAttachmentAsset,
  EditorCategory,
  EditorCoverAsset,
  EditorDraft,
  EditorFieldErrors,
  EditorFileAsset,
} from "./editor-shared.js";
import { EDITOR_CATEGORIES } from "./editor-shared.js";
import type {
  EditorAttachmentAsset,
  EditorCategory,
  EditorCoverAsset,
  EditorDraft,
  EditorFieldErrors,
  EditorFileAsset,
} from "./editor-shared.js";
export type EditorAssetKind =
  | "image"
  | "pdf"
  | "code"
  | "audio"
  | "video"
  | "archive"
  | "file";

export type EditorSubmitPayload = EditorDraft;

export type EditorSubmitResult = {
  ok: boolean;
  message: string;
  errors?: EditorFieldErrors;
  preview?: {
    slug: string;
    category: EditorCategory;
    receivedAt: string;
    scheduleAt: string | null;
    isHidden: boolean;
    coverName: string | null;
    assetCount: number;
  };
};

function isEditorCategory(value: unknown): value is EditorCategory {
  return typeof value === "string" && EDITOR_CATEGORIES.includes(value as EditorCategory);
}

function normalizeScheduleAt(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function createUniqueId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().slice(0, 8);
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFileId(name: string, size: number, type: string) {
  const base = normalizeSlug(`${name}-${size}-${type || "file"}`) || `asset-${size}`;
  return `${base}-${createUniqueId()}`;
}

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "avif",
  "svg",
  "bmp",
  "ico",
  "tif",
  "tiff",
]);

function getFileExtension(name: string) {
  const segments = name.toLowerCase().split(".");
  return segments.length > 1 ? segments.at(-1) ?? "" : "";
}

export function createEmptyEditorDraft(): EditorDraft {
  return {
    title: "",
    slug: "",
    summary: "",
    content: "",
    category: "archive",
    tags: [],
    scheduleAt: null,
    isHidden: false,
    cover: null,
    assets: [],
  };
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeTags(tags: string[]) {
  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .filter((tag) => {
      const lowered = tag.toLowerCase();

      if (seen.has(lowered)) {
        return false;
      }

      seen.add(lowered);
      return true;
    });
}

export function formatEditorFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageEditorFile(file: Pick<File, "name" | "type">) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(getFileExtension(file.name));
}

export function resolveEditorAssetKind(file: Pick<File, "name" | "type">): EditorAssetKind {
  const extension = getFileExtension(file.name);
  const type = file.type.toLowerCase();

  if (isImageEditorFile(file)) {
    return "image";
  }

  if (type === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    type.startsWith("text/") ||
    ["ts", "tsx", "js", "jsx", "json", "md", "mdx", "css", "scss", "html", "yml", "yaml"].includes(extension)
  ) {
    return "code";
  }

  if (type.startsWith("audio/")) {
    return "audio";
  }

  if (type.startsWith("video/")) {
    return "video";
  }

  if (
    ["zip", "rar", "7z", "tar", "gz"].includes(extension) ||
    type.includes("zip") ||
    type.includes("compressed")
  ) {
    return "archive";
  }

  return "file";
}

export function buildAttachmentAsset(file: Pick<File, "name" | "type" | "size">, previewUrl: string | null) {
  return {
    id: createFileId(file.name, file.size, file.type),
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl,
  } satisfies EditorAttachmentAsset;
}

export function buildCoverAsset(file: Pick<File, "name" | "type" | "size">, previewUrl: string | null) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl,
  } satisfies EditorCoverAsset;
}

export function validateEditorDraft(draft: EditorDraft): EditorFieldErrors {
  const errors: EditorFieldErrors = {};

  if (!draft.title.trim()) {
    errors.title = "请输入文章标题。";
  }

  if (!draft.slug.trim()) {
    errors.slug = "请输入文章 slug。";
  } else if (!/^[a-z0-9\u4e00-\u9fa5-]+$/i.test(draft.slug.trim())) {
    errors.slug = "Slug 只能包含字母、数字、中文和连字符。";
  }

  if (!draft.summary.trim()) {
    errors.summary = "请输入文章摘要。";
  }

  if (!draft.content.trim()) {
    errors.content = "请输入正文内容。";
  }

  if (!EDITOR_CATEGORIES.includes(draft.category)) {
    errors.category = "请选择有效的发布栏目。";
  }

  if (draft.scheduleAt) {
    const normalized = draft.scheduleAt.includes("T") ? draft.scheduleAt : draft.scheduleAt.replace(" ", "T");

    if (Number.isNaN(Date.parse(normalized))) {
      errors.scheduleAt = "请输入有效的发布时间。";
    }
  }

  return errors;
}

export function prepareEditorSubmitPayload(draft: EditorDraft): EditorSubmitPayload {
  return {
    ...draft,
    title: draft.title.trim(),
    slug: normalizeSlug(draft.slug),
    summary: draft.summary.trim(),
    content: draft.content.replace(/\r\n/g, "\n"),
    tags: normalizeTags(draft.tags),
    scheduleAt: normalizeScheduleAt(draft.scheduleAt),
    cover: draft.cover
      ? {
          name: draft.cover.name,
          type: draft.cover.type,
          size: draft.cover.size,
          previewUrl: draft.cover.previewUrl,
        }
      : null,
    assets: (draft.assets ?? []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      size: asset.size,
      previewUrl: asset.previewUrl,
    })),
  };
}

function extractSummaryFromMarkdown(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("- "))
    .filter((line) => !line.startsWith("* "))
    .filter((line) => !line.startsWith(">"));

  return lines[0] ?? "";
}

export function deriveEditorDraftFromMarkdown(source: string): EditorDraft {
  const parsed = matter(source);
  const data = parsed.data as Record<string, unknown>;
  const content = parsed.content.replace(/^\n+/, "");
  const firstHeadingMatch = content.match(/^#\s+(.+)$/m);
  const frontmatterTitle = typeof data.title === "string" ? data.title.trim() : "";
  const inferredTitle = frontmatterTitle || firstHeadingMatch?.[1]?.trim() || "";
  const summary =
    typeof data.summary === "string" && data.summary.trim()
      ? data.summary.trim()
      : extractSummaryFromMarkdown(content);
  const tags = Array.isArray(data.tags)
    ? normalizeTags(data.tags.filter((tag): tag is string => typeof tag === "string"))
    : [];
  const category = isEditorCategory(data.category) ? data.category : "archive";
  const slug =
    typeof data.slug === "string" && data.slug.trim()
      ? normalizeSlug(data.slug)
      : normalizeSlug(inferredTitle);

  return {
    ...createEmptyEditorDraft(),
    title: inferredTitle,
    slug,
    summary,
    content,
    category,
    tags,
  };
}

export function createEditorSubmitResult(
  draft: EditorDraft,
  now: () => string = () => new Date().toISOString(),
): EditorSubmitResult {
  const normalized = prepareEditorSubmitPayload(draft);
  const errors = validateEditorDraft(normalized);

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "发布失败，请先修正表单中的必填项。",
      errors,
    };
  }

  return {
    ok: true,
    message: "接口占位成功，文章发布请求已接收。",
    preview: {
      slug: normalized.slug,
      category: normalized.category,
      receivedAt: now(),
      scheduleAt: normalized.scheduleAt,
      isHidden: normalized.isHidden,
      coverName: normalized.cover?.name ?? null,
      assetCount: normalized.assets.length,
    },
  };
}
