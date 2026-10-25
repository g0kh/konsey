import { getSessionUserFromCookies } from "@/lib/auth-session";
import type { CurrentUser } from "@/lib/UserContext";

export async function getCurrentUserFromCookie(): Promise<CurrentUser | null> {
  const user = await getSessionUserFromCookies();
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    branch: user.branch,
    role: user.role,
    preferredCouncilTypes: user.preferredCouncilTypes ?? [],
  };
}
