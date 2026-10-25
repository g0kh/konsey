import { NextResponse } from "next/server";
import { buildDisplayName, generateUniqueUsername } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-password";
import {
  buildSessionCookieHeader,
  createUserSession,
} from "@/lib/auth-session";
import { BRANCHES, COUNCIL_TYPES } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      branch?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      preferredCouncilTypes?: string[];
    };

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const branch = body.branch?.trim();
    const phone = normalizePhone(body.phone ?? "");
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!firstName || !lastName || !branch || !password) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur" },
        { status: 400 },
      );
    }

    if (!BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
      return NextResponse.json({ error: "Geçersiz branş" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Geçerli bir cep telefonu numarası girin" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Şifreler eşleşmiyor" }, { status: 400 });
    }

    const preferredCouncilTypes = Array.from(
      new Set(
        (body.preferredCouncilTypes ?? []).filter((type) =>
          COUNCIL_TYPES.includes(type as (typeof COUNCIL_TYPES)[number]),
        ),
      ),
    );

    if (preferredCouncilTypes.length === 0) {
      return NextResponse.json(
        { error: "En az bir konsey seçin" },
        { status: 400 },
      );
    }

    const username = await generateUniqueUsername(firstName, lastName);
    const passwordHash = await hashPassword(password);
    const name = buildDisplayName(firstName, lastName);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name,
        username,
        passwordHash,
        branch,
        phone,
        role: "DOCTOR",
        preferredCouncilTypes,
      },
    });

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
        status: 201,
        headers: {
          "Set-Cookie": buildSessionCookieHeader(jwt),
        },
      },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
