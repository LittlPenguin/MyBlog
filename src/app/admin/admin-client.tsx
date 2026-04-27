"use client";

import { useState, useTransition } from "react";
import { KeyRound, LoaderCircle, LogOut } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel, Pill } from "@/components/site/ui";

type AdminClientProps = {
  initialNext: string;
  canManage: boolean;
  isConfigured: boolean;
};

type SessionResult =
  | {
      ok: true;
      redirectHref: string;
    }
  | {
      ok: false;
      message: string;
    };

export function AdminClient({ initialNext, canManage, isConfigured }: AdminClientProps) {
  const [accessCode, setAccessCode] = useState("");
  const [message, setMessage] = useState(
    isConfigured
      ? canManage
        ? "管理员模式已开启。"
        : "输入管理员访问码以开启内容管理权限。"
      : "管理员访问码未配置，当前不可开启管理员模式。",
  );
  const [isPending, startTransition] = useTransition();

  async function handleUnlock() {
    if (!isConfigured || !accessCode.trim()) {
      setMessage(isConfigured ? "请输入管理员访问码。" : "管理员访问码未配置。");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/session", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            accessCode,
            next: initialNext,
          }),
        });

        const result = (await response.json()) as SessionResult;

        if (!response.ok || !result.ok) {
          setMessage(result.ok ? "管理员验证失败。" : result.message);
          return;
        }

        window.location.assign(result.redirectHref);
      } catch {
        setMessage("管理员验证请求失败。");
      }
    });
  }

  async function handleLogout() {
    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/session", {
          method: "DELETE",
          credentials: "same-origin",
        });
        const result = (await response.json()) as SessionResult;

        if (!response.ok || !result.ok) {
          setMessage(result.ok ? "退出管理员模式失败。" : result.message);
          return;
        }

        window.location.assign(result.redirectHref);
      } catch {
        setMessage("退出管理员模式失败。");
      }
    });
  }

  return (
    <div className="space-y-6 pb-8 pt-2">
      <Reveal>
        <section className="mx-auto max-w-2xl text-center">
          <Pill active className="mx-auto">
            Admin Access
          </Pill>
          <h1 className="mt-4 font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
            管理员入口
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            使用管理员访问码切换到内容管理模式。普通用户不会获得编辑或删除权限。
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassPanel className="mx-auto max-w-xl p-6 md:p-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Session target</p>
              <p className="rounded-[20px] bg-background/45 px-4 py-3 text-sm text-foreground">{initialNext}</p>
            </div>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Access code</span>
              <div className="theme-surface flex items-center gap-3 rounded-[22px] px-4 py-3">
                <KeyRound className="h-4 w-4 text-primary" />
                <input
                  type="password"
                  value={accessCode}
                  disabled={!isConfigured || isPending}
                  onChange={(event) => setAccessCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleUnlock();
                    }
                  }}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                  placeholder="输入管理员访问码"
                />
              </div>
            </label>

            <p className="text-sm leading-7 text-muted-foreground">{message}</p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="editor-primary-button"
                disabled={!isConfigured || isPending}
                onClick={() => void handleUnlock()}
              >
                {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                <span>开启管理员模式</span>
              </button>

              <button
                type="button"
                className="editor-ghost-button"
                disabled={isPending}
                onClick={() => void handleLogout()}
              >
                {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span>退出管理员模式</span>
              </button>
            </div>
          </div>
        </GlassPanel>
      </Reveal>
    </div>
  );
}
