import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import {
  DetailAttachmentsSection,
  DetailBackLink,
  DetailHeroActions,
  DetailPageShell,
  DetailRelatedSection,
} from "@/components/site/detail-shell";
import {
  buildDetailAttachmentItems,
  buildDetailMetaChips,
  resolveDetailSummary,
} from "@/lib/detail-shell";
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

  const summary = resolveDetailSummary(resource.meta.summary, resource.meta.description);
  const related = await getRelatedResources(resource.meta.slug, 3);
  const backHref = buildResourcesHref(filters);

  return (
    <DetailPageShell
      backLink={
        <DetailBackLink
          href={backHref}
          preserveScroll
          label="返回资源列表"
          transitionKey="resource-back"
        />
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
      metaChips={buildDetailMetaChips([
        resource.meta.category,
        `${resource.meta.rating}.0 / 5`,
        ...resource.meta.tags,
      ])}
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
