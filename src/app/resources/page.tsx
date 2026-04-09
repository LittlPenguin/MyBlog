import { Suspense } from "react";
import { GlassPanel, Pill, SoftPanel } from "@/components/site/ui";
import {
  normalizeResourceFiltersWithCategories,
  type ResourceFilters,
} from "@/lib/resources-shared";
import {
  getAllResources,
  getResourceCategories,
} from "@/lib/resources";
import { ResourcesClient } from "./resources-client";

type PageProps = {
  searchParams: Promise<ResourceFilters>;
};

function ResourcesFallback() {
  return (
    <div className="space-y-6 pb-8 pt-2">
      <section className="relative mx-auto max-w-3xl text-center">
        <Pill active className="mx-auto">
          Resource Shelf
        </Pill>
        <div className="mx-auto mt-4 h-16 w-[24rem] max-w-full rounded-full bg-white/70" />
        <div className="mx-auto mt-4 h-5 w-[34rem] max-w-full rounded-full bg-white/60" />
      </section>

      <section className="scroll-strip flex gap-2 overflow-x-auto py-1">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-10 w-24 rounded-full bg-white/66" />
        ))}
      </section>

      <section className="editorial-grid md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <GlassPanel key={index} className="p-6">
            <div className="h-12 w-12 rounded-[18px] bg-white/76" />
            <div className="mt-5 h-8 w-2/3 rounded-full bg-white/80" />
            <div className="mt-3 h-4 w-3/4 rounded-full bg-white/66" />
            <div className="mt-4 space-y-2">
              <div className="h-4 rounded-full bg-white/60" />
              <div className="h-4 rounded-full bg-white/52" />
              <div className="h-4 w-4/5 rounded-full bg-white/52" />
            </div>
            <div className="mt-5 flex gap-2">
              <SoftPanel className="h-8 w-24">
                <span aria-hidden="true" />
              </SoftPanel>
              <SoftPanel className="h-8 w-18">
                <span aria-hidden="true" />
              </SoftPanel>
            </div>
          </GlassPanel>
        ))}
      </section>
    </div>
  );
}

async function ResourcesPageContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const [resources, categories] = await Promise.all([getAllResources(), getResourceCategories()]);
  const filters = normalizeResourceFiltersWithCategories(resolvedSearchParams, categories);

  return <ResourcesClient initialFilters={filters} resources={resources} categories={categories} />;
}

export default function ResourcesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<ResourcesFallback />}>
      <ResourcesPageContent searchParams={searchParams} />
    </Suspense>
  );
}
