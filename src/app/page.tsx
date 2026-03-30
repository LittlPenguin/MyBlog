import Image from "next/image";
import { ArrowRight, CalendarDays, Clock3, Sparkles, Star, SwatchBook } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ActionLink, ArticlePreviewCard, GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import { homeSignals, projects, resources, siteConfig } from "@/content/site";
import { getFeaturedPosts } from "@/lib/posts";

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(3);
  const featuredProjects = projects.slice(0, 2);
  const featuredResources = resources.slice(0, 3);

  return (
    <div className="space-y-6 pb-8 pt-2">
      <section className="editorial-grid lg:grid-cols-[1.28fr_0.72fr]">
        <Reveal>
          <GlassPanel className="relative overflow-hidden p-6 sm:p-8 md:p-10">
            <div className="absolute -right-10 top-6 text-[8rem] scrap-icon">
              <Star className="h-28 w-28 fill-current" />
            </div>
            <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,217,125,0.46),transparent_68%)]" />
            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div className="relative z-10 max-w-2xl space-y-5">
                <Pill active className="w-fit">
                  Sunset Editorial Board
                </Pill>
                <div
                  className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                  style={{ viewTransitionName: "page-eyebrow" }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {siteConfig.heroGreeting}
                </div>
                <h1
                  className="max-w-3xl text-balance font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-7xl"
                  style={{ viewTransitionName: "page-title" }}
                >
                  {siteConfig.heroTitle}
                </h1>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                  {siteConfig.heroLead}
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <ActionLink href="/archive" transitionKey="hero-archive">
                    查看归档
                    <ArrowRight className="h-4 w-4" />
                  </ActionLink>
                  <ActionLink href="/projects" variant="secondary" transitionKey="hero-projects">
                    浏览项目
                  </ActionLink>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                <SoftPanel className="animate-soft-float p-4">
                  <div className="overflow-hidden rounded-[22px] border border-white/70 shadow-[var(--shadow-mid)]">
                    <Image
                      src={siteConfig.gallery[0]}
                      alt="A warm editorial desk with afternoon light"
                      width={960}
                      height={960}
                      priority
                      className="aspect-[5/4] h-auto w-full object-cover"
                    />
                  </div>
                </SoftPanel>
                <SoftPanel className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Current Time
                    </p>
                    <p className="mt-2 font-heading text-4xl font-black tracking-[-0.06em] text-foreground">
                      16:45
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Beijing UTC+8
                    </p>
                  </div>
                  <div className="rounded-full bg-primary-soft p-3 text-primary">
                    <Clock3 className="h-5 w-5" />
                  </div>
                </SoftPanel>
              </div>
            </div>
          </GlassPanel>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <Reveal delay={0.05}>
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Current Mode
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                    Build, Write, Refine
                  </h2>
                </div>
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{siteConfig.now}</p>
            </GlassPanel>
          </Reveal>

          <Reveal delay={0.1}>
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Signals
                </p>
                <SwatchBook className="h-5 w-5 text-tertiary" />
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {homeSignals.map((item) => (
                  <li key={item} className="rounded-[18px] bg-white/48 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </Reveal>
        </div>
      </section>

      <section className="editorial-grid lg:grid-cols-[0.82fr_1.18fr]">
        <Reveal>
          <GlassPanel className="h-full p-6 sm:p-8">
            <Pill active>About Preview</Pill>
            <div className="mt-5 flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-[var(--shadow-mid)]">
                  <Image
                    src={siteConfig.avatar}
                    alt="YYsuni portrait"
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div>
                <h2 className="font-heading text-3xl font-black tracking-[-0.06em] text-foreground">
                  Designer, writer, frontend builder.
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  在内容、界面与代码之间来回切换，把网站当成长期生长的工作台来维护。
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>Designer</Pill>
              <Pill>Writer</Pill>
              <Pill>Developer</Pill>
            </div>
            <div className="mt-6">
              <ActionLink href="/about" variant="secondary" transitionKey="home-about">
                进入关于页
              </ActionLink>
            </div>
          </GlassPanel>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredPosts.map((post, index) => (
            <Reveal key={post.slug} delay={0.05 * (index + 1)}>
              <ArticlePreviewCard post={post} className="min-h-[260px]" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="editorial-grid lg:grid-cols-[1.12fr_0.88fr]">
        <Reveal>
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Pill active>Selected Works</Pill>
                <h2 className="mt-4 font-heading text-4xl font-black tracking-[-0.06em] text-foreground">
                  项目与实验像一张持续更新的工作板。
                </h2>
              </div>
              <ActionLink href="/projects" variant="secondary" transitionKey="home-project-board">
                查看全部项目
              </ActionLink>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {featuredProjects.map((project) => (
                <div
                  key={project.slug}
                  className="rounded-[24px] border border-white/55 bg-white/52 p-5 shadow-[0_10px_24px_rgba(46,47,45,0.05)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Pill active>{project.year}</Pill>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {project.stack.join(" / ")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{project.summary}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </Reveal>

        <Reveal delay={0.06}>
          <GlassPanel className="h-full p-6 sm:p-8">
            <Pill active>Resource Shelf</Pill>
            <h2 className="mt-4 font-heading text-3xl font-black tracking-[-0.06em] text-foreground">
              经常反复打开的工具与参考。
            </h2>
            <div className="mt-6 space-y-3">
              {featuredResources.map((resource) => (
                <SoftPanel key={resource.slug} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{resource.category}</p>
                  </div>
                  <Pill>{resource.monogram}</Pill>
                </SoftPanel>
              ))}
            </div>
            <div className="mt-6">
              <ActionLink href="/resources" variant="secondary" transitionKey="home-resources">
                查看资源页
              </ActionLink>
            </div>
          </GlassPanel>
        </Reveal>
      </section>
    </div>
  );
}
