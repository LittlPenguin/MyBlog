"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Eye,
  FileArchive,
  FileCode2,
  FileImage,
  FileMusic,
  FileText,
  FileUp,
  FileVideo,
  Folder,
  Image as ImageIcon,
  LoaderCircle,
  Lock,
  Send,
  Settings2,
  Sparkles,
  Tags,
  UploadCloud,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import {
  buildAttachmentAsset,
  buildCoverAsset,
  createEmptyEditorDraft,
  deriveEditorDraftFromMarkdown,
  EDITOR_CATEGORIES,
  formatEditorFileSize,
  isImageEditorFile,
  normalizeSlug,
  normalizeTags,
  prepareEditorSubmitPayload,
  resolveEditorAssetKind,
  validateEditorDraft,
  type EditorAssetKind,
  type EditorAttachmentAsset,
  type EditorCategory,
  type EditorCoverAsset,
  type EditorDraft,
  type EditorFieldErrors,
} from "@/lib/editor";
import type { EditorWriteResult } from "@/lib/publish-shared";
import { cn } from "@/lib/utils";

type EditorStatus = "idle" | "saving" | "saved" | "error";
type EditorMode = "edit" | "preview";

type NavItem = {
  label: string;
  icon: typeof Edit3;
  active?: boolean;
};

type AssetVisualMeta = {
  kind: EditorAssetKind;
  icon: typeof FileText;
  label: string;
};

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "写作", icon: Edit3, active: true },
  { label: "草稿", icon: Folder },
  { label: "媒体", icon: ImageIcon },
  { label: "设置", icon: Settings2 },
];

const CATEGORY_LABELS: Record<EditorCategory, string> = {
  archive: "归档",
  project: "项目",
  resource: "资源",
};

const ASSET_VISUALS: Record<EditorAssetKind, AssetVisualMeta> = {
  image: { kind: "image", icon: FileImage, label: "图片" },
  pdf: { kind: "pdf", icon: FileText, label: "PDF" },
  code: { kind: "code", icon: FileCode2, label: "代码" },
  audio: { kind: "audio", icon: FileMusic, label: "音频" },
  video: { kind: "video", icon: FileVideo, label: "视频" },
  archive: { kind: "archive", icon: FileArchive, label: "压缩包" },
  file: { kind: "file", icon: FileText, label: "文件" },
};

const INITIAL_TEMPLATE = `# 新文章标题
在这里开始写作。支持常见的 Markdown 语法：

- 列表
- **加粗**
- \`行内代码\`

## 一个小节
写下这篇文章真正想表达的核心观点。
`;

function countWords(input: string) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function countLines(input: string) {
  return input.length === 0 ? 1 : input.split("\n").length;
}

function buildInitialDraft(): EditorDraft {
  return {
    ...createEmptyEditorDraft(),
    content: INITIAL_TEMPLATE,
  };
}

function revokeAssetUrl(asset: EditorCoverAsset | EditorAttachmentAsset | null) {
  if (asset?.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(asset.previewUrl);
  }
}

function describeAsset(asset: Pick<EditorAttachmentAsset, "name" | "type">): AssetVisualMeta {
  return ASSET_VISUALS[resolveEditorAssetKind(asset)];
}

function buildAssetMetaLine(asset: Pick<EditorAttachmentAsset, "name" | "size" | "type">) {
  const visual = describeAsset(asset);
  return `${visual.label} · ${formatEditorFileSize(asset.size)}`;
}

export function EditorClient() {
  const [draft, setDraft] = useState<EditorDraft>(() => buildInitialDraft());
  const [mode, setMode] = useState<EditorMode>("edit");
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [message, setMessage] = useState("当前为预留 API 发布模式。");
  const [errors, setErrors] = useState<EditorFieldErrors>({});
  const autosaveTimerRef = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const preserveActionMessageRef = useRef(false);

  const wordCount = useMemo(() => countWords(draft.content), [draft.content]);
  const lineCount = useMemo(() => countLines(draft.content), [draft.content]);
  const assetSummaryLabel = useMemo(() => {
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
  }, [draft.assets]);

  useEffect(() => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    if (preserveActionMessageRef.current) {
      autosaveTimerRef.current = window.setTimeout(() => {
        preserveActionMessageRef.current = false;
        setMessage("草稿状态已同步到当前会话。");
        autosaveTimerRef.current = null;
      }, 900);

      return () => {
        if (autosaveTimerRef.current !== null) {
          window.clearTimeout(autosaveTimerRef.current);
        }
      };
    }

    setStatus((current) => (current === "saving" ? current : "idle"));
    setMessage("编辑内容已更新，等待下一次发布。");

    autosaveTimerRef.current = window.setTimeout(() => {
      setMessage("草稿状态已同步到当前会话。");
      autosaveTimerRef.current = null;
    }, 700);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draft]);

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
  }

  function preserveNextDraftFeedback() {
    preserveActionMessageRef.current = true;
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
      const nextDraft = deriveEditorDraftFromMarkdown(text);

      preserveNextDraftFeedback();
      setDraft((current) => ({
        ...current,
        ...nextDraft,
      }));
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

    preserveNextDraftFeedback();
    setDraft((current) => {
      if (current.cover?.previewUrl) {
        unregisterObjectUrl(current.cover.previewUrl);
      }

      return {
        ...current,
        cover: nextCover,
      };
    });

    setStatus("saved");
    setMessage(`封面已替换为 ${file.name}。`);
  }

  function clearCover() {
    preserveNextDraftFeedback();
    setDraft((current) => {
      if (current.cover?.previewUrl) {
        unregisterObjectUrl(current.cover.previewUrl);
      }

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

    preserveNextDraftFeedback();
    updateDraft("assets", [...draft.assets, ...nextAssets]);
    setStatus("saved");
    setMessage(`已加入 ${nextAssets.length} 个资源文件。`);
  }

  function removeAsset(assetId: string) {
    const asset = draft.assets.find((entry) => entry.id === assetId) ?? null;

    if (!asset) {
      return;
    }

    preserveNextDraftFeedback();
    setDraft((current) => ({
      ...current,
      assets: current.assets.filter((entry) => entry.id !== assetId),
    }));

    if (asset.previewUrl) {
      unregisterObjectUrl(asset.previewUrl);
    }

    setStatus("saved");
    setMessage(`已移除资源 ${asset.name}。`);
  }

  async function handleSubmit() {
    const payload = prepareEditorSubmitPayload(draft);
    const fieldErrors = validateEditorDraft(payload);

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

      preserveNextDraftFeedback();
      setDraft(payload);
      setStatus("saved");
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

      <aside className="editor-sidebar glass-panel">
        <div>
          <div className="editor-sidebar-brand">
            <h1 className="font-heading text-2xl font-black tracking-[-0.06em] text-foreground">
              YYsuni Admin
            </h1>
            <p className="font-label text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
              Sunset Editor Mode
            </p>
          </div>

          <nav className="editor-admin-nav" aria-label="Editor sections">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={cn("editor-admin-link", item.active && "editor-admin-link-active")}
                  aria-disabled={!item.active}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-label text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <SoftPanel className="editor-admin-profile">
          <div className="editor-admin-avatar">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Editor Session</p>
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Placeholder API Mode
            </p>
          </div>
        </SoftPanel>
      </aside>

      <section className="editor-main">
        <div className="editor-header-row">
          <Reveal>
            <div className="editor-header-copy">
              <h2 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground">
                新建文章 <span className="text-primary italic">/ Create Post</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.04}>
            <div className="editor-header-actions">
              <button
                type="button"
                className="editor-ghost-button"
                onClick={() => importInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4" />
                <span>导入 MD</span>
              </button>

              <button
                type="button"
                className={cn("editor-ghost-button", mode === "preview" && "editor-ghost-button-active")}
                onClick={() => {
                  startTransition(() => {
                    setMode((current) => (current === "edit" ? "preview" : "edit"));
                  });
                }}
              >
                <Eye className="h-4 w-4" />
                <span>{mode === "preview" ? "返回编辑" : "预览"}</span>
              </button>

              <button type="button" className="editor-ghost-button" aria-disabled="true">
                <Settings2 className="h-4 w-4" />
                <span>API Key</span>
              </button>

              <button
                type="button"
                className="editor-primary-button"
                onClick={handleSubmit}
                disabled={status === "saving"}
              >
                {status === "saving" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{status === "saving" ? "发布中..." : "发布文章"}</span>
              </button>
            </div>
          </Reveal>
        </div>

        <div className="editor-grid">
          <Reveal className="editor-main-panel" delay={0.05}>
            <GlassPanel className="editor-writer-panel">
              <label className="editor-field">
                <span className="sr-only">文章标题</span>
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  className="editor-title-input"
                  placeholder="请输入文章标题..."
                />
              </label>
              {errors.title ? <p className="editor-field-error">{errors.title}</p> : null}

              <div className="editor-slug-row">
                <span className="editor-inline-label">Post Slug</span>
                <input
                  value={draft.slug}
                  onChange={(event) => updateDraft("slug", normalizeSlug(event.target.value))}
                  className="editor-slug-input"
                  placeholder="article-url-slug"
                />
              </div>
              {errors.slug ? <p className="editor-field-error">{errors.slug}</p> : null}

              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="editor-body-shell"
              >
                {mode === "edit" ? (
                  <textarea
                    value={draft.content}
                    onChange={(event) => updateDraft("content", event.target.value)}
                    className="editor-content-input custom-scrollbar"
                    placeholder="在这里开始创作...（支持 Markdown）"
                  />
                ) : (
                  <div className="editor-preview prose-sunset custom-scrollbar">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {draft.content || "暂无预览内容。"}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
              {errors.content ? <p className="editor-field-error">{errors.content}</p> : null}

              <div className="editor-footer-row">
                <div className="editor-meta-inline">
                  <span>Words: {wordCount}</span>
                  <span>Lines: {lineCount}</span>
                  <span>Assets: {draft.assets.length}</span>
                </div>

                <div className="editor-status-inline">
                  <span
                    className={cn(
                      "editor-status-dot",
                      status === "saved" && "editor-status-dot-success",
                      status === "error" && "editor-status-dot-error",
                    )}
                  />
                  <span>{message}</span>
                </div>
              </div>
            </GlassPanel>
          </Reveal>

          <div className="editor-side-panel">
            <Reveal delay={0.08}>
              <GlassPanel className="editor-side-card editor-side-card-cover">
                <div className="editor-side-heading">
                  <Pill active className="gap-2">
                    <FileImage className="h-3 w-3" />
                    封面图管理
                  </Pill>
                  {draft.cover ? (
                    <span className="editor-cover-chip">{buildAssetMetaLine(draft.cover)}</span>
                  ) : null}
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className="editor-cover-dropzone"
                  onClick={() => coverInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    coverInputRef.current?.click();
                  }}
                >
                  {draft.cover?.previewUrl ? (
                    <div className="editor-cover-preview-shell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.cover.previewUrl}
                        alt={draft.cover.name}
                        className="editor-cover-preview-image"
                      />
                      <div className="editor-cover-overlay">
                        <span className="editor-cover-overlay-action">
                          <UploadCloud className="h-4 w-4" />
                          更换封面
                        </span>
                        <button
                          type="button"
                          className="editor-cover-overlay-action editor-cover-overlay-action-danger"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            clearCover();
                          }}
                        >
                          <X className="h-4 w-4" />
                          移除封面
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="editor-cover-empty">
                      <div className="editor-cover-empty-icon">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="editor-cover-empty-copy">
                        <span className="editor-cover-empty-title">上传文章封面</span>
                        <span className="editor-cover-empty-subtle">
                          仅支持本地图片，选择后立即预览
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {draft.cover ? (
                  <div className="editor-cover-meta">
                    <div className="editor-cover-meta-copy">
                      <p className="editor-asset-name">{draft.cover.name}</p>
                      <p className="editor-asset-subtle">
                        {draft.cover.type || "未知类型"} · {formatEditorFileSize(draft.cover.size)}
                      </p>
                    </div>
                    <div className="editor-cover-meta-actions">
                      <button
                        type="button"
                        className="editor-text-button"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        更换
                      </button>
                      <button type="button" className="editor-text-button" onClick={clearCover}>
                        移除
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="editor-side-caption">封面会在当前草稿会话中保留，不会真实上传。</p>
                )}
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.1}>
              <GlassPanel className="editor-side-card">
                <div className="editor-side-heading">
                  <Pill active>摘要 / Abstract</Pill>
                </div>
                <textarea
                  value={draft.summary}
                  onChange={(event) => updateDraft("summary", event.target.value)}
                  className="editor-side-textarea"
                  placeholder="输入文章摘要..."
                  rows={5}
                />
                {errors.summary ? <p className="editor-field-error">{errors.summary}</p> : null}
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.12}>
              <GlassPanel className="editor-side-card">
                <div className="editor-side-heading">
                  <Pill active>栏目 / Category</Pill>
                </div>
                <div className="editor-category-grid">
                  {EDITOR_CATEGORIES.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={cn(
                        "editor-category-button",
                        draft.category === entry && "editor-category-button-active",
                      )}
                      onClick={() => updateDraft("category", entry)}
                    >
                      {CATEGORY_LABELS[entry]}
                    </button>
                  ))}
                </div>
                {errors.category ? <p className="editor-field-error">{errors.category}</p> : null}
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.14}>
              <GlassPanel className="editor-side-card">
                <div className="editor-side-heading">
                  <Pill active className="gap-2">
                    <CalendarDays className="h-3 w-3" />
                    发布时间
                  </Pill>
                </div>
                <div className="editor-schedule-field">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={draft.scheduleAt ?? ""}
                    onChange={(event) => updateDraft("scheduleAt", event.target.value || null)}
                    className="editor-schedule-input"
                  />
                </div>
                {errors.scheduleAt ? <p className="editor-field-error">{errors.scheduleAt}</p> : null}
                <label className="editor-toggle-row">
                  <div className="editor-toggle-copy">
                    <Lock className="h-4 w-4" />
                    <span>存为私密 / Hidden</span>
                  </div>
                  <input
                    type="checkbox"
                    className="editor-hidden-checkbox"
                    checked={draft.isHidden}
                    onChange={(event) => updateDraft("isHidden", event.target.checked)}
                  />
                </label>
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.16}>
              <GlassPanel className="editor-side-card">
                <div className="editor-side-heading">
                  <Pill active className="gap-2">
                    <Tags className="h-3 w-3" />
                    Tags
                  </Pill>
                </div>

                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    event.preventDefault();
                    addTag(tagInput);
                  }}
                  className="editor-side-input"
                  placeholder="按回车添加标签"
                />

                <div className="editor-tag-list">
                  {draft.tags.length > 0 ? (
                    draft.tags.map((tag) => (
                      <span key={tag} className="editor-tag-chip">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`移除标签 ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">暂未添加标签。</p>
                  )}
                </div>
              </GlassPanel>
            </Reveal>

            <Reveal delay={0.18}>
              <GlassPanel className="editor-side-card">
                <div className="editor-side-heading">
                  <Pill active className="gap-2">
                    <UploadCloud className="h-3 w-3" />
                    文章资源
                  </Pill>
                  <button
                    type="button"
                    className="editor-text-button"
                    onClick={() => assetInputRef.current?.click()}
                  >
                    添加资源
                  </button>
                </div>

                <p className="editor-side-caption">{assetSummaryLabel}</p>

                <div className="editor-asset-grid">
                  <button
                    type="button"
                    className="editor-asset-add"
                    onClick={() => assetInputRef.current?.click()}
                  >
                    <UploadCloud className="h-5 w-5" />
                    <span>添加资源</span>
                    <span className="editor-asset-add-subtle">支持图片、PDF、代码和常见文件</span>
                  </button>

                  {draft.assets.map((asset) => {
                    const visual = describeAsset(asset);
                    const Icon = visual.icon;
                    const isImageAsset = visual.kind === "image" && Boolean(asset.previewUrl);

                    return (
                      <div
                        key={asset.id}
                        className={cn(
                          "editor-asset-card",
                          isImageAsset ? "editor-asset-card-image" : "editor-asset-card-file",
                        )}
                      >
                        {isImageAsset ? (
                          <div className="editor-asset-image-shell">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={asset.previewUrl ?? ""}
                              alt={asset.name}
                              className="editor-asset-image"
                            />
                            <div className="editor-asset-image-overlay">
                              <span className="editor-asset-image-label">{visual.label}</span>
                              <button
                                type="button"
                                className="editor-asset-remove editor-asset-remove-floating"
                                onClick={() => removeAsset(asset.id)}
                                aria-label={`移除资源 ${asset.name}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="editor-asset-image-meta">
                              <p className="editor-asset-name">{asset.name}</p>
                              <p className="editor-asset-subtle">{buildAssetMetaLine(asset)}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="editor-asset-icon">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="editor-asset-copy">
                              <p className="editor-asset-name">{asset.name}</p>
                              <p className="editor-asset-subtle">{buildAssetMetaLine(asset)}</p>
                            </div>
                            <button
                              type="button"
                              className="editor-asset-remove"
                              onClick={() => removeAsset(asset.id)}
                              aria-label={`移除资源 ${asset.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassPanel>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
