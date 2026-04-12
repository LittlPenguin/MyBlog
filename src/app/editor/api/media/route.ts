import { NextResponse } from "next/server";
import { collectEditorMediaReferences } from "@/lib/content";
import { editorContentRootDir } from "../shared";

export async function GET() {
  const items = await collectEditorMediaReferences(editorContentRootDir());
  return NextResponse.json({ ok: true, items });
}
