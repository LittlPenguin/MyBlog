import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth-server";
import { createMessage, readAllMessages, validateMessageInput } from "@/lib/messages";
import type { MessageCreateResponse, MessageListResponse } from "@/lib/messages-shared";
import { isCloudflareRuntime } from "@/lib/runtime-environment";
import { getD1Binding } from "@/lib/cloudflare-bindings";
import { listD1Messages, saveD1Message } from "@/lib/cloudflare-content-store";
import { apiMessageRootDir, revalidateMessageRoutes } from "./shared";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json<MessageListResponse>(
      {
        ok: false,
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  const db = getD1Binding();
  const items = db ? await listD1Messages(db) : await readAllMessages(apiMessageRootDir());
  return NextResponse.json<MessageListResponse>({
    ok: true,
    items,
  });
}

export async function POST(request: Request) {
  const db = getD1Binding();

  if (isCloudflareRuntime() && !db) {
    return NextResponse.json<MessageCreateResponse>(
      {
        ok: false,
        message: "Cloudflare deployment is read-only for file-based messages. Use local message storage or migrate messages to D1/R2.",
      },
      { status: 501 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json<MessageCreateResponse>(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const validation = validateMessageInput({
    name: typeof body.name === "string" ? body.name : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    body: typeof body.body === "string" ? body.body : undefined,
  });

  if (!validation.ok) {
    return NextResponse.json<MessageCreateResponse>(validation, { status: 422 });
  }

  if (db) {
    await saveD1Message({
      db,
      input: validation.value,
    });
  } else {
    await createMessage({
      rootDir: apiMessageRootDir(),
      input: validation.value,
    });
  }
  revalidateMessageRoutes();

  return NextResponse.json<MessageCreateResponse>({
    ok: true,
    message: "Message sent.",
  });
}
