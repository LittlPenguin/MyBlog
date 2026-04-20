export type BaseContentFrontmatter = {
  title: string;
  slug: string;
  summary: string;
  description?: string;
  date: string;
  category: string;
  tags: string[];
  cover?: string;
  featured: boolean;
  assetNames: string[];
  assetPaths?: string[];
};

export type ResourceContentFrontmatter = BaseContentFrontmatter & {
  url: string;
  rating: number;
  accent: "primary" | "secondary" | "tertiary";
  monogram: string;
};

export type ProjectContentFrontmatter = BaseContentFrontmatter & {
  year: string;
  stack: string[];
  href?: string;
  github?: string;
  docs?: string;
  icon: "grid" | "spark" | "pen" | "layers";
  accent: "primary" | "secondary" | "tertiary";
};
