import { resources, type ResourceItem } from "@/content/site";

export const ALL_RESOURCES_CATEGORY = "全部";

type SearchValue = string | string[] | undefined;

export type ResourceFilters = {
  q?: SearchValue;
  category?: SearchValue;
};

export function getResourceSlugs() {
  return resources.map((resource) => resource.slug);
}

export function getResourceBySlug(slug: string) {
  return resources.find((resource) => resource.slug === slug) ?? null;
}

export function getResourceCategories() {
  return [ALL_RESOURCES_CATEGORY, ...new Set(resources.map((resource) => resource.category))];
}

function readSearchValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function normalizeResourceFilters(filters: ResourceFilters) {
  const categories = getResourceCategories();
  const q = readSearchValue(filters.q).trim();
  const requestedCategory = readSearchValue(filters.category).trim();
  const category = categories.includes(requestedCategory) ? requestedCategory : ALL_RESOURCES_CATEGORY;

  return { q, category };
}

export function filterResources(filters: ResourceFilters) {
  const { q, category } = normalizeResourceFilters(filters);
  const normalized = q.toLowerCase();

  return resources.filter((resource) => {
    const matchCategory = category === ALL_RESOURCES_CATEGORY || resource.category === category;
    const haystack = `${resource.title} ${resource.description} ${resource.tags.join(" ")}`.toLowerCase();
    const matchQuery = !normalized || haystack.includes(normalized);

    return matchCategory && matchQuery;
  });
}

export function getRelatedResources(slug: string, limit = 3) {
  const current = getResourceBySlug(slug);

  if (!current) {
    return [] as ResourceItem[];
  }

  const sameCategory = resources.filter(
    (resource) => resource.slug !== slug && resource.category === current.category,
  );
  const remainder = resources.filter(
    (resource) => resource.slug !== slug && resource.category !== current.category,
  );

  return [...sameCategory, ...remainder].slice(0, limit);
}

export function buildResourcesHref(filters: ResourceFilters = {}) {
  const { q, category } = normalizeResourceFilters(filters);
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (category && category !== ALL_RESOURCES_CATEGORY) {
    params.set("category", category);
  }

  const query = params.toString();
  return query ? `/resources?${query}` : "/resources";
}

export function buildResourceDetailHref(slug: string, filters: ResourceFilters = {}) {
  const base = `/resources/${slug}`;
  const listHref = buildResourcesHref(filters);
  const queryIndex = listHref.indexOf("?");

  return queryIndex === -1 ? base : `${base}${listHref.slice(queryIndex)}`;
}
