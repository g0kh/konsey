import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-password";
import {
  buildSessionCookieHeader,
  createUserSession,
} from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim().toLocaleLowerCase("tr-TR");
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gerekli" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı" },
        { status: 401 },
      );
    }

    const jwt = await createUserSession(user);

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        branch: user.branch,
        role: user.role,
      },
      {
        headers: {
          "Set-Cookie": buildSessionCookieHeader(jwt),
        },
      },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Giriş yapılamadı" }, { status: 500 });
  }
}
