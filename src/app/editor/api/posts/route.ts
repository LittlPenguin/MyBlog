import { NextResponse } from "next/server";
import {
  createEditorWritePayload,
  updateEditorContentFile,
} from "@/lib/content";
import {
  type EditorSubmitPayload,
  validateEditorDraft,
} from "@/lib/editor";
import type { EditorWriteResult } from "@/lib/publish-shared";
import {
  editorContentRootDir,
  revalidateEditorContentRoutes,
  revalidatePreviousContentRoute,
} from "../shared";

export async function POST(request: Request) {
  let payload: EditorSubmitPayload;

  try {
    payload = (await request.json()) as EditorSubmitPayload;
  } catch {
    return NextResponse.json<EditorWriteResult>(
      {
        ok: false,
        message: "请求体不是合法的 JSON。",
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

  const result = await updateEditorContentFile({
    rootDir: editorContentRootDir(),
    payload: prepared,
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
