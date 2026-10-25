const TURKISH_FOLDS: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

export function foldTurkish(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .split("")
    .map((char) => TURKISH_FOLDS[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function editDistance(left: string, right: string): number {
  if (Math.abs(left.length - right.length) > 2) {
    return 3;
  }

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array<number>(cols).fill(0),
  );

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }
  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

/** Ad ve branş üzerinde önek, içerme ve kısa yazım farkı sıralaması. 0 eşleşme yok. */
export function fuzzyScore(query: string, ...fields: string[]): number {
  const normalizedQuery = foldTurkish(query.trim());
  if (!normalizedQuery) {
    return 1;
  }

  const haystack = foldTurkish(fields.filter(Boolean).join(" "));
  if (!haystack) {
    return 0;
  }

  if (haystack.startsWith(normalizedQuery)) {
    return 100;
  }

  const words = haystack.split(/\s+/).filter(Boolean);
  if (words.some((word) => word.startsWith(normalizedQuery))) {
    return 80;
  }
  if (haystack.includes(normalizedQuery)) {
    return 60;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const token of tokens) {
    const exact = words.find((word) => word.startsWith(token) || word.includes(token));
    if (exact) {
      score += exact.startsWith(token) ? 30 : 18;
      continue;
    }

    const close = words.find((word) => editDistance(word, token) <= 1);
    if (!close) {
      return 0;
    }
    score += 12;
  }

  return score;
}
