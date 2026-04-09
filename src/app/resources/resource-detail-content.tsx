import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { MDXComponents } from "@/components/mdx/components";

export async function ResourceDetailContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components: MDXComponents,
    options: {
      parseFrontmatter: false,
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

  return <div className="prose-sunset max-w-none">{content}</div>;
}
