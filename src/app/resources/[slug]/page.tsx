import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminDeleteButton } from "@/components/site/admin-delete-button";
import {
  DetailAttachmentsSection,
  DetailBackLink,
  DetailHeroActions,
  DetailPageShell,
  DetailRelatedSection,
} from "@/components/site/detail-shell";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { buildDetailAttachmentItems, buildDetailMetaChips, resolveDetailSummary } from "@/lib/detail-shell";
import { buildEditorLoadHref } from "@/lib/editor";
import { buildResourcesHref, buildResourceDetailHref, type ResourceFilters } from "@/lib/resources-shared";
import { getRelatedResources, getResourceDetailBySlug, getResourceSlugs } from "@/lib/resources";
import { ResourceDetailContent } from "../resource-detail-content";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ResourceFilters>;
};

export async function generateStaticParams() {
  const slugs = await getResourceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceDetailBySlug(slug);

  if (!resource) {
    return {};
  }

  const summary = resolveDetailSummary(resource.meta.summary, resource.meta.description);

  return {
    title: resource.meta.title,
    description: summary,
  };
}

export default async function ResourceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const resource = await getResourceDetailBySlug(slug);

  if (!resource) {
    notFound();
  }

  const [canManage, related] = await Promise.all([
    isAdminRequest(),
    getRelatedResources(resource.meta.slug, 3),
  ]);
  const summary = resolveDetailSummary(resource.meta.summary, resource.meta.description);
  const backHref = buildResourcesHref(filters);

  return (
    <DetailPageShell
      backLink={
        <div className="flex flex-wrap items-center gap-3">
          <DetailBackLink href={backHref} preserveScroll label="返回资源列表" transitionKey="resource-back" />
          {canManage ? (
            <>
              <DetailBackLink
                href={buildEditorLoadHref("resource", resource.meta.slug)}
                label="编辑"
                transitionKey={`resource-edit-${resource.meta.slug}`}
              />
              <AdminDeleteButton category="resource" slug={resource.meta.slug} redirectHref={backHref} variant="inline">
                删除
              </AdminDeleteButton>
            </>
          ) : null}
        </div>
      }
      eyebrow={
        <>
          <span className="resource-detail-chip-dot" aria-hidden="true" />
          {resource.meta.category}
        </>
      }
      title={resource.meta.title}
      summary={<p>{summary}</p>}
      cover={
        resource.meta.cover ? (
          <div className="theme-surface overflow-hidden rounded-[28px] p-2 shadow-[var(--shadow-far)]">
            <Image
              src={resource.meta.cover}
              alt={resource.meta.title}
              width={1600}
              height={900}
              className="h-auto w-full rounded-[22px] object-cover"
              sizes="(min-width: 1280px) 900px, 100vw"
            />
          </div>
        ) : null
      }
      metaChips={buildDetailMetaChips([resource.meta.category, `${resource.meta.rating}.0 / 5`, ...resource.meta.tags])}
      actions={
        resource.meta.url ? (
          <DetailHeroActions
            items={[
              {
                label: "打开原始资源",
                href: resource.meta.url,
                variant: "primary",
                icon: <ExternalLink className="h-4 w-4" />,
              },
            ]}
          />
        ) : null
      }
      body={<ResourceDetailContent source={resource.rawContent} />}
      attachments={
        <DetailAttachmentsSection
          title="资源附件"
          items={buildDetailAttachmentItems(resource.meta.assetNames, resource.meta.assetPaths)}
        />
      }
      related={
        <DetailRelatedSection
          title="相关资源"
          items={related.map((item) => ({
            title: item.title,
            summary: resolveDetailSummary(item.summary, item.description),
            href: buildResourceDetailHref(item.slug, filters),
            transitionKey: `resource-${item.slug}`,
            meta: item.category,
          }))}
        />
      }
    />
  );
}
