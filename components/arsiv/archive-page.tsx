"use client";

import { Fragment, useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  CouncilChip,
  DSCard,
  DSEmptyState,
  DSGhostIconLink,
  DSSelect,
  DSTable,
  PageHeader,
} from "@/components/ui/design-system";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { COUNCIL_TYPES } from "@/lib/constants";
import { formatDateShort } from "@/lib/date-utils";
import { fetcher } from "@/lib/fetcher";
import type { CompletedPresentationsResponse } from "@/lib/types/archive";
import { Archive, ExternalLink, Printer } from "lucide-react";

function truncateText(text: string | null, maxLength = 80): string {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function ArchivePage() {
  const [councilType, setCouncilType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    params.set("sortOrder", sortOrder);
    if (councilType !== "all") params.set("councilType", councilType);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (search) params.set("search", search);
    return params.toString();
  }, [councilType, startDate, endDate, search, sortOrder, page]);

  const { data, isLoading, error } = useSWR<CompletedPresentationsResponse>(
    `/api/presentations/completed?${queryString}`,
    fetcher,
    { keepPreviousData: true },
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Tamamlanan Konseyler Arşivi"
        description="Tamamlanmış konsey sunumlarını arayın ve görüntüleyin"
      />

      <DSCard className="mb-6 !p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DSSelect
            value={councilType}
            onChange={(e) => {
              setCouncilType(e.target.value);
              setPage(1);
            }}
            aria-label="Konsey Türü"
          >
            <option value="all">Konsey Türü — Tümü</option>
            {COUNCIL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </DSSelect>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            placeholder="Başlangıç Tarihi"
            aria-label="Başlangıç Tarihi"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            placeholder="Bitiş Tarihi"
            aria-label="Bitiş Tarihi"
          />
          <form onSubmit={handleSearchSubmit}>
            <SearchInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Hasta adı veya TC ile ara..."
            />
          </form>
        </div>
      </DSCard>

      <DSCard className="!p-0 overflow-x-auto">
        <DSTable>
          <thead>
            <tr>
              <th>Hasta Adı</th>
              <th>TC</th>
              <th>Konsey Türü</th>
              <th>Tarih</th>
              <th>Konsey Raporu Yazan</th>
              <th>Konsey Kararı</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-4">
                  <TableSkeleton rows={5} />
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-urgent">
                  Veriler yüklenirken hata oluştu
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <DSEmptyState
                    icon={Archive}
                    title="Tamamlanmış konsey kaydı yok"
                    description="Filtreleri değiştirerek tekrar deneyin."
                  />
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <Fragment key={item.id}>
                  <tr>
                    <td className="font-medium">
                      {item.patient.firstName} {item.patient.lastName}
                    </td>
                    <td className="tabular-nums text-[12px] text-text-muted">
                      {item.patient.tcNoMasked}
                    </td>
                    <td>
                      <CouncilChip label={item.councilType} />
                    </td>
                    <td className="text-text-secondary">
                      {formatDateShort(item.councilDecisionAt)}
                    </td>
                    <td className="text-text-secondary">
                      {item.councilDecisionBy?.name ?? "—"}
                    </td>
                    <td
                      className="max-w-xs cursor-pointer text-text-secondary hover:text-text-primary"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : item.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setExpandedId(isExpanded ? null : item.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {truncateText(item.councilDecision)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <DSGhostIconLink
                          href={`/konsey/${item.id}`}
                          title="Aç"
                        >
                          <ExternalLink className="size-4" />
                        </DSGhostIconLink>
                        <DSGhostIconLink
                          href={`/konsey/${item.id}/yazdir`}
                          title="Yazdır"
                          external
                        >
                          <Printer className="size-4" />
                        </DSGhostIconLink>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="!bg-surface-2">
                        <div className="py-4">
                          <p className="mb-2 text-[12px] font-medium text-text-secondary">
                            Konsey Kararı
                          </p>
                          <p className="whitespace-pre-wrap text-[13px] text-text-primary">
                            {item.councilDecision ?? "Karar metni yok"}
                          </p>
                          {item.branchComments.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-[12px] font-medium text-text-secondary">
                                Branş Yorumları
                              </p>
                              <div className="space-y-2">
                                {item.branchComments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="rounded-md border border-border bg-surface p-3"
                                  >
                                    <p className="text-[11px] text-text-muted">
                                      {comment.branch} · {comment.author.name}
                                    </p>
                                    <p className="mt-1 text-[13px] text-text-secondary">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </DSTable>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-[13px] text-text-secondary">
              Toplam {pagination.total} kayıt · Sayfa {pagination.page} /{" "}
              {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Önceki
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </DSCard>
    </div>
  );
}
