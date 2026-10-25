import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_KEY,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-constants";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  branch: string;
  role: UserRole;
  preferredCouncilTypes: string[];
};

type SessionPayload = SessionUser & {
  sessionToken: string;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "dev-only-change-in-production";
  return new TextEncoder().encode(secret);
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    branch: user.branch,
    role: user.role,
    preferredCouncilTypes: user.preferredCouncilTypes ?? [],
  };
}

async function signSessionCookie(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionCookie(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sessionToken = payload.sessionToken;
    const id = payload.id;

    if (typeof sessionToken !== "string" || typeof id !== "string") {
      return null;
    }

    const session = await prisma.authSession.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (
      !session ||
      session.expiresAt < new Date() ||
      !session.user.isActive ||
      session.user.id !== id
    ) {
      return null;
    }

    const sessionUser = toSessionUser(session.user);
    return { ...sessionUser, sessionToken };
  } catch {
    return null;
  }
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_KEY}=`));

  if (!match) {
    return null;
  }

  return match.slice(SESSION_COOKIE_KEY.length + 1);
}

function sessionUserFromPayload(payload: SessionPayload): SessionUser {
  return {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    firstName: payload.firstName,
    lastName: payload.lastName,
    branch: payload.branch,
    role: payload.role,
    preferredCouncilTypes: payload.preferredCouncilTypes ?? [],
  };
}

export async function getSessionUserFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  const token = getSessionTokenFromRequest(request);
  const payload = await verifySessionCookie(token);
  if (!payload) {
    return null;
  }

  return sessionUserFromPayload(payload);
}

export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE_KEY)?.value;
  const payload = await verifySessionCookie(token);
  if (!payload) {
    return null;
  }

  return sessionUserFromPayload(payload);
}

export async function createUserSession(user: User): Promise<string> {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.authSession.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt,
    },
  });

  const sessionUser = toSessionUser(user);
  return signSessionCookie({
    ...sessionUser,
    sessionToken,
  });
}

export function buildSessionCookieHeader(jwt: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_KEY}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function buildClearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_KEY}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function destroySessionFromRequest(
  request: Request,
): Promise<void> {
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    return;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sessionToken = payload.sessionToken;
    if (typeof sessionToken === "string") {
      await prisma.authSession.deleteMany({ where: { token: sessionToken } });
    }
  } catch {
    // Geçersiz oturum — temizleme gerekmez
  }
}

export async function requireAuth(
  request: Request,
): Promise<SessionUser | Response> {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Giriş gerekli" }, { status: 401 });
  }
  return user;
}
