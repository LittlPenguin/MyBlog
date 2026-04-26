import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { deleteMessage } from "@/lib/messages";
import type { MessageDeleteResponse } from "@/lib/messages-shared";
import { isCloudflareRuntime } from "@/lib/runtime-environment";
import { apiMessageRootDir, revalidateMessageRoutes } from "../shared";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  if (isCloudflareRuntime()) {
    return NextResponse.json<MessageDeleteResponse>(
      {
        ok: false,
        message: "Cloudflare deployment is read-only for file-based messages. Migrate messages to D1/R2 to manage them online.",
      },
      { status: 501 },
    );
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json<MessageDeleteResponse>(
      {
        ok: false,
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  const { id } = await params;
  const deleted = await deleteMessage({
    rootDir: apiMessageRootDir(),
    id,
  });

  if (!deleted) {
    return NextResponse.json<MessageDeleteResponse>(
      {
        ok: false,
        message: "Message not found.",
      },
      { status: 404 },
    );
  }

  revalidateMessageRoutes();

  return NextResponse.json<MessageDeleteResponse>({
    ok: true,
    id,
  });
}
