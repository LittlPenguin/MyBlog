type SearchValue = string | string[] | undefined;

export const ALL_POSTS_CATEGORY = "全部";

export type ArchiveFilters = {
  q?: SearchValue;
  category?: SearchValue;
};

function readSearchValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function normalizeArchiveFilters(filters: ArchiveFilters) {
  return normalizeArchiveFiltersWithCategories(filters, [ALL_POSTS_CATEGORY]);
}

export function normalizeArchiveFiltersWithCategories(filters: ArchiveFilters, categories: string[]) {
  const q = readSearchValue(filters.q).trim();
  const requestedCategory = readSearchValue(filters.category).trim();
  const category = categories.includes(requestedCategory) ? requestedCategory : ALL_POSTS_CATEGORY;

  return { q, category };
}

export function buildArchiveHref(filters: ArchiveFilters = {}) {
  const q = readSearchValue(filters.q).trim();
  const category = readSearchValue(filters.category).trim();
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (category && category !== ALL_POSTS_CATEGORY) {
    params.set("category", category);
  }

  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export function buildPostDetailHref(slug: string, filters: ArchiveFilters = {}) {
  const base = `/posts/${encodeURIComponent(slug)}`;
  const archiveHref = buildArchiveHref(filters);
  const queryIndex = archiveHref.indexOf("?");

  return queryIndex === -1 ? base : `${base}${archiveHref.slice(queryIndex)}`;
}
