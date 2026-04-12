export const EDITOR_CATEGORIES = ["resource", "project", "archive"] as const;

export type EditorCategory = (typeof EDITOR_CATEGORIES)[number];

export type EditorSection = "compose" | "drafts" | "media" | "settings";
export type EditorMode = "edit" | "preview";

export type EditorFileAsset = {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string | null;
};

export type EditorCoverAsset = Omit<EditorFileAsset, "id">;

export type EditorAttachmentAsset = EditorFileAsset;

export type EditorDraftSource = {
  originalCategory: EditorCategory;
  originalSlug: string;
};

export type EditorDraft = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: EditorCategory;
  tags: string[];
  scheduleAt: string | null;
  isHidden: boolean;
  cover: EditorCoverAsset | null;
  assets: EditorAttachmentAsset[];
};

export type EditorFieldErrors = Partial<Record<keyof EditorDraft, string>>;

export type EditorPreferences = {
  defaultCategory: EditorCategory;
  defaultHidden: boolean;
  autoSyncSlug: boolean;
  preferFrontmatterOnImport: boolean;
  defaultMode: EditorMode;
};

export type EditorDraftListItem = {
  title: string;
  slug: string;
  summary: string;
  category: EditorCategory;
  tags: string[];
  date: string;
  updatedAt: string;
  statusLabel: "draft" | "hidden" | "draft-hidden";
};

export type EditorMediaReference = {
  id: string;
  name: string;
  role: "cover" | "asset";
  kind: "image" | "pdf" | "code" | "audio" | "video" | "archive" | "file";
  category: EditorCategory;
  sourceSlug: string;
  sourceTitle: string;
  sourceDate: string;
  isDraft: boolean;
};
