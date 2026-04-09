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

const ENTER_SETTLE_MS = 680;

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

      <RouteLink href="/editor" transitionKey="nav-editor" className="shell-editor-link">
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

function AppFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { activeTransition, phase, setPhase, finishTransition, cancelTransition } = usePageTransition();
  const [mounted, setMounted] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const stageProbeRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const routesToWarm = ["/", "/about", "/projects", "/resources", "/archive", "/editor", "/posts/building-a-calm-interface"];

    routesToWarm.forEach((href) => {
      void router.prefetch(href);
    });
  }, [router]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      if (stageProbeRef.current !== null) {
        window.cancelAnimationFrame(stageProbeRef.current);
      }
    };
  }, []);

  const motionEnabled = mounted && !prefersReducedMotion;
  const routeMotionEnabled = mounted;
  const overlaySnapshot = activeTransition?.snapshot ?? null;
  const overlayVisible = routeMotionEnabled && !!overlaySnapshot;
  const waitingForTarget = !!activeTransition && pathname !== activeTransition.toPathname;
  const isHoldingTarget = !!activeTransition && pathname === activeTransition.toPathname && !stageReady;
  const isTransitionPending = waitingForTarget || isHoldingTarget;
  const routeProgress = useMemo(() => {
    if (!activeTransition) {
      return "0%";
    }

    if (phase === "entering") {
      return "100%";
    }

    return isTransitionPending ? "76%" : "88%";
  }, [activeTransition, isTransitionPending, phase]);

  useEffect(() => {
    if (!routeMotionEnabled) {
      if (activeTransition) {
        cancelTransition(activeTransition.id);
      }
      return;
    }
  }, [activeTransition, cancelTransition, routeMotionEnabled]);

  useEffect(() => {
    if (!activeTransition || !stageRef.current) {
      setStageReady(false);
      return;
    }

    if (pathname !== activeTransition.toPathname) {
      setStageReady(false);
      return;
    }

    const verifyStageReady = () => {
      if (!stageRef.current) {
        return;
      }

      const hasLoadingShell = !!stageRef.current.querySelector(".page-loading-shell");

      if (hasLoadingShell) {
        stageProbeRef.current = window.requestAnimationFrame(verifyStageReady);
        return;
      }

      setStageReady(true);
      setPhase("entering");

      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }

      settleTimerRef.current = window.setTimeout(() => {
        finishTransition(activeTransition.id);
        settleTimerRef.current = null;
      }, ENTER_SETTLE_MS);
    };

    verifyStageReady();

    return () => {
      if (stageProbeRef.current !== null) {
        window.cancelAnimationFrame(stageProbeRef.current);
        stageProbeRef.current = null;
      }
    };
  }, [activeTransition, finishTransition, pathname, setPhase]);

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

              <div className="shell-main-stage" ref={stageRef} data-route-stage="main">
                <motion.main
                  key={pathname}
                  className={cn("shell-main shell-main-layer", overlayVisible && "shell-main-layer-current")}
                  initial={
                    routeMotionEnabled
                      ? {
                          opacity: activeTransition ? 0.24 : 0.4,
                          x: activeTransition ? 42 : 22,
                          y: activeTransition ? 28 : 18,
                          scaleX: activeTransition ? 0.9 : 0.95,
                          scaleY: activeTransition ? 0.84 : 0.94,
                          rotate: activeTransition ? 3.4 : 1.2,
                          filter: activeTransition ? "blur(18px) saturate(0.82)" : "blur(10px) saturate(0.9)",
                        }
                      : false
                  }
                  animate={{
                    opacity: waitingForTarget ? 0.14 : 1,
                    x: waitingForTarget ? 42 : 0,
                    y: waitingForTarget ? 24 : 0,
                    scaleX: waitingForTarget ? 0.91 : 1,
                    scaleY: waitingForTarget ? 0.86 : 1,
                    rotate: waitingForTarget ? 2.6 : 0,
                    filter: waitingForTarget ? "blur(12px) saturate(0.84)" : "blur(0px) saturate(1)",
                  }}
                  transition={
                    routeMotionEnabled
                      ? {
                          x: { type: "spring", stiffness: 248, damping: 16, mass: 0.78 },
                          y: { type: "spring", stiffness: 228, damping: 16, mass: 0.8 },
                          scaleX: { type: "spring", stiffness: 280, damping: 13, mass: 0.7 },
                          scaleY: { type: "spring", stiffness: 262, damping: 12, mass: 0.68 },
                          rotate: { type: "spring", stiffness: 220, damping: 16, mass: 0.8 },
                          opacity: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
                          filter: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                        }
                      : undefined
                  }
                >
                  {children}
                </motion.main>

                {overlaySnapshot ? (
                  <motion.div
                    key={`${activeTransition?.fromPathname ?? pathname}-${activeTransition?.id ?? 0}`}
                    className={cn(
                      "shell-main shell-main-layer shell-main-layer-overlay",
                      phase === "exiting" && "shell-main-layer-overlay-holding",
                    )}
                    data-route-overlay-ignore
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
                            x: -96,
                            y: -40,
                            scaleX: 0.84,
                            scaleY: 0.74,
                            rotate: -5.8,
                            filter: "blur(20px) saturate(0.84)",
                          }
                        : {
                            opacity: 1,
                            x: -18,
                            y: -14,
                            scaleX: 0.978,
                            scaleY: 0.948,
                            rotate: -1.1,
                            filter: "blur(3px) saturate(0.98)",
                          }
                    }
                    transition={
                      phase === "entering"
                        ? {
                            x: { type: "spring", stiffness: 176, damping: 14, mass: 0.92 },
                            y: { type: "spring", stiffness: 166, damping: 13, mass: 0.94 },
                            scaleX: { type: "spring", stiffness: 244, damping: 12, mass: 0.58 },
                            scaleY: { type: "spring", stiffness: 226, damping: 11, mass: 0.56 },
                            rotate: { type: "spring", stiffness: 196, damping: 13, mass: 0.8 },
                            opacity: { duration: 0.26, ease: [0.18, 0.88, 0.18, 1] },
                            filter: { duration: 0.3, ease: [0.18, 0.88, 0.18, 1] },
                          }
                        : {
                            x: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            y: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            scaleX: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            scaleY: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            rotate: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            filter: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
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
