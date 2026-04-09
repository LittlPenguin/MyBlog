import type { Metadata } from "next";
import { Suspense } from "react";
import { BookMarked, ChevronDown, Search } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RouteLink } from "@/components/site/route-link";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import { getAllPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "归档",
  description: "按主题与时间重新组织的文章归档视图。",
};

type ArchiveColumn = {
  title: string;
  badge: string;
  tags: string[];
};

const ARCHIVE_COLUMNS: ArchiveColumn[] = [
  {
    title: "日常碎片",
    badge: "LIFE / 12",
    tags: ["摄影", "随笔", "城市观察"],
  },
  {
    title: "设计与前端",
    badge: "TECH / 08",
    tags: ["UI/UX", "React", "前端"],
  },
  {
    title: "内容结构",
    badge: "ESSAYS / 06",
    tags: ["写作", "内容", "系统"],
  },
];

function ArchiveBoardSkeleton() {
  return (
    <section className="editorial-grid lg:grid-cols-3">
      {ARCHIVE_COLUMNS.map((column, index) => (
        <Reveal key={column.title} delay={0.05 * (index + 1)}>
          <GlassPanel className="flex h-full flex-col p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                  {column.title}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {column.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </div>
              <Pill active>{column.badge}</Pill>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, itemIndex) => (
                <SoftPanel key={`${column.title}-${itemIndex}`} className="p-4">
                  <div className="h-3 w-20 rounded-full bg-white/60" />
                  <div className="mt-3 h-5 w-4/5 rounded-full bg-white/80" />
                </SoftPanel>
              ))}
            </div>
          </GlassPanel>
        </Reveal>
      ))}
    </section>
  );
}

async function ArchiveBoardContent() {
  const posts = await getAllPosts();
  const grouped = posts.reduce<Record<string, typeof posts>>((accumulator, post) => {
    if (!accumulator[post.category]) {
      accumulator[post.category] = [];
    }

    accumulator[post.category].push(post);
    return accumulator;
  }, {});

  const columns = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([title, items], index) => ({
      title,
      badge: `GROUP / ${items.length.toString().padStart(2, "0")}`,
      tags: Array.from(new Set(items.flatMap((post) => post.tags))).slice(0, 3),
      items: items.slice(0, Math.max(3, index === 0 ? 4 : 3)),
    }));

  return (
    <section className="editorial-grid lg:grid-cols-3">
      {columns.map((column, index) => (
        <Reveal key={column.title} delay={0.05 * (index + 1)}>
          <GlassPanel className="flex h-full flex-col p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                  {column.title}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {column.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </div>
              <Pill active>{column.badge}</Pill>
            </div>

            <div className="space-y-4">
              {column.items.map((post) => (
                <SoftPanel key={`${column.title}-${post.slug}`} className="p-4 transition hover:-translate-y-0.5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDate(post.date)}
                  </p>
                  <RouteLink
                    href={`/posts/${post.slug}`}
                    transitionKey={`post-${post.slug}`}
                    className="mt-2 block font-heading text-lg font-black tracking-[-0.04em] text-foreground transition hover:text-primary"
                  >
                    {post.title}
                  </RouteLink>
                </SoftPanel>
              ))}
            </div>
          </GlassPanel>
        </Reveal>
      ))}
    </section>
  );
}

export default function ArchivePage() {
  return (
    <div className="space-y-6 pb-8 pt-2">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Reveal>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/68 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground shadow-[var(--shadow-near)]">
              <BookMarked className="h-3.5 w-3.5 text-primary" />
              Archive Board
            </div>
            <h1 className="mt-4 font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
              归档 / Archive
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              不是简单的时间线堆叠，而是一页按主题密度重新组织过的文章总览。
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2.5 shadow-[var(--shadow-near)]">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">搜索文章</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2.5 shadow-[var(--shadow-near)]">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">分类</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Reveal>
      </section>

      <Suspense fallback={<ArchiveBoardSkeleton />}>
        <ArchiveBoardContent />
      </Suspense>
    </div>
  );
}
