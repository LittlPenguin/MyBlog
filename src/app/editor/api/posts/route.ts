import { NextResponse } from "next/server";
import path from "node:path";
import {
  createEditorWritePayload,
  deleteEditorContentFile,
  getContentDirectoryForCategory,
  type EditorUploadedFile,
  updateEditorContentFile,
} from "@/lib/content";
import { findContentFileBySlug } from "@/lib/content-slug";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { isCloudflareRuntime } from "@/lib/runtime-environment";
import {
  buildGitHubEditorDeletePlan,
  buildGitHubEditorPublishPlan,
  deleteEditorContentFromGitHub,
  publishEditorContentToGitHub,
  readGitHubPublishConfig,
  toRepositoryRelativePath,
} from "@/lib/github-publishing";
import {
  type EditorSubmitPayload,
  validateEditorDraft,
} from "@/lib/editor";
import type { EditorDeleteResult, EditorWriteResult } from "@/lib/publish-shared";
import {
  editorContentRootDir,
  revalidateEditorContentRoutes,
  revalidatePreviousContentRoute,
} from "../shared";

async function toUploadedFile(file: File): Promise<EditorUploadedFile> {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    buffer: new Uint8Array(await file.arrayBuffer()),
  };
}

async function findExistingContentSource(source: EditorSubmitPayload["source"]) {
  if (!source) {
    return null;
  }

  const directory = path.join(editorContentRootDir(), getContentDirectoryForCategory(source.originalCategory));
  return findContentFileBySlug(directory, source.originalSlug);
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json<EditorWriteResult>(
      {
        ok: false,
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  let payload: EditorSubmitPayload;
  let coverUpload: EditorUploadedFile | null = null;
  let assetUploads: EditorUploadedFile[] = [];

  try {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");

    if (typeof rawPayload !== "string") {
      return NextResponse.json<EditorWriteResult>(
        {
          ok: false,
          message: "请求体中缺少文章 payload。",
        },
        { status: 400 },
      );
    }

    payload = JSON.parse(rawPayload) as EditorSubmitPayload;

    const coverFile = formData.get("coverFile");
    if (coverFile instanceof File) {
      coverUpload = await toUploadedFile(coverFile);
    }

    assetUploads = await Promise.all(
      formData
        .getAll("assetFiles")
        .filter((file): file is File => file instanceof File)
        .map((file) => toUploadedFile(file)),
    );
  } catch {
    return NextResponse.json<EditorWriteResult>(
      {
        ok: false,
        message: "请求体不是合法的表单数据。",
      },
      { status: 400 },
    );
  }

  const prepared = createEditorWritePayload(payload);
  const errors = validateEditorDraft(prepared);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json<EditorWriteResult>(
      {
        ok: false,
        message: "发布失败，请先修正表单中的必填项。",
        errors,
      },
      { status: 422 },
    );
  }

  if (isCloudflareRuntime()) {
    const config = readGitHubPublishConfig();

    if (!config) {
      return NextResponse.json<EditorWriteResult>(
        {
          ok: false,
          message: "线上发布需要先配置 MYBLOG_GITHUB_REPOSITORY 和 MYBLOG_GITHUB_TOKEN。",
        },
        { status: 503 },
      );
    }

    try {
      const existing = await findExistingContentSource(prepared.source ?? null);
      const plan = buildGitHubEditorPublishPlan({
        payload: prepared,
        coverUpload,
        assetUploads,
        existingContentPath: existing ? toRepositoryRelativePath(existing.filePath) : null,
        existingSource: existing?.source ?? "",
      });
      const result = await publishEditorContentToGitHub({
        config,
        plan,
      });

      return NextResponse.json<EditorWriteResult>(result, {
        status: result.ok ? 200 : result.errors ? 422 : 502,
      });
    } catch (error) {
      return NextResponse.json<EditorWriteResult>(
        {
          ok: false,
          message: error instanceof Error ? error.message : "GitHub 发布请求失败。",
        },
        { status: 502 },
      );
    }
  }

  const result = await updateEditorContentFile({
    rootDir: editorContentRootDir(),
    payload: prepared,
    coverUpload,
    assetUploads,
  });

  if (result.ok) {
    revalidateEditorContentRoutes(result.category, result.slug);

    if (
      prepared.source &&
      (prepared.source.originalCategory !== result.category || prepared.source.originalSlug !== result.slug)
    ) {
      revalidatePreviousContentRoute(prepared.source.originalCategory, prepared.source.originalSlug);
    }
  }

  return NextResponse.json<EditorWriteResult>(result, {
    status: result.ok ? 200 : 422,
  });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json<EditorDeleteResult>(
      {
        ok: false,
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  let source: EditorSubmitPayload["source"];

  try {
    const body = (await request.json()) as {
      source?: EditorSubmitPayload["source"];
    };
    source = body.source ?? null;
  } catch {
    return NextResponse.json<EditorDeleteResult>(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  if (!source) {
    return NextResponse.json<EditorDeleteResult>(
      {
        ok: false,
        message: "Missing original content source.",
      },
      { status: 400 },
    );
  }

  if (isCloudflareRuntime()) {
    const config = readGitHubPublishConfig();

    if (!config) {
      return NextResponse.json<EditorDeleteResult>(
        {
          ok: false,
          message: "线上删除需要先配置 MYBLOG_GITHUB_REPOSITORY 和 MYBLOG_GITHUB_TOKEN。",
        },
        { status: 503 },
      );
    }

    try {
      const existing = await findExistingContentSource(source);
      const plan = buildGitHubEditorDeletePlan({
        source,
        existingSource: existing?.source ?? "",
        existingContentPath: existing ? toRepositoryRelativePath(existing.filePath) : null,
      });
      const result = await deleteEditorContentFromGitHub({
        config,
        plan,
      });

      return NextResponse.json<EditorDeleteResult>(result, {
        status: result.ok ? 200 : 502,
      });
    } catch (error) {
      return NextResponse.json<EditorDeleteResult>(
        {
          ok: false,
          message: error instanceof Error ? error.message : "GitHub 删除请求失败。",
        },
        { status: 502 },
      );
    }
  }

  const result = await deleteEditorContentFile({
    rootDir: editorContentRootDir(),
    source,
  });

  revalidateEditorContentRoutes(source.originalCategory, source.originalSlug);
  revalidatePreviousContentRoute(source.originalCategory, source.originalSlug);

  const response: EditorDeleteResult = result.ok
    ? {
        ok: true,
        message: result.message,
        redirectHref: result.redirectHref,
      }
    : result;

  return NextResponse.json<EditorDeleteResult>(response, {
    status: result.ok ? 200 : 422,
  });
}
