"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  message?: string;
  confirmLabel?: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  open,
  title,
  description,
  message = "",
  confirmLabel = "确认删除",
  pending = false,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, pending]);

  if (!portalHost) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="admin-delete-dialog-overlay"
          onClick={() => {
            if (!pending) {
              onClose();
            }
          }}
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
                      {title}
                    </h2>
                    <p id={descriptionId} className="admin-delete-dialog-warning">
                      {description}
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
                      onClick={onClose}
                      disabled={pending}
                      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                      whileTap={reduceMotion ? undefined : { y: 1, scale: 0.975 }}
                    >
                      取消
                    </motion.button>

                    <motion.button
                      type="button"
                      className="admin-delete-dialog-confirm"
                      onClick={onConfirm}
                      disabled={pending}
                      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
                      whileTap={reduceMotion ? undefined : { y: 1, scale: 0.97 }}
                    >
                      {pending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span>{confirmLabel}</span>
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
  );
}
