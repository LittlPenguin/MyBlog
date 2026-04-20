"use client";

import { startTransition, type RefObject } from "react";
import {
  CalendarDays,
  Eye,
  FileImage,
  FileUp,
  Globe,
  Link2,
  LoaderCircle,
  Send,
  Sparkles,
  Star,
  Tags,
  UploadCloud,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel, Pill } from "@/components/site/ui";
import {
  EDITOR_CATEGORIES,
  type EditorAccent,
  type EditorCategory,
  type EditorDraft,
  type EditorFieldErrors,
  type EditorMode,
  type EditorProjectIcon,
} from "@/lib/editor";
import { cn } from "@/lib/utils";
import {
  ACCENT_LABELS,
  buildAssetMetaLine,
  CATEGORY_LABELS,
  describeAsset,
  PROJECT_ICON_LABELS,
} from "./editor-helpers";

type EditorStatus = "idle" | "saving" | "saved" | "error";

type ComposePanelProps = {
  draft: EditorDraft;
  mode: EditorMode;
  errors: EditorFieldErrors;
  status: EditorStatus;
  message: string;
  tagInput: string;
  wordCount: number;
  lineCount: number;
  assetSummaryLabel: string;
  importInputRef: RefObject<HTMLInputElement | null>;
  coverInputRef: RefObject<HTMLInputElement | null>;
  assetInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCategoryChange: (value: EditorCategory) => void;
  onScheduleChange: (value: string | null) => void;
  onProjectMetaChange: <K extends keyof EditorDraft["projectMeta"]>(
    key: K,
    value: EditorDraft["projectMeta"][K],
  ) => void;
  onResourceMetaChange: <K extends keyof EditorDraft["resourceMeta"]>(
    key: K,
    value: EditorDraft["resourceMeta"][K],
  ) => void;
  onTagInputChange: (value: string) => void;
  onTagAdd: () => void;
  onTagRemove: (tag: string) => void;
  onToggleMode: () => void;
  onSubmit: () => void;
  onClearCover: () => void;
  onRemoveAsset: (assetId: string) => void;
};

function AccentSelector({
  value,
  onChange,
}: {
  value: EditorAccent;
  onChange: (value: EditorAccent) => void;
}) {
  return (
    <div className="editor-category-grid">
      {(Object.keys(ACCENT_LABELS) as EditorAccent[]).map((accent) => (
        <button
          key={accent}
          type="button"
          className={cn("editor-category-button", value === accent && "editor-category-button-active")}
          onClick={() => onChange(accent)}
        >
          {ACCENT_LABELS[accent]}
        </button>
      ))}
    </div>
  );
}

function ProjectIconSelector({
  value,
  onChange,
}: {
  value: EditorProjectIcon;
  onChange: (value: EditorProjectIcon) => void;
}) {
  return (
    <div className="editor-category-grid">
      {(Object.keys(PROJECT_ICON_LABELS) as EditorProjectIcon[]).map((icon) => (
        <button
          key={icon}
          type="button"
          className={cn("editor-category-button", value === icon && "editor-category-button-active")}
          onClick={() => onChange(icon)}
        >
          {PROJECT_ICON_LABELS[icon]}
        </button>
      ))}
    </div>
  );
}

export function EditorComposePanel({
  draft,
  mode,
  errors,
  status,
  message,
  tagInput,
  wordCount,
  lineCount,
  assetSummaryLabel,
  importInputRef,
  coverInputRef,
  assetInputRef,
  onTitleChange,
  onSlugChange,
  onSummaryChange,
  onContentChange,
  onCategoryChange,
  onScheduleChange,
  onProjectMetaChange,
  onResourceMetaChange,
  onTagInputChange,
  onTagAdd,
  onTagRemove,
  onToggleMode,
  onSubmit,
  onClearCover,
  onRemoveAsset,
}: ComposePanelProps) {
  return (
    <>
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
            <button type="button" className="editor-ghost-button" onClick={() => importInputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              <span>导入 MD</span>
            </button>

            <button
              type="button"
              className={cn("editor-ghost-button", mode === "preview" && "editor-ghost-button-active")}
              onClick={() => {
                startTransition(() => {
                  onToggleMode();
                });
              }}
            >
              <Eye className="h-4 w-4" />
              <span>{mode === "preview" ? "返回编辑" : "预览"}</span>
            </button>

            <button type="button" className="editor-primary-button" onClick={onSubmit} disabled={status === "saving"}>
              {status === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
                onChange={(event) => onTitleChange(event.target.value)}
                className="editor-title-input"
                placeholder="请输入文章标题..."
              />
            </label>
            {errors.title ? <p className="editor-field-error">{errors.title}</p> : null}

            <div className="editor-slug-row">
              <span className="editor-inline-label">Post Slug</span>
              <input
                value={draft.slug}
                onChange={(event) => onSlugChange(event.target.value)}
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
                  onChange={(event) => onContentChange(event.target.value)}
                  className="editor-content-input custom-scrollbar"
                  placeholder="在这里开始创作，支持 Markdown。"
                />
              ) : (
                <div className="editor-preview prose-sunset custom-scrollbar">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content || "暂无预览内容。"}</ReactMarkdown>
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
                {draft.cover ? <span className="editor-cover-chip">{buildAssetMetaLine(draft.cover)}</span> : null}
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
                    <img src={draft.cover.previewUrl} alt={draft.cover.name} className="editor-cover-preview-image" />
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
                          onClearCover();
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
                      <span className="editor-cover-empty-subtle">仅支持本地图片，选择后会立即预览。</span>
                    </div>
                  </div>
                )}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.1}>
            <GlassPanel className="editor-side-card">
              <div className="editor-side-heading">
                <Pill active>摘要 / Abstract</Pill>
              </div>
              <textarea
                value={draft.summary}
                onChange={(event) => onSummaryChange(event.target.value)}
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
                    className={cn("editor-category-button", draft.category === entry && "editor-category-button-active")}
                    onClick={() => onCategoryChange(entry)}
                  >
                    {CATEGORY_LABELS[entry]}
                  </button>
                ))}
              </div>
              {errors.category ? <p className="editor-field-error">{errors.category}</p> : null}
            </GlassPanel>
          </Reveal>

          {draft.category === "project" ? (
            <>
              <Reveal delay={0.13}>
                <GlassPanel className="editor-side-card">
                  <div className="editor-side-heading">
                    <Pill active className="gap-2">
                      <Link2 className="h-3 w-3" />
                      项目链接
                    </Pill>
                  </div>
                  <div className="space-y-3">
                    <input
                      value={draft.projectMeta.href}
                      onChange={(event) => onProjectMetaChange("href", event.target.value)}
                      className="editor-slug-input"
                      placeholder="Website URL"
                    />
                    <input
                      value={draft.projectMeta.github}
                      onChange={(event) => onProjectMetaChange("github", event.target.value)}
                      className="editor-slug-input"
                      placeholder="GitHub URL"
                    />
                    <input
                      value={draft.projectMeta.docs}
                      onChange={(event) => onProjectMetaChange("docs", event.target.value)}
                      className="editor-slug-input"
                      placeholder="Docs URL"
                    />
                  </div>
                </GlassPanel>
              </Reveal>

              <Reveal delay={0.135}>
                <GlassPanel className="editor-side-card">
                  <div className="editor-side-heading">
                    <Pill active className="gap-2">
                      <Globe className="h-3 w-3" />
                      项目配置
                    </Pill>
                  </div>
                  <div className="space-y-3">
                    <input
                      value={draft.projectMeta.year}
                      onChange={(event) => onProjectMetaChange("year", event.target.value)}
                      className="editor-slug-input"
                      placeholder="年份，例如 2026"
                    />
                    <input
                      value={draft.projectMeta.stack.join(", ")}
                      onChange={(event) =>
                        onProjectMetaChange(
                          "stack",
                          event.target.value
                            .split(",")
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        )
                      }
                      className="editor-slug-input"
                      placeholder="技术栈，使用逗号分隔"
                    />
                    <ProjectIconSelector
                      value={draft.projectMeta.icon}
                      onChange={(value) => onProjectMetaChange("icon", value)}
                    />
                    <AccentSelector
                      value={draft.projectMeta.accent}
                      onChange={(value) => onProjectMetaChange("accent", value)}
                    />
                  </div>
                </GlassPanel>
              </Reveal>
            </>
          ) : null}

          {draft.category === "resource" ? (
            <>
              <Reveal delay={0.13}>
                <GlassPanel className="editor-side-card">
                  <div className="editor-side-heading">
                    <Pill active className="gap-2">
                      <Link2 className="h-3 w-3" />
                      资源链接
                    </Pill>
                  </div>
                  <input
                    value={draft.resourceMeta.url}
                    onChange={(event) => onResourceMetaChange("url", event.target.value)}
                    className="editor-slug-input"
                    placeholder="原始资源 URL"
                  />
                </GlassPanel>
              </Reveal>

              <Reveal delay={0.135}>
                <GlassPanel className="editor-side-card">
                  <div className="editor-side-heading">
                    <Pill active className="gap-2">
                      <Star className="h-3 w-3" />
                      资源配置
                    </Pill>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={draft.resourceMeta.rating}
                      onChange={(event) => onResourceMetaChange("rating", Number(event.target.value || 4))}
                      className="editor-slug-input"
                      placeholder="评分 1-5"
                    />
                    <input
                      value={draft.resourceMeta.monogram}
                      onChange={(event) => onResourceMetaChange("monogram", event.target.value)}
                      className="editor-slug-input"
                      placeholder="Monogram，例如 FM"
                    />
                    <AccentSelector
                      value={draft.resourceMeta.accent}
                      onChange={(value) => onResourceMetaChange("accent", value)}
                    />
                  </div>
                </GlassPanel>
              </Reveal>
            </>
          ) : null}

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
                  onChange={(event) => onScheduleChange(event.target.value || null)}
                  className="editor-schedule-input"
                />
              </div>
              {errors.scheduleAt ? <p className="editor-field-error">{errors.scheduleAt}</p> : null}
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.16}>
            <GlassPanel className="editor-side-card">
              <div className="editor-side-heading">
                <Pill active className="gap-2">
                  <Tags className="h-3 w-3" />
                  标签 / Tags
                </Pill>
                <span className="editor-side-caption">{draft.tags.length} 个标签</span>
              </div>

              <div className="editor-slug-row">
                <input
                  value={tagInput}
                  onChange={(event) => onTagInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    event.preventDefault();
                    onTagAdd();
                  }}
                  className="editor-slug-input"
                  placeholder="输入标签后按 Enter"
                />
              </div>

              <div className="editor-tag-list">
                {draft.tags.map((tag) => (
                  <span key={tag} className="editor-tag-chip">
                    #{tag}
                    <button type="button" onClick={() => onTagRemove(tag)} aria-label={`移除标签 ${tag}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.18}>
            <GlassPanel className="editor-side-card">
              <div className="editor-side-heading">
                <Pill active className="gap-2">
                  <Sparkles className="h-3 w-3" />
                  文章资源
                </Pill>
                <span className="editor-side-caption">{assetSummaryLabel}</span>
              </div>

              <div className="editor-asset-grid">
                <button type="button" className="editor-asset-add" onClick={() => assetInputRef.current?.click()}>
                  <UploadCloud className="h-5 w-5" />
                  <span>添加资源</span>
                  <span className="editor-asset-add-subtle">支持图片、PDF、代码片段等本地文件。</span>
                </button>

                {draft.assets.map((asset) => {
                  const visual = describeAsset(asset);
                  const Icon = visual.icon;
                  const isImage = visual.kind === "image" && Boolean(asset.previewUrl);

                  return (
                    <div
                      key={asset.id}
                      className={cn(
                        "editor-asset-card",
                        isImage ? "editor-asset-card-image" : "editor-asset-card-file",
                      )}
                    >
                      {isImage ? (
                        <div className="editor-asset-image-shell">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset.previewUrl ?? ""} alt={asset.name} className="editor-asset-image" />
                          <div className="editor-asset-image-overlay">
                            <span className="editor-asset-image-label">{visual.label}</span>
                            <button
                              type="button"
                              className="editor-asset-remove editor-asset-remove-floating"
                              onClick={() => onRemoveAsset(asset.id)}
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
                            onClick={() => onRemoveAsset(asset.id)}
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
    </>
  );
}
