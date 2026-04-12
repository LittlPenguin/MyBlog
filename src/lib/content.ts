import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type {
  BaseContentFrontmatter,
  ProjectContentFrontmatter,
  ResourceContentFrontmatter,
} from "./content-shared";
import type {
  EditorCategory,
  EditorDraft,
  EditorDraftListItem,
  EditorDraftSource,
  EditorFieldErrors,
  EditorMediaReference,
} from "./editor-shared";
import {
  buildAttachmentAssetReference,
  buildCoverAssetReference,
  createEmptyEditorDraft,
  type EditorSubmitPayload,
  prepareEditorSubmitPayload,
  resolveEditorAssetKind,
} from "./editor.js";
import type { EditorWriteResult } from "./publish-shared";

export const CONTENT_CATEGORY_DIRECTORY = {
  archive: "posts",
  project: "projects",
  resource: "resources",
} as const satisfies Record<EditorCategory, string>;

export type ContentDirectory = (typeof CONTENT_CATEGORY_DIRECTORY)[EditorCategory];

export type ContentCollectionItem<T extends BaseContentFrontmatter = BaseContentFrontmatter> = {
  meta: T;
  content: string;
  filePath: string;
};

export type EditorWritePayload = EditorSubmitPayload;

type ContentFileDescriptor = {
  category: EditorCategory;
  filePath: string;
  slug: string;
};

type ParsedEditorDraft = {
  draft: EditorDraft;
  source: EditorDraftSource;
};

export type EditorWriteValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
      errors: EditorFieldErrors;
    };

const CATEGORY_LABELS: Record<EditorCategory, string> = {
  archive: "归档",
  project: "项目",
  resource: "资源",
};

function createMonogram(title: string) {
  const parts = title
    .split(/[\s-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return letters || title.slice(0, 2).toUpperCase() || "NT";
}

function createResourceFrontmatter(
  payload: EditorWritePayload,
  base: BaseContentFrontmatter,
): ResourceContentFrontmatter {
  return {
    ...base,
    url: `/resources/${payload.slug}`,
    rating: 4,
    accent: "primary",
    monogram: createMonogram(payload.title),
  };
}

function createProjectFrontmatter(
  payload: EditorWritePayload,
  base: BaseContentFrontmatter,
  now: () => string = () => new Date().toISOString(),
): ProjectContentFrontmatter {
  return {
    ...base,
    year: resolvePublishDate(payload.scheduleAt, now).slice(0, 4),
    stack: payload.tags.length > 0 ? payload.tags : ["Notes"],
    href: undefined,
    github: undefined,
    docs: undefined,
    icon: "grid",
    accent: "primary",
  };
}

export function getContentDirectoryForCategory(category: EditorCategory): ContentDirectory {
  return CONTENT_CATEGORY_DIRECTORY[category];
}

export function resolvePublishDate(scheduleAt: string | null, now: () => string = () => new Date().toISOString()) {
  if (scheduleAt) {
    return scheduleAt.slice(0, 10);
  }

  return now().slice(0, 10);
}

export function createEditorWritePayload(draft: EditorDraft) {
  return prepareEditorSubmitPayload(draft);
}

export function createBaseContentFrontmatter(
  payload: EditorWritePayload,
  now: () => string = () => new Date().toISOString(),
): BaseContentFrontmatter {
  const base: BaseContentFrontmatter = {
    title: payload.title,
    slug: payload.slug,
    summary: payload.summary,
    description: payload.summary,
    date: resolvePublishDate(payload.scheduleAt, now),
    category: CATEGORY_LABELS[payload.category],
    tags: payload.tags,
    cover: payload.cover?.name,
    featured: false,
    draft: payload.isHidden,
    hidden: payload.isHidden,
    assetNames: payload.assets.map((asset) => asset.name),
  };

  if (payload.category === "resource") {
    return createResourceFrontmatter(payload, base);
  }

  if (payload.category === "project") {
    return createProjectFrontmatter(payload, base, now);
  }

  return base;
}

export function createContentFileBody({
  frontmatter,
  content,
}: {
  frontmatter: BaseContentFrontmatter;
  content: string;
}) {
  const serializedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, value]) => value !== undefined),
  ) as Record<string, unknown>;
  const yaml = matter.stringify(content.trimEnd(), serializedFrontmatter).trim();
  return `${yaml}\n`;
}

export function buildContentFileSource(
  payload: EditorWritePayload,
  now: () => string = () => new Date().toISOString(),
) {
  return createContentFileBody({
    frontmatter: createBaseContentFrontmatter(payload, now),
    content: payload.content,
  });
}

export async function parseContentCollectionItem<T extends BaseContentFrontmatter = BaseContentFrontmatter>(
  filePath: string,
) {
  const source = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(source);

  return {
    meta: data as T,
    content,
    filePath,
  } satisfies ContentCollectionItem<T>;
}

export async function readCollectionItems<T extends BaseContentFrontmatter = BaseContentFrontmatter>(
  directory: string,
) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => path.join(directory, entry.name));

  const items = await Promise.all(files.map((filePath) => parseContentCollectionItem<T>(filePath)));

  return items.sort((a, b) => +new Date(b.meta.date) - +new Date(a.meta.date));
}

function getAbsoluteContentFilePath({
  rootDir,
  category,
  slug,
}: {
  rootDir: string;
  category: EditorCategory;
  slug: string;
}) {
  return path.join(rootDir, getContentDirectoryForCategory(category), `${slug}.mdx`);
}

async function readContentFileDescriptor(rootDir: string) {
  const categories = Object.keys(CONTENT_CATEGORY_DIRECTORY) as EditorCategory[];

  const collections = await Promise.all(
    categories.map(async (category) => {
      const directory = path.join(rootDir, getContentDirectoryForCategory(category));
      const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);

      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
        .map((entry) => ({
          category,
          filePath: path.join(directory, entry.name),
          slug: entry.name.replace(/\.mdx$/, ""),
        }) satisfies ContentFileDescriptor);
    }),
  );

  return collections.flat();
}

function resolveDraftStatusLabel(meta: BaseContentFrontmatter): EditorDraftListItem["statusLabel"] | null {
  if (meta.draft && meta.hidden) {
    return "draft-hidden";
  }

  if (meta.draft) {
    return "draft";
  }

  if (meta.hidden) {
    return "hidden";
  }

  return null;
}

function createEditorMediaId(reference: Pick<EditorMediaReference, "category" | "sourceSlug" | "role" | "name">) {
  return `${reference.category}:${reference.sourceSlug}:${reference.role}:${reference.name}`;
}

function inferDraftScheduleAt(date: string | undefined) {
  if (!date) {
    return null;
  }

  return `${date.slice(0, 10)}T00:00`;
}

function toRelativeOutputPath(absoluteOutputPath: string) {
  return path.relative(process.cwd(), absoluteOutputPath).replaceAll("\\", "/");
}

export async function getEditorDraftLists(rootDir: string): Promise<EditorDraftListItem[]> {
  const descriptors = await readContentFileDescriptor(rootDir);

  const entries = await Promise.all(
    descriptors.map(async (descriptor) => {
      const item = await parseContentCollectionItem(descriptor.filePath);
      const stats = await fs.stat(descriptor.filePath);
      const statusLabel = resolveDraftStatusLabel(item.meta);

      if (!statusLabel) {
        return null;
      }

      return {
        title: item.meta.title,
        slug: item.meta.slug,
        summary: item.meta.summary,
        category: descriptor.category,
        tags: item.meta.tags,
        date: item.meta.date,
        updatedAt: stats.mtime.toISOString(),
        statusLabel,
      } satisfies EditorDraftListItem;
    }),
  );

  return entries
    .filter((entry): entry is EditorDraftListItem => entry !== null)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function parseEditorDraftForEditing({
  rootDir,
  category,
  slug,
}: {
  rootDir: string;
  category: EditorCategory;
  slug: string;
}): Promise<ParsedEditorDraft | null> {
  const filePath = getAbsoluteContentFilePath({ rootDir, category, slug });
  const source = await fs.readFile(filePath, "utf8").catch(() => null);

  if (!source) {
    return null;
  }

  const { data, content } = matter(source);
  const meta = data as BaseContentFrontmatter;

  return {
    draft: {
      ...createEmptyEditorDraft(),
      title: meta.title,
      slug: meta.slug,
      summary: meta.summary,
      content: content.replace(/^\n+/, ""),
      category,
      tags: meta.tags,
      scheduleAt: inferDraftScheduleAt(meta.date),
      isHidden: Boolean(meta.hidden || meta.draft),
      cover: meta.cover ? buildCoverAssetReference(meta.cover) : null,
      assets: (meta.assetNames ?? []).map((name) => buildAttachmentAssetReference(name)),
    },
    source: {
      originalCategory: category,
      originalSlug: slug,
    },
  };
}

export async function collectEditorMediaReferences(rootDir: string): Promise<EditorMediaReference[]> {
  const descriptors = await readContentFileDescriptor(rootDir);

  const entries = await Promise.all(
    descriptors.map(async (descriptor) => {
      const item = await parseContentCollectionItem(descriptor.filePath);
      const isDraft = Boolean(item.meta.draft || item.meta.hidden);
      const references: EditorMediaReference[] = [];

      if (item.meta.cover) {
        const coverKind = resolveEditorAssetKind({ name: item.meta.cover, type: "" });
        references.push({
          id: createEditorMediaId({
            category: descriptor.category,
            sourceSlug: item.meta.slug,
            role: "cover",
            name: item.meta.cover,
          }),
          name: item.meta.cover,
          role: "cover",
          kind: coverKind,
          category: descriptor.category,
          sourceSlug: item.meta.slug,
          sourceTitle: item.meta.title,
          sourceDate: item.meta.date,
          isDraft,
        });
      }

      for (const assetName of item.meta.assetNames ?? []) {
        references.push({
          id: createEditorMediaId({
            category: descriptor.category,
            sourceSlug: item.meta.slug,
            role: "asset",
            name: assetName,
          }),
          name: assetName,
          role: "asset",
          kind: resolveEditorAssetKind({ name: assetName, type: "" }),
          category: descriptor.category,
          sourceSlug: item.meta.slug,
          sourceTitle: item.meta.title,
          sourceDate: item.meta.date,
          isDraft,
        });
      }

      return references;
    }),
  );

  return entries
    .flat()
    .sort((a, b) => +new Date(b.sourceDate) - +new Date(a.sourceDate));
}

export async function validateEditorWriteTarget({
  rootDir,
  category,
  slug,
}: {
  rootDir: string;
  category: EditorCategory;
  slug: string;
}): Promise<EditorWriteValidationResult> {
  const outputPath = path.join(rootDir, getContentDirectoryForCategory(category), `${slug}.mdx`);

  try {
    await fs.access(outputPath);

    return {
      ok: false,
      message: "slug 已存在，请更换后再发布。",
      errors: {
        slug: "当前 slug 已存在对应内容文件。",
      },
    };
  } catch {
    return { ok: true };
  }
}

async function removeFileIfExists(filePath: string) {
  await fs.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  });
}

async function writeContentAtPath({
  absoluteOutputPath,
  payload,
  now,
}: {
  absoluteOutputPath: string;
  payload: EditorWritePayload;
  now?: () => string;
}) {
  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
  const source = buildContentFileSource(payload, now);
  await fs.writeFile(absoluteOutputPath, source, "utf8");
}

export function buildEditorWriteResult({
  slug,
  category,
  outputPath,
}: {
  slug: string;
  category: EditorCategory;
  outputPath: string;
}): EditorWriteResult {
  return {
    ok: true,
    message: `内容已写入${CATEGORY_LABELS[category]}目录。`,
    slug,
    category,
    outputPath,
  };
}

export async function writeEditorContentFile({
  rootDir,
  payload,
  now,
}: {
  rootDir: string;
  payload: EditorWritePayload;
  now?: () => string;
}): Promise<EditorWriteResult> {
  const validation = await validateEditorWriteTarget({
    rootDir,
    category: payload.category,
    slug: payload.slug,
  });

  if (!validation.ok) {
    return validation;
  }

  const targetDirectory = path.join(rootDir, getContentDirectoryForCategory(payload.category));
  await fs.mkdir(targetDirectory, { recursive: true });

  const absoluteOutputPath = path.join(targetDirectory, `${payload.slug}.mdx`);
  await writeContentAtPath({
    absoluteOutputPath,
    payload,
    now,
  });

  return buildEditorWriteResult({
    slug: payload.slug,
    category: payload.category,
    outputPath: toRelativeOutputPath(absoluteOutputPath),
  });
}

export async function updateEditorContentFile({
  rootDir,
  payload,
  now,
}: {
  rootDir: string;
  payload: EditorWritePayload;
  now?: () => string;
}): Promise<EditorWriteResult> {
  const source = payload.source;

  if (!source) {
    return writeEditorContentFile({ rootDir, payload, now });
  }

  const originalPath = getAbsoluteContentFilePath({
    rootDir,
    category: source.originalCategory,
    slug: source.originalSlug,
  });

  const nextPath = getAbsoluteContentFilePath({
    rootDir,
    category: payload.category,
    slug: payload.slug,
  });

  if (originalPath !== nextPath) {
    const validation = await validateEditorWriteTarget({
      rootDir,
      category: payload.category,
      slug: payload.slug,
    });

    if (!validation.ok) {
      return validation;
    }
  }

  await writeContentAtPath({
    absoluteOutputPath: nextPath,
    payload,
    now,
  });

  if (originalPath !== nextPath) {
    await removeFileIfExists(originalPath);
  }

  return buildEditorWriteResult({
    slug: payload.slug,
    category: payload.category,
    outputPath: toRelativeOutputPath(nextPath),
  });
}

export async function writeEditorDraftPublishedState({
  rootDir,
  category,
  slug,
}: {
  rootDir: string;
  category: EditorCategory;
  slug: string;
}): Promise<EditorWriteResult> {
  const filePath = getAbsoluteContentFilePath({ rootDir, category, slug });
  const source = await fs.readFile(filePath, "utf8").catch(() => null);

  if (!source) {
    return {
      ok: false,
      message: "未找到目标草稿文件。",
    };
  }

  const parsed = matter(source);
  const nextFrontmatter = {
    ...(parsed.data as BaseContentFrontmatter),
    draft: false,
    hidden: false,
  };

  const output = matter.stringify(parsed.content.trimEnd(), nextFrontmatter).trim() + "\n";
  await fs.writeFile(filePath, output, "utf8");

  return {
    ok: true,
    message: "草稿已发布为公开内容。",
    slug,
    category,
    outputPath: toRelativeOutputPath(filePath),
  };
}
