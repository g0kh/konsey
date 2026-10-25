import Link from "next/link";
import {
  formatCouncilDate,
  getCouncilTypeBadgeStyle,
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
} from "@/lib/presentation-utils";
import { cn } from "@/lib/utils";
import type { PresentationStatus } from "@prisma/client";

export type PresentationListItem = {
  id: string;
  councilType: string;
  presentationReason: string;
  status: PresentationStatus;
  councilDate: string | null;
  patient: {
    firstName: string;
    lastName: string;
    tcNo: string;
  };
  submittedBy: {
    name: string;
    branch: string;
  };
  hasPendingConsultForBranch: boolean;
};

export function PresentationCard({
  presentation,
}: {
  presentation: PresentationListItem;
}) {
  return (
    <Link
      href={`/konsey/${presentation.id}`}
      className="card card-interactive group relative flex flex-col p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "mb-2 inline-block",
              getCouncilTypeBadgeStyle(presentation.councilType),
            )}
          >
            {presentation.councilType}
          </span>
          <h3 className="truncate font-display text-lg font-semibold text-text-primary">
            {presentation.patient.firstName} {presentation.patient.lastName}
          </h3>
          <p className="tabular-nums text-xs text-text-secondary">
            TC: {presentation.patient.tcNo}
          </p>
        </div>
        {presentation.hasPendingConsultForBranch && (
          <span className="badge badge-urgent inline-flex shrink-0 items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-urgent-dot animate-pulse-dot" />
            Görüş Bekliyor
          </span>
        )}
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-text-secondary">
        {presentation.presentationReason}
      </p>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-theme-border pt-3">
        <div className="space-y-1 text-xs text-text-secondary">
          <p>
            {presentation.submittedBy.name}
            <span className="text-text-tertiary"> · </span>
            {presentation.submittedBy.branch}
          </p>
          <p>{formatCouncilDate(presentation.councilDate)}</p>
        </div>
        <span className={cn(STATUS_BADGE_STYLES[presentation.status])}>
          {STATUS_LABELS[presentation.status]}
        </span>
      </div>
    </Link>
  );
}
