import { NextResponse } from "next/server";
import { buildAdminDashboardData } from "@/lib/admin-dashboard-data";
import { requireAdmin } from "@/lib/admin-auth";
import { withServerCache } from "@/lib/server-cache";

const CACHE_TTL_MS = 30_000;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const data = await withServerCache(
      "admin-dashboard",
      CACHE_TTL_MS,
      buildAdminDashboardData,
    );

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Dashboard verileri yüklenemedi" },
      { status: 500 },
    );
  }
}
