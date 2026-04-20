import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DetailBackLink,
  DetailPageShell,
  DetailRelatedSection,
} from "@/components/site/detail-shell";
import { buildDetailMetaChips, resolveDetailSummary } from "@/lib/detail-shell";
import { getAdjacentPosts, getPostBySlug, getPostSlugs } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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

  const summary = resolveDetailSummary(post.meta.summary);

  return {
    title: post.meta.title,
    description: summary,
    openGraph: {
      title: post.meta.title,
      description: summary,
      type: "article",
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) {
    notFound();
  }

  const summary = resolveDetailSummary(post.meta.summary);
  const { previous, next } = await getAdjacentPosts(slug);
  const relatedItems = [previous, next]
    .filter((item): item is NonNullable<typeof previous> => item !== null)
    .map((item) => ({
      title: item.title,
      summary: item.summary,
      href: `/posts/${item.slug}`,
      transitionKey: `post-${item.slug}`,
      meta: item.readingMinutes,
    }));

  return (
    <DetailPageShell
      backLink={<DetailBackLink href="/archive" label="返回归档" transitionKey="back-archive" />}
      eyebrow={
        <>
          <span className="resource-detail-chip-dot" aria-hidden="true" />
          {post.meta.category}
        </>
      }
      title={post.meta.title}
      summary={<p>{summary}</p>}
      metaChips={buildDetailMetaChips([formatDate(post.meta.date), post.meta.readingMinutes, ...post.meta.tags])}
      body={<div className="prose-sunset max-w-none">{post.content}</div>}
      related={<DetailRelatedSection title="继续阅读" items={relatedItems} />}
    />
  );
}
