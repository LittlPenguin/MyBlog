import { MarkdownContent } from "@/components/site/markdown-content";

export function ResourceDetailContent({ source }: { source: string }) {
  return <MarkdownContent source={source} />;
}
