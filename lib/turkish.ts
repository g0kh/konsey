/** Türkçe büyük harf kuralları (İ/i, I/ı) */
export function formatTurkishUppercase(text: string): string {
  return text.toLocaleUpperCase("tr-TR");
}

export function formatTurkishTitlecase(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (!word) return word;
      const lower = word.toLocaleLowerCase("tr-TR");
      return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
    })
    .join(" ");
}
