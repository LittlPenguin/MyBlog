import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import {
  normalizeDetailAttachments,
  renderDetailHeroActionAttrs,
  type DetailActionItem,
  type DetailAttachmentItem,
} from "@/lib/detail-shell";
import { cn } from "@/lib/utils";
import { GlassPanel, Pill, SoftPanel } from "./ui";
import { RouteLink } from "./route-link";
 
export type DetailActionVisualItem = DetailActionItem & {
  icon?: React.ReactNode;
};

export type DetailRelatedItem = {
  title: string;
  summary: string;
  href: string;
  transitionKey?: string;
  meta?: string | null;
};

export function DetailBackLink({
  href,
  label,
  transitionKey,
  preserveScroll = false,
}: {
  href: string;
  label: string;
  transitionKey: string;
  preserveScroll?: boolean;
}) {
  return (
    <RouteLink
      href={href}
      preserveScroll={preserveScroll}
      transitionKey={transitionKey}
      className="inline-flex w-fit items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-near)] transition hover:text-foreground"
    >
      {label}
    </RouteLink>
  );
}

export function DetailHeroActions({ items }: { items: DetailActionVisualItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {renderDetailHeroActionAttrs(items).map((item, index) => (
        <a
          key={`${item.label}-${item.href}`}
          href={item.href}
          target={item.target}
          rel={item.rel}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5",
            item.variant === "secondary"
              ? "border border-white/60 bg-white/58 text-foreground"
              : "bg-gradient-to-r from-primary to-primary-strong text-white shadow-[0_18px_36px_rgba(172,42,31,0.22)]",
          )}
        >
          {items[index]?.icon}
          <span>{item.label}</span>
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

export function DetailAttachmentsSection({
  title,
  items,
}: {
  title: string;
  items: DetailAttachmentItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 space-y-3 border-t border-white/45 pt-8">
      <h2 className="font-heading text-2xl font-black tracking-[-0.05em] text-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {normalizeDetailAttachments(items).map((item) => {
          const card = (
            <SoftPanel className="flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5">
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                {item.meta ? <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p> : null}
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </SoftPanel>
          );

          return item.isLinked && item.href ? (
            <a key={`${item.name}-${item.href}`} href={item.href} target="_blank" rel="noreferrer">
              {card}
            </a>
          ) : (
            <div key={item.name}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

export function DetailRelatedSection({
  title,
  items,
}: {
  title: string;
  items: DetailRelatedItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <GlassPanel className="p-6">
      <h2 className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <RouteLink
            key={item.href}
            href={item.href}
            transitionKey={item.transitionKey ?? item.href}
            className="block"
          >
            <SoftPanel className="resource-related-card p-4 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-black tracking-[-0.04em] text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                  {item.meta ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.meta}</p> : null}
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 text-primary" />
              </div>
            </SoftPanel>
          </RouteLink>
        ))}
      </div>
    </GlassPanel>
  );
}

export function DetailPageShell({
  backLink,
  eyebrow,
  title,
  summary,
  cover,
  metaChips,
  actions,
  body,
  attachments,
  related,
}: {
  backLink: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: string;
  summary: React.ReactNode;
  cover?: React.ReactNode;
  metaChips?: string[];
  actions?: React.ReactNode;
  body: React.ReactNode;
  attachments?: React.ReactNode;
  related?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-8 pt-2">
      <Reveal>
        <GlassPanel className="detail-hero-panel relative overflow-hidden p-6 sm:p-8 md:p-10">
          <div className="detail-hero-copy">
            {eyebrow ? <div className="resource-detail-chip">{eyebrow}</div> : null}
            {backLink}

            <div className="space-y-4">
              <h1 className="font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-6xl">
                {title}
              </h1>
              <div className="detail-summary max-w-3xl text-base leading-8 text-muted-foreground">{summary}</div>
            </div>

            {metaChips && metaChips.length > 0 ? (
              <div className="detail-meta-row">
                <div className="flex flex-wrap gap-2">
                  {metaChips.map((item) => (
                    <Pill key={item}>{item}</Pill>
                  ))}
                </div>
              </div>
            ) : null}

            {actions ? <div className="detail-actions-row">{actions}</div> : null}
          </div>

          {cover ? <div className="detail-cover-wrap mt-6">{cover}</div> : null}
        </GlassPanel>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassPanel className="detail-body-panel p-6 md:p-10">
          <div className="detail-body-flow">
            {body}
            {attachments}
          </div>
        </GlassPanel>
      </Reveal>

      {related ? (
        <Reveal delay={0.08}>
          <div className="detail-related-wrap">{related}</div>
        </Reveal>
      ) : null}
    </div>
  );
}
