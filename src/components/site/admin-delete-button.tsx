"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/site/delete-confirm-dialog";
import { cn } from "@/lib/utils";

type AdminDeleteButtonProps = {
  category: "archive" | "project" | "resource";
  slug: string;
  redirectHref?: string;
  onDeleted?: () => void;
  className?: string;
  variant?: "ghost" | "inline";
  children?: React.ReactNode;
};

type DeleteResult =
  | {
      ok: true;
      redirectHref: string;
    }
  | {
      ok: false;
      message: string;
    };

export function AdminDeleteButton({
  category,
  slug,
  redirectHref,
  onDeleted,
  className,
  variant = "ghost",
  children,
}: AdminDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const contentLabel = useMemo(() => {
    if (category === "project") {
      return "项目";
    }

    if (category === "resource") {
      return "资源";
    }

    return "文章";
  }, [category]);

  function openDialog() {
    setMessage("");
    setIsOpen(true);
  }

  function closeDialog() {
    if (isPending) {
      return;
    }

    setMessage("");
    setIsOpen(false);
  }

  async function handleDelete() {
    startTransition(async () => {
      try {
        const response = await fetch("/editor/api/posts", {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            source: {
              originalCategory: category,
              originalSlug: slug,
            },
          }),
        });

        const result = (await response.json()) as DeleteResult;

        if (!response.ok || !result.ok) {
          setMessage(result.ok ? "删除失败。" : result.message);
          return;
        }

        setIsOpen(false);
        setMessage("");

        if (redirectHref) {
          router.push(redirectHref);
        } else {
          router.refresh();
        }

        onDeleted?.();
      } catch {
        setMessage("删除请求失败。");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={openDialog}
        className={cn(
          variant === "ghost"
            ? "editor-ghost-button"
            : "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-600 theme-surface",
          className,
        )}
      >
        {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        <span>{children ?? "删除"}</span>
      </button>

      <DeleteConfirmDialog
        open={isOpen}
        title={`删除${contentLabel}`}
        description="警告：确认后会永久移除正文、封面、上传资源，并且无法恢复。"
        message={message}
        pending={isPending}
        confirmLabel="确认删除"
        onClose={closeDialog}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
