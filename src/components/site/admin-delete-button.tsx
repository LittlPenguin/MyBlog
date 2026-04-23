"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
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
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  const contentLabel = useMemo(() => {
    if (category === "project") {
      return "项目";
    }

    if (category === "resource") {
      return "资源";
    }

    return "文章";
  }, [category]);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setIsOpen(false);
        setMessage("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isPending]);

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

  const dialog = portalHost
    ? createPortal(
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              className="admin-delete-dialog-overlay"
              onClick={closeDialog}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1.02 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 0.995 }}
              transition={{
                duration: reduceMotion ? 0.16 : 0.24,
                ease: [0.2, 0.9, 0.18, 1],
              }}
            >
              <motion.div
                className="admin-delete-dialog-shell"
                initial={reduceMotion ? { y: 0 } : { y: 36 }}
                animate={reduceMotion ? { y: 0 } : { y: 0 }}
                exit={reduceMotion ? { y: 0 } : { y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 24,
                  mass: 0.9,
                }}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                  className="admin-delete-dialog-stage"
                  onClick={(event) => event.stopPropagation()}
                  initial={
                    reduceMotion
                      ? { scale: 1, y: 0, rotate: 0 }
                      : { scale: 0.84, y: 70, rotate: -5.5 }
                  }
                  animate={
                    reduceMotion
                      ? { scale: 1, y: 0, rotate: 0 }
                      : { scale: 1, y: 0, rotate: 0 }
                  }
                  exit={
                    reduceMotion
                      ? { scale: 1, y: 0, rotate: 0 }
                      : { scale: 0.9, y: 28, rotate: 2.6 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 360,
                    damping: 21,
                    mass: 0.82,
                  }}
                >
                  <motion.div
                    className="admin-delete-dialog-panel glass-panel"
                    initial={reduceMotion ? { scale: 1 } : { scale: 0.98 }}
                    animate={reduceMotion ? { scale: 1 } : { scale: 1 }}
                    exit={reduceMotion ? { scale: 1 } : { scale: 0.985 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 22,
                      mass: 0.88,
                    }}
                  >
                    <motion.div
                      className="admin-delete-dialog-emblem admin-delete-dialog-breathing"
                      aria-hidden="true"
                      initial={reduceMotion ? { y: 0 } : { y: -14, scale: 0.88, rotate: -8 }}
                      animate={reduceMotion ? { y: 0 } : { y: 0, scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 18,
                        mass: 0.75,
                        delay: reduceMotion ? 0 : 0.02,
                      }}
                    >
                      <AlertTriangle className="h-6 w-6" />
                    </motion.div>

                    <div className="admin-delete-dialog-body">
                      <motion.div
                        className="admin-delete-dialog-head"
                        initial={reduceMotion ? { y: 0 } : { y: 18 }}
                        animate={reduceMotion ? { y: 0 } : { y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 310,
                          damping: 24,
                          mass: 0.9,
                          delay: reduceMotion ? 0 : 0.04,
                        }}
                      >
                        <p className="admin-delete-dialog-eyebrow">Danger Zone</p>
                        <h2 id={titleId} className="admin-delete-dialog-title">
                          删除{contentLabel}
                        </h2>
                        <p id={descriptionId} className="admin-delete-dialog-warning">
                          警告：确认后会永久移除正文、封面、上传资源，并且无法恢复。
                        </p>
                      </motion.div>

                      {message ? (
                        <motion.p
                          className="admin-delete-dialog-feedback"
                          initial={reduceMotion ? { y: 0 } : { y: 10, scale: 0.98 }}
                          animate={reduceMotion ? { y: 0 } : { y: 0, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 23,
                            mass: 0.92,
                          }}
                        >
                          {message}
                        </motion.p>
                      ) : null}

                      <motion.div
                        className="admin-delete-dialog-actions"
                        initial={reduceMotion ? { y: 0 } : { y: 22 }}
                        animate={reduceMotion ? { y: 0 } : { y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 280,
                          damping: 22,
                          mass: 0.9,
                          delay: reduceMotion ? 0 : 0.08,
                        }}
                      >
                        <motion.button
                          type="button"
                          className="admin-delete-dialog-cancel"
                          onClick={closeDialog}
                          disabled={isPending}
                          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                          whileTap={reduceMotion ? undefined : { y: 1, scale: 0.975 }}
                        >
                          取消
                        </motion.button>

                        <motion.button
                          type="button"
                          className="admin-delete-dialog-confirm"
                          onClick={() => void handleDelete()}
                          disabled={isPending}
                          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
                          whileTap={reduceMotion ? undefined : { y: 1, scale: 0.97 }}
                        >
                          {isPending ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span>确认删除</span>
                        </motion.button>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        portalHost,
      )
    : null;

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
      {dialog}
    </>
  );
}
