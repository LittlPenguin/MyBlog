import { revalidatePath } from "next/cache";
import type { EditorCategory } from "@/lib/editor";

export function editorContentRootDir() {
  return `${process.cwd().replaceAll("\\", "/")}/src/content`;
}

export function revalidateEditorContentRoutes(category: EditorCategory, slug: string) {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/archive");
  revalidatePath("/projects");
  revalidatePath("/resources");
  revalidatePath("/sitemap.xml");

  if (category === "archive") {
    revalidatePath(`/posts/${slug}`);
  }

  if (category === "resource") {
    revalidatePath(`/resources/${slug}`);
  }

  if (category === "project") {
    revalidatePath(`/projects/${slug}`);
  }
}

export function revalidatePreviousContentRoute(category: EditorCategory, slug: string) {
  if (category === "archive") {
    revalidatePath(`/posts/${slug}`);
  }

  if (category === "resource") {
    revalidatePath(`/resources/${slug}`);
  }

  if (category === "project") {
    revalidatePath(`/projects/${slug}`);
  }
}
