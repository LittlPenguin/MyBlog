import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDeleteButton } from "@/components/site/admin-delete-button";
import { DetailBackLink, DetailPageShell, DetailRelatedSection } from "@/components/site/detail-shell";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { buildDetailMetaChips, resolveDetailSummary } from "@/lib/detail-shell";
import { buildEditorLoadHref } from "@/lib/editor";
import { buildArchiveHref, type ArchiveFilters } from "@/lib/posts-shared";
import { getAdjacentPosts, getPostBySlug, getPostSlugs } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ArchiveFilters>;
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

export default async function PostPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) {
    notFound();
  }

  const [canManage, adjacent] = await Promise.all([isAdminRequest(), getAdjacentPosts(slug)]);
  const summary = resolveDetailSummary(post.meta.summary);
  const relatedItems = [adjacent.previous, adjacent.next]
    .filter((item): item is NonNullable<typeof adjacent.previous> => item !== null)
    .map((item) => ({
      title: item.title,
      summary: item.summary,
      href: `/posts/${item.slug}`,
      transitionKey: `post-${item.slug}`,
      meta: item.readingMinutes,
    }));
  const backHref = buildArchiveHref(filters);

  return (
    <DetailPageShell
      backLink={
        <div className="flex flex-wrap items-center gap-3">
          <DetailBackLink href={backHref} preserveScroll label="返回归档" transitionKey="back-archive" />
          {canManage ? (
            <>
              <DetailBackLink
                href={buildEditorLoadHref("archive", post.meta.slug)}
                label="编辑"
                transitionKey={`post-edit-${post.meta.slug}`}
              />
              <AdminDeleteButton category="archive" slug={post.meta.slug} redirectHref={backHref} variant="inline">
                删除
              </AdminDeleteButton>
            </>
          ) : null}
        </div>
      }
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
