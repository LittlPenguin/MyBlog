import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AdminEnvLike = Record<string, string | undefined>;

type ReadTokenOptions = {
  sessionSecret: string;
  now?: number;
};

type CreateTokenOptions = {
  sessionSecret: string;
  expiresAt: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function readEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export function getAdminAccessCode(env: AdminEnvLike = process.env) {
  return readEnvValue(env.ADMIN_ACCESS_CODE);
}

export function getAdminSessionSecret(env: AdminEnvLike = process.env) {
  return readEnvValue(env.ADMIN_SESSION_SECRET);
}

export function hasAdminAccessConfig(env: AdminEnvLike = process.env) {
  return Boolean(getAdminAccessCode(env) && getAdminSessionSecret(env));
}

export function sanitizeAdminNextPath(input: string | null | undefined) {
  if (!input) {
    return "/editor";
  }

  const value = input.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/editor";
  }

  return value;
}

export function createAdminSessionToken({ sessionSecret, expiresAt }: CreateTokenOptions) {
  const payload = toBase64Url(JSON.stringify({ exp: expiresAt }));
  const signature = signValue(payload, sessionSecret);
  return `${payload}.${signature}`;
}

export function readAdminSessionToken(token: string, { sessionSecret, now = Date.now() }: ReadTokenOptions) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return { isValid: false, expiresAt: null };
  }

  const expectedSignature = signValue(payload, sessionSecret);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { isValid: false, expiresAt: null };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as { exp?: number };
    const expiresAt = typeof parsed.exp === "number" ? parsed.exp : null;

    if (!expiresAt) {
      return { isValid: false, expiresAt: null };
    }

    return {
      isValid: expiresAt > now,
      expiresAt,
    };
  } catch {
    return { isValid: false, expiresAt: null };
  }
}

export function getAdminSessionCookieOptions(maxAge = ADMIN_SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function isValidAdminAccessCode(accessCode: string, env: AdminEnvLike = process.env) {
  const expected = getAdminAccessCode(env);
  if (!expected) {
    return false;
  }

  return accessCode.trim() === expected;
}
