import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookie,
  getAdminSessionCookieOptions,
  hasAdminAccessConfig,
  isValidAdminAccessCode,
  sanitizeAdminNextPath,
} from "@/lib/admin-auth";

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
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
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
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!isValidAdminAccessCode(accessCode)) {
    return NextResponse.json<AdminSessionResult>(
      {
        ok: false,
        message: "管理员访问码无效。",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const sessionCookie = createAdminSessionCookie();

  if (!sessionCookie) {
    return NextResponse.json<AdminSessionResult>(
      {
        ok: false,
        message: "管理员会话密钥未配置。",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const response = NextResponse.json<AdminSessionResult>({
    ok: true,
    redirectHref: next,
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json<AdminSessionResult>({
    ok: true,
    redirectHref: "/admin",
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", getAdminSessionCookieOptions(0));

  return response;
}
