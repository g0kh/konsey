/** Türkiye cep numarası. Yalnızca hesap sahibine gösterilir. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("5")) {
    return `0${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("05")) {
    return digits;
  }

  if (digits.length === 12 && digits.startsWith("905")) {
    return `0${digits.slice(2)}`;
  }

  return null;
}
