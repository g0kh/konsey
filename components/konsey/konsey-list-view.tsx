import { KonseyListContent } from "@/components/konsey/konsey-list-content";
import { KonseyListFilters } from "@/components/konsey/konsey-list-filters";
import { KonseySessionRunner } from "@/components/konsey/konsey-session-runner";

export function KonseyListView({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const councilType = searchParams.councilType ?? "all";
  const status = searchParams.status ?? "";

  return (
    <>
      <KonseyListFilters />
      <KonseyListContent searchParams={searchParams} />
      <KonseySessionRunner councilType={councilType} status={status} />
    </>
  );
}
