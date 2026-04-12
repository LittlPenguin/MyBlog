import matter from "gray-matter";
export { EDITOR_CATEGORIES } from "./editor-shared.js";
export type {
  EditorAttachmentAsset,
  EditorDraftListItem,
  EditorDraftSource,
  EditorCategory,
  EditorCoverAsset,
  EditorDraft,
  EditorFieldErrors,
  EditorFileAsset,
  EditorMediaReference,
  EditorMode,
  EditorPreferences,
  EditorSection,
} from "./editor-shared.js";
import { EDITOR_CATEGORIES } from "./editor-shared.js";
import type {
  EditorAttachmentAsset,
  EditorDraftListItem,
  EditorDraftSource,
  EditorCategory,
  EditorCoverAsset,
  EditorDraft,
  EditorFieldErrors,
  EditorFileAsset,
  EditorMediaReference,
  EditorMode,
  EditorPreferences,
  EditorSection,
} from "./editor-shared.js";
export type EditorAssetKind =
  | "image"
  | "pdf"
  | "code"
  | "audio"
  | "video"
  | "archive"
  | "file";

export type EditorSubmitPayload = EditorDraft & {
  source?: EditorDraftSource | null;
};

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

type DeriveEditorDraftOptions = {
  preferFrontmatter?: boolean;
};

type ApplyEditorTitleChangeInput = {
  draft: EditorDraft;
  nextTitle: string;
  autoSyncSlug: boolean;
  isSlugTouched: boolean;
};

type ApplyEditorTitleChangeResult = {
  draft: EditorDraft;
  isSlugTouched: boolean;
};

const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  defaultCategory: "archive",
  defaultHidden: false,
  autoSyncSlug: true,
  preferFrontmatterOnImport: true,
  defaultMode: "edit",
};

export const EDITOR_PREFERENCES_STORAGE_KEY = "myblog.editor.preferences.v1";

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

function createDeterministicFileId(name: string, size: number, type: string) {
  return normalizeSlug(`${name}-${size}-${type || "file"}`) || `asset-${size}`;
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

export function createEmptyEditorDraft(
  partialPreferences: Partial<Pick<EditorPreferences, "defaultCategory" | "defaultHidden">> = {},
): EditorDraft {
  return createEmptyEditorDraftFromPreferences(partialPreferences);
}

function createEmptyEditorDraftFromPreferences(
  partialPreferences: Partial<Pick<EditorPreferences, "defaultCategory" | "defaultHidden">> = {},
): EditorDraft {
  return {
    title: "",
    slug: "",
    summary: "",
    content: "",
    category: partialPreferences.defaultCategory ?? DEFAULT_EDITOR_PREFERENCES.defaultCategory,
    tags: [],
    scheduleAt: null,
    isHidden: partialPreferences.defaultHidden ?? DEFAULT_EDITOR_PREFERENCES.defaultHidden,
    cover: null,
    assets: [],
  };
}

export function createDefaultEditorPreferences(): EditorPreferences {
  return { ...DEFAULT_EDITOR_PREFERENCES };
}

export function resolveEditorPreferences(input: unknown): EditorPreferences {
  const defaults = createDefaultEditorPreferences();

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const value = input as Partial<Record<keyof EditorPreferences, unknown>>;

  return {
    defaultCategory: isEditorCategory(value.defaultCategory) ? value.defaultCategory : defaults.defaultCategory,
    defaultHidden: typeof value.defaultHidden === "boolean" ? value.defaultHidden : defaults.defaultHidden,
    autoSyncSlug: typeof value.autoSyncSlug === "boolean" ? value.autoSyncSlug : defaults.autoSyncSlug,
    preferFrontmatterOnImport:
      typeof value.preferFrontmatterOnImport === "boolean"
        ? value.preferFrontmatterOnImport
        : defaults.preferFrontmatterOnImport,
    defaultMode:
      value.defaultMode === "preview" || value.defaultMode === "edit"
        ? value.defaultMode
        : defaults.defaultMode,
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

export function buildAttachmentAssetReference(name: string, previewUrl: string | null = null): EditorAttachmentAsset {
  return {
    id: createDeterministicFileId(name, 0, "file"),
    name,
    type: "",
    size: 0,
    previewUrl,
  };
}

export function buildCoverAssetReference(name: string, previewUrl: string | null = null): EditorCoverAsset {
  return {
    name,
    type: "",
    size: 0,
    previewUrl,
  };
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
  const normalized: EditorSubmitPayload = {
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

  return normalized;
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

export function deriveEditorDraftFromMarkdown(source: string, options: DeriveEditorDraftOptions = {}): EditorDraft {
  const parsed = matter(source);
  const data = parsed.data as Record<string, unknown>;
  const content = parsed.content.replace(/^\n+/, "");
  const firstHeadingMatch = content.match(/^#\s+(.+)$/m);
  const preferFrontmatter = options.preferFrontmatter ?? true;
  const frontmatterTitle = typeof data.title === "string" ? data.title.trim() : "";
  const inferredTitle = frontmatterTitle || firstHeadingMatch?.[1]?.trim() || "";
  const summary =
    typeof data.summary === "string" && data.summary.trim()
      ? data.summary.trim()
      : extractSummaryFromMarkdown(content);
  const tags = preferFrontmatter && Array.isArray(data.tags)
    ? normalizeTags(data.tags.filter((tag): tag is string => typeof tag === "string"))
    : [];
  const category = preferFrontmatter && isEditorCategory(data.category) ? data.category : "archive";
  const slug =
    preferFrontmatter && typeof data.slug === "string" && data.slug.trim()
      ? normalizeSlug(data.slug)
      : normalizeSlug(inferredTitle);

  return {
    ...createEmptyEditorDraftFromPreferences(),
    title: inferredTitle,
    slug,
    summary,
    content,
    category,
    tags,
  };
}

export function applyEditorTitleChange({
  draft,
  nextTitle,
  autoSyncSlug,
  isSlugTouched,
}: ApplyEditorTitleChangeInput): ApplyEditorTitleChangeResult {
  if (!autoSyncSlug || isSlugTouched) {
    return {
      draft: {
        ...draft,
        title: nextTitle,
      },
      isSlugTouched,
    };
  }

  return {
    draft: {
      ...draft,
      title: nextTitle,
      slug: normalizeSlug(nextTitle),
    },
    isSlugTouched,
  };
}

function normalizeComparableScheduleAt(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function hasMeaningfulEditorChanges(draft: EditorDraft, baseline: EditorDraft) {
  return (
    draft.title.trim() !== baseline.title.trim() ||
    draft.slug.trim() !== baseline.slug.trim() ||
    draft.summary.trim() !== baseline.summary.trim() ||
    draft.content.trim() !== baseline.content.trim() ||
    draft.category !== baseline.category ||
    draft.isHidden !== baseline.isHidden ||
    normalizeComparableScheduleAt(draft.scheduleAt) !== normalizeComparableScheduleAt(baseline.scheduleAt) ||
    normalizeTags(draft.tags).join("|") !== normalizeTags(baseline.tags).join("|") ||
    (draft.cover?.name ?? "") !== (baseline.cover?.name ?? "") ||
    draft.assets.length !== baseline.assets.length ||
    draft.assets.some((asset, index) => asset.name !== baseline.assets[index]?.name)
  );
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
