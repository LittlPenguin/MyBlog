"use client";

import { startTransition, type RefObject } from "react";
import {
  CalendarDays,
  Eye,
  FileImage,
  FileUp,
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
  EDITOR_CATEGORIES,
  type EditorAssetKind,
  type EditorAttachmentAsset,
  type EditorCategory,
  type EditorDraft,
  type EditorDraftListItem,
  type EditorFieldErrors,
  type EditorMediaReference,
  type EditorMode,
  type EditorPreferences,
  type EditorSection,
} from "@/lib/editor";
import { cn } from "@/lib/utils";
import {
  ASSET_VISUALS,
  buildAssetMetaLine,
  CATEGORY_LABELS,
  describeAsset,
  EDITOR_NAV_ITEMS,
} from "./editor-helpers";

type EditorStatus = "idle" | "saving" | "saved" | "error";

type SidebarProps = {
  activeSection: EditorSection;
  onSectionChange: (section: EditorSection) => void;
};

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
  onHiddenChange: (value: boolean) => void;
  onTagInputChange: (value: string) => void;
  onTagAdd: () => void;
  onTagRemove: (tag: string) => void;
  onToggleMode: () => void;
  onSubmit: () => void;
  onClearCover: () => void;
  onRemoveAsset: (assetId: string) => void;
};

type DraftsPanelProps = {
  drafts: EditorDraftListItem[];
  draftsLoading: boolean;
  draftActionKey: string | null;
  onCreateDraft: () => void;
  onContinueEdit: (item: EditorDraftListItem) => void;
  onPublish: (item: EditorDraftListItem) => void;
};

type MediaPanelProps = {
  media: EditorMediaReference[];
  mediaFilter: "all" | "cover" | "asset";
  mediaQuery: string;
  mediaLoading: boolean;
  onMediaFilterChange: (value: "all" | "cover" | "asset") => void;
  onMediaQueryChange: (value: string) => void;
  onApplyCover: (item: EditorMediaReference) => void;
  onApplyAsset: (item: EditorMediaReference) => void;
};

type SettingsPanelProps = {
  preferences: EditorPreferences;
  onUpdatePreference: <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => void;
  onResetPreferences: () => void;
};

const DRAFT_STATUS_LABELS: Record<EditorDraftListItem["statusLabel"], string> = {
  draft: "草稿",
  hidden: "私密",
  "draft-hidden": "草稿 / 私密",
};

const MEDIA_FILTER_LABELS = {
  all: "全部",
  cover: "封面",
  asset: "资源",
} as const;

function MediaKindChip({ kind }: { kind: EditorAssetKind }) {
  const visual = ASSET_VISUALS[kind];
  const Icon = visual.icon;

  return (
    <span className="editor-cover-chip">
      <Icon className="h-3.5 w-3.5" />
      {visual.label}
    </span>
  );
}

function DraftEmptyState() {
  return (
    <GlassPanel className="editor-side-card">
      <div className="editor-cover-empty">
        <div className="editor-cover-empty-icon">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="editor-cover-empty-copy">
          <span className="editor-cover-empty-title">当前没有待处理草稿</span>
          <span className="editor-cover-empty-subtle">隐藏内容或草稿文件会自动显示在这里，方便继续编辑或直接发布。</span>
        </div>
      </div>
    </GlassPanel>
  );
}

function MediaEmptyState() {
  return (
    <GlassPanel className="editor-side-card">
      <div className="editor-cover-empty">
        <div className="editor-cover-empty-icon">
          <FileImage className="h-6 w-6" />
        </div>
        <div className="editor-cover-empty-copy">
          <span className="editor-cover-empty-title">还没有可引用媒体</span>
          <span className="editor-cover-empty-subtle">当内容 frontmatter 中存在 cover 或 assetNames 时，这里会自动生成引用索引。</span>
        </div>
      </div>
    </GlassPanel>
  );
}

export function EditorSidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="editor-sidebar glass-panel">
      <div>
        <div className="editor-sidebar-brand">
          <h1 className="font-heading text-2xl font-black tracking-[-0.06em] text-foreground">YYsuni Admin</h1>
          <p className="font-label text-[10px] uppercase tracking-[0.26em] text-muted-foreground">Sunset Editor Mode</p>
        </div>

        <nav className="editor-admin-nav" aria-label="Editor sections">
          {EDITOR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.section === activeSection;

            return (
              <button
                key={item.section}
                type="button"
                className={cn("editor-admin-link", isActive && "editor-admin-link-active")}
                onClick={() => onSectionChange(item.section)}
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
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Content Source Ready</p>
        </div>
      </SoftPanel>
    </aside>
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
  onHiddenChange,
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

            <button type="button" className="editor-ghost-button" aria-disabled="true">
              <Settings2 className="h-4 w-4" />
              <span>API Key</span>
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
                  placeholder="在这里开始创作...（支持 Markdown）"
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

              {draft.cover ? (
                <div className="editor-cover-meta">
                  <div className="editor-cover-meta-copy">
                    <p className="editor-asset-name">{draft.cover.name}</p>
                    <p className="editor-asset-subtle">
                      {draft.cover.type || "未知类型"} · {buildAssetMetaLine({ ...draft.cover, name: draft.cover.name })}
                    </p>
                  </div>
                  <div className="editor-cover-meta-actions">
                    <button type="button" className="editor-text-button" onClick={() => coverInputRef.current?.click()}>
                      更换
                    </button>
                    <button type="button" className="editor-text-button" onClick={onClearCover}>
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <p className="editor-side-caption">封面只在当前编辑会话中保留，本轮不会真实上传到资产目录。</p>
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
              <label className="editor-toggle-row">
                <div className="editor-toggle-copy">
                  <Lock className="h-4 w-4" />
                  <span>存为私密 / Hidden</span>
                </div>
                <input
                  type="checkbox"
                  className="editor-hidden-checkbox"
                  checked={draft.isHidden}
                  onChange={(event) => onHiddenChange(event.target.checked)}
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
                onChange={(event) => onTagInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }

                  event.preventDefault();
                  onTagAdd();
                }}
                className="editor-side-input"
                placeholder="按回车添加标签"
              />

              <div className="editor-tag-list">
                {draft.tags.length > 0 ? (
                  draft.tags.map((tag) => (
                    <span key={tag} className="editor-tag-chip">
                      #{tag}
                      <button type="button" onClick={() => onTagRemove(tag)} aria-label={`移除标签 ${tag}`}>
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
                <button type="button" className="editor-text-button" onClick={() => assetInputRef.current?.click()}>
                  添加资源
                </button>
              </div>

              <p className="editor-side-caption">{assetSummaryLabel}</p>

              <div className="editor-asset-grid">
                <button type="button" className="editor-asset-add" onClick={() => assetInputRef.current?.click()}>
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

export function EditorDraftsPanel({
  drafts,
  draftsLoading,
  draftActionKey,
  onCreateDraft,
  onContinueEdit,
  onPublish,
}: DraftsPanelProps) {
  return (
    <div className="space-y-5">
      <div className="editor-header-row">
        <Reveal>
          <div className="editor-header-copy">
            <h2 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground">
              草稿箱 <span className="text-primary italic">/ Drafts</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              这里汇总所有处于草稿或私密状态的本地内容文件。你可以直接发布，也可以带回写作区继续修改。
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="editor-header-actions">
            <button type="button" className="editor-ghost-button" onClick={onCreateDraft}>
              <Send className="h-4 w-4" />
              <span>新建空白稿</span>
            </button>
          </div>
        </Reveal>
      </div>

      {draftsLoading ? (
        <GlassPanel className="editor-side-card">
          <div className="editor-cover-empty">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            <span className="editor-cover-empty-title">正在读取草稿...</span>
          </div>
        </GlassPanel>
      ) : drafts.length === 0 ? (
        <DraftEmptyState />
      ) : (
        <div className="editorial-grid lg:grid-cols-2">
          {drafts.map((item, index) => (
            <Reveal key={`${item.category}-${item.slug}`} delay={0.04 * Math.min(index, 5)}>
              <GlassPanel className="editor-side-card flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill active>{CATEGORY_LABELS[item.category]}</Pill>
                  <Pill>{DRAFT_STATUS_LABELS[item.statusLabel]}</Pill>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.date}</span>
                </div>

                <div>
                  <h3 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.summary}</p>
                </div>

                <div className="editor-tag-list">
                  {item.tags.map((tag) => (
                    <span key={tag} className="editor-tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    更新于 {new Date(item.updatedAt).toLocaleString("zh-CN")}
                  </span>
                  <div className="flex items-center gap-3">
                    <button type="button" className="editor-text-button" onClick={() => onContinueEdit(item)}>
                      继续编辑
                    </button>
                    <button
                      type="button"
                      className="editor-primary-button"
                      onClick={() => onPublish(item)}
                      disabled={draftActionKey === `${item.category}:${item.slug}:publish`}
                    >
                      {draftActionKey === `${item.category}:${item.slug}:publish` ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>直接发布</span>
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorMediaPanel({
  media,
  mediaFilter,
  mediaQuery,
  mediaLoading,
  onMediaFilterChange,
  onMediaQueryChange,
  onApplyCover,
  onApplyAsset,
}: MediaPanelProps) {
  return (
    <div className="space-y-5">
      <div className="editor-header-row">
        <Reveal>
          <div className="editor-header-copy">
            <h2 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground">
              媒体索引 <span className="text-primary italic">/ Media</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              媒体页不会读取实际图片资源，而是从已存在内容的封面和资源引用中生成索引，方便回填到当前文章草稿。
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="editor-header-actions">
            {(Object.keys(MEDIA_FILTER_LABELS) as Array<keyof typeof MEDIA_FILTER_LABELS>).map((filter) => (
              <button
                key={filter}
                type="button"
                className={cn("editor-ghost-button", mediaFilter === filter && "editor-ghost-button-active")}
                onClick={() => onMediaFilterChange(filter)}
              >
                <span>{MEDIA_FILTER_LABELS[filter]}</span>
              </button>
            ))}
            <input
              value={mediaQuery}
              onChange={(event) => onMediaQueryChange(event.target.value)}
              className="editor-side-input"
              placeholder="搜索媒体名称或来源..."
            />
          </div>
        </Reveal>
      </div>

      {mediaLoading ? (
        <GlassPanel className="editor-side-card">
          <div className="editor-cover-empty">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            <span className="editor-cover-empty-title">正在整理媒体索引...</span>
          </div>
        </GlassPanel>
      ) : media.length === 0 ? (
        <MediaEmptyState />
      ) : (
        <div className="editorial-grid lg:grid-cols-2">
          {media.map((item, index) => (
            <Reveal key={item.id} delay={0.03 * Math.min(index, 7)}>
              <GlassPanel className="editor-side-card flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill active>{item.role === "cover" ? "封面" : "资源"}</Pill>
                  <Pill>{CATEGORY_LABELS[item.category]}</Pill>
                  <MediaKindChip kind={item.kind} />
                  {item.isDraft ? <Pill>草稿源</Pill> : null}
                </div>

                <div>
                  <h3 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">{item.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    来源于《{item.sourceTitle}》 · {item.sourceDate}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    /{item.category}/{item.sourceSlug}
                  </span>
                  <div className="flex items-center gap-3">
                    <button type="button" className="editor-text-button" onClick={() => onApplyCover(item)}>
                      设为封面
                    </button>
                    <button type="button" className="editor-primary-button" onClick={() => onApplyAsset(item)}>
                      <UploadCloud className="h-4 w-4" />
                      <span>加入资源</span>
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorSettingsPanel({
  preferences,
  onUpdatePreference,
  onResetPreferences,
}: SettingsPanelProps) {
  return (
    <div className="space-y-5">
      <div className="editor-header-row">
        <Reveal>
          <div className="editor-header-copy">
            <h2 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground">
              编辑设置 <span className="text-primary italic">/ Settings</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              这些设置只保存在当前浏览器，用来定义默认分类、导入规则和写作偏好，不会回写站点全局配置。
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="editor-header-actions">
            <button type="button" className="editor-ghost-button" onClick={onResetPreferences}>
              <X className="h-4 w-4" />
              <span>恢复默认</span>
            </button>
          </div>
        </Reveal>
      </div>

      <div className="editorial-grid lg:grid-cols-2">
        <Reveal>
          <GlassPanel className="editor-side-card">
            <div className="editor-side-heading">
              <Pill active>默认发布</Pill>
            </div>
            <div className="space-y-4">
              <div>
                <p className="editor-inline-label">Default Category</p>
                <div className="editor-category-grid mt-3">
                  {EDITOR_CATEGORIES.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={cn(
                        "editor-category-button",
                        preferences.defaultCategory === entry && "editor-category-button-active",
                      )}
                      onClick={() => onUpdatePreference("defaultCategory", entry)}
                    >
                      {CATEGORY_LABELS[entry]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="editor-toggle-row">
                <div className="editor-toggle-copy">
                  <Lock className="h-4 w-4" />
                  <span>默认私密状态</span>
                </div>
                <input
                  type="checkbox"
                  className="editor-hidden-checkbox"
                  checked={preferences.defaultHidden}
                  onChange={(event) => onUpdatePreference("defaultHidden", event.target.checked)}
                />
              </label>
            </div>
          </GlassPanel>
        </Reveal>

        <Reveal delay={0.05}>
          <GlassPanel className="editor-side-card">
            <div className="editor-side-heading">
              <Pill active>写作偏好</Pill>
            </div>
            <div className="space-y-4">
              <label className="editor-toggle-row">
                <div className="editor-toggle-copy">
                  <Tags className="h-4 w-4" />
                  <span>标题变化时自动同步 slug</span>
                </div>
                <input
                  type="checkbox"
                  className="editor-hidden-checkbox"
                  checked={preferences.autoSyncSlug}
                  onChange={(event) => onUpdatePreference("autoSyncSlug", event.target.checked)}
                />
              </label>

              <label className="editor-toggle-row">
                <div className="editor-toggle-copy">
                  <FileUp className="h-4 w-4" />
                  <span>导入 MD 时优先采用 frontmatter</span>
                </div>
                <input
                  type="checkbox"
                  className="editor-hidden-checkbox"
                  checked={preferences.preferFrontmatterOnImport}
                  onChange={(event) => onUpdatePreference("preferFrontmatterOnImport", event.target.checked)}
                />
              </label>

              <div>
                <p className="editor-inline-label">Default Mode</p>
                <div className="editor-category-grid mt-3">
                  {(["edit", "preview"] as const).map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={cn(
                        "editor-category-button",
                        preferences.defaultMode === entry && "editor-category-button-active",
                      )}
                      onClick={() => onUpdatePreference("defaultMode", entry)}
                    >
                      {entry === "edit" ? "编辑" : "预览"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassPanel>
        </Reveal>
      </div>
    </div>
  );
}
