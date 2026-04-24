"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import type { MessageCreateResponse } from "@/lib/messages-shared";

type FormState = {
  name: string;
  email: string;
  body: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type SubmitStatus = "idle" | "success" | "error";

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  body: "",
};

export function MessageForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [isPending, setIsPending] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
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

    if (status !== "idle") {
      setStatus("idle");
      setFeedback("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatus("idle");
    setFeedback("");
    setErrors({});

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          body: form.body,
        }),
      });
      const result = (await response.json()) as MessageCreateResponse;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setFeedback(result.message || "留言发送失败。");
        setErrors(result.ok ? {} : (result.errors ?? {}));
        return;
      }

      setForm(EMPTY_FORM);
      setErrors({});
      setStatus("success");
      setFeedback(result.message);
    } catch {
      setStatus("error");
      setFeedback("留言发送失败，请稍后重试。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="about-message-form" onSubmit={handleSubmit}>
      <div className="about-message-fields">
        <label className="about-message-field">
          <span className="about-message-label">姓名</span>
          <input
            name="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="about-message-input"
            placeholder="怎么称呼你？"
            autoComplete="name"
            required
          />
          {errors.name ? <span className="about-message-error">{errors.name}</span> : null}
        </label>

        <label className="about-message-field">
          <span className="about-message-label">邮箱</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="about-message-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          {errors.email ? <span className="about-message-error">{errors.email}</span> : null}
        </label>

        <label className="about-message-field about-message-field-wide">
          <span className="about-message-label">内容</span>
          <textarea
            name="body"
            value={form.body}
            onChange={(event) => updateField("body", event.target.value)}
            className="about-message-textarea custom-scrollbar"
            placeholder="写下你想交流的内容。"
            rows={7}
            required
          />
          {errors.body ? <span className="about-message-error">{errors.body}</span> : null}
        </label>
      </div>

      <div className="about-message-footer">
        <div
          className={
            status === "success"
              ? "about-message-feedback about-message-feedback-success"
              : status === "error"
                ? "about-message-feedback about-message-feedback-error"
                : "about-message-feedback"
          }
          aria-live="polite"
        >
          {feedback || "留言仅用于后台管理，不会公开展示。"}
        </div>

        <button type="submit" className="editor-primary-button" disabled={isPending}>
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>{isPending ? "发送中..." : "发送留言"}</span>
        </button>
      </div>
    </form>
  );
}
