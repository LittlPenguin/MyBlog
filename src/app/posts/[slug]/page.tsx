import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import { RouteLink } from "@/components/site/route-link";
import { getAdjacentPosts, getPostBySlug, getPostSlugs } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const unstable_instant = {
  prefetch: "static",
} as const;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) {
    return {};
  }

  return {
    title: post.meta.title,
    description: post.meta.summary,
    openGraph: {
      title: post.meta.title,
      description: post.meta.summary,
      type: "article",
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post || post.meta.draft) {
    notFound();
  }

  const { previous, next } = await getAdjacentPosts(slug);

  return (
    <article className="pb-8 pt-2">
      <div className="mx-auto max-w-4xl">
        <RouteLink
          href="/archive"
          transitionKey="back-archive"
          className="inline-flex items-center gap-2 rounded-full bg-white/68 px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-near)] transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回归档
        </RouteLink>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <Pill active>{post.meta.category}</Pill>
            <Pill>{post.meta.readingMinutes}</Pill>
          </div>
          <h1
            className="mt-5 text-balance font-heading text-5xl font-black tracking-[-0.08em] text-foreground md:text-7xl"
            style={{ viewTransitionName: `post-${post.meta.slug}` }}
          >
            {post.meta.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{post.meta.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{formatDate(post.meta.date)}</span>
            {post.meta.tags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        </header>

        <GlassPanel className="mt-10 p-6 md:p-10">
          <div className="prose-sunset max-w-none">{post.content}</div>
        </GlassPanel>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {previous ? (
            <RouteLink href={`/posts/${previous.slug}`} transitionKey={`post-${previous.slug}`}>
              <SoftPanel className="h-full p-5 transition hover:-translate-y-0.5">
                <p className="text-sm text-muted-foreground">上一篇</p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                  {previous.title}
                </h2>
              </SoftPanel>
            </RouteLink>
          ) : (
            <div />
          )}

          {next ? (
            <RouteLink href={`/posts/${next.slug}`} transitionKey={`post-${next.slug}`}>
              <SoftPanel className="h-full p-5 text-left transition hover:-translate-y-0.5 md:text-right">
                <div className="flex items-center justify-between gap-2 md:flex-row-reverse">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">下一篇</p>
                </div>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.05em] text-foreground">
                  {next.title}
                </h2>
              </SoftPanel>
            </RouteLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
