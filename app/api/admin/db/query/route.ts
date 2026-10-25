import { NextResponse } from "next/server";
import { isSuperAdmin, requireAdmin } from "@/lib/admin-auth";
import { validateSelectQuery } from "@/lib/admin-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!isSuperAdmin(auth.user)) {
    return NextResponse.json(
      { error: "Ham sorgu yalnızca süper admin için" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { sql?: string };
    const validation = validateSelectQuery(body.sql ?? "");
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await prisma.$queryRawUnsafe(body.sql!.trim().replace(/;$/, ""));
    const rows = Array.isArray(result) ? result : [result];
    const columns =
      rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null
        ? Object.keys(rows[0] as object)
        : [];

    return NextResponse.json({
      columns,
      rows: rows.map((row) =>
        Object.fromEntries(
          Object.entries(row as Record<string, unknown>).map(([key, value]) => [
            key,
            value instanceof Date ? value.toISOString() : value,
          ]),
        ),
      ),
      rowCount: rows.length,
    });
  } catch (error) {
    console.error("Admin query error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sorgu hatası" },
      { status: 400 },
    );
  }
}
