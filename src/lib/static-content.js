import path from "node:path";
import matter from "gray-matter";
import { staticContentRegistry } from "../content/generated/static-content-registry.js";

function safelyDecodeSlug(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeContentSlug(slug) {
  return safelyDecodeSlug(slug.trim());
}

const COLLECTION_BY_DIRECTORY = {
  posts: "posts",
  projects: "projects",
  resources: "resources",
};

function normalizeDirectoryName(directory) {
  return directory.replaceAll("\\", "/").split("/").filter(Boolean).at(-1) ?? "";
}

export function resolveStaticContentCollection(directory) {
  const directoryName = normalizeDirectoryName(directory);
  return COLLECTION_BY_DIRECTORY[directoryName] ?? null;
}

export function getStaticContentEntries(directory) {
  const collection = resolveStaticContentCollection(directory);
  return collection ? staticContentRegistry[collection] : [];
}

export async function readStaticContentCollection(directory) {
  const entries = getStaticContentEntries(directory);

  return entries
    .map((entry) => {
      const { data, content } = matter(entry.source);

      return {
        meta: data,
        content,
        filePath: path.join(directory, entry.fileName),
        source: entry.source,
      };
    })
    .sort((a, b) => +new Date(b.meta.date) - +new Date(a.meta.date));
}

export async function findStaticContentBySlug(directory, slug) {
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
