import type { PresentationStatus } from "@prisma/client";
import { STATUS_BADGE_STYLES, STATUS_LABELS } from "@/lib/presentation-utils";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: PresentationStatus }) {
  return (
    <span className={cn(STATUS_BADGE_STYLES[status])} data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  );
}
