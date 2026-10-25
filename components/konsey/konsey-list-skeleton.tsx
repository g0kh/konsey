import { DSCard } from "@/components/ui/design-system";
import { TableSkeleton } from "@/components/ui/skeleton";

export function KonseyListSkeleton() {
  return (
    <>
      <DSCard className="mb-6 !p-5">
        <div className="h-24 animate-pulse rounded-lg bg-surface-2" />
      </DSCard>
      <DSCard className="!p-0">
        <TableSkeleton rows={8} />
      </DSCard>
    </>
  );
}
