import { NextResponse } from "next/server";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      tcNo?: string;
      diagnosis?: string;
      councilType?: string;
      requestingBranch?: string;
      presentationReason?: string;
      submittedByUserId?: string;
    };

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const tcNo = body.tcNo?.trim();
    const councilType = body.councilType?.trim();
    const presentationReason =
      body.presentationReason?.trim() || "Konsey değerlendirmesi";

    if (!firstName || !lastName || !tcNo || !councilType) {
      return NextResponse.json(
        { error: "Ad, soyad, TC no ve konsey türü zorunludur" },
        { status: 400 },
      );
    }

    if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
      return NextResponse.json({ error: "Geçersiz konsey türü" }, { status: 400 });
    }

    const submitter =
      body.submittedByUserId
        ? await prisma.user.findUnique({ where: { id: body.submittedByUserId } })
        : await prisma.user.findFirst({ where: { role: "DOCTOR" } });

    if (!submitter) {
      return NextResponse.json(
        { error: "Sunumu oluşturacak doktor bulunamadı" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.upsert({
      where: { tcNo },
      update: {
        firstName,
        lastName,
        diagnosis: body.diagnosis?.trim() || undefined,
      },
      create: {
        firstName,
        lastName,
        tcNo,
        diagnosis: body.diagnosis?.trim() || null,
      },
    });

    const presentation = await prisma.councilPresentation.create({
      data: {
        patientId: patient.id,
        submittedByUserId: submitter.id,
        councilType,
        presentationReason,
        clinicalSummary: body.diagnosis?.trim() || null,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let session = await prisma.councilSession.findFirst({
      where: {
        councilType,
        sessionDate: { gte: today, lt: tomorrow },
      },
    });

    if (!session) {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (!admin) {
        return NextResponse.json(
          { error: "Konsey oturumu oluşturulamadı: admin kullanıcı yok" },
          { status: 500 },
        );
      }

      session = await prisma.councilSession.create({
        data: {
          councilType,
          sessionDate: new Date(),
          createdByUserId: admin.id,
        },
      });
    }

    const existingCount = await prisma.councilSessionPresentation.count({
      where: { sessionId: session.id },
    });

    await prisma.councilSessionPresentation.create({
      data: {
        sessionId: session.id,
        presentationId: presentation.id,
        orderIndex: existingCount + 1,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Patient create error:", error);
    return NextResponse.json(
      { error: "Hasta kaydı oluşturulurken bir hata oluştu" },
      { status: 500 },
    );
  }
}
