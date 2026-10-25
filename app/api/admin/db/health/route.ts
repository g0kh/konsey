import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type CheckResult = {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  message: string;
};

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const checks: CheckResult[] = [];

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      id: "connection",
      label: "Veritabanı bağlantısı",
      status: "pass",
      message: "Bağlantı başarılı",
    });
  } catch {
    checks.push({
      id: "connection",
      label: "Veritabanı bağlantısı",
      status: "fail",
      message: "Bağlantı kurulamadı",
    });
    return NextResponse.json({ checks, ranAt: new Date().toISOString() });
  }

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const required = [
    "User",
    "Patient",
    "CouncilPresentation",
    "QuickConsult",
    "BranchComment",
    "CouncilSession",
    "CouncilSessionPresentation",
    "AdminAuditLog",
  ];
  const missing = required.filter(
    (t) => !tables.some((row) => row.tablename === t),
  );
  checks.push({
    id: "tables",
    label: "Tüm tablolar mevcut",
    status: missing.length ? "fail" : "pass",
    message: missing.length ? `Eksik: ${missing.join(", ")}` : "Tüm tablolar mevcut",
  });

  const orphanPresentations = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::int as count FROM "CouncilPresentation" p
    WHERE NOT EXISTS (SELECT 1 FROM "Patient" pt WHERE pt.id = p."patientId")
  `;
  const orphanCount = Number(orphanPresentations[0]?.count ?? 0);
  checks.push({
    id: "orphans",
    label: "Orphan kayıt kontrolü",
    status: orphanCount > 0 ? "warn" : "pass",
    message:
      orphanCount > 0
        ? `${orphanCount} yetim sunum kaydı`
        : "Yetim kayıt bulunamadı",
  });

  const duplicateTc = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::int as count FROM (
      SELECT "tcNo" FROM "Patient" GROUP BY "tcNo" HAVING COUNT(*) > 1
    ) d
  `;
  const dupCount = Number(duplicateTc[0]?.count ?? 0);
  checks.push({
    id: "duplicate_tc",
    label: "Duplicate TC kontrolü",
    status: dupCount > 0 ? "fail" : "pass",
    message: dupCount > 0 ? `${dupCount} mükerrer TC` : "Mükerrer TC yok",
  });

  const missingRequired = await prisma.councilPresentation.count({
    where: {
      OR: [
        { presentationReason: "" },
        { patient: { firstName: "" } },
      ],
    },
  });
  checks.push({
    id: "required_fields",
    label: "Eksik zorunlu alan kontrolü",
    status: missingRequired > 0 ? "warn" : "pass",
    message:
      missingRequired > 0
        ? `${missingRequired} eksik alanlı kayıt`
        : "Zorunlu alanlar tamam",
  });

  checks.push({
    id: "fk_integrity",
    label: "Foreign key bütünlüğü",
    status: orphanCount > 0 ? "warn" : "pass",
    message: orphanCount > 0 ? "Bazı ilişkiler bozuk olabilir" : "FK bütünlüğü sağlam",
  });

  return NextResponse.json({ checks, ranAt: new Date().toISOString() });
}
