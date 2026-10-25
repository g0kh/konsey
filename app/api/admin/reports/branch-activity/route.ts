import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { BRANCHES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const [comments, consults] = await Promise.all([
    prisma.branchComment.groupBy({
      by: ["branch"],
      _count: { id: true },
    }),
    prisma.quickConsult.findMany({
      include: {
        respondedBy: { select: { branch: true } },
      },
    }),
  ]);

  const commentMap = new Map(comments.map((c) => [c.branch, c._count.id]));
  const pendingMap = new Map<string, number>();
  const responseTimes = new Map<string, number[]>();

  for (const consult of consults) {
    if (!consult.response) {
      pendingMap.set(
        consult.targetBranch,
        (pendingMap.get(consult.targetBranch) ?? 0) + 1,
      );
      continue;
    }
    if (consult.respondedAt) {
      const hours =
        (consult.respondedAt.getTime() - consult.createdAt.getTime()) /
        (1000 * 60 * 60);
      const branch = consult.targetBranch;
      const existing = responseTimes.get(branch) ?? [];
      existing.push(hours);
      responseTimes.set(branch, existing);
    }
  }

  const branches = BRANCHES.map((branch) => {
    const times = responseTimes.get(branch) ?? [];
    const avgHours =
      times.length === 0
        ? null
        : Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;

    return {
      branch,
      commentCount: commentMap.get(branch) ?? 0,
      pendingConsults: pendingMap.get(branch) ?? 0,
      avgResponseHours: avgHours,
    };
  }).sort((a, b) => b.commentCount - a.commentCount);

  return NextResponse.json({ branches });
}
