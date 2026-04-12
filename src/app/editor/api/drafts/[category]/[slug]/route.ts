import { NextResponse } from "next/server";
import { parseEditorDraftForEditing } from "@/lib/content";
import { editorContentRootDir } from "../../../shared";

type RouteContext = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  if (!["archive", "project", "resource"].includes(params.category)) {
    return NextResponse.json(
      {
        ok: false,
        message: "无效的草稿分类。",
      },
      { status: 400 },
    );
  }

  const category = params.category as "archive" | "project" | "resource";

  const result = await parseEditorDraftForEditing({
    rootDir: editorContentRootDir(),
    category,
    slug: params.slug,
  });

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "未找到目标草稿内容。",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
