"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyEditorCategoryChange,
  applyEditorTitleChange,
  buildAttachmentAsset,
  buildCoverAsset,
  deriveEditorDraftFromMarkdown,
  isImageEditorFile,
  normalizeSlug,
  normalizeTags,
  prepareEditorSubmitPayload,
  type EditorDraft,
  type EditorDraftSource,
  type EditorFieldErrors,
  type EditorMode,
} from "@/lib/editor";
import type { EditorWriteResult } from "@/lib/publish-shared";
import { buildInitialDraft, countLines, countWords, describeAsset, isSlugCustom } from "./editor-helpers";
import { EditorComposePanel } from "./editor-sections";

type EditorStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_AUTO_SYNC_SLUG = true;
const DEFAULT_IMPORT_FRONTMATTER = true;
const DEFAULT_MODE: EditorMode = "edit";

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
  const [draft, setDraft] = useState<EditorDraft>(() => buildInitialDraft());
  const [draftSource, setDraftSource] = useState<EditorDraftSource | null>(null);
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [mode, setMode] = useState<EditorMode>(DEFAULT_MODE);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [message, setMessage] = useState("编辑器已准备就绪。");
  const [errors, setErrors] = useState<EditorFieldErrors>({});
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

  function applyPersistedDraft(nextDraft: EditorDraft, source: EditorDraftSource | null) {
    clearBlobAssetsFromDraft(draft);
    coverFileRef.current = null;
    assetFileMapRef.current = new Map();
    setDraft(nextDraft);
    setDraftSource(source);
    setIsSlugTouched(isSlugCustom(nextDraft));
    setErrors({});
    setStatus("saved");
    setMessage("已同步最新发布内容。");
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
    coverFileRef.current = file;

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
    coverFileRef.current = null;
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
      const built = buildAttachmentAsset(file, previewUrl);
      assetFileMapRef.current.set(built.id, file);
      return built;
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
    assetFileMapRef.current.delete(assetId);
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
        setMessage(result.message || "发布请求失败。");
        return;
      }

      coverFileRef.current = null;
      assetFileMapRef.current = new Map();
      applyPersistedDraft(result.draft, result.source);
      setMessage(result.message);
    } catch {
      setStatus("error");
      setMessage("网络错误，发布请求未完成。");
    }
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
          onCategoryChange={(value) =>
            setDraft((current) => applyEditorCategoryChange({ draft: current, nextCategory: value }))
          }
          onScheduleChange={(value) => updateDraft("scheduleAt", value)}
          onHiddenChange={(value) => updateDraft("isHidden", value)}
          onProjectMetaChange={updateProjectMeta}
          onResourceMetaChange={updateResourceMeta}
          onTagInputChange={setTagInput}
          onTagAdd={() => addTag(tagInput)}
          onTagRemove={removeTag}
          onToggleMode={() => setMode((current) => (current === "edit" ? "preview" : "edit"))}
          onSubmit={handleSubmit}
          onClearCover={clearCover}
          onRemoveAsset={removeAsset}
        />
      </section>
    </div>
  );
}
