export type DetailActionItem = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type DetailAttachmentItem = {
  name: string;
  href?: string | null;
  meta?: string | null;
};

export function isRenderableExternalHref(href: string) {
  const trimmed = href.trim();

  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
    if ((url.hostname === "github.com" || url.hostname === "www.github.com") && normalizedPath === "/") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function buildDetailMetaChips(values: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return values
    .map((value) => value?.trim() ?? "")
    .filter((value) => {
      if (!value || seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    });
}

export function resolveDetailSummary(summary?: string | null, description?: string | null) {
  const primary = summary?.trim() ?? "";

  if (primary) {
    return primary;
  }

  return description?.trim() ?? "";
}

export function buildDetailAttachmentItems(
  assetNames?: string[] | null,
  assetPaths?: string[] | null,
  fallbackMeta = "仅保留元数据引用",
): DetailAttachmentItem[] {
  return (assetNames ?? []).map((name, index) => {
    const href = assetPaths?.[index] ?? null;

    return {
      name,
      href,
      meta: href ? href.replace(/^\/+/, "") : fallbackMeta,
    };
  });
}

export function renderDetailHeroActionAttrs(items: DetailActionItem[]) {
  return items
    .filter((item) => isRenderableExternalHref(item.href))
    .map((item) => ({
      ...item,
      target: "_blank",
      rel: "noreferrer",
    }));
}

export function normalizeDetailAttachments(items: DetailAttachmentItem[]) {
  return items.map((item) => ({
    ...item,
    isLinked: Boolean(item.href),
  }));
}
