import { NextResponse } from "next/server";
import { writeEditorDraftPublishedState } from "@/lib/content";
import {
  editorContentRootDir,
  revalidateEditorContentRoutes,
} from "../../../../shared";

type RouteContext = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

  const result = await writeEditorDraftPublishedState({
    rootDir: editorContentRootDir(),
    category,
    slug: params.slug,
  });

  if (result.ok) {
    revalidateEditorContentRoutes(result.category, result.slug);
  }

  return NextResponse.json(result, {
    status: result.ok ? 200 : 404,
  });
}
