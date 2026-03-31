import Image from "next/image";
import { CalendarDays, Palette, PawPrint, Pin, Plus, Star, Workflow } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { RouteLink } from "@/components/site/route-link";
import { homeBoard } from "@/content/home-board";
import { cn } from "@/lib/utils";

export const unstable_instant = {
  prefetch: "static",
} as const;

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

function BoardCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("board-card", className)}>{children}</div>;
}

function BoardSectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="board-card-title">{children}</h3>;
}

export default function HomePage() {
  return (
    <div className="home-board-page">
      <div className="board-background-icon board-background-icon-star">
        <Star className="h-24 w-24 fill-current" />
      </div>
      <div className="board-background-icon board-background-icon-pet">
        <PawPrint className="h-32 w-32" />
      </div>

      <section className="home-board-grid">
        <Reveal className="home-board-hero" delay={0.02}>
          <BoardCard className="home-board-hero-card">
            <span className="scrapbook-pin" aria-hidden="true" />
            <div className="home-board-hero-copy">
              <div>
                <h1 className="home-board-hero-title" style={{ viewTransitionName: "page-title" }}>
                  {homeBoard.greeting}
                </h1>
                <p className="home-board-hero-lead" style={{ viewTransitionName: "page-eyebrow" }}>
                  {homeBoard.lead}
                </p>
              </div>

              <div className="home-board-hero-actions">
                <RouteLink href="/archive" transitionKey="hero-archive" className="board-primary-button">
                  {homeBoard.archiveLabel}
                </RouteLink>
                <RouteLink href="/projects" transitionKey="hero-projects" className="board-secondary-button">
                  {homeBoard.projectsLabel}
                </RouteLink>
              </div>
            </div>

            <div className="home-board-hero-image">
              <Image
                src={homeBoard.heroImage}
                alt="Warm sunset cat card"
                width={300}
                height={300}
                preload
                unoptimized
                className="h-full w-full object-cover"
              />
            </div>
          </BoardCard>
        </Reveal>

        <div className="home-board-sidecards">
          <Reveal delay={0.08}>
            <BoardCard className="board-widget-card">
              <div className="board-widget-header">
                <span>{homeBoard.currentTimeLabel}</span>
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div className="board-clock-face">
                <span className="board-clock-time">
                  {homeBoard.currentTimeValue}
                  <span className="board-clock-seconds">{homeBoard.currentTimeSeconds}</span>
                </span>
              </div>
              <p className="board-widget-caption">{homeBoard.currentTimeZone}</p>
            </BoardCard>
          </Reveal>

          <Reveal delay={0.12}>
            <BoardCard className="board-widget-card">
              <div className="board-widget-header">
                <span>{homeBoard.calendarLabel}</span>
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>

              <div className="board-calendar">
                {weekDays.map((item, index) => (
                  <span key={`${item}-${index}`} className="board-calendar-weekday">
                    {item}
                  </span>
                ))}
                {homeBoard.calendarDays.map((item) => (
                  <span
                    key={`${item.day}-${item.muted ? "muted" : "live"}`}
                    className={cn(
                      "board-calendar-day",
                      item.muted && "board-calendar-day-muted",
                      item.active && "board-calendar-day-active",
                    )}
                  >
                    {item.day}
                  </span>
                ))}
              </div>
            </BoardCard>
          </Reveal>
        </div>

        <div className="home-board-preview-grid">
          <Reveal delay={0.14}>
            <RouteLink href="/about" transitionKey="home-about" className="block">
              <BoardCard className="board-preview-card board-preview-about">
                <div className="board-preview-pin">
                  <Pin className="h-5 w-5" />
                </div>
                <BoardSectionTitle>{homeBoard.about.title}</BoardSectionTitle>
                <div className="board-preview-row">
                  <div className="board-preview-icon">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">{homeBoard.about.role}</p>
                    <p className="mt-1 text-muted-foreground">{homeBoard.about.description}</p>
                  </div>
                </div>
              </BoardCard>
            </RouteLink>
          </Reveal>

          <Reveal delay={0.18}>
            <RouteLink href="/projects" transitionKey="home-project-board" className="group block">
              <BoardCard className="board-preview-card">
                <BoardSectionTitle>{homeBoard.projects.title}</BoardSectionTitle>
                <div className="space-y-3">
                  <div className="board-preview-row board-preview-project-row">
                    <span className="text-xs font-medium text-foreground">{homeBoard.projects.name}</span>
                    <Workflow className="h-4 w-4 text-foreground/70 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                  <div className="board-progress-bar">
                    <div className="board-progress-fill" />
                  </div>
                </div>
              </BoardCard>
            </RouteLink>
          </Reveal>

          <Reveal delay={0.22}>
            <RouteLink href="/resources" transitionKey="home-resources" className="block">
              <BoardCard className="board-preview-card">
                <BoardSectionTitle>{homeBoard.resources.title}</BoardSectionTitle>
                <div className="board-tag-row">
                  {homeBoard.resources.tags.map((tag, index) => (
                    <span key={tag} className={cn("board-tag", index === 0 && "board-tag-accent")}>
                      {tag}
                    </span>
                  ))}
                </div>
              </BoardCard>
            </RouteLink>
          </Reveal>

          <Reveal delay={0.26}>
            <RouteLink href="/posts/building-a-calm-interface" transitionKey="home-editor-card" className="block">
              <BoardCard className="board-preview-card board-preview-editor">
                <BoardSectionTitle>{homeBoard.editor.title}</BoardSectionTitle>
                <div className="board-editor-snippet">
                  <p className="board-editor-line board-editor-line-primary">{homeBoard.editor.lines[0]}</p>
                  <p className="board-editor-line">{homeBoard.editor.lines[1]}</p>
                  <p className="board-editor-line">
                    Today was a <span className="board-editor-highlight">beautiful</span> sunset...
                  </p>
                </div>
              </BoardCard>
            </RouteLink>
          </Reveal>
        </div>

        <Reveal className="home-board-footer" delay={0.3}>
          <div className="board-footer-strip">
            <div className="board-footer-note">
              <Star className="h-4 w-4 text-primary" />
              <p>{homeBoard.footerNote}</p>
            </div>
            <div className="board-footer-meta">
              <div className="board-swatches" aria-hidden="true">
                <span className="board-swatch board-swatch-neutral" />
                <span className="board-swatch board-swatch-primary" />
                <span className="board-swatch board-swatch-tertiary" />
              </div>
              <p>{homeBoard.footerVersion}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal className="home-floating-card-wrap" delay={0.34}>
        <div className="home-floating-card">
          <div className="home-floating-frame">
            <Image
              src={homeBoard.floatingImage}
              alt="Moments captured"
              width={200}
              height={200}
              unoptimized
              className="h-full w-full rounded-[1rem] object-cover grayscale transition duration-500 hover:grayscale-0"
            />
          </div>
          <p className="home-floating-note">{homeBoard.floatingNote}</p>
        </div>
      </Reveal>

      <div className="home-board-plus-badge" aria-hidden="true">
        <Plus className="h-5 w-5" />
      </div>
    </div>
  );
}
