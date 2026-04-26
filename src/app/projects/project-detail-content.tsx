import { MarkdownContent } from "@/components/site/markdown-content";

export function ProjectDetailContent({ source }: { source: string }) {
  return <MarkdownContent source={source} />;
}
