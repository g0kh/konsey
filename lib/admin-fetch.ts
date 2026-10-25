import type { CurrentUser } from "@/lib/UserContext";

export async function adminFetch(
  user: CurrentUser | null,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  if (!user) {
    throw new Error("Giriş gerekli");
  }

  return fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
