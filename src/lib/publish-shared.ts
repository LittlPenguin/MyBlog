import type { EditorCategory, EditorFieldErrors } from "./editor-shared";

export type EditorWriteResult =
  | {
      ok: true;
      message: string;
      slug: string;
      category: EditorCategory;
      outputPath: string;
    }
  | {
      ok: false;
      message: string;
      errors?: EditorFieldErrors;
    };
