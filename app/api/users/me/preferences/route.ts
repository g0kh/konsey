import { NextResponse } from "next/server";
import { buildDisplayName } from "@/lib/auth";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { BRANCHES, COUNCIL_TYPES } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      branch: true,
      phone: true,
      preferredCouncilTypes: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    branch: user.branch,
    phone: user.phone ?? "",
    preferredCouncilTypes: user.preferredCouncilTypes ?? [],
  });
}

export async function PATCH(request: Request) {
  const session = await getSessionUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    branch?: string;
    phone?: string;
    preferredCouncilTypes?: string[];
  };

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const branch = body.branch?.trim() ?? "";
  const phone = normalizePhone(body.phone ?? "");

  if (!firstName || !lastName || !branch) {
    return NextResponse.json(
      { error: "İsim, soyisim ve klinik zorunludur" },
      { status: 400 },
    );
  }

  if (!BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
    return NextResponse.json({ error: "Geçersiz klinik" }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json(
      { error: "Geçerli bir cep telefonu numarası girin" },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.preferredCouncilTypes)) {
    return NextResponse.json(
      { error: "Geçersiz konsey tercihleri" },
      { status: 400 },
    );
  }

  const preferredCouncilTypes = Array.from(
    new Set(
      body.preferredCouncilTypes.filter((type) =>
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

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      firstName,
      lastName,
      name: buildDisplayName(firstName, lastName),
      branch,
      phone,
      preferredCouncilTypes,
    },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      branch: true,
      phone: true,
      preferredCouncilTypes: true,
    },
  });

  return NextResponse.json({
    firstName: updated.firstName,
    lastName: updated.lastName,
    username: updated.username,
    branch: updated.branch,
    phone: updated.phone ?? "",
    preferredCouncilTypes: updated.preferredCouncilTypes,
  });
}
