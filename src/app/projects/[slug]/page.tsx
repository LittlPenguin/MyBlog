import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Boxes, GitBranch, Grid2x2, Sparkles, SquareStack } from "lucide-react";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { RouteLink } from "@/components/site/route-link";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import { getAllProjects, getProjectDetailBySlug, getProjectSlugs } from "@/lib/projects";
import { formatDate } from "@/lib/utils";
import { ProjectDetailContent } from "../project-detail-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function projectIcon(icon: "grid" | "spark" | "pen" | "layers") {
  switch (icon) {
    case "spark":
      return Sparkles;
    case "pen":
      return SquareStack;
    case "layers":
      return Boxes;
    case "grid":
    default:
      return Grid2x2;
  }
}

function accentClasses(accent: "primary" | "secondary" | "tertiary") {
  if (accent === "secondary") {
    return "bg-secondary-soft text-secondary";
  }

  if (accent === "tertiary") {
    return "bg-[rgba(255,217,125,0.24)] text-tertiary";
  }

  return "bg-primary-soft text-primary";
}

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectDetailBySlug(slug);

  if (!project) {
    return {};
  }

  return {
    title: project.meta.title,
    description: project.meta.summary,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectDetailBySlug(slug);

  if (!project || project.meta.draft) {
    notFound();
  }

  const allProjects = await getAllProjects();
  const related = allProjects.filter((item) => item.slug !== slug).slice(0, 3);
  const Icon = projectIcon(project.meta.icon);

  return (
    <div className="space-y-6 pb-8 pt-2">
      <Reveal>
        <section className="resource-detail-grid">
          <GlassPanel className="resource-detail-hero relative overflow-hidden p-6 sm:p-8">
            <div className="resource-detail-chip">
              <span className="resource-detail-chip-dot" aria-hidden="true" />
              {project.meta.category}
            </div>

            <div className="resource-detail-copy">
              <RouteLink
                href="/projects"
                transitionKey="project-back"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-near)] transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                返回项目列表
              </RouteLink>

              <div className="space-y-4">
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-[20px] ${accentClasses(project.meta.accent)}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h1 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
                  {project.meta.title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground">{project.meta.description}</p>
              </div>

              <div className="resource-detail-meta">
                <div className="flex flex-wrap gap-2">
                  <Pill active>{project.meta.year}</Pill>
                  <Pill>{formatDate(project.meta.date)}</Pill>
                  {project.meta.stack.map((item) => (
                    <Pill key={item}>{item}</Pill>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {project.meta.href ? (
                  <a
                    href={project.meta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(172,42,31,0.22)] transition hover:-translate-y-0.5"
                  >
                    Website
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
                {project.meta.github ? (
                  <a
                    href={project.meta.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/58 px-4 py-3 text-sm font-semibold text-foreground"
                  >
                    <GitBranch className="h-4 w-4" />
                    GitHub
                  </a>
                ) : null}
                {project.meta.docs ? (
                  <a
                    href={project.meta.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/58 px-4 py-3 text-sm font-semibold text-foreground"
                  >
                    Docs
                  </a>
                ) : null}
              </div>

              {project.meta.cover ? (
                <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/55 p-2 shadow-[var(--shadow-far)]">
                  <Image
                    src={project.meta.cover}
                    alt={project.meta.title}
                    width={1600}
                    height={900}
                    className="h-auto w-full rounded-[22px] object-cover"
                    sizes="(min-width: 1280px) 720px, 100vw"
                  />
                </div>
              ) : null}
            </div>
          </GlassPanel>

          <div className="resource-detail-side">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">项目信息</h2>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-5 space-y-4">
                <SoftPanel className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">分类</p>
                  <p className="mt-2 font-heading text-xl font-black tracking-[-0.04em] text-foreground">
                    {project.meta.category}
                  </p>
                </SoftPanel>
                <SoftPanel className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">年份</p>
                  <p className="mt-2 font-heading text-xl font-black tracking-[-0.04em] text-foreground">
                    {project.meta.year}
                  </p>
                </SoftPanel>
                <SoftPanel className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">标签</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.meta.tags.map((tag) => (
                      <Pill key={tag}>{tag}</Pill>
                    ))}
                  </div>
                </SoftPanel>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h2 className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">继续浏览</h2>
              <div className="mt-5 space-y-3">
                {related.map((item) => (
                  <RouteLink
                    key={item.slug}
                    href={`/projects/${item.slug}`}
                    transitionKey={`project-${item.slug}`}
                    className="block"
                  >
                    <SoftPanel className="resource-related-card p-4 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
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

      <Reveal delay={0.06}>
        <GlassPanel className="p-6 md:p-10">
          <ProjectDetailContent source={project.rawContent} />

          {project.meta.assetNames.length > 0 ? (
            <div className="mt-10 space-y-3 border-t border-white/45 pt-8">
              <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">项目附件</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {project.meta.assetNames.map((name, index) => {
                  const href = project.meta.assetPaths?.[index] ?? null;
                  const card = (
                    <SoftPanel className="flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5">
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {href ? href.replace(/^\/+/, "") : "仅保留元数据引用"}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </SoftPanel>
                  );

                  return href ? (
                    <a key={name} href={href} target="_blank" rel="noreferrer">
                      {card}
                    </a>
                  ) : (
                    <div key={name}>{card}</div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </GlassPanel>
      </Reveal>
    </div>
  );
}
