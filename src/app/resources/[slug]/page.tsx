import type { Metadata } from "next";
import { ArrowUpRight, ChevronLeft, ExternalLink, Layers3, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { RouteLink } from "@/components/site/route-link";
import { GlassPanel, Pill, RatingStars, SoftPanel } from "@/components/site/ui";
import { resources } from "@/content/site";
import {
  buildResourceDetailHref,
  buildResourcesHref,
  getRelatedResources,
  getResourceBySlug,
  getResourceSlugs,
  type ResourceFilters,
} from "@/lib/resources";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ResourceFilters>;
};

export async function generateStaticParams() {
  return getResourceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResourceBySlug(slug);

  if (!resource) {
    return {};
  }

  return {
    title: resource.title,
    description: resource.description,
  };
}

export default async function ResourceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const resource = getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  const related = getRelatedResources(resource.slug, 3);
  const backHref = buildResourcesHref(filters);
  const featuredCount = resources.filter((item) => item.featured).length;

  return (
    <div className="space-y-6 pb-8 pt-2">
      <Reveal>
        <section className="resource-detail-grid">
          <GlassPanel className="resource-detail-hero relative overflow-hidden p-6 sm:p-8">
            <div className="resource-detail-chip">
              <span className="resource-detail-chip-dot" aria-hidden="true" />
              {resource.category}
            </div>

            <div className="resource-detail-copy">
              <RouteLink
                href={backHref}
                preserveScroll
                transitionKey="resource-back"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-near)] transition hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                返回资源列表
              </RouteLink>

              <div className="space-y-4">
                <h1 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
                  {resource.title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground">{resource.description}</p>
              </div>

              <div className="resource-detail-meta">
                <div className="flex items-center gap-3">
                  <RatingStars value={resource.rating} />
                  <span className="text-sm text-muted-foreground">{resource.rating}.0 / 5 curated score</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(172,42,31,0.22)] transition hover:-translate-y-0.5"
                >
                  新标签打开
                  <ExternalLink className="h-4 w-4" />
                </a>
                <span className="inline-flex items-center rounded-full border border-white/60 bg-white/58 px-4 py-3 text-sm text-muted-foreground">
                  {resource.url.replace(/^https?:\/\//, "")}
                </span>
              </div>
            </div>
          </GlassPanel>

          <div className="resource-detail-side">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">收藏视角</h2>
                <Star className="h-4 w-4 text-tertiary" />
              </div>
              <div className="mt-5 space-y-4">
                <SoftPanel className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">分类</p>
                  <p className="mt-2 font-heading text-xl font-black tracking-[-0.04em] text-foreground">
                    {resource.category}
                  </p>
                </SoftPanel>
                <SoftPanel className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">精选资源</p>
                  <p className="mt-2 font-heading text-xl font-black tracking-[-0.04em] text-foreground">
                    {featuredCount} items
                  </p>
                </SoftPanel>
                <SoftPanel className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">站内中转</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    先通过站内详情承接，再跳向外部内容，返回时不再重刷资源列表的加载层。
                  </p>
                </SoftPanel>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">相关推荐</h2>
              </div>

              <div className="mt-5 space-y-3">
                {related.map((item) => (
                  <RouteLink
                    key={item.slug}
                    href={buildResourceDetailHref(item.slug, filters)}
                    preserveScroll
                    transitionKey={`resource-${item.slug}`}
                    className="block"
                  >
                    <SoftPanel className="resource-related-card p-4 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 text-primary" />
                      </div>
                    </SoftPanel>
                  </RouteLink>
                ))}
              </div>
            </GlassPanel>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
