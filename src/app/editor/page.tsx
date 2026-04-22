import type { Metadata } from "next";
import { getPersistedEditorDraftBySource } from "@/lib/content";
import {
  createEmptyEditorDraft,
  type EditorCategory,
  type EditorDraft,
  type EditorDraftSource,
} from "@/lib/editor";
import { editorContentRootDir } from "./api/shared";
import { EditorClient } from "./editor-client";

export const metadata: Metadata = {
  title: "Editor",
  description: "Create, update, and maintain site content.",
};

type SearchValue = string | string[] | undefined;

type PageProps = {
  searchParams: Promise<{
    category?: SearchValue;
    slug?: SearchValue;
  }>;
};

function readSearchValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isEditorCategory(value: string): value is EditorCategory {
  return value === "archive" || value === "project" || value === "resource";
}

export default async function EditorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedCategory = readSearchValue(params.category).trim();
  const requestedSlug = readSearchValue(params.slug).trim();

  let initialDraft: EditorDraft | null = null;
  let initialSource: EditorDraftSource | null = null;
  let initialMessage: string | null = null;

  if (isEditorCategory(requestedCategory) && requestedSlug) {
    const loaded = await getPersistedEditorDraftBySource({
      rootDir: editorContentRootDir(),
      category: requestedCategory,
      slug: requestedSlug,
    });

    if (loaded) {
      initialDraft = loaded.draft;
      initialSource = loaded.source;
      initialMessage = "Editing existing content.";
    } else {
      initialDraft = createEmptyEditorDraft({
        category: requestedCategory,
      });
      initialMessage = "Requested content was not found. Starting from a fresh draft.";
    }
  }

  return (
    <EditorClient
      initialDraft={initialDraft}
      initialSource={initialSource}
      initialMessage={initialMessage}
    />
  );
}
