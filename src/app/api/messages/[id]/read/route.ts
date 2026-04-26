import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { markMessageAsRead } from "@/lib/messages";
import type { MessageMutationResponse } from "@/lib/messages-shared";
import { isCloudflareRuntime } from "@/lib/runtime-environment";
import { apiMessageRootDir, revalidateMessageRoutes } from "../../shared";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  if (isCloudflareRuntime()) {
    return NextResponse.json<MessageMutationResponse>(
      {
        ok: false,
        message: "Cloudflare deployment is read-only for file-based messages. Migrate messages to D1/R2 to manage them online.",
      },
      { status: 501 },
    );
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json<MessageMutationResponse>(
      {
        ok: false,
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  const { id } = await params;
  const item = await markMessageAsRead({
    rootDir: apiMessageRootDir(),
    id,
  });

  if (!item) {
    return NextResponse.json<MessageMutationResponse>(
      {
        ok: false,
        message: "Message not found.",
      },
      { status: 404 },
    );
  }

  revalidateMessageRoutes();

  return NextResponse.json<MessageMutationResponse>({
    ok: true,
    item,
  });
}
