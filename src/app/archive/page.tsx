import type { Metadata } from "next";
import { BookMarked, ChevronDown, Search } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import { RouteLink } from "@/components/site/route-link";
import { getAllPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "归档",
  description: "按内容主题和时间整理的文章归档页面。",
};

export const unstable_instant = {
  prefetch: "static",
} as const;

export default async function ArchivePage() {
  const posts = await getAllPosts();
  const columns = [
    {
      title: "日常碎片",
      badge: "LIFE / 12",
      tags: ["摄影", "随笔", "城市观察"],
      items: posts.slice(0, 3),
    },
    {
      title: "设计与前端",
      badge: "TECH / 08",
      tags: ["UI/UX", "React", "前端"],
      items: posts.slice(0, 3).reverse(),
    },
    {
      title: "内容结构",
      badge: "ESSAYS / 06",
      tags: ["写作", "内容", "系统"],
      items: posts.slice(0, 3),
    },
  ];

  return (
    <div className="space-y-6 pb-8 pt-2">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Reveal>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/68 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground shadow-[var(--shadow-near)]">
              <BookMarked className="h-3.5 w-3.5 text-primary" />
              Archive Board
            </div>
            <h1
              className="mt-4 font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl"
              style={{ viewTransitionName: "page-title" }}
            >
              归档 / Archive
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              不是简单的时间线堆叠，而是一页按主题密度重新组织过的文章总览。
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2.5 shadow-[var(--shadow-near)]"
              style={{ viewTransitionName: "page-eyebrow" }}
            >
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
    </div>
  );
}
