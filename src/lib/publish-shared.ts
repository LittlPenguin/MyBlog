import type { EditorCategory, EditorDraft, EditorDraftSource, EditorFieldErrors } from "./editor-shared";

export type EditorWriteResult =
  | {
      ok: true;
      message: string;
      slug: string;
      category: EditorCategory;
      outputPath: string;
      draft: EditorDraft;
      source: EditorDraftSource;
    }
  | {
      ok: false;
      message: string;
      errors?: EditorFieldErrors;
    };

export type EditorDeleteResult =
  | {
      ok: true;
      message: string;
      redirectHref: string;
    }
  | {
      ok: false;
      message: string;
    };
