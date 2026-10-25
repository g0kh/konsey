import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TABLE_NAMES = [
  "User",
  "Patient",
  "CouncilPresentation",
  "QuickConsult",
  "BranchComment",
  "CouncilSession",
  "CouncilSessionPresentation",
] as const;

export async function GET() {
  const timestamp = new Date().toISOString();
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTimeMs = Date.now() - start;

    const [
      users,
      patients,
      presentations,
      quickConsults,
      branchComments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.councilPresentation.count(),
      prisma.quickConsult.count(),
      prisma.branchComment.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      database: {
        connected: true,
        responseTimeMs,
        tablesExist: [...TABLE_NAMES],
        recordCounts: {
          users,
          patients,
          presentations,
          quickConsults,
          branchComments,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV ?? "unknown",
        databaseUrl: Boolean(process.env.DATABASE_URL),
        nextVersion: process.env.npm_package_dependencies_next ?? "14.2.35",
      },
      timestamp,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        database: {
          connected: false,
          responseTimeMs: Date.now() - start,
          tablesExist: [],
          recordCounts: {
            users: 0,
            patients: 0,
            presentations: 0,
            quickConsults: 0,
            branchComments: 0,
          },
        },
        environment: {
          nodeEnv: process.env.NODE_ENV ?? "unknown",
          databaseUrl: Boolean(process.env.DATABASE_URL),
          nextVersion: process.env.npm_package_dependencies_next ?? "14.2.35",
        },
        timestamp,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
