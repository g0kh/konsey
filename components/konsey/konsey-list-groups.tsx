import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { CouncilChip, DSCard, DSEmptyState, DSTable } from "@/components/ui/design-system";
import { TableGroupHeader } from "@/components/ui/table-group-header";
import { groupPresentations } from "@/lib/group-presentations";
import { maskTcNo } from "@/lib/presentation-utils";
import type { PresentationListItem } from "@/lib/server/presentations";
import { ChevronRight, ClipboardList } from "lucide-react";

function truncateReason(text: string, max = 45): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function formatListDate(row: PresentationListItem): string {
  if (row.status === "COMPLETED" && row.councilDecisionAt) {
    return new Date(row.councilDecisionAt).toLocaleDateString("tr-TR");
  }
  if (row.councilDate) {
    return new Date(row.councilDate).toLocaleDateString("tr-TR");
  }
  return "—";
}

function PresentationRow({ row }: { row: PresentationListItem }) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2">
          {row.hasPendingConsultForBranch && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-urgent"
              title="Bekleyen hızlı görüş"
            />
          )}
          <div>
            <p className="font-medium text-text-primary">
              {row.patient.firstName} {row.patient.lastName}
            </p>
            <p className="tabular-nums text-[13px] text-text-muted">
              {maskTcNo(row.patient.tcNo)}
            </p>
          </div>
        </div>
      </td>
      <td>
        <CouncilChip label={row.councilType} />
      </td>
      <td className="max-w-[200px] text-text-secondary">
        {truncateReason(row.presentationReason)}
      </td>
      <td>
        {row.imagingLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.imagingLabels.map((label) => (
              <span
                key={label}
                className="badge badge-branch !py-0.5 !text-[10px]"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td>{row.submittedBy.name}</td>
      <td className="text-text-secondary">
        {formatListDate(row)}
      </td>
      <td>
        <StatusBadge status={row.status} />
      </td>
      <td>
        <Link
          href={`/konsey/${row.id}`}
          className="inline-flex size-8 items-center justify-center rounded-md text-text-muted transition-all duration-150 ease hover:bg-surface-2 hover:text-text-primary"
          title="Detay"
        >
          <ChevronRight className="size-4" />
        </Link>
      </td>
    </tr>
  );
}

function PresentationTable({
  items,
  statusFilter,
}: {
  items: PresentationListItem[];
  statusFilter?: string;
}) {
  const dateHeader =
    statusFilter === "COMPLETED" ? "Tamamlanma" : "Tarih";

  return (
    <DSCard className="!p-0 overflow-x-auto">
      <DSTable>
        <thead>
          <tr>
            <th>Hasta</th>
            <th>Konsey</th>
            <th>Sunuş Sebebi</th>
            <th>Görüntüleme</th>
            <th>Sunan Doktor</th>
            <th>{dateHeader}</th>
            <th>Durum</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <PresentationRow key={row.id} row={row} />
          ))}
        </tbody>
      </DSTable>
    </DSCard>
  );
}

export function KonseyListGroups({
  presentations,
  councilTypeFilter = "all",
  statusFilter,
}: {
  presentations: PresentationListItem[];
  councilTypeFilter?: string;
  statusFilter?: string;
}) {
  if (presentations.length === 0) {
    return (
      <DSCard>
        <DSEmptyState
          icon={ClipboardList}
          title="Henüz konsey sunumu bulunmuyor"
          description="Yeni hasta ekleyerek konsey sürecini başlatabilirsiniz."
        />
      </DSCard>
    );
  }

  const groups = groupPresentations(presentations, councilTypeFilter);
  const showGroupHeaders = councilTypeFilter === "all" && groups.length > 1;

  if (!showGroupHeaders) {
    return <PresentationTable items={presentations} statusFilter={statusFilter} />;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.type} className="konsey-group-section">
          <TableGroupHeader label={group.type} count={group.items.length} />
          <PresentationTable items={group.items} statusFilter={statusFilter} />
        </section>
      ))}
    </div>
  );
}
