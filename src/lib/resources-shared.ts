import type { ResourceContentFrontmatter } from "./content-shared";

export const ALL_RESOURCES_CATEGORY = "全部";

type SearchValue = string | string[] | undefined;

export type ResourceItem = ResourceContentFrontmatter;

export type ResourceFilters = {
  q?: SearchValue;
  category?: SearchValue;
};

function readSearchValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function normalizeResourceFilters(filters: ResourceFilters) {
  return normalizeResourceFiltersWithCategories(filters, [ALL_RESOURCES_CATEGORY]);
}

export function normalizeResourceFiltersWithCategories(filters: ResourceFilters, categories: string[]) {
  const q = readSearchValue(filters.q).trim();
  const requestedCategory = readSearchValue(filters.category).trim();
  const category = categories.includes(requestedCategory) ? requestedCategory : ALL_RESOURCES_CATEGORY;

  return { q, category };
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
