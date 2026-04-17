import path from "node:path";
import matter from "gray-matter";
import type { ProjectContentFrontmatter } from "./content-shared";
import { findContentFileBySlug, normalizeContentSlug } from "./content-slug.js";
import { readCollectionItems } from "./content.js";

const PROJECTS_DIR = path.join(process.cwd(), "src", "content", "projects");

export type ProjectFrontmatter = ProjectContentFrontmatter;

export type ProjectItem = ProjectFrontmatter;

function normalizeProjectItem(
  project: Partial<ProjectItem> &
    Pick<ProjectItem, "title" | "slug" | "summary" | "date" | "category" | "tags" | "featured" | "draft" | "hidden" | "assetNames">,
): ProjectItem {
  return {
    ...project,
    description: project.description ?? project.summary,
    year: project.year ?? project.date.slice(0, 4),
    stack: project.stack ?? (project.tags.length > 0 ? project.tags : ["Notes"]),
    icon: project.icon ?? "grid",
    accent: project.accent ?? "primary",
    assetNames: project.assetNames ?? [],
    assetPaths: project.assetPaths ?? [],
  };
}

export async function getAllProjects() {
  const items = await readCollectionItems<ProjectFrontmatter>(PROJECTS_DIR);

  return items
    .map((item) => normalizeProjectItem(item.meta))
    .filter((project) => !project.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getProjectSlugs() {
  const projects = await getAllProjects();
  return projects.map((project) => project.slug);
}

export async function getProjectBySlug(slug: string) {
  const projects = await getAllProjects();
  const normalizedSlug = normalizeContentSlug(slug);
  return projects.find((project) => project.slug === normalizedSlug) ?? null;
}

export async function getProjectDetailBySlug(slug: string) {
  const match = await findContentFileBySlug(PROJECTS_DIR, slug);
  if (!match) {
    return null;
  }

  const { data, content } = matter(match.source);
  const meta = normalizeProjectItem(data as ProjectItem);

  return {
    meta,
    rawContent: content,
  };
}
