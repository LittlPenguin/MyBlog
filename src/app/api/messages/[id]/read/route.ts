import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { markMessageAsRead } from "@/lib/messages";
import type { MessageMutationResponse } from "@/lib/messages-shared";
import { apiMessageRootDir, revalidateMessageRoutes } from "../../shared";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
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
