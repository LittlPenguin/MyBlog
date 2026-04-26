import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  img: ({ alt = "", className, ...props }) => (
    // Markdown content may reference external images that are not configured for next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={["h-auto w-full", className].filter(Boolean).join(" ")} {...props} />
  ),
};

export function MarkdownContent({ source }: { source: string }) {
  return (
    <div className="prose-sunset max-w-none">
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
