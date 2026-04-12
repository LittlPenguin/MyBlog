import { NextResponse } from "next/server";
import { getEditorDraftLists } from "@/lib/content";
import { editorContentRootDir } from "../shared";

export async function GET() {
  const drafts = await getEditorDraftLists(editorContentRootDir());
  return NextResponse.json({ ok: true, drafts });
}
