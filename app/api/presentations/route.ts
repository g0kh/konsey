import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getPresentationsList } from "@/lib/server/presentations";
import { invalidateServerCache } from "@/lib/server-cache";
import { serializeImagingSection, withoutPacsLinks } from "@/lib/imaging-data";
import type { ImagingSectionValue } from "@/lib/imaging-data";
import {
  ageToBirthDate,
  isValidTcNoFormat,
} from "@/lib/validations/presentation-form";

export async function GET(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const councilType = searchParams.get("councilType");

    if (
      councilType &&
      councilType !== "all" &&
      !COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])
    ) {
      return NextResponse.json({ error: "Geçersiz konsey türü" }, { status: 400 });
    }

    const result = await getPresentationsList({
      councilType,
      status: searchParams.get("status"),
      search: searchParams.get("search"),
      userBranch: searchParams.get("userBranch"),
      preferredCouncilTypes:
        !session || session.role === "ADMIN"
          ? null
          : session.preferredCouncilTypes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Presentations fetch error:", error);
    return NextResponse.json(
      { error: "Sunumlar yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      tcNo?: string;
      age?: string | number;
      birthDate?: string;
      diagnosis?: string;
      councilType?: string;
      presentationReason?: string;
      clinicalSummary?: string;
      petScan?: ImagingSectionValue;
      mrScan?: ImagingSectionValue;
      ctScan?: ImagingSectionValue;
      pathology?: ImagingSectionValue;
      memeUsg?: ImagingSectionValue;
      otherImaging?: ImagingSectionValue;
    };

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const tcNo = body.tcNo?.trim();
    const councilType = body.councilType?.trim();
    const presentationReason = body.presentationReason?.trim();
    if (!firstName || !lastName || !tcNo || !councilType || !presentationReason) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 },
      );
    }

    if (!isValidTcNoFormat(tcNo)) {
      return NextResponse.json(
        { error: "TC kimlik numarası 11 haneli olmalıdır" },
        { status: 400 },
      );
    }

    if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
      return NextResponse.json({ error: "Geçersiz konsey türü" }, { status: 400 });
    }

    if (
      session.role !== "ADMIN" &&
      !session.preferredCouncilTypes.includes(councilType)
    ) {
      return NextResponse.json(
        { error: "Üye olmadığınız konseye hasta ekleyemezsiniz" },
        { status: 403 },
      );
    }

    const ageRaw = body.age;
    const parsedAge =
      ageRaw !== undefined && ageRaw !== "" && ageRaw !== null
        ? Number(ageRaw)
        : NaN;
    const birthDate = Number.isFinite(parsedAge) && parsedAge >= 0
      ? ageToBirthDate(parsedAge)
      : body.birthDate
        ? new Date(body.birthDate)
        : undefined;
    const diagnosis =
      body.diagnosis?.trim() ||
      body.clinicalSummary?.trim() ||
      null;

    const patient = await prisma.patient.upsert({
      where: { tcNo },
      update: {
        firstName,
        lastName,
        ...(birthDate !== undefined ? { birthDate } : {}),
        diagnosis: diagnosis || undefined,
      },
      create: {
        firstName,
        lastName,
        tcNo,
        birthDate: birthDate ?? null,
        diagnosis,
      },
    });

    const presentation = await prisma.councilPresentation.create({
      data: {
        patientId: patient.id,
        submittedByUserId: session.id,
        councilType,
        presentationReason,
        clinicalSummary: body.clinicalSummary?.trim() || null,
        petScanNote: serializeImagingSection(body.petScan ?? { enabled: false, entries: [] }),
        mrNote: serializeImagingSection(body.mrScan ?? { enabled: false, entries: [] }),
        ctNote: serializeImagingSection(body.ctScan ?? { enabled: false, entries: [] }),
        pathologyNote: serializeImagingSection(
          withoutPacsLinks(body.pathology ?? { enabled: false, entries: [] }),
        ),
        memeUsgNote: serializeImagingSection(
          withoutPacsLinks(body.memeUsg ?? { enabled: false, entries: [] }),
        ),
        imagingNote: serializeImagingSection(body.otherImaging ?? { enabled: false, entries: [] }),
      },
    });

    invalidateServerCache("konsey-list");
    try {
      revalidatePath("/konsey");
    } catch {
      /* test ortamında revalidatePath kullanılamaz */
    }

    return NextResponse.json({
      presentationId: presentation.id,
      patientId: patient.id,
    });
  } catch (error) {
    console.error("Presentation create error:", error);
    return NextResponse.json(
      { error: "Sunum oluşturulurken bir hata oluştu" },
      { status: 500 },
    );
  }
}
