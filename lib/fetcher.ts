export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Veri yüklenemedi");
  }

  return response.json() as Promise<T>;
}
