"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { GlassPanel, Pill, RatingStars } from "@/components/site/ui";
import { resources } from "@/content/site";
import { cn } from "@/lib/utils";

const categories = ["全部", ...new Set(resources.map((item) => item.category))];

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");

  const filteredResources = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchCategory = category === "全部" || resource.category === category;
      const haystack = `${resource.title} ${resource.description} ${resource.tags.join(" ")}`.toLowerCase();
      const matchQuery = !normalized || haystack.includes(normalized);

      return matchCategory && matchQuery;
    });
  }, [category, query]);

  return (
    <div className="space-y-6 pb-8 pt-2">
      <Reveal>
        <section className="relative mx-auto max-w-3xl text-center">
          <Pill active className="mx-auto">
            Resource Shelf
          </Pill>
          <h1
            className="mt-4 font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl"
            style={{ viewTransitionName: "page-title" }}
          >
            收藏 / Resources
          </h1>
          <p
            className="mt-3 text-sm leading-7 text-muted-foreground md:text-base"
            style={{ viewTransitionName: "page-eyebrow" }}
          >
            经过筛选后留下的设计资源、工具与参考，而不是一堆没有上下文的链接收藏。
          </p>

          <div className="relative mx-auto mt-6 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-white/50 bg-white/72 py-3 pl-11 pr-5 text-sm shadow-[0_12px_24px_rgba(46,47,45,0.06)] outline-none transition focus:border-primary/30"
              placeholder="搜索资源、灵感与工具..."
            />
          </div>
        </section>
      </Reveal>

      <section className="scroll-strip flex gap-2 overflow-x-auto py-1">
        {categories.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
              category === item
                ? "bg-primary text-white shadow-[0_14px_28px_rgba(172,42,31,0.22)]"
                : "border border-white/55 bg-white/66 text-muted-foreground hover:text-primary",
              index === 0 ? "ml-1" : "",
            )}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="editorial-grid md:grid-cols-2 xl:grid-cols-3">
        {filteredResources.map((resource, index) => (
          <Reveal key={resource.slug} delay={0.04 * (index + 1)}>
            <GlassPanel className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-sm font-heading font-black tracking-[-0.04em] text-primary shadow-[var(--shadow-near)]">
                  {resource.monogram}
                </div>
                <RatingStars value={resource.rating} />
              </div>
              <h2 className="mt-5 font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                {resource.title}
              </h2>
              <a
                href={resource.url}
                className="mt-1 block truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {resource.url.replace(/^https?:\/\//, "")}
              </a>
              <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">{resource.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Pill active>{resource.category}</Pill>
                {resource.tags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
            </GlassPanel>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
