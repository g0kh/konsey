import { COUNCIL_TYPES, BRANCHES } from "@/lib/constants";
import {
  defaultImagingSections,
  formatImagingEntriesForSummary,
  type ImagingSectionName,
  type ImagingSectionValue,
  isPlausibleImagingDate,
} from "@/lib/imaging-data";
import { z } from "zod";

/** TC: yalnızca 11 rakam (algoritma kontrolü yok) */
export function isValidTcNoFormat(tcNo: string): boolean {
  return /^\d{11}$/.test(tcNo);
}

export function ageToBirthDate(age: number): Date {
  const year = new Date().getFullYear() - age;
  return new Date(year, 0, 1);
}

const optionalUrl = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      return "";
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  })
  .refine(
    (value) => !value || /^https?:\/\/.+/i.test(value),
    "Geçerli bir link girin",
  );

const imagingEntrySchema = z.object({
  date: z
    .string()
    .default("")
    .refine(
      (value) => isPlausibleImagingDate(value),
      "Tarih formatı: 12.01.2026 veya 12/06/26",
    ),
  notes: z.string().default(""),
  link: optionalUrl.default(""),
});

const imagingSectionSchema = z.object({
  enabled: z.boolean(),
  entries: z.array(imagingEntrySchema).min(1),
});

export const presentationFormSchema = z.object({
  firstName: z.string().min(1, "Bu alan zorunludur"),
  lastName: z.string().min(1, "Bu alan zorunludur"),
  tcNo: z
    .string()
    .regex(/^\d{11}$/, "TC kimlik numarası 11 haneli olmalıdır"),
  age: z
    .string()
    .optional()
    .refine(
      (value) => !value || (/^\d{1,3}$/.test(value) && Number(value) <= 150),
      "Geçerli bir yaş girin",
    ),
  councilType: z.enum(COUNCIL_TYPES, { message: "Konsey türü seçin" }),
  presentationReason: z.string().min(1, "Bu alan zorunludur"),
  clinicalSummary: z.string().optional(),
  petScan: imagingSectionSchema,
  mrScan: imagingSectionSchema,
  ctScan: imagingSectionSchema,
  pathology: imagingSectionSchema,
  memeUsg: imagingSectionSchema,
  otherImaging: imagingSectionSchema,
  quickConsultEnabled: z.boolean().default(false),
  quickConsultBranch: z.enum(BRANCHES).default(BRANCHES[0]),
  quickConsultQuestion: z.string().default(""),
});

export type PresentationFormValues = z.infer<typeof presentationFormSchema>;

export const step1Schema = presentationFormSchema.pick({
  firstName: true,
  lastName: true,
  tcNo: true,
  age: true,
});

export const step2Schema = presentationFormSchema.pick({
  councilType: true,
  presentationReason: true,
  clinicalSummary: true,
});

export const step3Schema = presentationFormSchema.pick({
  petScan: true,
  mrScan: true,
  ctScan: true,
  pathology: true,
  memeUsg: true,
  otherImaging: true,
});

export const step4Schema = presentationFormSchema.pick({
  quickConsultEnabled: true,
  quickConsultBranch: true,
  quickConsultQuestion: true,
});

export const defaultPresentationFormValues: PresentationFormValues = {
  firstName: "",
  lastName: "",
  tcNo: "",
  age: "",
  councilType: COUNCIL_TYPES[0],
  presentationReason: "",
  clinicalSummary: "",
  quickConsultEnabled: false,
  quickConsultBranch: BRANCHES[0],
  quickConsultQuestion: "",
  ...defaultImagingSections(),
};

export function formatImagingNote(section: ImagingSectionValue): string | null {
  return formatImagingEntriesForSummary(section);
}

export { type ImagingSectionName, type ImagingSectionValue };
