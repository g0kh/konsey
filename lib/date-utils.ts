import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDate(
  date: string | Date | null | undefined,
  pattern = "d MMMM yyyy",
): string {
  if (!date) {
    return "—";
  }

  return format(new Date(date), pattern, { locale: tr });
}

/** Tam tarih: 15 Ocak 2025, Çarşamba */
export function formatDateFull(
  date: string | Date | null | undefined,
): string {
  if (!date) {
    return "—";
  }

  return format(new Date(date), "d MMMM yyyy, EEEE", { locale: tr });
}

/** Kısa tarih: 15 Oca 2025 */
export function formatDateShort(
  date: string | Date | null | undefined,
): string {
  if (!date) {
    return "—";
  }

  return format(new Date(date), "d MMM yyyy", { locale: tr });
}

export function formatDateTime(
  date: string | Date | null | undefined,
  pattern = "d MMMM yyyy, EEEE HH:mm",
): string {
  if (!date) {
    return "—";
  }

  return format(new Date(date), pattern, { locale: tr });
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) {
    return "—";
  }

  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
}
