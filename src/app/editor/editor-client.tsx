"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyEditorCategoryChange,
  applyEditorTitleChange,
  buildEditorDetailHref,
  buildAttachmentAsset,
  buildCoverAsset,
  deriveEditorDraftFromMarkdown,
  isImageEditorFile,
  normalizeSlug,
  normalizeTags,
  prepareEditorSubmitPayload,
  validateEditorDraft,
  type EditorDraft,
  type EditorDraftSource,
  type EditorFieldErrors,
  type EditorMode,
} from "@/lib/editor";
import type { MessageListItem } from "@/lib/messages";
import type { MessageListResponse } from "@/lib/messages-shared";
import type { EditorDeleteResult, EditorWriteResult } from "@/lib/publish-shared";
import { buildInitialDraft, countLines, countWords, describeAsset, isSlugCustom } from "./editor-helpers";
import { EditorMessagePanel } from "./message-panel";
import { EditorComposePanel } from "./editor-sections";

type EditorStatus = "idle" | "saving" | "saved" | "error";
type EditorView = "compose" | "messages";

type EditorClientProps = {
  initialDraft?: EditorDraft | null;
  initialSource?: EditorDraftSource | null;
  initialMessage?: string | null;
};

const DEFAULT_AUTO_SYNC_SLUG = true;
const DEFAULT_IMPORT_FRONTMATTER = true;
const DEFAULT_MODE: EditorMode = "edit";

function createAssetSummaryLabel(draft: EditorDraft) {
  if (draft.assets.length === 0) {
    return "No assets yet.";
  }

  const imageCount = draft.assets.filter((asset) => describeAsset(asset).kind === "image").length;
  const fileCount = draft.assets.length - imageCount;

  if (imageCount > 0 && fileCount > 0) {
    return `${imageCount} images and ${fileCount} files attached.`;
  }

  if (imageCount > 0) {
    return `${imageCount} images attached.`;
  }

  return `${fileCount} files attached.`;
}

export function EditorClient({
  initialDraft = null,
  initialSource = null,
  initialMessage = null,
}: EditorClientProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<EditorDraft>(() => initialDraft ?? buildInitialDraft());
  const [draftSource, setDraftSource] = useState<EditorDraftSource | null>(initialSource);
  const [isSlugTouched, setIsSlugTouched] = useState(() => (initialDraft ? isSlugCustom(initialDraft) : false));
  const [mode, setMode] = useState<EditorMode>(DEFAULT_MODE);
  const [view, setView] = useState<EditorView>("compose");
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [message, setMessage] = useState(initialMessage ?? "Editor ready.");
  const [errors, setErrors] = useState<EditorFieldErrors>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const coverFileRef = useRef<File | null>(null);
  const assetFileMapRef = useRef<Map<string, File>>(new Map());

  const wordCount = useMemo(() => countWords(draft.content), [draft.content]);
  const lineCount = useMemo(() => countLines(draft.content), [draft.content]);
  const assetSummaryLabel = useMemo(() => createAssetSummaryLabel(draft), [draft]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  function registerObjectUrl(url: string | null) {
    if (!url || !url.startsWith("blob:")) {
      return;
    }

    objectUrlsRef.current.push(url);
  }

  function unregisterObjectUrl(url: string | null) {
    if (!url || !url.startsWith("blob:")) {
      return;
    }

    URL.revokeObjectURL(url);
    objectUrlsRef.current = objectUrlsRef.current.filter((entry) => entry !== url);
  }

  function clearBlobAssetsFromDraft(currentDraft: EditorDraft) {
    currentDraft.assets.forEach((asset) => unregisterObjectUrl(asset.previewUrl));
    unregisterObjectUrl(currentDraft.cover?.previewUrl ?? null);
  }

  function clearObjectBackedFiles() {
    coverFileRef.current = null;
    assetFileMapRef.current = new Map();
  }

  function updateErrorsForKey(key: keyof EditorDraft | keyof EditorFieldErrors) {
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateDraft<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    updateErrorsForKey(key);
    setStatus("idle");
  }

  function applyPersistedDraft(nextDraft: EditorDraft, source: EditorDraftSource | null) {
    clearBlobAssetsFromDraft(draft);
    clearObjectBackedFiles();
    setDraft(nextDraft);
    setDraftSource(source);
    setIsSlugTouched(isSlugCustom(nextDraft));
    setErrors({});
    setStatus("saved");
    setMessage("Content synced.");
  }

  function handleTitleChange(value: string) {
    const result = applyEditorTitleChange({
      draft,
      nextTitle: value,
      autoSyncSlug: DEFAULT_AUTO_SYNC_SLUG,
      isSlugTouched,
    });

    setDraft(result.draft);
    setIsSlugTouched(result.isSlugTouched);
    setErrors((current) => {
      const next = { ...current };
      delete next.title;
      if (!isSlugTouched) {
        delete next.slug;
      }
      return next;
    });
    setStatus("idle");
  }

  function updateProjectMeta<K extends keyof EditorDraft["projectMeta"]>(
    key: K,
    value: EditorDraft["projectMeta"][K],
  ) {
    setDraft((current) => ({
      ...current,
      projectMeta: {
        ...current.projectMeta,
        [key]: value,
      },
    }));

    if (key === "href") {
      updateErrorsForKey("projectHref");
    }
    if (key === "github") {
      updateErrorsForKey("projectGithub");
    }
    if (key === "docs") {
      updateErrorsForKey("projectDocs");
    }
    setStatus("idle");
  }

  function updateResourceMeta<K extends keyof EditorDraft["resourceMeta"]>(
    key: K,
    value: EditorDraft["resourceMeta"][K],
  ) {
    setDraft((current) => ({
      ...current,
      resourceMeta: {
        ...current.resourceMeta,
        [key]: value,
      },
    }));

    if (key === "url") {
      updateErrorsForKey("resourceUrl");
    }
    if (key === "topic") {
      updateErrorsForKey("resourceTopic");
    }
    setStatus("idle");
  }

  function updateArchiveTopic(value: string) {
    setDraft((current) => ({
      ...current,
      archiveMeta: {
        ...current.archiveMeta,
        topic: value,
      },
    }));
    updateErrorsForKey("archiveTopic");
    setStatus("idle");
  }

  function handleSlugChange(value: string) {
    updateDraft("slug", normalizeSlug(value));
    setIsSlugTouched(true);
  }

  function addTag(value: string) {
    const normalized = normalizeTags([...draft.tags, value]);

    if (normalized.length === draft.tags.length) {
      setTagInput("");
      return;
    }

    updateDraft("tags", normalized);
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateDraft(
      "tags",
      draft.tags.filter((entry) => entry !== tag),
    );
  }

  async function handleMarkdownImport(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = deriveEditorDraftFromMarkdown(text, {
        preferFrontmatter: DEFAULT_IMPORT_FRONTMATTER,
      });

      setDraft((current) => ({
        ...current,
        ...imported,
      }));
      setDraftSource(null);
      setIsSlugTouched(isSlugCustom(imported));
      setErrors({});
      setStatus("saved");
      setMessage(`Imported ${file.name}.`);
    } catch {
      setStatus("error");
      setMessage("Markdown import failed.");
    }
  }

  function handleCoverSelection(file: File | null) {
    if (!file) {
      return;
    }

    if (!isImageEditorFile(file)) {
      setStatus("error");
      setMessage("Cover must be an image file.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    registerObjectUrl(previewUrl);
    const nextCover = buildCoverAsset(file, previewUrl);

    setDraft((current) => {
      unregisterObjectUrl(current.cover?.previewUrl ?? null);
      return {
        ...current,
        cover: nextCover,
      };
    });
    coverFileRef.current = file;

    setStatus("saved");
    setMessage(`Cover updated: ${file.name}.`);
  }

  function clearCover() {
    setDraft((current) => {
      unregisterObjectUrl(current.cover?.previewUrl ?? null);
      return {
        ...current,
        cover: null,
      };
    });
    coverFileRef.current = null;
    setStatus("saved");
    setMessage("Cover removed.");
  }

  function handleAssetSelection(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextAssets = Array.from(files).map((file) => {
      const previewUrl = isImageEditorFile(file) ? URL.createObjectURL(file) : null;
      registerObjectUrl(previewUrl);
      const built = buildAttachmentAsset(file, previewUrl);
      assetFileMapRef.current.set(built.id, file);
      return built;
    });

    updateDraft("assets", [...draft.assets, ...nextAssets]);
    setStatus("saved");
    setMessage(`${nextAssets.length} assets added.`);
  }

  function removeAsset(assetId: string) {
    const asset = draft.assets.find((entry) => entry.id === assetId) ?? null;

    if (!asset) {
      return;
    }

    unregisterObjectUrl(asset.previewUrl);
    assetFileMapRef.current.delete(assetId);
    setDraft((current) => ({
      ...current,
      assets: current.assets.filter((entry) => entry.id !== assetId),
    }));
    setStatus("saved");
    setMessage(`Removed ${asset.name}.`);
  }

  async function handleSubmit() {
    const payload = {
      ...prepareEditorSubmitPayload(draft),
      source: draftSource,
    };
    const fieldErrors = validateEditorDraft(payload);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("Please fix the highlighted fields before publishing.");
      return;
    }

    setErrors({});
    setStatus("saving");
    setMessage("Publishing...");

    try {
      const formData = new FormData();
      formData.set("payload", JSON.stringify(payload));

      if (coverFileRef.current) {
        formData.set("coverFile", coverFileRef.current);
      }

      draft.assets.forEach((asset) => {
        const file = assetFileMapRef.current.get(asset.id);
        if (file) {
          formData.append("assetFiles", file);
        }
      });

      const response = await fetch("/editor/api/posts", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as EditorWriteResult;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setErrors(result.ok ? {} : (result.errors ?? {}));
        setMessage(result.message || "Publish failed.");
        return;
      }

      applyPersistedDraft(result.draft, result.source);
      setMessage(result.message);
      router.push(buildEditorDetailHref(result.category, result.slug));
    } catch {
      setStatus("error");
      setMessage("Network error while publishing.");
    }
  }

  async function handleDelete() {
    if (!draftSource) {
      return;
    }

    setIsDeleting(true);
    setStatus("saving");
    setMessage("Deleting content...");

    try {
      const response = await fetch("/editor/api/posts", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          source: draftSource,
        }),
      });

      const result = (await response.json()) as EditorDeleteResult;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message || "Delete failed.");
        return;
      }

      router.push(result.redirectHref);
    } catch {
      setStatus("error");
      setMessage("Network error while deleting.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleLogout() {
    setStatus("saving");
    setMessage("Leaving admin mode...");

    try {
      const response = await fetch("/admin/api/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        setStatus("error");
        setMessage("Failed to leave admin mode.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Failed to leave admin mode.");
    }
  }

  async function loadMessages() {
    setMessagesLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "GET",
        cache: "no-store",
      });
      const result = (await response.json()) as MessageListResponse;

      if (!response.ok || !result.ok) {
        setMessageFeedback(result.ok ? "Failed to load messages." : result.message);
        return false;
      }

      setMessages(result.items);
      if (selectedMessageId && !result.items.some((item) => item.id === selectedMessageId)) {
        setSelectedMessageId(null);
      }
      setMessageFeedback("");
      return true;
    } catch {
      setMessageFeedback("Network error while loading messages.");
      return false;
    } finally {
      setMessagesLoading(false);
    }
  }

  async function openMessagesView() {
    setView("messages");
    if (messages.length > 0) {
      return;
    }

    await loadMessages();
  }

  return (
    <div className="editor-screen">
      <input
        ref={importInputRef}
        type="file"
        accept=".md,.mdx,text/markdown,text/plain"
        className="sr-only"
        onChange={(event) => {
          void handleMarkdownImport(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          handleCoverSelection(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <input
        ref={assetInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          handleAssetSelection(event.target.files);
          event.target.value = "";
        }}
      />

      <section className="editor-main">
        {view === "compose" ? (
          <EditorComposePanel
            draft={draft}
            draftSource={draftSource}
            mode={mode}
            errors={errors}
            status={status}
            message={message}
            tagInput={tagInput}
            wordCount={wordCount}
            lineCount={lineCount}
            assetSummaryLabel={assetSummaryLabel}
            importInputRef={importInputRef}
            coverInputRef={coverInputRef}
            assetInputRef={assetInputRef}
            isDeleting={isDeleting}
            onTitleChange={handleTitleChange}
            onSlugChange={handleSlugChange}
            onSummaryChange={(value) => updateDraft("summary", value)}
            onContentChange={(value) => updateDraft("content", value)}
            onCategoryChange={(value) =>
              setDraft((current) => applyEditorCategoryChange({ draft: current, nextCategory: value }))
            }
            onScheduleChange={(value) => updateDraft("scheduleAt", value)}
            onFeaturedChange={(value: boolean) => updateDraft("featured", value)}
            onArchiveTopicChange={updateArchiveTopic}
            onProjectMetaChange={updateProjectMeta}
            onResourceMetaChange={updateResourceMeta}
            onTagInputChange={setTagInput}
            onTagAdd={() => addTag(tagInput)}
            onTagRemove={removeTag}
            onToggleMode={() => setMode((current) => (current === "edit" ? "preview" : "edit"))}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            onClearCover={clearCover}
            onRemoveAsset={removeAsset}
            onLogout={handleLogout}
            onOpenMessages={() => void openMessagesView()}
          />
        ) : (
          <EditorMessagePanel
            items={messages}
            selectedId={selectedMessageId}
            feedback={messageFeedback}
            loading={messagesLoading}
            onBack={() => setView("compose")}
            onRefresh={() => void loadMessages()}
            onSelect={setSelectedMessageId}
            onItemsChange={setMessages}
            onSelectedIdChange={setSelectedMessageId}
            onFeedbackChange={setMessageFeedback}
            onLoadingChange={setMessagesLoading}
          />
        )}
      </section>
    </div>
  );
}
