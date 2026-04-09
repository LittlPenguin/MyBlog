import type { Metadata } from "next";
import { EditorClient } from "./editor-client";

export const metadata: Metadata = {
  title: "编辑器",
  description: "用于编写、预览并提交文章的单屏后台编辑页。",
};

export default function EditorPage() {
  return <EditorClient />;
}
