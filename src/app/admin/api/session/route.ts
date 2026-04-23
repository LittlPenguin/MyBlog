import { NextResponse } from "next/server";
import {
  hasAdminAccessConfig,
  isValidAdminAccessCode,
  sanitizeAdminNextPath,
} from "@/lib/admin-auth";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/admin-auth-server";

type AdminSessionResult =
  | {
      ok: true;
      redirectHref: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function POST(request: Request) {
  if (!hasAdminAccessConfig()) {
    return NextResponse.json<AdminSessionResult>(
      {
        ok: false,
        message: "管理员访问码未配置。",
      },
      { status: 503 },
    );
  }

  let accessCode = "";
  let next = "/editor";

  try {
    const body = (await request.json()) as {
      accessCode?: string;
      next?: string;
    };
    accessCode = body.accessCode ?? "";
    next = sanitizeAdminNextPath(body.next);
  } catch {
    return NextResponse.json<AdminSessionResult>(
      {
        ok: false,
        message: "请求体必须是有效 JSON。",
      },
      { status: 400 },
    );
  }

  if (!isValidAdminAccessCode(accessCode)) {
    return NextResponse.json<AdminSessionResult>(
      {
        ok: false,
        message: "管理员访问码无效。",
      },
      { status: 401 },
    );
  }

  await setAdminSessionCookie();

  return NextResponse.json<AdminSessionResult>({
    ok: true,
    redirectHref: next,
  });
}

export async function DELETE() {
  await clearAdminSessionCookie();

  return NextResponse.json<AdminSessionResult>({
    ok: true,
    redirectHref: "/admin",
  });
}
