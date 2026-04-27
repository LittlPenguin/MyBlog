import { randomUUID } from "node:crypto";
import matter from "gray-matter";
import {
  buildContentFileSource,
  buildEditorWriteResult,
  createBaseContentFrontmatter,
  createPersistedEditorDraft,
  getContentDirectoryForCategory,
  parseContentCollectionSource,
  type ContentCollectionItem,
  type EditorUploadedFile,
  type EditorWritePayload,
} from "./content.js";
import type { BaseContentFrontmatter } from "./content-shared";
import type { D1DatabaseBinding, R2BucketBinding } from "./cloudflare-bindings";
import { normalizeContentSlug } from "./content-slug.js";
import type { EditorCategory, EditorDraftSource } from "./editor-shared";
import type { MessageCreateInput, MessageListItem, StoredMessage } from "./messages";

type ContentRow = {
  collection: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags_json: string;
  frontmatter_json: string;
  body: string;
  source: string;
  published_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type MessageRow = {
  id: string;
  name: string;
  email: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type PersistedAssets = Parameters<typeof createBaseContentFrontmatter>[2];
type PersistedAssetEntries = NonNullable<PersistedAssets>["assetEntries"];

function categoryToCollection(category: EditorCategory) {
  return getContentDirectoryForCategory(category);
}

function collectionToCategory(collection: string): EditorCategory | null {
  if (collection === "posts") {
    return "archive";
  }

  if (collection === "projects") {
    return "project";
  }

  if (collection === "resources") {
    return "resource";
  }

  return null;
}

function getRedirectHref(source: EditorDraftSource) {
  return source.originalCategory === "archive"
    ? "/archive"
    : source.originalCategory === "project"
      ? "/projects"
      : "/resources";
}

function normalizeR2Key(value: string) {
  return value.replace(/^\/+/, "");
}

function sanitizeAssetBaseName(name: string) {
  const parsed = name.match(/^(.*?)(\.[^.]*?)?$/);
  const rawBase = parsed?.[1] ?? name;
  const rawExtension = parsed?.[2] ?? "";
  const base = rawBase
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const extension = rawExtension.toLowerCase().replace(/[^.\w-]+/g, "");
  return `${base || "asset"}${extension}`;
}

function sanitizeAssetSlugPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getR2UploadPrefix(category: EditorCategory, slug: string) {
  return `uploads/${categoryToCollection(category)}/${sanitizeAssetSlugPart(slug)}`;
}

function getContentOutputPath(category: EditorCategory, slug: string) {
  return `d1://${categoryToCollection(category)}/${slug}`;
}

function contentRowToItem<T extends BaseContentFrontmatter = BaseContentFrontmatter>(
  row: ContentRow,
): ContentCollectionItem<T> {
  return parseContentCollectionSource<T>(getContentOutputPath(collectionToCategory(row.collection) ?? "archive", row.slug), row.source);
}

function toMessageStatus(readAt: string | null) {
  return readAt ? "read" : "unread";
}

function rowToMessage(row: MessageRow): MessageListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
    status: toMessageStatus(row.read_at),
  };
}

function storedMessageToListItem(message: StoredMessage): MessageListItem {
  return {
    ...message,
    status: toMessageStatus(message.readAt),
  };
}

async function persistR2Assets({
  bucket,
  payload,
  coverUpload,
  assetUploads,
}: {
  bucket: R2BucketBinding | null;
  payload: EditorWritePayload;
  coverUpload?: EditorUploadedFile | null;
  assetUploads?: EditorUploadedFile[];
}): Promise<PersistedAssets> {
  const prefix = getR2UploadPrefix(payload.category, payload.slug);
  let coverPath: string | null = payload.cover?.persistedPath ?? null;
  const assetEntries: PersistedAssetEntries = [];

  if (bucket && coverUpload) {
    const extension = coverUpload.name.includes(".") ? `.${coverUpload.name.split(".").at(-1)?.toLowerCase()}` : ".bin";
    const key = `${prefix}/cover${extension}`;
    await bucket.put(key, coverUpload.buffer, {
      httpMetadata: {
        contentType: coverUpload.type || undefined,
      },
    });
    coverPath = `/${key}`;
  }

  const uploadsByName = new Map((assetUploads ?? []).map((upload) => [upload.name, upload]));

  for (const asset of payload.assets) {
    const upload = uploadsByName.get(asset.name);

    if (bucket && upload) {
      const key = `${prefix}/assets/${sanitizeAssetBaseName(upload.name)}`;
      await bucket.put(key, upload.buffer, {
        httpMetadata: {
          contentType: upload.type || undefined,
        },
      });
      assetEntries.push({
        name: asset.name,
        path: `/${key}`,
      });
      continue;
    }

    assetEntries.push({
      name: asset.name,
      path: asset.persistedPath ?? null,
    });
  }

  return {
    coverPath,
    assetEntries,
  };
}

export async function listD1Content<T extends BaseContentFrontmatter = BaseContentFrontmatter>(
  db: D1DatabaseBinding,
  category: EditorCategory,
): Promise<ContentCollectionItem<T>[]> {
  const collection = categoryToCollection(category);
  const rows = await db
    .prepare(
      `SELECT collection, slug, title, summary, category, tags_json, frontmatter_json, body, source, published_at, updated_at, deleted_at
       FROM content_items
       WHERE collection = ?1 AND deleted_at IS NULL
       ORDER BY published_at DESC, updated_at DESC`,
    )
    .bind(collection)
    .all<ContentRow>();

  return (rows.results ?? []).map((row) => contentRowToItem<T>(row));
}

export async function hasAnyD1Content(db: D1DatabaseBinding, category: EditorCategory) {
  const collection = categoryToCollection(category);
  const row = await db
    .prepare(
      `SELECT slug
       FROM content_items
       WHERE collection = ?1
       LIMIT 1`,
    )
    .bind(collection)
    .first<{ slug: string }>();

  return Boolean(row);
}

export async function hasD1ContentRow(db: D1DatabaseBinding, category: EditorCategory, slug: string) {
  const collection = categoryToCollection(category);
  const normalizedSlug = normalizeContentSlug(slug);
  const row = await db
    .prepare(
      `SELECT deleted_at
       FROM content_items
       WHERE collection = ?1 AND slug = ?2
       LIMIT 1`,
    )
    .bind(collection, normalizedSlug)
    .first<{ deleted_at: string | null }>();

  return Boolean(row);
}

export async function getD1ContentBySlug<T extends BaseContentFrontmatter = BaseContentFrontmatter>(
  db: D1DatabaseBinding,
  category: EditorCategory,
  slug: string,
): Promise<ContentCollectionItem<T> | null> {
  const collection = categoryToCollection(category);
  const normalizedSlug = normalizeContentSlug(slug);
  const row = await db
    .prepare(
      `SELECT collection, slug, title, summary, category, tags_json, frontmatter_json, body, source, published_at, updated_at, deleted_at
       FROM content_items
       WHERE collection = ?1 AND slug = ?2 AND deleted_at IS NULL
       LIMIT 1`,
    )
    .bind(collection, normalizedSlug)
    .first<ContentRow>();

  return row ? contentRowToItem<T>(row) : null;
}

export async function saveD1Content({
  db,
  bucket = null,
  payload,
  coverUpload = null,
  assetUploads = [],
  now = () => new Date().toISOString(),
}: {
  db: D1DatabaseBinding;
  bucket?: R2BucketBinding | null;
  payload: EditorWritePayload;
  coverUpload?: EditorUploadedFile | null;
  assetUploads?: EditorUploadedFile[];
  now?: () => string;
}) {
  const persistedAssets = await persistR2Assets({
    bucket,
    payload,
    coverUpload,
    assetUploads,
  });
  const frontmatter = createBaseContentFrontmatter(payload, now, persistedAssets);
  const source = buildContentFileSource(payload, now, persistedAssets);
  const parsed = matter(source);
  const publishedAt = `${frontmatter.date}T00:00:00.000Z`;
  const updatedAt = now();
  const collection = categoryToCollection(payload.category);

  await db
    .prepare(
      `INSERT INTO content_items (
        collection, slug, title, summary, category, tags_json, frontmatter_json, body, source, published_at, updated_at, deleted_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL)
      ON CONFLICT(collection, slug) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        category = excluded.category,
        tags_json = excluded.tags_json,
        frontmatter_json = excluded.frontmatter_json,
        body = excluded.body,
        source = excluded.source,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at,
        deleted_at = NULL`,
    )
    .bind(
      collection,
      payload.slug,
      frontmatter.title,
      frontmatter.summary,
      frontmatter.category,
      JSON.stringify(frontmatter.tags),
      JSON.stringify(frontmatter),
      parsed.content,
      source,
      publishedAt,
      updatedAt,
    )
    .run();

  const result = buildEditorWriteResult({
    payload,
    outputPath: getContentOutputPath(payload.category, payload.slug),
    persistedAssets,
    now,
  });

  if (result.ok) {
    result.message = "Content saved to Cloudflare D1.";
    result.deploymentPending = false;
  }

  return result;
}

export async function getD1EditorDraftBySource(db: D1DatabaseBinding, source: EditorDraftSource) {
  const item = await getD1ContentBySlug(db, source.originalCategory, source.originalSlug);

  if (!item) {
    return null;
  }

  return createPersistedEditorDraft({
    category: source.originalCategory,
    slug: source.originalSlug,
    frontmatter: item.meta,
    content: item.content,
  });
}

async function deleteR2Prefix(bucket: R2BucketBinding, prefix: string) {
  let cursor: string | undefined;

  do {
    const page = await bucket.list({ prefix, cursor });
    const keys = page.objects.map((object) => object.key);

    if (keys.length > 0) {
      await bucket.delete(keys);
    }

    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

export async function deleteD1Content({
  db,
  bucket = null,
  source,
  now = () => new Date().toISOString(),
}: {
  db: D1DatabaseBinding;
  bucket?: R2BucketBinding | null;
  source: EditorDraftSource;
  now?: () => string;
}) {
  await db
    .prepare(
      `UPDATE content_items
       SET deleted_at = ?1
       WHERE collection = ?2 AND slug = ?3`,
    )
    .bind(now(), categoryToCollection(source.originalCategory), source.originalSlug)
    .run();

  if (bucket) {
    await deleteR2Prefix(bucket, getR2UploadPrefix(source.originalCategory, source.originalSlug));
  }

  return {
    ok: true,
    message: "Content deleted from Cloudflare D1.",
    redirectHref: getRedirectHref(source),
  } as const;
}

export async function saveD1Message({
  db,
  input,
  now = () => new Date().toISOString(),
  createId = () => randomUUID(),
}: {
  db: D1DatabaseBinding;
  input: MessageCreateInput;
  now?: () => string;
  createId?: () => string;
}) {
  const message: StoredMessage = {
    id: createId(),
    name: input.name,
    email: input.email,
    body: input.body,
    createdAt: now(),
    readAt: null,
  };

  await db
    .prepare(
      `INSERT INTO messages (id, name, email, body, created_at, read_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(message.id, message.name, message.email, message.body, message.createdAt, message.readAt)
    .run();

  return storedMessageToListItem(message);
}

export async function listD1Messages(db: D1DatabaseBinding) {
  const rows = await db
    .prepare(
      `SELECT id, name, email, body, created_at, read_at
       FROM messages
       ORDER BY created_at DESC`,
    )
    .all<MessageRow>();

  return (rows.results ?? []).map(rowToMessage);
}

export async function markD1MessageAsRead({
  db,
  id,
  now = () => new Date().toISOString(),
}: {
  db: D1DatabaseBinding;
  id: string;
  now?: () => string;
}) {
  const existing = await db
    .prepare(
      `SELECT id, name, email, body, created_at, read_at
       FROM messages
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(id)
    .first<MessageRow>();

  if (!existing) {
    return null;
  }

  if (!existing.read_at) {
    await db
      .prepare(
        `UPDATE messages
         SET read_at = ?1
         WHERE id = ?2 AND read_at IS NULL`,
      )
      .bind(now(), id)
      .run();
  }

  const next = await db
    .prepare(
      `SELECT id, name, email, body, created_at, read_at
       FROM messages
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(id)
    .first<MessageRow>();

  return next ? rowToMessage(next) : null;
}

export async function deleteD1Message(db: D1DatabaseBinding, id: string) {
  const existing = await db
    .prepare(
      `SELECT id, name, email, body, created_at, read_at
       FROM messages
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(id)
    .first<MessageRow>();

  if (!existing) {
    return false;
  }

  await db
    .prepare(`DELETE FROM messages WHERE id = ?1`)
    .bind(id)
    .run();

  return true;
}

export async function getR2Asset(bucket: R2BucketBinding, publicPath: string) {
  return bucket.get(normalizeR2Key(publicPath));
}
