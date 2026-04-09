import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { MDXComponents } from "@/components/mdx/components";

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
  draft?: boolean;
};

export type PostMeta = PostFrontmatter & {
  readingMinutes: string;
};

export async function getPostSlugs() {
  const files = await fs.readdir(POSTS_DIR);
  return files.filter((file) => file.endsWith(".mdx")).map((file) => file.replace(/\.mdx$/, ""));
}

export async function getAllPosts() {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPostMeta(slug)));

  return posts
    .filter((post): post is PostMeta => post !== null)
    .filter((post) => !post.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getFeaturedPosts(limit = 3) {
  const posts = await getAllPosts();
  return posts.filter((post) => post.featured).slice(0, limit);
}

export async function getPostMeta(slug: string) {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
    const source = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(source);
    const stats = readingTime(content);

    return {
      ...(data as PostFrontmatter),
      slug,
      readingMinutes: `${Math.max(1, Math.ceil(stats.minutes))} min read`,
    } satisfies PostMeta;
  } catch {
    return null;
  }
}

export async function getPostBySlug(slug: string) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  const source = await fs.readFile(filePath, "utf8");
  const { content } = matter(source);

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
      slug,
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
