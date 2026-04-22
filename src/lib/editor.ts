import matter from "gray-matter";
export { EDITOR_CATEGORIES } from "./editor-shared.js";
export type {
  EditorAccent,
  EditorArchiveMeta,
  EditorAttachmentAsset,
  EditorDraftSource,
  EditorCategory,
  EditorCoverAsset,
  EditorDraft,
  EditorFieldErrors,
  EditorFileAsset,
  EditorMode,
  EditorProjectIcon,
  EditorProjectMeta,
  EditorResourceMeta,
} from "./editor-shared.js";
import { EDITOR_CATEGORIES } from "./editor-shared.js";
import type {
  EditorAccent,
  EditorArchiveMeta,
  EditorAttachmentAsset,
  EditorDraftSource,
  EditorCategory,
  EditorCoverAsset,
  EditorDraft,
  EditorFieldErrors,
  EditorMode,
  EditorProjectIcon,
  EditorProjectMeta,
  EditorResourceMeta,
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

function isAbsoluteHttpUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRenderableExternalUrl(value: string) {
  if (!isAbsoluteHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";

    if ((url.hostname === "github.com" || url.hostname === "www.github.com") && normalizedPath === "/") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function readArchiveTopic(meta: Partial<EditorArchiveMeta> | undefined) {
  return typeof meta?.topic === "string" ? meta.topic : "";
}

function readResourceTopic(meta: Partial<EditorResourceMeta> | undefined) {
  return typeof meta?.topic === "string" ? meta.topic : "";
}

export function buildEditorDetailHref(category: EditorCategory, slug: string) {
  const normalizedSlug = normalizeSlug(slug);

  switch (category) {
    case "archive":
      return `/posts/${normalizedSlug}`;
    case "project":
      return `/projects/${normalizedSlug}`;
    case "resource":
      return `/resources/${normalizedSlug}`;
    default: {
      const exhaustiveCheck: never = category;
      return exhaustiveCheck;
    }
  }
}

export function buildEditorLoadHref(category: EditorCategory, slug: string) {
  const params = new URLSearchParams();
  params.set("category", category);
  params.set("slug", normalizeSlug(slug));
  return `/editor?${params.toString()}`;
}

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

type ApplyEditorCategoryChangeInput = {
  draft: EditorDraft;
  nextCategory: EditorCategory;
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

export function createEmptyProjectMeta(): EditorProjectMeta {
  return {
    href: "",
    github: "",
    docs: "",
    year: "",
    stack: [],
    icon: "grid",
    accent: "primary",
  };
}

export function createEmptyResourceMeta(): EditorResourceMeta {
  return {
    url: "",
    rating: 4,
    monogram: "",
    accent: "primary",
    topic: "",
  };
}

export function createEmptyArchiveMeta(): EditorArchiveMeta {
  return {
    topic: "",
  };
}

export function createEmptyEditorDraft(
  partial: Partial<Pick<EditorDraft, "category">> = {},
): EditorDraft {
  return {
    title: "",
    slug: "",
    summary: "",
    content: "",
    category: partial.category ?? "archive",
    tags: [],
    scheduleAt: null,
    featured: false,
    projectMeta: createEmptyProjectMeta(),
    resourceMeta: createEmptyResourceMeta(),
    archiveMeta: createEmptyArchiveMeta(),
    cover: null,
    assets: [],
  };
}

function trimOrEmpty(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeMonogram(value: string) {
  return value.trim().toUpperCase();
}

function normalizeRating(value: number) {
  if (!Number.isFinite(value)) {
    return 4;
  }

  return Math.max(1, Math.min(5, Math.round(value)));
}

function createCategoryTemplate(category: EditorCategory) {
  if (category === "project") {
    return `# 项目名称
一句话说明这个项目解决了什么问题。

## 项目链接
- Website:
- GitHub:
- Docs:

## 项目概览
- 目标
- 使用场景
- 当前状态

## 关键能力
- 能力一
- 能力二
- 能力三

## 设计与实现
补充架构、交互、技术栈和实现取舍。`;
  }

  if (category === "resource") {
    return `# 资源名称
一句话说明这个资源适合什么场景。

## 资源信息
- 原始链接:
- 推荐评分:

## 资源简介
- 它是什么
- 适合谁
- 为什么值得收藏

## 使用建议
写下你的使用体验、亮点和注意事项。`;
  }

  return `# 新文章标题
在这里开始写作。支持常见的 Markdown 语法：
- 列表
- **加粗**
- \`行内代码\`

## 一个小节
写下这篇文章真正想表达的核心观点。`;
}

export function isEditorDraftNearEmpty(draft: Pick<EditorDraft, "title" | "summary" | "content" | "tags" | "assets" | "cover">) {
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const content = draft.content.trim();

  if (title || summary) {
    return false;
  }

  if ((draft.tags?.length ?? 0) > 0 || (draft.assets?.length ?? 0) > 0 || draft.cover) {
    return false;
  }

  return content.length < 16;
}

function initializeCategoryMeta(draft: EditorDraft, nextCategory: EditorCategory): EditorDraft {
  if (nextCategory === "project") {
    const nextYear = trimOrEmpty(draft.projectMeta.year) || new Date().getFullYear().toString();
    return {
      ...draft,
      projectMeta: {
        ...draft.projectMeta,
        year: nextYear,
        stack: draft.projectMeta.stack.length > 0 ? draft.projectMeta.stack : normalizeTags(draft.tags),
      },
    };
  }

  if (nextCategory === "resource") {
    return {
      ...draft,
      resourceMeta: {
        ...draft.resourceMeta,
        monogram: draft.resourceMeta.monogram || draft.title.trim().slice(0, 2).toUpperCase(),
        topic: draft.resourceMeta.topic || draft.archiveMeta.topic,
      },
    };
  }

  return draft;
}

export function applyEditorCategoryChange({ draft, nextCategory }: ApplyEditorCategoryChangeInput): EditorDraft {
  const nextDraft = initializeCategoryMeta(
    {
      ...draft,
      category: nextCategory,
    },
    nextCategory,
  );

  if (!isEditorDraftNearEmpty(draft)) {
    return nextDraft;
  }

  return {
    ...nextDraft,
    content: createCategoryTemplate(nextCategory),
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
    persistedPath: null,
  } satisfies EditorAttachmentAsset;
}

export function buildCoverAsset(file: Pick<File, "name" | "type" | "size">, previewUrl: string | null) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl,
    persistedPath: null,
  } satisfies EditorCoverAsset;
}

export function buildAttachmentAssetReference(
  name: string,
  previewUrl: string | null = null,
  persistedPath: string | null = null,
): EditorAttachmentAsset {
  return {
    id: createDeterministicFileId(name, 0, "file"),
    name,
    type: "",
    size: 0,
    previewUrl,
    persistedPath,
  };
}

export function buildCoverAssetReference(
  name: string,
  previewUrl: string | null = null,
  persistedPath: string | null = null,
): EditorCoverAsset {
  return {
    name,
    type: "",
    size: 0,
    previewUrl,
    persistedPath,
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

  if (draft.category === "archive" && !readArchiveTopic(draft.archiveMeta).trim()) {
    errors.archiveTopic = "Please enter an archive topic.";
  }

  if (draft.category === "resource") {
    if (!readResourceTopic(draft.resourceMeta).trim()) {
      errors.resourceTopic = "Please enter a resource topic.";
    }

    if (draft.resourceMeta.url.trim() && !isAbsoluteHttpUrl(draft.resourceMeta.url.trim())) {
      errors.resourceUrl = "Resource URL must be an absolute http/https link.";
    }
  }

  if (draft.category === "project") {
    if (draft.projectMeta.href.trim() && !isRenderableExternalUrl(draft.projectMeta.href.trim())) {
      errors.projectHref = "Website URL must be an absolute public http/https link.";
    }

    if (draft.projectMeta.github.trim() && !isRenderableExternalUrl(draft.projectMeta.github.trim())) {
      errors.projectGithub = "GitHub URL must be an absolute public http/https link.";
    }

    if (draft.projectMeta.docs.trim() && !isRenderableExternalUrl(draft.projectMeta.docs.trim())) {
      errors.projectDocs = "Docs URL must be an absolute public http/https link.";
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
    featured: Boolean(draft.featured),
    projectMeta: {
      href: trimOrEmpty(draft.projectMeta.href),
      github: trimOrEmpty(draft.projectMeta.github),
      docs: trimOrEmpty(draft.projectMeta.docs),
      year: trimOrEmpty(draft.projectMeta.year),
      stack: normalizeTags(draft.projectMeta.stack),
      icon: draft.projectMeta.icon,
      accent: draft.projectMeta.accent,
    },
    resourceMeta: {
      url: trimOrEmpty(draft.resourceMeta.url),
      rating: normalizeRating(draft.resourceMeta.rating),
      monogram: normalizeMonogram(draft.resourceMeta.monogram),
      accent: draft.resourceMeta.accent,
      topic: trimOrEmpty(readResourceTopic(draft.resourceMeta)),
    },
    archiveMeta: {
      topic: trimOrEmpty(readArchiveTopic(draft.archiveMeta)),
    },
    cover: draft.cover
      ? {
          name: draft.cover.name,
          type: draft.cover.type,
          size: draft.cover.size,
          previewUrl: draft.cover.previewUrl,
          persistedPath: draft.cover.persistedPath ?? null,
        }
      : null,
    assets: (draft.assets ?? []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      size: asset.size,
      previewUrl: asset.previewUrl,
      persistedPath: asset.persistedPath ?? null,
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
  const tags =
    preferFrontmatter && Array.isArray(data.tags)
      ? normalizeTags(data.tags.filter((tag): tag is string => typeof tag === "string"))
      : [];
  const category = preferFrontmatter && isEditorCategory(data.category) ? data.category : "archive";
  const slug =
    preferFrontmatter && typeof data.slug === "string" && data.slug.trim()
      ? normalizeSlug(data.slug)
      : normalizeSlug(inferredTitle);

  const projectMeta = createEmptyProjectMeta();
  const resourceMeta = createEmptyResourceMeta();
  const archiveMeta = createEmptyArchiveMeta();
  let featured = false;

  if (preferFrontmatter) {
    if (typeof data.featured === "boolean") {
      featured = data.featured;
    }
    if (typeof data.href === "string") {
      projectMeta.href = data.href.trim();
    }
    if (typeof data.github === "string") {
      projectMeta.github = data.github.trim();
    }
    if (typeof data.docs === "string") {
      projectMeta.docs = data.docs.trim();
    }
    if (typeof data.year === "string") {
      projectMeta.year = data.year.trim();
    }
    if (Array.isArray(data.stack)) {
      projectMeta.stack = normalizeTags(data.stack.filter((tag): tag is string => typeof tag === "string"));
    }
    if (data.icon === "grid" || data.icon === "spark" || data.icon === "pen" || data.icon === "layers") {
      projectMeta.icon = data.icon as EditorProjectIcon;
    }
    if (data.accent === "primary" || data.accent === "secondary" || data.accent === "tertiary") {
      projectMeta.accent = data.accent as EditorAccent;
    }
    if (typeof data.url === "string") {
      resourceMeta.url = data.url.trim();
    }
    if (typeof data.rating === "number") {
      resourceMeta.rating = normalizeRating(data.rating);
    }
    if (typeof data.monogram === "string") {
      resourceMeta.monogram = normalizeMonogram(data.monogram);
    }
    if (typeof data.category === "string") {
      if (category === "archive") {
        archiveMeta.topic = data.category.trim();
      }
      if (category === "resource") {
        resourceMeta.topic = data.category.trim();
      }
    }
  }

  return {
    ...createEmptyEditorDraft(),
    title: inferredTitle,
    slug,
    summary,
    content,
    category,
    tags,
    featured,
    projectMeta,
    resourceMeta,
    archiveMeta,
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
