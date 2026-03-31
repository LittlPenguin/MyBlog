"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
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
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems, siteConfig, type NavItem } from "@/content/site";
import { cn } from "@/lib/utils";
import { RouteLink } from "./route-link";
import { PageTransitionProvider, usePageTransition } from "./transition-context";

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
    <header className="shell-topbar">
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
            <span
              className="font-heading text-[2rem] font-black tracking-[-0.07em] text-primary-strong"
              style={{ viewTransitionName: "brand-mark" }}
            >
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
      transition={motionEnabled ? { duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: 0.2 } : undefined}
    >
      <Plus className="h-5 w-5" />
    </motion.div>
  );
}

function AppFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { activeTransition, finishTransition } = usePageTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const motionEnabled = mounted && !prefersReducedMotion;

  useEffect(() => {
    if (!activeTransition) {
      return;
    }

    const timer = window.setTimeout(() => {
      finishTransition();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTransition, finishTransition, pathname]);

  return (
    <LayoutGroup id="site-shell">
      <div className="site-shell">
        <motion.div
          className="transition-veil"
          aria-hidden="true"
          animate={
            activeTransition
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: motionEnabled ? 1.012 : 1 }
          }
          transition={{ duration: motionEnabled ? 0.28 : 0.14, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="shell-stage">
          <SideNavigation />

          <div className="shell-content">
            <ShellTopBar />

            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={pathname}
                className="shell-main"
                initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
                animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 1 }}
                exit={motionEnabled ? { opacity: 0, y: -10, filter: "blur(8px)" } : { opacity: 1 }}
                transition={{ duration: motionEnabled ? 0.32 : 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.main>
            </AnimatePresence>
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
