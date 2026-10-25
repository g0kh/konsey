import {
  hasImagingContent,
  parseImagingEntries,
  type ImagingEntry,
} from "@/lib/imaging-data";

export type { ImagingEntry };

/** @deprecated parseImagingEntries kullanın */
export function parseImagingNote(note: string | null): {
  notes: string;
  link: string | null;
  entries: ImagingEntry[];
} {
  const entries = parseImagingEntries(note);
  if (entries.length === 0) {
    return { notes: "", link: null, entries: [] };
  }

  const notes = entries
    .map((e) => {
      const parts: string[] = [];
      if (e.date) parts.push(`[${e.date}]`);
      if (e.notes) parts.push(e.notes);
      return parts.join(" ");
    })
    .join("\n");

  const link = entries.find((e) => e.link)?.link ?? null;
  return { notes, link, entries };
}

export function imagingHasContent(note: string | null | undefined): boolean {
  return hasImagingContent(parseImagingEntries(note));
}

export function calculateAge(birthDate: string | null): string | null {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return `${age} yaş`;
}
