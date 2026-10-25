import type { CurrentUser } from "@/lib/UserContext";
import { adminFetch } from "@/lib/admin-fetch";

export function adminFetcher(user: CurrentUser | null) {
  return async (url: string) => {
    const response = await adminFetch(user, url);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "İstek başarısız");
    }
    return response.json();
  };
}
