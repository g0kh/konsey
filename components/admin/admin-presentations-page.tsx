"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { StatusBadge } from "@/components/status-badge";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNCIL_TYPES } from "@/lib/constants";
import { adminFetch } from "@/lib/admin-fetch";
import { truncateText } from "@/lib/admin-utils";
import { getCouncilTypeBadgeStyle } from "@/lib/presentation-utils";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import type { PresentationStatus } from "@prisma/client";
import { Eye, Pencil, Printer, Trash2 } from "lucide-react";

type PresentationRow = {
  id: string;
  patientName: string;
  tcNoMasked: string;
  councilType: string;
  presentationReason: string;
  submittedBy: string;
  status: PresentationStatus;
  councilDate: string | null;
  createdAt: string;
  councilDecision: string | null;
  adminNotes: string | null;
};

const STATUSES: PresentationStatus[] = [
  "PENDING",
  "IN_COUNCIL",
  "COMPLETED",
  "CANCELLED",
];

export function AdminPresentationsPage() {
  const { user } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [councilType, setCouncilType] = useState("all");
  const [statuses, setStatuses] = useState<PresentationStatus[]>([]);
  const [search, setSearch] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bulkStatus, setBulkStatus] = useState<PresentationStatus>("PENDING");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<PresentationRow | null>(null);
  const [editForm, setEditForm] = useState({
    status: "PENDING" as PresentationStatus,
    councilDate: "",
    councilDecision: "",
    adminNotes: "",
  });

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (councilType !== "all") params.set("councilType", councilType);
    if (statuses.length) params.set("statuses", statuses.join(","));
    if (search) params.set("search", search);
    if (submitter) params.set("submitter", submitter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `/api/admin/presentations?${params}`;
  }, [page, pageSize, councilType, statuses, search, submitter, dateFrom, dateTo]);

  const { data, mutate, isLoading } = useSWR<{
    items: PresentationRow[];
    total: number;
  }>(user ? query : null, adminFetcher(user));

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEdit = (row: PresentationRow) => {
    setEditing(row);
    setEditForm({
      status: row.status,
      councilDate: row.councilDate?.slice(0, 10) ?? "",
      councilDecision: row.councilDecision ?? "",
      adminNotes: row.adminNotes ?? "",
    });
  };

  const saveEdit = async () => {
    if (!user || !editing) return;
    const response = await adminFetch(user, `/api/admin/presentations/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify(editForm),
    });
    if (!response.ok) {
      toast.error("Güncelleme başarısız");
      return;
    }
    toast.success("Sunum güncellendi");
    setEditing(null);
    mutate();
  };

  const deleteOne = async (id: string) => {
    if (!user || !confirm("Bu sunumu silmek istediğinize emin misiniz?")) return;
    const response = await adminFetch(user, `/api/admin/presentations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error("Silme başarısız");
      return;
    }
    toast.success("Sunum silindi");
    mutate();
  };

  const bulkUpdateStatus = async () => {
    if (!user || selected.size === 0) return;
    const response = await adminFetch(user, "/api/admin/presentations/bulk", {
      method: "PATCH",
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    if (!response.ok) {
      toast.error("Durum güncelleme başarısız");
      return;
    }
    toast.success(`${selected.size} sunumun durumu güncellendi`);
    setSelected(new Set());
    mutate();
  };

  const bulkDelete = async () => {
    if (!user || selected.size === 0) return;
    if (
      !confirm(
        `${selected.size} hasta kaydı kalıcı olarak silinecek. Devam edilsin mi?`,
      )
    ) {
      return;
    }
    const response = await adminFetch(user, "/api/admin/presentations/bulk", {
      method: "DELETE",
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (!response.ok) {
      toast.error("Toplu silme başarısız");
      return;
    }
    toast.success("Seçili sunumlar silindi");
    setSelected(new Set());
    mutate();
  };

  const exportCsv = useCallback(async () => {
    if (!user) return;
    const ids = Array.from(selected);
    const url =
      ids.length > 0
        ? `/api/admin/presentations/export?ids=${ids.join(",")}`
        : "/api/admin/presentations/export";
    const response = await adminFetch(user, url);
    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sunumlar-${Date.now()}.csv`;
    a.click();
  }, [user, selected]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Konsey Türü</Label>
          <select
            className="select-field"
            value={councilType}
            onChange={(e) => {
              setCouncilType(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tümü</option>
            {COUNCIL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Arama</Label>
          <Input
            placeholder="Hasta adı / TC"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>Sunan Doktor</Label>
          <Input
            value={submitter}
            onChange={(e) => {
              setSubmitter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>Başlangıç Tarihi</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>Bitiş Tarihi</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "pill-tab text-xs",
                statuses.includes(s) && "pill-tab-active",
              )}
              onClick={() => {
                setStatuses((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                );
                setPage(1);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={!selected.size}>
          Toplu Sil ({selected.size})
        </Button>
        <select
          className="select-field !w-36"
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value as PresentationStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={bulkUpdateStatus}
          disabled={!selected.size}
        >
          Durumu Güncelle ({selected.size})
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          CSV Dışa Aktar
        </Button>
      </div>

      <div className="card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(data?.items.map((i) => i.id)));
                    } else {
                      setSelected(new Set());
                    }
                  }}
                />
              </th>
              <th>#</th>
              <th>Hasta</th>
              <th>TC</th>
              <th>Konsey</th>
              <th>Sebep</th>
              <th>Sunan</th>
              <th>Durum</th>
              <th>Konsey Tarihi</th>
              <th>Oluşturma</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={11} className="py-8 text-center text-text-secondary">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {data?.items.map((row, index) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </td>
                <td>{(page - 1) * pageSize + index + 1}</td>
                <td className="font-medium">{row.patientName}</td>
                <td className="tabular-nums text-xs">{row.tcNoMasked}</td>
                <td>
                  <span className={cn("badge", getCouncilTypeBadgeStyle(row.councilType))}>
                    {row.councilType}
                  </span>
                </td>
                <td className="max-w-[180px]">{truncateText(row.presentationReason)}</td>
                <td>{row.submittedBy}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td className="text-xs">
                  {row.councilDate
                    ? new Date(row.councilDate).toLocaleDateString("tr-TR")
                    : "—"}
                </td>
                <td className="text-xs">
                  {new Date(row.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td>
                  <div className="flex gap-1">
                    <Link
                      href={`/konsey/${row.id}`}
                      title="Görüntüle"
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      <Eye className="size-4" />
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Düzenle">
                      <Pencil className="size-4" />
                    </Button>
                    <Link
                      href={`/konsey/${row.id}/yazdir`}
                      target="_blank"
                      title="Yazdır"
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      <Printer className="size-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteOne(row.id)}
                      title="Sil"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span>Sayfa başına</span>
          <select
            className="select-field !w-20"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Önceki
          </Button>
          <span className="flex items-center text-sm text-text-secondary">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </Button>
        </div>
      </div>

      {editing && (
        <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6">
            <h2 className="section-header">Sunum Düzenle</h2>
            <p className="mb-4 text-sm text-text-secondary">{editing.patientName}</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Durum</Label>
                <select
                  className="select-field"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as PresentationStatus,
                    }))
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Konsey Tarihi</Label>
                <Input
                  type="date"
                  value={editForm.councilDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, councilDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Konsey Kararı</Label>
                <Textarea
                  rows={3}
                  value={editForm.councilDecision}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, councilDecision: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Admin Notları (gizli)</Label>
                <Textarea
                  rows={2}
                  value={editForm.adminNotes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, adminNotes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                İptal
              </Button>
              <Button onClick={saveEdit}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
