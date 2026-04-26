import path from "node:path";
import matter from "gray-matter";
import type { BaseContentFrontmatter } from "./content-shared";
import {
  staticContentRegistry,
  type StaticContentCollection,
} from "../content/generated/static-content-registry.js";

function safelyDecodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeContentSlug(slug: string) {
  return safelyDecodeSlug(slug.trim());
}

export type StaticContentItem<T extends BaseContentFrontmatter = BaseContentFrontmatter> = {
  meta: T;
  content: string;
  filePath: string;
  source: string;
};

const COLLECTION_BY_DIRECTORY = {
  posts: "posts",
  projects: "projects",
  resources: "resources",
} as const satisfies Record<string, StaticContentCollection>;

function normalizeDirectoryName(directory: string) {
  return directory.replaceAll("\\", "/").split("/").filter(Boolean).at(-1) ?? "";
}

export function resolveStaticContentCollection(directory: string): StaticContentCollection | null {
  const directoryName = normalizeDirectoryName(directory);
  return COLLECTION_BY_DIRECTORY[directoryName as keyof typeof COLLECTION_BY_DIRECTORY] ?? null;
}

export function getStaticContentEntries(directory: string) {
  const collection = resolveStaticContentCollection(directory);
  return collection ? staticContentRegistry[collection] : [];
}

export async function readStaticContentCollection<T extends BaseContentFrontmatter = BaseContentFrontmatter>(
  directory: string,
) {
  const entries = getStaticContentEntries(directory);

  return entries
    .map((entry) => {
      const { data, content } = matter(entry.source);

      return {
        meta: data as T,
        content,
        filePath: path.join(directory, entry.fileName),
        source: entry.source,
      } satisfies StaticContentItem<T>;
    })
    .sort((a, b) => +new Date(b.meta.date) - +new Date(a.meta.date));
}

export async function findStaticContentBySlug(directory: string, slug: string) {
  const normalizedSlug = normalizeContentSlug(slug);
  const entries = getStaticContentEntries(directory);

  for (const entry of entries) {
    const fileSlug = normalizeContentSlug(entry.fileName.replace(/\.mdx$/, ""));
    const { data } = matter(entry.source);
    const frontmatterSlug = typeof data.slug === "string" ? normalizeContentSlug(data.slug) : "";

    if (fileSlug === normalizedSlug || frontmatterSlug === normalizedSlug) {
      return {
        filePath: path.join(directory, entry.fileName),
        source: entry.source,
        slug: frontmatterSlug || fileSlug,
      };
    }
  }

  return null;
}
