import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createEditorWritePayload, writeEditorContentFile } from "@/lib/content";
import {
  type EditorSubmitPayload,
  validateEditorDraft,
} from "@/lib/editor";
import type { EditorWriteResult } from "@/lib/publish-shared";

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

  const result = await writeEditorContentFile({
    rootDir: `${process.cwd().replaceAll("\\", "/")}/src/content`,
    payload: prepared,
  });

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/archive");
    revalidatePath("/projects");
    revalidatePath("/resources");
    revalidatePath("/sitemap.xml");

    if (result.category === "archive") {
      revalidatePath(`/posts/${result.slug}`);
    }

    if (result.category === "resource") {
      revalidatePath(`/resources/${result.slug}`);
    }

    if (result.category === "project") {
      revalidatePath(`/projects/${result.slug}`);
    }
  }

  return NextResponse.json<EditorWriteResult>(result, {
    status: result.ok ? 200 : 422,
  });
}
