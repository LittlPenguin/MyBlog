"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  FolderKanban,
  House,
  LibraryBig,
  Mail,
  MoonStar,
  Search,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { navItems, siteConfig, socialLinks, type NavItem } from "@/content/site";
import { cn } from "@/lib/utils";
import { RouteLink } from "./route-link";
import { PageTransitionProvider, usePageTransition } from "./transition-context";

function resolveNavIcon(icon: NavItem["icon"]) {
  switch (icon) {
    case "home":
      return House;
    case "archive":
      return Archive;
    case "projects":
      return FolderKanban;
    case "resources":
      return LibraryBig;
    case "about":
      return UserRound;
    default:
      return House;
  }
}

function isActiveRoute(pathname: string, item: NavItem) {
  return (item.match ?? [item.href]).some((entry) =>
    entry === "/" ? pathname === "/" : pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function AppFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { activeTransition, finishTransition } = usePageTransition();

  useEffect(() => {
    if (!activeTransition) {
      return;
    }

    const timer = window.setTimeout(() => {
      finishTransition();
    }, 320);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTransition, finishTransition, pathname]);

  const footerLinks = useMemo(
    () => socialLinks.filter((link) => !link.href.startsWith("mailto:")),
    [],
  );

  return (
    <LayoutGroup id="site-shell">
      <div className="site-shell">
        <motion.div
          className="transition-veil"
          aria-hidden="true"
          animate={
            activeTransition
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: prefersReducedMotion ? 1 : 1.015 }
          }
          transition={{ duration: prefersReducedMotion ? 0.14 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        />

        <header className="sticky top-0 z-50 px-4 pb-4 pt-4 sm:px-6 lg:px-8">
          <div className="glass-panel mx-auto flex w-full max-w-[1320px] items-center justify-between rounded-[30px] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-6">
              <RouteLink
                href="/"
                transitionKey="brand-mark"
                className="relative inline-flex items-center gap-3 rounded-full px-1 py-1"
              >
                <span
                  className="font-heading text-xl font-black italic tracking-[-0.06em] text-primary-strong"
                  style={{ viewTransitionName: "brand-mark" }}
                >
                  {siteConfig.name}
                </span>
                <span className="hidden text-[11px] uppercase tracking-[0.24em] text-muted-foreground md:inline">
                  Sunset Glass Blog
                </span>
              </RouteLink>

              <nav className="hidden items-center gap-2 lg:flex">
                {navItems.map((item) => {
                  const Icon = resolveNavIcon(item.icon);
                  const active = isActiveRoute(pathname, item);

                  return (
                    <RouteLink
                      key={item.href}
                      href={item.href}
                      transitionKey={item.transitionKey}
                      className={cn(
                        "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
                        active ? "text-foreground" : "hover:text-primary",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="active-nav-pill"
                          className="absolute inset-0 rounded-full bg-white/72 shadow-[0_10px_22px_rgba(46,47,45,0.08)]"
                          transition={{ type: "spring", stiffness: 360, damping: 34 }}
                        />
                      ) : null}
                      <Icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10 font-heading font-bold tracking-[-0.03em]">
                        {item.label}
                      </span>
                    </RouteLink>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                className="glass-soft inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Theme"
                className="glass-soft inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary"
              >
                <MoonStar className="h-4 w-4" />
              </button>
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(172,42,31,0.24)] transition hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                联系我
              </a>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="mx-auto w-full max-w-[1320px] px-4 pb-12 sm:px-6 lg:px-8"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14, filter: "blur(12px)" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10, filter: "blur(10px)" }}
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <footer className="px-4 pb-8 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 rounded-[28px] border border-white/50 bg-white/42 px-5 py-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground shadow-[0_10px_30px_rgba(46,47,45,0.06)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>{siteConfig.footerNote}</div>
            <div className="flex flex-wrap items-center gap-4">
              {footerLinks.map((link) => (
                <a key={link.label} href={link.href} className="transition hover:text-primary">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
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
