import path from "node:path";
import matter from "gray-matter";
import {
  buildContentFileSource,
  buildEditorWriteResult,
  getContentDirectoryForCategory,
  type EditorUploadedFile,
  type EditorWritePayload,
} from "./content.js";
import type { EditorDraftSource } from "./editor-shared";
import type { BaseContentFrontmatter } from "./content-shared";
import type { EditorDeleteResult, EditorWriteResult } from "./publish-shared";

export type GitHubPublishConfig = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  committerName: string | null;
  committerEmail: string | null;
};

export type GitHubFilePut = {
  path: string;
  content: string | Uint8Array;
};

export type GitHubEditorPublishPlan = {
  commitMessage: string;
  contentPath: string;
  originalContentPath: string | null;
  requiresUniqueContentPath: boolean;
  filesToPut: GitHubFilePut[];
  filesToDelete: string[];
  result: EditorWriteResult;
};

export type GitHubEditorDeletePlan = {
  commitMessage: string;
  filesToDelete: string[];
  result: EditorDeleteResult;
};

type FetchLike = typeof fetch;

type GitHubTreeEntry = {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string | null;
};

type GitHubCommitResponse = {
  sha: string;
  html_url?: string;
};

function readEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function normalizeRepositoryPath(value: string) {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}

function toPublicRepositoryPath(publicPath: string) {
  return normalizeRepositoryPath(`public/${publicPath.replace(/^\/+/, "")}`);
}

function sanitizeAssetBaseName(name: string) {
  const parsed = path.parse(name);
  const base = parsed.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const extension = parsed.ext.toLowerCase().replace(/[^.\w-]+/g, "");
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

function getContentRepositoryPath(category: EditorWritePayload["category"], slug: string) {
  return normalizeRepositoryPath(`src/content/${getContentDirectoryForCategory(category)}/${slug}.mdx`);
}

function getAssetPublicPrefix(category: EditorWritePayload["category"], slug: string) {
  return `/uploads/${getContentDirectoryForCategory(category)}/${sanitizeAssetSlugPart(slug)}`;
}

function getRedirectHref(source: EditorDraftSource) {
  return source.originalCategory === "archive"
    ? "/archive"
    : source.originalCategory === "project"
      ? "/projects"
      : "/resources";
}

function getPersistedAssetPathsFromSource(source: string) {
  const { data } = matter(source);
  const frontmatter = data as Partial<BaseContentFrontmatter>;
  const paths: string[] = [];

  if (typeof frontmatter.cover === "string" && frontmatter.cover.startsWith("/")) {
    paths.push(toPublicRepositoryPath(frontmatter.cover));
  }

  if (Array.isArray(frontmatter.assetPaths)) {
    for (const assetPath of frontmatter.assetPaths) {
      if (typeof assetPath === "string" && assetPath.startsWith("/")) {
        paths.push(toPublicRepositoryPath(assetPath));
      }
    }
  }

  return paths;
}

function buildPersistedAssetsForGitHub({
  payload,
  coverUpload,
  assetUploads,
}: {
  payload: EditorWritePayload;
  coverUpload?: EditorUploadedFile | null;
  assetUploads?: EditorUploadedFile[];
}) {
  const assetPrefix = getAssetPublicPrefix(payload.category, payload.slug);
  const filesToPut: GitHubFilePut[] = [];
  let coverPath: string | null = null;

  if (coverUpload) {
    const fileName = `cover${path.extname(coverUpload.name).toLowerCase() || ".bin"}`;
    coverPath = `${assetPrefix}/${fileName}`;
    filesToPut.push({
      path: toPublicRepositoryPath(coverPath),
      content: coverUpload.buffer,
    });
  } else if (payload.cover?.persistedPath?.startsWith("/")) {
    coverPath = payload.cover.persistedPath;
  }

  const uploadsByName = new Map((assetUploads ?? []).map((upload) => [upload.name, upload]));
  const assetEntries: Array<{ name: string; path: string | null }> = [];

  for (const asset of payload.assets) {
    const upload = uploadsByName.get(asset.name);

    if (upload) {
      const assetPath = `${assetPrefix}/assets/${sanitizeAssetBaseName(upload.name)}`;
      filesToPut.push({
        path: toPublicRepositoryPath(assetPath),
        content: upload.buffer,
      });
      assetEntries.push({
        name: asset.name,
        path: assetPath,
      });
      continue;
    }

    assetEntries.push({
      name: asset.name,
      path: asset.persistedPath?.startsWith("/") ? asset.persistedPath : null,
    });
  }

  return {
    persistedAssets: {
      coverPath,
      assetEntries,
    },
    filesToPut,
  };
}

function dedupePaths(paths: string[]) {
  return Array.from(new Set(paths.map(normalizeRepositoryPath).filter(Boolean)));
}

function toBase64(content: string | Uint8Array) {
  if (typeof content === "string") {
    return Buffer.from(content, "utf8").toString("base64");
  }

  return Buffer.from(content).toString("base64");
}

function encodeRefPath(branch: string) {
  return branch.split("/").map(encodeURIComponent).join("/");
}

export function toRepositoryRelativePath(filePath: string) {
  return normalizeRepositoryPath(path.relative(process.cwd(), filePath));
}

export function readGitHubPublishConfig(env: Record<string, string | undefined> = process.env): GitHubPublishConfig | null {
  const repository = readEnvValue(env.MYBLOG_GITHUB_REPOSITORY);
  const token = readEnvValue(env.MYBLOG_GITHUB_TOKEN);

  if (!repository || !token) {
    return null;
  }

  const [owner, repo, ...extra] = repository.split("/").map((part) => part.trim()).filter(Boolean);

  if (!owner || !repo || extra.length > 0) {
    return null;
  }

  return {
    owner,
    repo,
    branch: readEnvValue(env.MYBLOG_GITHUB_BRANCH) ?? "main",
    token,
    committerName: readEnvValue(env.MYBLOG_GITHUB_COMMITTER_NAME),
    committerEmail: readEnvValue(env.MYBLOG_GITHUB_COMMITTER_EMAIL),
  };
}

export function buildGitHubEditorPublishPlan({
  payload,
  coverUpload = null,
  assetUploads = [],
  existingContentPath = null,
  existingSource = "",
  now,
}: {
  payload: EditorWritePayload;
  coverUpload?: EditorUploadedFile | null;
  assetUploads?: EditorUploadedFile[];
  existingContentPath?: string | null;
  existingSource?: string;
  now?: () => string;
}): GitHubEditorPublishPlan {
  const originalContentPath = payload.source
    ? normalizeRepositoryPath(
        existingContentPath ?? getContentRepositoryPath(payload.source.originalCategory, payload.source.originalSlug),
      )
    : null;
  const contentPath =
    payload.source && payload.source.originalCategory === payload.category && payload.source.originalSlug === payload.slug
      ? originalContentPath ?? getContentRepositoryPath(payload.category, payload.slug)
      : getContentRepositoryPath(payload.category, payload.slug);
  const { persistedAssets, filesToPut: assetFiles } = buildPersistedAssetsForGitHub({
    payload,
    coverUpload,
    assetUploads,
  });
  const contentSource = buildContentFileSource(payload, now, persistedAssets);
  const filesToPut = [
    ...assetFiles,
    {
      path: contentPath,
      content: contentSource,
    },
  ];
  const nextAssetPaths = new Set(
    [
      persistedAssets.coverPath,
      ...persistedAssets.assetEntries.map((entry) => entry.path),
    ]
      .filter((entry): entry is string => Boolean(entry))
      .map(toPublicRepositoryPath),
  );
  const filesToDelete =
    originalContentPath && originalContentPath !== contentPath
      ? [originalContentPath]
      : [];
  filesToDelete.push(
    ...getPersistedAssetPathsFromSource(existingSource).filter((assetPath) => !nextAssetPaths.has(assetPath)),
  );
  const result = buildEditorWriteResult({
    payload,
    outputPath: contentPath,
    persistedAssets,
    now,
  });

  if (result.ok) {
    result.message = "内容已提交到 GitHub，Cloudflare 将自动重新部署。";
    result.deploymentPending = true;
    result.redirectHref = null;
  }

  return {
    commitMessage: `content(editor): publish ${payload.title}`,
    contentPath,
    originalContentPath,
    requiresUniqueContentPath: !payload.source || contentPath !== originalContentPath,
    filesToPut,
    filesToDelete,
    result,
  };
}

export function buildGitHubEditorDeletePlan({
  source,
  existingSource = "",
  existingContentPath = null,
}: {
  source: EditorDraftSource;
  existingSource?: string;
  existingContentPath?: string | null;
}): GitHubEditorDeletePlan {
  const contentPath = normalizeRepositoryPath(
    existingContentPath ?? getContentRepositoryPath(source.originalCategory, source.originalSlug),
  );

  return {
    commitMessage: `content(editor): delete ${source.originalSlug}`,
    filesToDelete: dedupePaths([
      contentPath,
      ...(existingSource ? getPersistedAssetPathsFromSource(existingSource) : []),
    ]),
    result: {
      ok: true,
      message: "内容删除请求已提交到 GitHub，Cloudflare 将自动重新部署。",
      redirectHref: getRedirectHref(source),
    },
  };
}

async function githubRequest<T>(
  config: GitHubPublishConfig,
  endpoint: string,
  init: RequestInit = {},
  fetchImpl: FetchLike = fetch,
) {
  const response = await fetchImpl(`https://api.github.com/repos/${config.owner}/${config.repo}${endpoint}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
      "user-agent": "myblog-editor",
      "x-github-api-version": "2022-11-28",
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the HTTP status text when GitHub does not return JSON.
    }

    throw new Error(`GitHub API ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

async function readBaseRepositoryState(config: GitHubPublishConfig, fetchImpl: FetchLike = fetch) {
  const encodedBranch = encodeRefPath(config.branch);
  const ref = await githubRequest<{ object: { sha: string } }>(
    config,
    `/git/ref/heads/${encodedBranch}`,
    undefined,
    fetchImpl,
  );
  const commit = await githubRequest<{ tree: { sha: string } }>(
    config,
    `/git/commits/${ref.object.sha}`,
    undefined,
    fetchImpl,
  );
  const tree = await githubRequest<{ tree: GitHubTreeEntry[] }>(
    config,
    `/git/trees/${commit.tree.sha}?recursive=1`,
    undefined,
    fetchImpl,
  );

  return {
    encodedBranch,
    headSha: ref.object.sha,
    treeSha: commit.tree.sha,
    existingPaths: new Set(
      tree.tree
        .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
        .map((entry) => normalizeRepositoryPath(entry.path ?? "")),
    ),
  };
}

async function createBlob(config: GitHubPublishConfig, file: GitHubFilePut, fetchImpl: FetchLike = fetch) {
  const blob = await githubRequest<{ sha: string }>(
    config,
    "/git/blobs",
    {
      method: "POST",
      body: JSON.stringify({
        content: toBase64(file.content),
        encoding: "base64",
      }),
    },
    fetchImpl,
  );

  return blob.sha;
}

async function commitGitHubFiles({
  config,
  message,
  filesToPut,
  filesToDelete,
  requireMissingPath = null,
  fetchImpl = fetch,
}: {
  config: GitHubPublishConfig;
  message: string;
  filesToPut: GitHubFilePut[];
  filesToDelete: string[];
  requireMissingPath?: string | null;
  fetchImpl?: FetchLike;
}) {
  const repositoryState = await readBaseRepositoryState(config, fetchImpl);

  if (requireMissingPath && repositoryState.existingPaths.has(normalizeRepositoryPath(requireMissingPath))) {
    return {
      ok: false as const,
      message: "slug 已存在，请更换后再发布。",
      errors: {
        slug: "当前 slug 已存在对应内容文件。",
      },
    };
  }

  const tree: GitHubTreeEntry[] = [];

  for (const file of filesToPut) {
    const sha = await createBlob(config, file, fetchImpl);
    tree.push({
      path: normalizeRepositoryPath(file.path),
      mode: "100644",
      type: "blob",
      sha,
    });
  }

  for (const deletePath of dedupePaths(filesToDelete)) {
    if (!repositoryState.existingPaths.has(deletePath)) {
      continue;
    }

    tree.push({
      path: deletePath,
      mode: "100644",
      type: "blob",
      sha: null,
    });
  }

  if (tree.length === 0) {
    return {
      ok: false as const,
      message: "没有可提交到 GitHub 的文件变更。",
    };
  }

  const nextTree = await githubRequest<{ sha: string }>(
    config,
    "/git/trees",
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: repositoryState.treeSha,
        tree,
      }),
    },
    fetchImpl,
  );
  const committer =
    config.committerName && config.committerEmail
      ? {
          name: config.committerName,
          email: config.committerEmail,
        }
      : undefined;
  const commit = await githubRequest<GitHubCommitResponse>(
    config,
    "/git/commits",
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: nextTree.sha,
        parents: [repositoryState.headSha],
        committer,
      }),
    },
    fetchImpl,
  );

  await githubRequest(
    config,
    `/git/refs/heads/${repositoryState.encodedBranch}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: commit.sha,
      }),
    },
    fetchImpl,
  );

  return {
    ok: true as const,
    commitUrl: commit.html_url,
  };
}

export async function publishEditorContentToGitHub({
  config,
  plan,
  fetchImpl,
}: {
  config: GitHubPublishConfig;
  plan: GitHubEditorPublishPlan;
  fetchImpl?: FetchLike;
}): Promise<EditorWriteResult> {
  const commit = await commitGitHubFiles({
    config,
    message: plan.commitMessage,
    filesToPut: plan.filesToPut,
    filesToDelete: plan.filesToDelete,
    requireMissingPath: plan.requiresUniqueContentPath ? plan.contentPath : null,
    fetchImpl,
  });

  if (!commit.ok) {
    return commit;
  }

  if (plan.result.ok && commit.commitUrl) {
    plan.result.commitUrl = commit.commitUrl;
  }

  return plan.result;
}

export async function deleteEditorContentFromGitHub({
  config,
  plan,
  fetchImpl,
}: {
  config: GitHubPublishConfig;
  plan: GitHubEditorDeletePlan;
  fetchImpl?: FetchLike;
}): Promise<EditorDeleteResult> {
  const commit = await commitGitHubFiles({
    config,
    message: plan.commitMessage,
    filesToPut: [],
    filesToDelete: plan.filesToDelete,
    fetchImpl,
  });

  if (!commit.ok) {
    return {
      ok: false,
      message: commit.message,
    };
  }

  return plan.result;
}
