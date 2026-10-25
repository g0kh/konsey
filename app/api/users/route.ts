import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/** Eski kimlik seçimi kaldırıldı — kullanıcı listesi yalnızca admin API üzerinden */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  return NextResponse.json(
    { error: "Bu uç nokta kullanımdan kaldırıldı. /api/admin/users kullanın." },
    { status: 410 },
  );
}
