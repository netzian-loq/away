import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal gate for the orders dashboard, which shows customer emails and
 * revenue.
 *
 * The cookie holds an HMAC derived from ADMIN_PASSWORD rather than the
 * password itself, so a stolen cookie doesn't reveal it, and it stops being
 * valid the moment the password is changed. Comparison is constant-time.
 *
 * Fails closed: with no ADMIN_PASSWORD configured nobody gets in, rather than
 * the dashboard defaulting to public.
 */

export const ADMIN_COOKIE = "away_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("away-orders-dashboard").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Verifies a submitted password and returns the cookie value to set. */
export function tokenForPassword(password: string): string | null {
  const configured = process.env.ADMIN_PASSWORD;
  const expected = expectedToken();
  if (!configured || !expected) return null;
  return safeEqual(password, configured) ? expected : null;
}

export async function isSignedIn(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(token && safeEqual(token, expected));
}

export async function signIn(token: string): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
