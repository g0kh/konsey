import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_KEY } from "@/lib/session-constants";

const PUBLIC_PATHS = new Set(["/", "/giris", "/kayit"]);
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/register", "/api/health"];

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "dev-only-change-in-production";
  return new TextEncoder().encode(secret);
}

async function readSessionPayload(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_KEY)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (typeof payload.id !== "string") {
      return null;
    }
    return payload as { id: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = await readSessionPayload(request);
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!session && !isPublicPath) {
    const loginUrl = new URL("/", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (session && (pathname === "/" || pathname === "/giris" || pathname === "/kayit")) {
    return NextResponse.redirect(new URL("/konsey", request.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/yetkisiz") {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/yetkisiz", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
