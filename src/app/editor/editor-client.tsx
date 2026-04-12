"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyEditorTitleChange,
  buildAttachmentAsset,
  buildAttachmentAssetReference,
  buildCoverAsset,
  buildCoverAssetReference,
  createDefaultEditorPreferences,
  deriveEditorDraftFromMarkdown,
  EDITOR_PREFERENCES_STORAGE_KEY,
  hasMeaningfulEditorChanges,
  isImageEditorFile,
  normalizeSlug,
  normalizeTags,
  prepareEditorSubmitPayload,
  resolveEditorPreferences,
  type EditorDraft,
  type EditorDraftListItem,
  type EditorDraftSource,
  type EditorFieldErrors,
  type EditorMediaReference,
  type EditorMode,
  type EditorPreferences,
  type EditorSection,
} from "@/lib/editor";
import type { EditorWriteResult } from "@/lib/publish-shared";
import {
  buildInitialDraft,
  countLines,
  countWords,
  describeAsset,
  INITIAL_TEMPLATE,
  isSlugCustom,
} from "./editor-helpers";
import {
  EditorComposePanel,
  EditorDraftsPanel,
  EditorMediaPanel,
  EditorSettingsPanel,
  EditorSidebar,
} from "./editor-sections";

type EditorStatus = "idle" | "saving" | "saved" | "error";

type DraftListResponse = {
  ok: true;
  drafts: EditorDraftListItem[];
};

type DraftDetailResponse = {
  ok: boolean;
  draft?: EditorDraft;
  source?: EditorDraftSource;
  message?: string;
};

type MediaResponse = {
  ok: true;
  items: EditorMediaReference[];
};

function createBlankDraftFromPreferences(preferences: EditorPreferences) {
  return buildInitialDraft(preferences);
}

function createAssetSummaryLabel(draft: EditorDraft) {
  if (draft.assets.length === 0) {
    return "尚未加入资源文件。";
  }

  const imageCount = draft.assets.filter((asset) => describeAsset(asset).kind === "image").length;
  const fileCount = draft.assets.length - imageCount;

  if (imageCount > 0 && fileCount > 0) {
    return `已加入 ${imageCount} 张图片与 ${fileCount} 个文件。`;
  }

  if (imageCount > 0) {
    return `已加入 ${imageCount} 张图片资源。`;
  }

  return `已加入 ${fileCount} 个文件资源。`;
}

export function EditorClient() {
  const [preferences, setPreferences] = useState<EditorPreferences>(() => createDefaultEditorPreferences());
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [activeSection, setActiveSection] = useState<EditorSection>("compose");
  const [draft, setDraft] = useState<EditorDraft>(() => createBlankDraftFromPreferences(createDefaultEditorPreferences()));
  const [draftSource, setDraftSource] = useState<EditorDraftSource | null>(null);
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [mode, setMode] = useState<EditorMode>("edit");
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [message, setMessage] = useState("编辑器已准备就绪。");
  const [errors, setErrors] = useState<EditorFieldErrors>({});
  const [drafts, setDrafts] = useState<EditorDraftListItem[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftActionKey, setDraftActionKey] = useState<string | null>(null);
  const [media, setMedia] = useState<EditorMediaReference[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "cover" | "asset">("all");
  const [mediaQuery, setMediaQuery] = useState("");
  const [composeBaseline, setComposeBaseline] = useState<EditorDraft>(() =>
    createBlankDraftFromPreferences(createDefaultEditorPreferences()),
  );
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const wordCount = useMemo(() => countWords(draft.content), [draft.content]);
  const lineCount = useMemo(() => countLines(draft.content), [draft.content]);
  const assetSummaryLabel = useMemo(() => createAssetSummaryLabel(draft), [draft]);

  const filteredMedia = useMemo(() => {
    const query = mediaQuery.trim().toLowerCase();

    return media.filter((item) => {
      const matchesFilter = mediaFilter === "all" || item.role === mediaFilter;
      const haystack = `${item.name} ${item.sourceTitle} ${item.sourceSlug}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [media, mediaFilter, mediaQuery]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EDITOR_PREFERENCES_STORAGE_KEY);
      const resolved = resolveEditorPreferences(raw ? JSON.parse(raw) : null);
      const nextDraft = createBlankDraftFromPreferences(resolved);
      setPreferences(resolved);
      setDraft(nextDraft);
      setComposeBaseline(nextDraft);
      setMode(resolved.defaultMode);
    } catch {
      const defaults = createDefaultEditorPreferences();
      const nextDraft = createBlankDraftFromPreferences(defaults);
      setPreferences(defaults);
      setDraft(nextDraft);
      setComposeBaseline(nextDraft);
      setMode(defaults.defaultMode);
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady) {
      return;
    }

    window.localStorage.setItem(EDITOR_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, preferencesReady]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (activeSection === "drafts") {
      void loadDrafts();
    }

    if (activeSection === "media") {
      void loadMedia();
    }
  }, [activeSection]);

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

  function updateDraft<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });

    setStatus("idle");
  }

  function applyNextDraft(nextDraft: EditorDraft, source: EditorDraftSource | null) {
    clearBlobAssetsFromDraft(draft);
    setDraft(nextDraft);
    setComposeBaseline(nextDraft);
    setDraftSource(source);
    setIsSlugTouched(isSlugCustom(nextDraft));
    setErrors({});
    setStatus("saved");
    setMessage(source ? "草稿已载入写作区。" : "已切换到新的写作草稿。");
  }

  function createFreshDraft() {
    const nextDraft = createBlankDraftFromPreferences(preferences);
    applyNextDraft(nextDraft, null);
    setMode(preferences.defaultMode);
    setTagInput("");
    setActiveSection("compose");
  }

  async function loadDrafts() {
    setDraftsLoading(true);

    try {
      const response = await fetch("/editor/api/drafts", { cache: "no-store" });
      const result = (await response.json()) as DraftListResponse;
      setDrafts(result.drafts ?? []);
    } catch {
      setStatus("error");
      setMessage("草稿列表读取失败。");
    } finally {
      setDraftsLoading(false);
    }
  }

  async function loadMedia() {
    setMediaLoading(true);

    try {
      const response = await fetch("/editor/api/media", { cache: "no-store" });
      const result = (await response.json()) as MediaResponse;
      setMedia(result.items ?? []);
    } catch {
      setStatus("error");
      setMessage("媒体索引读取失败。");
    } finally {
      setMediaLoading(false);
    }
  }

  function handleTitleChange(value: string) {
    const result = applyEditorTitleChange({
      draft,
      nextTitle: value,
      autoSyncSlug: preferences.autoSyncSlug,
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
        preferFrontmatter: preferences.preferFrontmatterOnImport,
      });

      setDraft((current) => ({
        ...current,
        ...imported,
      }));
      setComposeBaseline((current) => ({
        ...current,
        ...imported,
      }));
      setDraftSource(null);
      setIsSlugTouched(isSlugCustom(imported));
      setErrors({});
      setStatus("saved");
      setMessage(`已导入 ${file.name}，草稿内容已更新。`);
    } catch {
      setStatus("error");
      setMessage("Markdown 导入失败，文件内容无法解析。");
    }
  }

  function handleCoverSelection(file: File | null) {
    if (!file) {
      return;
    }

    if (!isImageEditorFile(file)) {
      setStatus("error");
      setMessage("封面仅支持图片文件，请重新选择 PNG、JPG、WEBP 等图片格式。");
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

    setStatus("saved");
    setMessage(`封面已替换为 ${file.name}。`);
  }

  function clearCover() {
    setDraft((current) => {
      unregisterObjectUrl(current.cover?.previewUrl ?? null);
      return {
        ...current,
        cover: null,
      };
    });
    setStatus("saved");
    setMessage("封面已移除。");
  }

  function handleAssetSelection(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextAssets = Array.from(files).map((file) => {
      const previewUrl = isImageEditorFile(file) ? URL.createObjectURL(file) : null;
      registerObjectUrl(previewUrl);
      return buildAttachmentAsset(file, previewUrl);
    });

    updateDraft("assets", [...draft.assets, ...nextAssets]);
    setStatus("saved");
    setMessage(`已加入 ${nextAssets.length} 个资源文件。`);
  }

  function removeAsset(assetId: string) {
    const asset = draft.assets.find((entry) => entry.id === assetId) ?? null;

    if (!asset) {
      return;
    }

    unregisterObjectUrl(asset.previewUrl);
    setDraft((current) => ({
      ...current,
      assets: current.assets.filter((entry) => entry.id !== assetId),
    }));
    setStatus("saved");
    setMessage(`已移除资源 ${asset.name}。`);
  }

  function validatePayload(payload: ReturnType<typeof prepareEditorSubmitPayload> & { source: EditorDraftSource | null }) {
    const nextErrors: EditorFieldErrors = {};

    if (!payload.title.trim()) {
      nextErrors.title = "请输入文章标题。";
    }

    if (!payload.slug.trim()) {
      nextErrors.slug = "请输入文章 slug。";
    }

    if (!payload.summary.trim()) {
      nextErrors.summary = "请输入文章摘要。";
    }

    if (!payload.content.trim()) {
      nextErrors.content = "请输入正文内容。";
    }

    if (
      payload.scheduleAt &&
      Number.isNaN(Date.parse(payload.scheduleAt.includes("T") ? payload.scheduleAt : payload.scheduleAt.replace(" ", "T")))
    ) {
      nextErrors.scheduleAt = "请输入有效的发布时间。";
    }

    return nextErrors;
  }

  async function handleSubmit() {
    const payload = {
      ...prepareEditorSubmitPayload(draft),
      source: draftSource,
    };
    const fieldErrors = validatePayload(payload);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setStatus("error");
      setMessage("发布失败，请先修正必填字段。");
      return;
    }

    setErrors({});
    setStatus("saving");
    setMessage("正在发送发布请求...");

    try {
      const response = await fetch("/editor/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as EditorWriteResult;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setErrors(result.ok ? {} : (result.errors ?? {}));
        setMessage(result.message || "发布请求失败。");
        return;
      }

      setDraftSource({
        originalCategory: result.category,
        originalSlug: result.slug,
      });
      setComposeBaseline(draft);
      setStatus("saved");
      setMessage(result.message);
      void Promise.all([loadDrafts(), loadMedia()]);
    } catch {
      setStatus("error");
      setMessage("网络错误，发布请求未完成。");
    }
  }

  async function handleContinueEdit(item: EditorDraftListItem) {
    if (hasMeaningfulEditorChanges(draft, composeBaseline)) {
      const confirmed = window.confirm("当前写作区存在未发布内容，是否仍然载入选中的草稿？");
      if (!confirmed) {
        return;
      }
    }

    setDraftActionKey(`${item.category}:${item.slug}:load`);

    try {
      const response = await fetch(`/editor/api/drafts/${item.category}/${item.slug}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as DraftDetailResponse;

      if (!response.ok || !result.ok || !result.draft || !result.source) {
        setStatus("error");
        setMessage(result.message || "草稿加载失败。");
        return;
      }

      applyNextDraft(result.draft, result.source);
      setActiveSection("compose");
      setMode(preferences.defaultMode);
      setTagInput("");
    } catch {
      setStatus("error");
      setMessage("草稿加载失败。");
    } finally {
      setDraftActionKey(null);
    }
  }

  async function handlePublishDraft(item: EditorDraftListItem) {
    setDraftActionKey(`${item.category}:${item.slug}:publish`);

    try {
      const response = await fetch(`/editor/api/drafts/${item.category}/${item.slug}/publish`, {
        method: "POST",
      });
      const result = (await response.json()) as EditorWriteResult;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message || "草稿发布失败。");
        return;
      }

      setStatus("saved");
      setMessage(result.message);
      await Promise.all([loadDrafts(), loadMedia()]);
    } catch {
      setStatus("error");
      setMessage("草稿发布失败。");
    } finally {
      setDraftActionKey(null);
    }
  }

  function handleApplyMediaAsCover(item: EditorMediaReference) {
    setDraft((current) => ({
      ...current,
      cover: buildCoverAssetReference(item.name),
    }));
    setActiveSection("compose");
    setStatus("saved");
    setMessage(`已将 ${item.name} 设为当前草稿封面。`);
  }

  function handleApplyMediaAsAsset(item: EditorMediaReference) {
    setDraft((current) => {
      if (current.assets.some((asset) => asset.name === item.name)) {
        return current;
      }

      return {
        ...current,
        assets: [...current.assets, buildAttachmentAssetReference(item.name)],
      };
    });
    setActiveSection("compose");
    setStatus("saved");
    setMessage(`已将 ${item.name} 加入当前草稿资源。`);
  }

  function updatePreference<K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    if (key === "defaultMode") {
      setMode(value as EditorMode);
    }
  }

  function resetPreferences() {
    const defaults = createDefaultEditorPreferences();
    setPreferences(defaults);
    setMode(defaults.defaultMode);
    setStatus("saved");
    setMessage("编辑器偏好已恢复默认。");
  }

  if (!preferencesReady) {
    return (
      <div className="editor-screen">
        <div className="editor-main">
          <div className="editor-cover-empty">
            <span className="editor-cover-empty-title">正在载入编辑器配置...</span>
          </div>
        </div>
      </div>
    );
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

      <EditorSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <section className="editor-main">
        {activeSection === "compose" ? (
          <EditorComposePanel
            draft={draft}
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
            onTitleChange={handleTitleChange}
            onSlugChange={handleSlugChange}
            onSummaryChange={(value) => updateDraft("summary", value)}
            onContentChange={(value) => updateDraft("content", value)}
            onCategoryChange={(value) => updateDraft("category", value)}
            onScheduleChange={(value) => updateDraft("scheduleAt", value)}
            onHiddenChange={(value) => updateDraft("isHidden", value)}
            onTagInputChange={setTagInput}
            onTagAdd={() => addTag(tagInput)}
            onTagRemove={removeTag}
            onToggleMode={() => setMode((current) => (current === "edit" ? "preview" : "edit"))}
            onSubmit={handleSubmit}
            onClearCover={clearCover}
            onRemoveAsset={removeAsset}
          />
        ) : null}

        {activeSection === "drafts" ? (
          <EditorDraftsPanel
            drafts={drafts}
            draftsLoading={draftsLoading}
            draftActionKey={draftActionKey}
            onCreateDraft={createFreshDraft}
            onContinueEdit={handleContinueEdit}
            onPublish={handlePublishDraft}
          />
        ) : null}

        {activeSection === "media" ? (
          <EditorMediaPanel
            media={filteredMedia}
            mediaFilter={mediaFilter}
            mediaQuery={mediaQuery}
            mediaLoading={mediaLoading}
            onMediaFilterChange={setMediaFilter}
            onMediaQueryChange={setMediaQuery}
            onApplyCover={handleApplyMediaAsCover}
            onApplyAsset={handleApplyMediaAsAsset}
          />
        ) : null}

        {activeSection === "settings" ? (
          <EditorSettingsPanel
            preferences={preferences}
            onUpdatePreference={updatePreference}
            onResetPreferences={resetPreferences}
          />
        ) : null}
      </section>
    </div>
  );
}
