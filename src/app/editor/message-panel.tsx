"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, LoaderCircle, Mail, RefreshCw, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/site/delete-confirm-dialog";
import { GlassPanel, Pill } from "@/components/site/ui";
import type {
  MessageDeleteResponse,
  MessageListResponse,
  MessageMutationResponse,
} from "@/lib/messages-shared";
import type { MessageListItem } from "@/lib/messages";
import { cn, formatDate } from "@/lib/utils";

type MessagePanelProps = {
  items: MessageListItem[];
  selectedId: string | null;
  feedback: string;
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  onItemsChange: (items: MessageListItem[]) => void;
  onSelectedIdChange: (id: string | null) => void;
  onFeedbackChange: (message: string) => void;
  onLoadingChange: (loading: boolean) => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function summarizeBody(body: string) {
  const singleLine = body.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 80) {
    return singleLine;
  }

  return `${singleLine.slice(0, 80)}...`;
}

function sortByCreatedAtDesc(items: MessageListItem[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function replaceItem(items: MessageListItem[], nextItem: MessageListItem) {
  return sortByCreatedAtDesc(items.map((item) => (item.id === nextItem.id ? nextItem : item)));
}

export function EditorMessagePanel({
  items,
  selectedId,
  feedback,
  loading,
  onBack,
  onRefresh,
  onSelect,
  onItemsChange,
  onSelectedIdChange,
  onFeedbackChange,
  onLoadingChange,
}: MessagePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const unreadItems = useMemo(() => items.filter((item) => item.status === "unread"), [items]);
  const readItems = useMemo(() => items.filter((item) => item.status === "read"), [items]);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  function openDeleteDialog() {
    setDeleteMessage("");
    setDeleteOpen(true);
  }

  function closeDeleteDialog() {
    if (isPending) {
      return;
    }

    setDeleteOpen(false);
    setDeleteMessage("");
  }

  function handleSelect(id: string) {
    onSelectedIdChange(id);
    onSelect(id);

    const target = items.find((item) => item.id === id);
    if (!target || target.status === "read") {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/messages/${id}/read`, {
          method: "POST",
        });
        const result = (await response.json()) as MessageMutationResponse;

        if (!response.ok || !result.ok) {
          onFeedbackChange(result.ok ? "标记已读失败。" : result.message);
          return;
        }

        onItemsChange(replaceItem(items, result.item));
        onFeedbackChange("留言已标记为已读。");
      } catch {
        onFeedbackChange("标记已读时发生网络错误。");
      }
    });
  }

  function handleDelete() {
    if (!selected) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/messages/${selected.id}`, {
          method: "DELETE",
        });
        const result = (await response.json()) as MessageDeleteResponse;

        if (!response.ok || !result.ok) {
          setDeleteMessage(result.ok ? "删除留言失败。" : result.message);
          return;
        }

        const nextItems = items.filter((item) => item.id !== selected.id);
        onItemsChange(nextItems);
        onSelectedIdChange(null);
        onFeedbackChange("留言已删除。");
        setDeleteOpen(false);
        setDeleteMessage("");
      } catch {
        setDeleteMessage("删除留言时发生网络错误。");
      }
    });
  }

  async function refreshMessages() {
    onLoadingChange(true);
    onFeedbackChange("");

    try {
      const response = await fetch("/api/messages", {
        method: "GET",
        cache: "no-store",
      });
      const result = (await response.json()) as MessageListResponse;

      if (!response.ok || !result.ok) {
        onFeedbackChange(result.ok ? "加载留言失败。" : result.message);
        return;
      }

      onItemsChange(result.items);
      if (selectedId && !result.items.some((item) => item.id === selectedId)) {
        onSelectedIdChange(null);
      }
      onFeedbackChange("留言列表已刷新。");
    } catch {
      onFeedbackChange("加载留言时发生网络错误。");
    } finally {
      onLoadingChange(false);
    }
  }

  return (
    <div className="editor-message-screen">
      <div className="editor-header-row">
        <div className="editor-header-copy">
          <h2 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground">
            留言管理 <span className="text-primary italic">/ Messages</span>
          </h2>
        </div>

        <div className="editor-header-actions">
          <button type="button" className="editor-ghost-button" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            <span>返回编辑</span>
          </button>
          <button type="button" className="editor-ghost-button" onClick={() => void refreshMessages()} disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>刷新留言</span>
          </button>
        </div>
      </div>

      <div className="editor-message-grid">
        <GlassPanel className="editor-message-list-card p-5">
          <div className="editor-message-list-head">
            <Pill active>未读 {unreadItems.length}</Pill>
            <Pill>已读 {readItems.length}</Pill>
          </div>

          {feedback ? <p className="editor-message-feedback">{feedback}</p> : null}

          <div className="editor-message-group">
            <p className="editor-message-group-title">未读</p>
            <div className="editor-message-items">
              {unreadItems.length > 0 ? (
                unreadItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn("editor-message-item", selectedId === item.id && "editor-message-item-active")}
                    onClick={() => handleSelect(item.id)}
                  >
                    <div className="editor-message-item-head">
                      <span className="editor-message-item-name">{item.name}</span>
                      <span className="editor-message-item-time">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="editor-message-item-email">{item.email}</p>
                    <p className="editor-message-item-body">{summarizeBody(item.body)}</p>
                  </button>
                ))
              ) : (
                <p className="editor-message-empty">暂无未读留言。</p>
              )}
            </div>
          </div>

          <div className="editor-message-group">
            <p className="editor-message-group-title">已读</p>
            <div className="editor-message-items">
              {readItems.length > 0 ? (
                readItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn("editor-message-item", selectedId === item.id && "editor-message-item-active")}
                    onClick={() => handleSelect(item.id)}
                  >
                    <div className="editor-message-item-head">
                      <span className="editor-message-item-name">{item.name}</span>
                      <span className="editor-message-item-time">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="editor-message-item-email">{item.email}</p>
                    <p className="editor-message-item-body">{summarizeBody(item.body)}</p>
                  </button>
                ))
              ) : (
                <p className="editor-message-empty">暂无已读留言。</p>
              )}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="editor-message-detail-card p-6">
          {selected ? (
            <div className="editor-message-detail">
              <div className="editor-message-detail-head">
                <div className="space-y-2">
                  <Pill active={selected.status === "unread"}>{selected.status === "unread" ? "未读" : "已读"}</Pill>
                  <h3 className="font-heading text-3xl font-black tracking-[-0.05em] text-foreground">
                    {selected.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
                <button type="button" className="editor-ghost-button" onClick={openDeleteDialog}>
                  <Trash2 className="h-4 w-4" />
                  <span>删除留言</span>
                </button>
              </div>

              <div className="editor-message-detail-meta">
                <span>收到时间：{formatDate(selected.createdAt)}</span>
                <span>
                  {selected.readAt ? `已读时间：${formatDateTime(selected.readAt)}` : "打开详情后会自动标记为已读"}
                </span>
              </div>

              <div className="editor-message-detail-body">
                <Mail className="h-5 w-5 text-primary" />
                <p>{selected.body}</p>
              </div>
            </div>
          ) : (
            <div className="editor-message-detail-empty">
              <Mail className="h-8 w-8 text-primary" />
              <h3 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">选择一条留言</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                左侧按未读和已读分组展示留言。点击任意一条后，这里会显示完整内容。
              </p>
            </div>
          )}
        </GlassPanel>
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        title="删除留言"
        description="警告：确认后会永久删除这条留言，并且无法恢复。"
        message={deleteMessage}
        pending={isPending}
        confirmLabel="确认删除"
        onClose={closeDeleteDialog}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
