import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  getAdminSessionSecret,
  readAdminSessionToken,
} from "./admin-auth";

export async function isAdminRequest() {
  const sessionSecret = getAdminSessionSecret();

  if (!sessionSecret) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return readAdminSessionToken(token, { sessionSecret }).isValid;
}

export async function setAdminSessionCookie() {
  const sessionSecret = getAdminSessionSecret();

  if (!sessionSecret) {
    return false;
  }

  const cookieStore = await cookies();
  const token = createAdminSessionToken({
    sessionSecret,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000,
  });

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, getAdminSessionCookieOptions());
  return true;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", getAdminSessionCookieOptions(0));
}
