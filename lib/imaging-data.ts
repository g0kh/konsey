export type ImagingEntry = {
  date: string;
  notes: string;
  link: string;
};

export type ImagingSectionValue = {
  enabled: boolean;
  entries: ImagingEntry[];
};

export const PACS_LINK_HINT =
  "Hastanın PACS görüntüleme ekranındaki linki kopyalayıp buraya yapıştırabilirsiniz.";

export const IMAGING_FORM_SECTIONS = [
  {
    name: "petScan",
    dbField: "petScanNote",
    label: "PET Görüntüleme",
    addLabel: "Başka bir PET ekle",
    dateLabel: "PET Tarihi",
    pacsEnabled: true,
    pacsDisabledNote: "",
  },
  {
    name: "mrScan",
    dbField: "mrNote",
    label: "MR Görüntüleme",
    addLabel: "Başka bir MR ekle",
    dateLabel: "MR Tarihi",
    pacsEnabled: true,
    pacsDisabledNote: "",
  },
  {
    name: "ctScan",
    dbField: "ctNote",
    label: "BT (Tomografi)",
    addLabel: "Başka bir BT ekle",
    dateLabel: "BT Tarihi",
    pacsEnabled: true,
    pacsDisabledNote: "",
  },
  {
    name: "pathology",
    dbField: "pathologyNote",
    label: "Patoloji",
    addLabel: "Başka bir patoloji ekle",
    dateLabel: "Patoloji Tarihi",
    pacsEnabled: false,
    pacsDisabledNote: "Dijital patoloji bağlantısı henüz verilmiyor.",
  },
  {
    name: "memeUsg",
    dbField: "memeUsgNote",
    label: "Ultrason",
    addLabel: "Başka bir ultrason ekle",
    dateLabel: "Ultrason Tarihi",
    pacsEnabled: false,
    pacsDisabledNote: "Ultrason için PACS bağlantısı henüz kullanılmıyor.",
  },
  {
    name: "otherImaging",
    dbField: "imagingNote",
    label: "Diğer Görüntüleme",
    addLabel: "Başka bir görüntüleme ekle",
    dateLabel: "Tarih",
    pacsEnabled: true,
    pacsDisabledNote: "",
  },
] as const;

export type ImagingSectionName = (typeof IMAGING_FORM_SECTIONS)[number]["name"];

export function emptyImagingEntry(): ImagingEntry {
  return { date: "", notes: "", link: "" };
}

export function defaultImagingSection(): ImagingSectionValue {
  return { enabled: false, entries: [emptyImagingEntry()] };
}

export function defaultImagingSections(): Record<ImagingSectionName, ImagingSectionValue> {
  return {
    petScan: defaultImagingSection(),
    mrScan: defaultImagingSection(),
    ctScan: defaultImagingSection(),
    pathology: defaultImagingSection(),
    memeUsg: defaultImagingSection(),
    otherImaging: defaultImagingSection(),
  };
}

const LINK_MARKER = "\n\nGörüntüleme linki: ";

/** Eski düz metin veya JSON dizisini okur */
export function parseImagingEntries(note: string | null | undefined): ImagingEntry[] {
  if (!note?.trim()) {
    return [];
  }

  const trimmed = note.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as ImagingEntry[];
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          date: entry.date ?? "",
          notes: entry.notes ?? "",
          link: entry.link ?? "",
        }));
      }
    } catch {
      /* eski format */
    }
  }

  const linkIndex = trimmed.indexOf(LINK_MARKER);
  if (linkIndex !== -1) {
    return [
      {
        date: "",
        notes: trimmed.slice(0, linkIndex).trim(),
        link: trimmed.slice(linkIndex + LINK_MARKER.length).trim(),
      },
    ];
  }

  if (trimmed.startsWith("Görüntüleme linki: ")) {
    return [
      {
        date: "",
        notes: "",
        link: trimmed.replace("Görüntüleme linki: ", "").trim(),
      },
    ];
  }

  return [{ date: "", notes: trimmed, link: "" }];
}

export function withoutPacsLinks(section: ImagingSectionValue): ImagingSectionValue {
  return {
    ...section,
    entries: section.entries.map((entry) => ({ ...entry, link: "" })),
  };
}

export function serializeImagingSection(section: ImagingSectionValue): string | null {
  const entries = section.entries
    .map((entry) => ({
      date: entry.date.trim(),
      notes: entry.notes.trim(),
      link: normalizeLink(entry.link),
    }))
    .filter((entry) => entry.date || entry.notes || entry.link);

  if (entries.length === 0) {
    return null;
  }

  return JSON.stringify(entries);
}

function normalizeLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function formatImagingEntriesForSummary(
  section: ImagingSectionValue,
): string | null {
  const entries = section.entries
    .map((entry) => ({
      date: entry.date.trim(),
      notes: entry.notes.trim(),
      link: entry.link.trim(),
    }))
    .filter((entry) => entry.date || entry.notes || entry.link);

  if (entries.length === 0) {
    return null;
  }

  return entries
    .map((entry, index) => {
      const parts: string[] = [];
      if (entries.length > 1) {
        parts.push(`Kayıt ${index + 1}`);
      }
      if (entry.date) {
        parts.push(`Tarih: ${entry.date}`);
      }
      if (entry.notes) {
        parts.push(entry.notes);
      }
      if (entry.link) {
        parts.push(`Link: ${entry.link}`);
      }
      return parts.join("\n");
    })
    .join("\n\n");
}

export function hasImagingContent(entries: ImagingEntry[]): boolean {
  return entries.some((e) => e.date || e.notes || e.link);
}

/** Görüntüleme tarihi — 12.01.2026, 12/06/26 vb. serbest metin */
export function isPlausibleImagingDate(value: string): boolean {
  if (!value.trim()) {
    return true;
  }
  const normalized = value.trim().replace(/\s+/g, "");
  return /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})$/.test(
    normalized,
  );
}
