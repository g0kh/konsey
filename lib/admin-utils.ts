export function maskTcNo(tcNo: string): string {
  if (tcNo.length < 6) {
    return tcNo;
  }
  return `${tcNo.slice(0, 3)}****${tcNo.slice(-3)}`;
}

export function truncateText(text: string, max = 40): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}…`;
}

export function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((value) => {
      const str = value == null ? "" : String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i++;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

const FORBIDDEN_SQL =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i;

export function validateSelectQuery(sql: string): { ok: true } | { ok: false; error: string } {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { ok: false, error: "Sorgu boş olamaz" };
  }
  if (!/^\s*SELECT\b/i.test(trimmed)) {
    return { ok: false, error: "Yalnızca SELECT sorgularına izin verilir" };
  }
  if (FORBIDDEN_SQL.test(trimmed)) {
    return { ok: false, error: "Yasak SQL ifadesi tespit edildi" };
  }
  if (trimmed.includes(";") && trimmed.indexOf(";") < trimmed.length - 1) {
    return { ok: false, error: "Birden fazla sorgu çalıştırılamaz" };
  }
  return { ok: true };
}
