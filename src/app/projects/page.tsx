import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Boxes, Grid2x2, Sparkles, SquareStack } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RouteLink } from "@/components/site/route-link";
import { GlassPanel, Pill } from "@/components/site/ui";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "项目",
  description: "精选项目与界面实验的集中展示页。",
};

function accentClasses(accent: "primary" | "secondary" | "tertiary") {
  if (accent === "secondary") {
    return "bg-secondary-soft text-secondary";
  }

  if (accent === "tertiary") {
    return "bg-[rgba(255,217,125,0.24)] text-tertiary";
  }

  return "bg-primary-soft text-primary";
}

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

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="space-y-6 pb-8 pt-2">
      <Reveal>
        <section className="space-y-3">
          <Pill active className="w-fit">
            Selected Works
          </Pill>
          <h1 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
            项目作品集<span className="text-primary italic">.</span>
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            暮色与玻璃的气质下面，是长期迭代中的产品判断、前端实现与内容组织实验。
          </p>
        </section>
      </Reveal>

      <section className="editorial-grid md:grid-cols-2">
        {projects.map((project, index) => {
          const Icon = projectIcon(project.icon);

          return (
            <Reveal key={project.slug} delay={0.05 * (index + 1)}>
              <GlassPanel className="group flex h-full flex-col justify-between p-6 transition hover:-translate-y-1">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    {project.cover ? (
                      <div className="h-24 w-36 overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-[var(--shadow-near)]">
                        <Image
                          src={project.cover}
                          alt={project.title}
                          width={720}
                          height={480}
                          className="h-full w-full object-cover"
                          sizes="288px"
                        />
                      </div>
                    ) : (
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-[18px] ${accentClasses(project.accent)}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {project.year}
                    </span>
                  </div>

                  <div>
                    <RouteLink
                      href={`/projects/${project.slug}`}
                      transitionKey={`project-${project.slug}`}
                      className="block"
                    >
                      <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground transition group-hover:text-primary">
                        {project.title}
                      </h2>
                    </RouteLink>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <Pill key={item}>{item}</Pill>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{project.summary}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {project.href ? (
                    <a
                      href={project.href}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(172,42,31,0.18)]"
                    >
                      Website
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                  {project.github ? (
                    <a
                      href={project.github}
                      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/56 px-4 py-2 text-sm font-semibold text-foreground"
                    >
                      GitHub
                    </a>
                  ) : null}
                  {project.docs ? (
                    <a
                      href={project.docs}
                      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/56 px-4 py-2 text-sm font-semibold text-foreground"
                    >
                      Docs
                    </a>
                  ) : null}
                </div>
              </GlassPanel>
            </Reveal>
          );
        })}
      </section>
    </div>
  );
}
