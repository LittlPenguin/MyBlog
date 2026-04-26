import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { MDXComponents } from "@/components/mdx/components";
import { findContentFileBySlug, normalizeContentSlug } from "./content-slug.js";
import { getStaticContentEntries } from "./static-content.js";

const POSTS_DIR = path.join(process.cwd(), "src", "content", "posts");

export type PostFrontmatter = {
  title: string;
  slug: string;
  summary: string;
  date: string;
  category: string;
  tags: string[];
  cover?: string;
  featured?: boolean;
};

export type PostMeta = PostFrontmatter & {
  readingMinutes: string;
};

export async function getPostSlugs() {
  const files = await fs.readdir(POSTS_DIR).catch(() => getStaticContentEntries(POSTS_DIR).map((entry) => entry.fileName));
  return files.filter((file) => file.endsWith(".mdx")).map((file) => file.replace(/\.mdx$/, ""));
}

export async function getAllPosts() {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPostMeta(slug)));

  return posts
    .filter((post): post is PostMeta => post !== null)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getFeaturedPosts(limit = 3) {
  const posts = await getAllPosts();
  return posts.filter((post) => post.featured).slice(0, limit);
}

export async function getPostMeta(slug: string) {
  try {
    const match = await findContentFileBySlug(POSTS_DIR, slug);
    if (!match) {
      return null;
    }
    const source = match.source;
    const { data, content } = matter(source);
    const stats = readingTime(content);

    return {
      ...(data as PostFrontmatter),
      slug: normalizeContentSlug(slug),
      readingMinutes: `${Math.max(1, Math.ceil(stats.minutes))} min read`,
    } satisfies PostMeta;
  } catch {
    return null;
  }
}

export async function getPostBySlug(slug: string) {
  const match = await findContentFileBySlug(POSTS_DIR, slug);
  if (!match) {
    throw new Error(`Post not found for slug: ${slug}`);
  }
  const source = match.source;
  const { content } = matter(source);
  const normalizedSlug = normalizeContentSlug(slug);

  const { frontmatter, content: compiledContent } = await compileMDX<PostFrontmatter>({
    source,
    components: MDXComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                className: ["anchor-link"],
              },
            },
          ],
        ],
      },
    },
  });

  return {
    meta: {
      ...frontmatter,
      slug: normalizedSlug,
      readingMinutes: `${Math.max(1, Math.ceil(readingTime(content).minutes))} min read`,
    } satisfies PostMeta,
    content: compiledContent,
  };
}

export async function getAdjacentPosts(slug: string) {
  const posts = await getAllPosts();
  const currentIndex = posts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: posts[currentIndex + 1] ?? null,
    next: posts[currentIndex - 1] ?? null,
  };
}
