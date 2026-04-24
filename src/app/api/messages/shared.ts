import { revalidatePath } from "next/cache";
import { messageRootDir } from "@/lib/messages";

export function apiMessageRootDir() {
  return messageRootDir(process.cwd());
}

export function revalidateMessageRoutes() {
  revalidatePath("/about");
  revalidatePath("/editor");
}
