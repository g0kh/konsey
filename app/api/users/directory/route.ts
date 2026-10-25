import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DIRECTORY_LIMIT = 500;

export async function GET(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const councilType = new URL(request.url).searchParams.get("councilType")?.trim();
    if (
      councilType &&
      !COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])
    ) {
      return NextResponse.json({ error: "Geçersiz konsey türü" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
      take: DIRECTORY_LIMIT,
      select: {
        id: true,
        name: true,
        branch: true,
        preferredCouncilTypes: true,
      },
    });

    const directory = users.map((user) => ({
      id: user.id,
      name: user.name,
      branch: user.branch,
    }));

    const members = councilType
      ? users
          .filter((user) => user.preferredCouncilTypes.includes(councilType))
          .map((user) => ({
            id: user.id,
            name: user.name,
            branch: user.branch,
          }))
      : [];

    return NextResponse.json({ members, users: directory });
  } catch (error) {
    console.error("User directory error:", error);
    return NextResponse.json(
      { error: "Hekim listesi yüklenemedi" },
      { status: 500 },
    );
  }
}
