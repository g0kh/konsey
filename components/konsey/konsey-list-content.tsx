import { KonseyListGroups } from "@/components/konsey/konsey-list-groups";
import { getCurrentUserFromCookie } from "@/lib/server/current-user-cookie";
import {
  getPresentationsList,
  type PresentationListFilters,
} from "@/lib/server/presentations";
import { withServerCache } from "@/lib/server-cache";

const LIST_CACHE_TTL_MS = 15_000;

function presentationsCacheKey(filters: PresentationListFilters): string {
  const prefs = filters.preferredCouncilTypes?.join(",") ?? "";
  return [
    "konsey-list",
    filters.councilType ?? "all",
    filters.status ?? "",
    filters.search ?? "",
    filters.userBranch ?? "",
    prefs,
  ].join(":");
}

export async function KonseyListContent({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await getCurrentUserFromCookie();
  const councilType = searchParams.councilType ?? "all";
  const filters: PresentationListFilters = {
    councilType,
    status: searchParams.status,
    search: searchParams.search,
    userBranch: user?.branch,
    preferredCouncilTypes:
      user?.role === "ADMIN" ? null : (user?.preferredCouncilTypes ?? []),
  };

  const presentations = await withServerCache(
    presentationsCacheKey(filters),
    LIST_CACHE_TTL_MS,
    () => getPresentationsList(filters),
  );

  return (
    <KonseyListGroups
      presentations={presentations}
      councilTypeFilter={councilType}
      statusFilter={searchParams.status}
    />
  );
}
