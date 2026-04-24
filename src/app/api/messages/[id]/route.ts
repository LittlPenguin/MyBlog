import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { deleteMessage } from "@/lib/messages";
import type { MessageDeleteResponse } from "@/lib/messages-shared";
import { apiMessageRootDir, revalidateMessageRoutes } from "../shared";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
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
