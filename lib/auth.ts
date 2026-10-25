import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export { SESSION_COOKIE_KEY } from "@/lib/session-constants";
export {
  buildClearSessionCookieHeader,
  buildSessionCookieHeader,
  createUserSession,
  destroySessionFromRequest,
  getSessionUserFromCookies,
  getSessionUserFromRequest,
  getSessionTokenFromRequest,
  requireAuth,
  toSessionUser,
  verifySessionCookie,
  type SessionUser,
} from "@/lib/auth-session";

export function buildDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function slugifyUsername(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9.]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export async function generateUniqueUsername(
  firstName: string,
  lastName: string,
): Promise<string> {
  const base = slugifyUsername(`${firstName}.${lastName}`) || "kullanici";
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
}

export type { UserRole };
