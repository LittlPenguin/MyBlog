export const EDITOR_CATEGORIES = ["resource", "project", "archive"] as const;

export type EditorCategory = (typeof EDITOR_CATEGORIES)[number];

export type EditorMode = "edit" | "preview";

export type EditorFileAsset = {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string | null;
  persistedPath?: string | null;
};

export type EditorCoverAsset = Omit<EditorFileAsset, "id">;

export type EditorAttachmentAsset = EditorFileAsset;

export type EditorDraftSource = {
  originalCategory: EditorCategory;
  originalSlug: string;
};

export type EditorAccent = "primary" | "secondary" | "tertiary";

export type EditorProjectIcon = "grid" | "spark" | "pen" | "layers";

export type EditorProjectMeta = {
  href: string;
  github: string;
  docs: string;
  year: string;
  stack: string[];
  icon: EditorProjectIcon;
  accent: EditorAccent;
};

export type EditorResourceMeta = {
  url: string;
  rating: number;
  monogram: string;
  accent: EditorAccent;
};

export type EditorArchiveMeta = Record<string, never>;

export type EditorDraft = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: EditorCategory;
  tags: string[];
  scheduleAt: string | null;
  projectMeta: EditorProjectMeta;
  resourceMeta: EditorResourceMeta;
  archiveMeta: EditorArchiveMeta;
  cover: EditorCoverAsset | null;
  assets: EditorAttachmentAsset[];
};

export type EditorFieldErrors = Partial<Record<keyof EditorDraft, string>>;
