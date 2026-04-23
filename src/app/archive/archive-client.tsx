"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { BookMarked, Filter, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { AdminDeleteButton } from "@/components/site/admin-delete-button";
import { RouteLink } from "@/components/site/route-link";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import { buildEditorLoadHref } from "@/lib/editor";
import {
  ALL_POSTS_CATEGORY,
  buildArchiveHref,
  buildPostDetailHref,
  normalizeArchiveFiltersWithCategories,
  type ArchiveFilters,
} from "@/lib/posts-shared";
import type { PostMeta } from "@/lib/posts";
import { cn, formatDate } from "@/lib/utils";

type ArchiveClientProps = {
  initialFilters: {
    q: string;
    category: string;
  };
  posts: PostMeta[];
  categories: string[];
  canManage: boolean;
};

type ArchivePanel = "search" | "filter" | null;

type ArchiveGroup = {
  title: string;
  badge: string;
  tags: string[];
  items: PostMeta[];
};

function buildArchiveGroups(posts: PostMeta[]) {
  const grouped = posts.reduce<Map<string, PostMeta[]>>((accumulator, post) => {
    const items = accumulator.get(post.category) ?? [];
    items.push(post);
    accumulator.set(post.category, items);
    return accumulator;
  }, new Map());

  return Array.from(grouped.entries()).map(([title, items]) => ({
    title,
    badge: `GROUP / ${items.length.toString().padStart(2, "0")}`,
    tags: Array.from(new Set(items.flatMap((post) => post.tags))).slice(0, 3),
    items,
  })) satisfies ArchiveGroup[];
}

const archiveDialogMotion = {
  initial: { opacity: 0, scale: 0.94, y: -10, filter: "blur(10px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.97, y: -8, filter: "blur(8px)" },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
};

function ArchiveEmptyState() {
  return (
    <Reveal delay={0.08}>
      <GlassPanel className="p-8 text-center">
        <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
          没有匹配的文章
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          换一个关键词，或者切回“全部分类”查看完整归档。
        </p>
      </GlassPanel>
    </Reveal>
  );
}

export function ArchiveClient({ initialFilters, posts, categories, canManage }: ArchiveClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(initialFilters.q);
  const [category, setCategory] = useState(initialFilters.category);
  const [openPanel, setOpenPanel] = useState<ArchivePanel>(null);
  const deferredQuery = useDeferredValue(query);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = category === ALL_POSTS_CATEGORY || post.category === category;
      const haystack = `${post.title} ${post.summary} ${post.tags.join(" ")} ${post.category}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, deferredQuery, posts]);

  const groups = useMemo(() => buildArchiveGroups(filteredPosts), [filteredPosts]);
  const hasQueryFilter = Boolean(query.trim());
  const hasCategoryFilter = category !== ALL_POSTS_CATEGORY;
  const currentFilters = useMemo(() => ({ q: query, category }), [category, query]);

  useEffect(() => {
    if (openPanel !== "search" || !searchInputRef.current) {
      return;
    }

    searchInputRef.current.focus();
    searchInputRef.current.select();
  }, [openPanel]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!toolbarRef.current) {
        return;
      }

      const target = event.target as Node;
      if (!toolbarRef.current.contains(target)) {
        setOpenPanel(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function replaceFilters(next: ArchiveFilters) {
    const normalized = normalizeArchiveFiltersWithCategories(next, categories);
    const href = buildArchiveHref(normalized);
    const queryIndex = href.indexOf("?");
    const nextHref = queryIndex === -1 ? pathname : `${pathname}${href.slice(queryIndex)}`;

    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });
  }

  function togglePanel(panel: Exclude<ArchivePanel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <div className="space-y-6 pb-8 pt-2">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Reveal>
          <div>
            <div className="theme-surface inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <BookMarked className="h-3.5 w-3.5 text-primary" />
              Archive Board
            </div>
            <h1 className="mt-4 font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
              归档 / Archive
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              按主题重新整理站内文章，并把搜索与分类筛选直接保留在链接里。
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="archive-toolbar-layer">
          <div ref={toolbarRef} className="archive-toolbar">
            <div className="archive-tool-shell">
              <button
                type="button"
                className={cn(
                  "archive-tool-trigger theme-surface",
                  openPanel === "search" && "archive-tool-trigger-active",
                  !reduceMotion && openPanel !== "search" && "archive-tool-trigger-breathing",
                  hasQueryFilter && "archive-tool-trigger-filtered",
                )}
                aria-label="搜索文章"
                aria-expanded={openPanel === "search"}
                aria-controls="archive-search-dialog"
                onClick={() => togglePanel("search")}
              >
                <Search className="h-3.5 w-3.5" />
                {hasQueryFilter ? <span className="archive-filter-indicator" aria-hidden="true" /> : null}
              </button>

              <AnimatePresence>
                {openPanel === "search" ? (
                  <motion.div
                    id="archive-search-dialog"
                    key="archive-search-dialog"
                    className="archive-search-dialog archive-dialog-panel glass-panel"
                    initial={reduceMotion ? false : archiveDialogMotion.initial}
                    animate={reduceMotion ? { opacity: 1 } : archiveDialogMotion.animate}
                    exit={reduceMotion ? { opacity: 0 } : archiveDialogMotion.exit}
                    transition={archiveDialogMotion.transition}
                  >
                    <div className="archive-dialog-head">
                      <div>
                        <p className="archive-dialog-eyebrow">Search</p>
                        <h2 className="archive-dialog-title">搜索文章</h2>
                        <p className="archive-dialog-copy">标题、摘要、标签、分类</p>
                      </div>
                    </div>

                    <label className="archive-dialog-field">
                      <Search className="h-4 w-4 text-primary" />
                      <input
                        ref={searchInputRef}
                        value={query}
                        onChange={(event) => {
                          const value = event.target.value;
                          setQuery(value);
                          replaceFilters({ q: value, category });
                        }}
                        className="archive-dialog-input"
                        placeholder="标题、摘要、标签、分类"
                        aria-label="搜索文章"
                      />
                    </label>

                    <div className="archive-dialog-actions">
                      <button
                        type="button"
                        className="archive-dialog-action archive-dialog-action-ghost"
                        onClick={() => {
                          setQuery("");
                          replaceFilters({ q: "", category });
                        }}
                      >
                        清除
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="archive-tool-shell">
              <button
                type="button"
                className={cn(
                  "archive-tool-trigger theme-surface",
                  openPanel === "filter" && "archive-tool-trigger-active",
                  !reduceMotion && openPanel !== "filter" && "archive-tool-trigger-breathing",
                  hasCategoryFilter && "archive-tool-trigger-filtered",
                )}
                aria-label="分类筛选"
                aria-expanded={openPanel === "filter"}
                aria-controls="archive-filter-dialog"
                onClick={() => togglePanel("filter")}
              >
                <Filter className="h-3.5 w-3.5" />
                {hasCategoryFilter ? <span className="archive-filter-indicator" aria-hidden="true" /> : null}
              </button>

              <AnimatePresence>
                {openPanel === "filter" ? (
                  <motion.div
                    id="archive-filter-dialog"
                    key="archive-filter-dialog"
                    className="archive-filter-dialog archive-dialog-panel glass-panel"
                    initial={reduceMotion ? false : archiveDialogMotion.initial}
                    animate={reduceMotion ? { opacity: 1 } : archiveDialogMotion.animate}
                    exit={reduceMotion ? { opacity: 0 } : archiveDialogMotion.exit}
                    transition={archiveDialogMotion.transition}
                  >
                    <div className="archive-dialog-head">
                      <div>
                        <p className="archive-dialog-eyebrow">Category</p>
                        <h2 className="archive-dialog-title">分类筛选</h2>
                        <p className="archive-dialog-copy">选择一个分类后会立即应用筛选。</p>
                      </div>
                    </div>

                    <div className="archive-filter-grid">
                      {categories.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setCategory(item);
                            replaceFilters({ q: query, category: item });
                          }}
                          className={cn(
                            "archive-dialog-chip",
                            category === item ? "archive-dialog-chip-active" : "archive-dialog-chip-idle",
                          )}
                          aria-pressed={category === item}
                        >
                          {item === ALL_POSTS_CATEGORY ? "全部分类" : item}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </section>

      {groups.length === 0 ? (
        <ArchiveEmptyState />
      ) : (
        <section className="editorial-grid lg:grid-cols-3">
          {groups.map((group, index) => (
            <Reveal key={group.title} delay={0.05 * (index + 1)}>
              <GlassPanel className="flex h-full flex-col p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                      {group.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.tags.map((tag) => (
                        <Pill key={tag}>{tag}</Pill>
                      ))}
                    </div>
                  </div>
                  <Pill active>{group.badge}</Pill>
                </div>

                <div className="space-y-4">
                  {group.items.map((post) => (
                    <SoftPanel key={`${group.title}-${post.slug}`} className="p-4 transition hover:-translate-y-0.5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {formatDate(post.date)}
                      </p>
                      <RouteLink
                        href={buildPostDetailHref(post.slug, currentFilters)}
                        transitionKey={`post-${post.slug}`}
                        className="mt-2 block font-heading text-lg font-black tracking-[-0.04em] text-foreground transition hover:text-primary"
                      >
                        {post.title}
                      </RouteLink>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <RouteLink
                          href={buildPostDetailHref(post.slug, currentFilters)}
                          transitionKey={`post-preview-${post.slug}`}
                          className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
                        >
                          预览
                        </RouteLink>
                        {canManage ? (
                          <>
                            <RouteLink
                              href={buildEditorLoadHref("archive", post.slug)}
                              className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                            >
                              编辑
                            </RouteLink>
                            <AdminDeleteButton
                              category="archive"
                              slug={post.slug}
                              variant="inline"
                              className="px-0 py-0 text-xs uppercase tracking-[0.16em]"
                            >
                              删除
                            </AdminDeleteButton>
                          </>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{post.summary}</p>
                    </SoftPanel>
                  ))}
                </div>
              </GlassPanel>
            </Reveal>
          ))}
        </section>
      )}
    </div>
  );
}
