import type { PresentationStatus } from "@prisma/client";
import { formatDateFull } from "@/lib/date-utils";

export const STATUS_FILTER_OPTIONS = [
  { value: "PENDING", label: "Bekliyor" },
  { value: "IN_COUNCIL", label: "Konseyde" },
  { value: "COMPLETED", label: "Tamamlandı" },
] as const;

export type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

export const STATUS_LABELS: Record<PresentationStatus, string> = {
  PENDING: "Bekliyor",
  IN_COUNCIL: "Konseyde",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

export const STATUS_BADGE_STYLES: Record<PresentationStatus, string> = {
  PENDING: "badge badge-pending",
  IN_COUNCIL: "badge badge-active",
  COMPLETED: "badge badge-complete",
  CANCELLED: "badge badge-cancelled",
};

/** Neutral council type chip — all types look the same */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getCouncilTypeBadgeStyle(_councilType?: string): string {
  return "council-chip";
}

export function formatCouncilDate(date: string | null): string {
  if (!date) {
    return "—";
  }
  return formatDateFull(date);
}

export function maskTcNo(tcNo: string): string {
  if (tcNo.length < 6) {
    return tcNo;
  }
  return `${tcNo.slice(0, 3)}****${tcNo.slice(-3)}`;
}
