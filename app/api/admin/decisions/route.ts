import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const councilType = searchParams.get("councilType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const doctor = searchParams.get("doctor")?.trim();

  const where: Prisma.CouncilPresentationWhereInput = {
    status: "COMPLETED",
    councilDecision: { not: null },
  };

  if (search) {
    where.OR = [
      { councilDecision: { contains: search, mode: "insensitive" } },
      { patient: { firstName: { contains: search, mode: "insensitive" } } },
      { patient: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (councilType && councilType !== "all") {
    where.councilType = councilType;
  }

  if (doctor) {
    where.councilDecisionBy = {
      name: { contains: doctor, mode: "insensitive" },
    };
  }

  if (dateFrom || dateTo) {
    where.councilDecisionAt = {};
    if (dateFrom) {
      where.councilDecisionAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.councilDecisionAt.lte = new Date(`${dateTo}T23:59:59`);
    }
  }

  const decisions = await prisma.councilPresentation.findMany({
    where,
    orderBy: { councilDecisionAt: "desc" },
    include: {
      patient: true,
      submittedBy: { select: { name: true, branch: true } },
      councilDecisionBy: { select: { id: true, name: true, branch: true } },
      branchComments: {
        include: { author: { select: { name: true, branch: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const auditByPresentation = await prisma.adminAuditLog.findMany({
    where: {
      entityType: "CouncilPresentation",
      action: "decision_edit",
      entityId: { in: decisions.map((d) => d.id) },
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  const auditMap = new Map<string, typeof auditByPresentation>();
  for (const log of auditByPresentation) {
    const existing = auditMap.get(log.entityId) ?? [];
    existing.push(log);
    auditMap.set(log.entityId, existing);
  }

  return NextResponse.json(
    decisions.map((d) => ({
      id: d.id,
      patient: {
        firstName: d.patient.firstName,
        lastName: d.patient.lastName,
        tcNo: d.patient.tcNo,
        diagnosis: d.patient.diagnosis,
        birthDate: d.patient.birthDate?.toISOString() ?? null,
        gender: d.patient.gender,
      },
      councilType: d.councilType,
      presentationReason: d.presentationReason,
      clinicalSummary: d.clinicalSummary,
      currentTreatment: d.currentTreatment,
      councilDecision: d.councilDecision,
      councilDecisionAt: d.councilDecisionAt?.toISOString() ?? null,
      councilDecisionBy: d.councilDecisionBy,
      submittedBy: d.submittedBy,
      branchComments: d.branchComments.map((c) => ({
        id: c.id,
        branch: c.branch,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
      })),
      editHistory: (auditMap.get(d.id) ?? []).map((log) => ({
        details: log.details,
        editedBy: log.user.name,
        editedAt: log.createdAt.toISOString(),
      })),
    })),
  );
}
