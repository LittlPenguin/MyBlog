"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  Bell,
  FolderKanban,
  Home,
  LibraryBig,
  MoonStar,
  Plus,
  Settings2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { navItems, siteConfig, type NavItem } from "@/content/site";
import { cn } from "@/lib/utils";
import { RouteLink } from "./route-link";
import { PageTransitionProvider, usePageTransition } from "./transition-context";

type OverlaySnapshot = {
  transitionId: number;
  fromPathname: string;
  toPathname: string;
  html: string;
  width: number;
  height: number;
};

const EXIT_SETTLE_MS = 180;
const ENTER_SETTLE_MS = 620;

function resolveNavIcon(icon: NavItem["icon"]) {
  switch (icon) {
    case "home":
      return Home;
    case "archive":
      return Archive;
    case "projects":
      return FolderKanban;
    case "resources":
      return LibraryBig;
    case "about":
      return UserRound;
    default:
      return Home;
  }
}

function isActiveRoute(pathname: string, item: NavItem) {
  return (item.match ?? [item.href]).some((entry) =>
    entry === "/" ? pathname === "/" : pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function ShellTopBar() {
  return (
    <header className="shell-topbar" data-route-overlay-ignore>
      <div className="shell-topbar-actions">
        <button type="button" aria-label="Toggle theme" className="shell-topbar-button">
          <MoonStar className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Notifications" className="shell-topbar-button">
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="shell-topbar-button shell-topbar-button-accent"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <div className="shell-avatar">
          <Image
            src={siteConfig.avatar}
            alt="YYsuni avatar"
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}

function SideNavigation() {
  const pathname = usePathname();

  return (
    <aside className="shell-sidebar">
      <div>
        <div className="mb-10 px-2">
          <RouteLink href="/" transitionKey="brand-mark" className="inline-flex flex-col gap-1">
            <span className="font-heading text-[2rem] font-black tracking-[-0.07em] text-primary-strong">
              {siteConfig.name}
            </span>
            <span className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Personal Blog
            </span>
          </RouteLink>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = resolveNavIcon(item.icon);
            const active = isActiveRoute(pathname, item);

            return (
              <RouteLink
                key={item.href}
                href={item.href}
                transitionKey={item.transitionKey}
                className={cn("shell-nav-link", active && "shell-nav-link-active")}
              >
                <Icon className="relative z-10 h-[18px] w-[18px]" />
                <span className="relative z-10 flex items-baseline gap-2">
                  <span>{item.label}</span>
                  <span className="font-label text-[10px] uppercase tracking-[0.18em] opacity-80">
                    {item.eyebrow}
                  </span>
                </span>
                {active ? <motion.span layoutId="active-nav-pill" className="shell-nav-pill" /> : null}
              </RouteLink>
            );
          })}
        </nav>
      </div>

      <RouteLink href="/posts/building-a-calm-interface" transitionKey="nav-editor" className="shell-editor-link">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/22">
          <Settings2 className="h-4 w-4" />
        </span>
        <span>Markdown Editor</span>
      </RouteLink>
    </aside>
  );
}

function FloatingAction({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <motion.div
      className="shell-floating-action"
      initial={motionEnabled ? { opacity: 0, scale: 0.84 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionEnabled ? { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.16 } : undefined}
    >
      <Plus className="h-5 w-5" />
    </motion.div>
  );
}

function createSnapshot(element: HTMLElement) {
  const clone = element.cloneNode(true);

  if (!(clone instanceof HTMLElement)) {
    return null;
  }

  clone.removeAttribute("id");
  clone.querySelectorAll("[data-route-overlay-ignore]").forEach((node) => node.remove());
  clone.querySelectorAll("script").forEach((node) => node.remove());
  clone.querySelectorAll("video, audio").forEach((node) => node.remove());

  const rect = element.getBoundingClientRect();

  return {
    html: clone.innerHTML,
    width: rect.width,
    height: rect.height,
  };
}

function AppFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { activeTransition, phase, setPhase, finishTransition, cancelTransition } = usePageTransition();
  const [mounted, setMounted] = useState(false);
  const [overlaySnapshot, setOverlaySnapshot] = useState<OverlaySnapshot | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const routesToWarm = ["/", "/about", "/projects", "/resources", "/archive", "/posts/building-a-calm-interface"];

    routesToWarm.forEach((href) => {
      void router.prefetch(href);
    });
  }, [router]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const motionEnabled = mounted && !prefersReducedMotion;
  const overlayVisible = motionEnabled && !!overlaySnapshot;
  const waitingForTarget = !!activeTransition && pathname !== activeTransition.toPathname;
  const routeProgress = useMemo(() => {
    if (!activeTransition) {
      return "0%";
    }

    if (phase === "entering") {
      return "100%";
    }

    return waitingForTarget ? "58%" : "84%";
  }, [activeTransition, phase, waitingForTarget]);

  useEffect(() => {
    if (!motionEnabled) {
      if (overlaySnapshot) {
        setOverlaySnapshot(null);
      }
      if (activeTransition) {
        cancelTransition(activeTransition.id);
      }
      return;
    }

    if (!activeTransition || !stageRef.current) {
      return;
    }

    setOverlaySnapshot((current) => {
      if (current?.transitionId === activeTransition.id) {
        return current;
      }

      const snapshot = createSnapshot(stageRef.current!);

      if (!snapshot) {
        return null;
      }

      return {
        transitionId: activeTransition.id,
        fromPathname: activeTransition.fromPathname,
        toPathname: activeTransition.toPathname,
        html: snapshot.html,
        width: snapshot.width,
        height: snapshot.height,
      };
    });

    setPhase("exiting");
  }, [activeTransition, cancelTransition, motionEnabled, overlaySnapshot, setPhase]);

  useEffect(() => {
    if (!activeTransition || !overlaySnapshot) {
      return;
    }

    if (pathname !== activeTransition.toPathname) {
      return;
    }

    setPhase("entering");

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = window.setTimeout(() => {
      setOverlaySnapshot((current) => (current?.transitionId === activeTransition.id ? null : current));
      finishTransition(activeTransition.id);
      settleTimerRef.current = null;
    }, ENTER_SETTLE_MS);
  }, [activeTransition, finishTransition, overlaySnapshot, pathname, setPhase]);

  return (
    <LayoutGroup id="site-shell">
      <div className="site-shell">
        <div className="shell-stage">
          <SideNavigation />

          <div className="shell-content">
            <ShellTopBar />

            <div className="shell-main-wrap">
              <div
                className={cn("shell-route-meter", activeTransition && "shell-route-meter-active")}
                aria-hidden="true"
              >
                <span className="shell-route-meter-fill" style={{ width: routeProgress }} />
              </div>

              <div className="shell-main-stage" ref={stageRef}>
                <motion.main
                  key={pathname}
                  className={cn("shell-main shell-main-layer", overlayVisible && "shell-main-layer-current")}
                  initial={motionEnabled ? { opacity: 0.3, x: 26, y: 22, scale: 0.92, rotate: 2.2 } : false}
                  animate={{
                    opacity: activeTransition ? (waitingForTarget ? 0.16 : 1) : 1,
                    x: activeTransition ? (waitingForTarget ? 34 : 0) : 0,
                    y: activeTransition ? (waitingForTarget ? 20 : 0) : 0,
                    scale: activeTransition ? (waitingForTarget ? 0.93 : 1) : 1,
                    rotate: activeTransition ? (waitingForTarget ? 1.4 : 0) : 0,
                    filter: activeTransition
                      ? waitingForTarget
                        ? "blur(10px) saturate(0.88)"
                        : "blur(0px) saturate(1)"
                      : "blur(0px) saturate(1)",
                  }}
                  transition={
                    motionEnabled
                      ? {
                          x: { type: "spring", stiffness: 210, damping: 18, mass: 0.78 },
                          y: { type: "spring", stiffness: 220, damping: 18, mass: 0.82 },
                          scale: { type: "spring", stiffness: 260, damping: 16, mass: 0.72 },
                          rotate: { type: "spring", stiffness: 220, damping: 18, mass: 0.84 },
                          opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                          filter: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                        }
                      : undefined
                  }
                >
                  {children}
                </motion.main>

                {overlaySnapshot ? (
                  <motion.div
                    key={`${overlaySnapshot.fromPathname}-${overlaySnapshot.transitionId}`}
                    className="shell-main shell-main-layer shell-main-layer-overlay"
                    style={{
                      width: overlaySnapshot.width,
                      minHeight: overlaySnapshot.height,
                    }}
                    initial={{
                      opacity: 1,
                      x: 0,
                      y: 0,
                      scaleX: 1,
                      scaleY: 1,
                      rotate: 0,
                      filter: "blur(0px) saturate(1)",
                    }}
                    animate={
                      phase === "entering"
                        ? {
                            opacity: 0,
                            x: -88,
                            y: -34,
                            scaleX: 0.86,
                            scaleY: 0.8,
                            rotate: -5.6,
                            filter: "blur(18px) saturate(0.88)",
                          }
                        : {
                            opacity: 0.96,
                            x: -10,
                            y: -10,
                            scaleX: 0.985,
                            scaleY: 0.966,
                            rotate: -0.8,
                            filter: "blur(2px) saturate(0.98)",
                          }
                    }
                    transition={
                      phase === "entering"
                        ? {
                            x: { type: "spring", stiffness: 170, damping: 13, mass: 0.9 },
                            y: { type: "spring", stiffness: 160, damping: 12, mass: 0.92 },
                            scaleX: { type: "spring", stiffness: 240, damping: 11, mass: 0.56 },
                            scaleY: { type: "spring", stiffness: 220, damping: 10, mass: 0.52 },
                            rotate: { type: "spring", stiffness: 190, damping: 13, mass: 0.78 },
                            opacity: { duration: 0.24, ease: [0.18, 0.88, 0.18, 1] },
                            filter: { duration: 0.3, ease: [0.18, 0.88, 0.18, 1] },
                          }
                        : {
                            x: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                            y: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                            scaleX: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                            scaleY: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                            rotate: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                            filter: { duration: EXIT_SETTLE_MS / 1000, ease: [0.22, 1, 0.36, 1] },
                          }
                    }
                  >
                    <div className="shell-main-overlay-sheen" aria-hidden="true" />
                    <div className="shell-main-overlay-html" dangerouslySetInnerHTML={{ __html: overlaySnapshot.html }} />
                  </motion.div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <FloatingAction motionEnabled={motionEnabled} />
      </div>
    </LayoutGroup>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageTransitionProvider>
      <AppFrameInner>{children}</AppFrameInner>
    </PageTransitionProvider>
  );
}
