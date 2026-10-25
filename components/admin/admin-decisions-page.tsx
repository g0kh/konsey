"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { adminFetcher } from "@/components/admin/admin-fetcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNCIL_TYPES } from "@/lib/constants";
import { adminFetch } from "@/lib/admin-fetch";
import { useCurrentUser } from "@/lib/UserContext";
import { Printer } from "lucide-react";

type DecisionRow = {
  id: string;
  patient: { firstName: string; lastName: string; tcNo: string; diagnosis: string | null };
  councilType: string;
  presentationReason: string;
  clinicalSummary: string | null;
  councilDecision: string | null;
  councilDecisionAt: string | null;
  councilDecisionBy: { name: string } | null;
  branchComments: {
    branch: string;
    content: string;
    author: { name: string };
  }[];
  editHistory: { details: string | null; editedBy: string; editedAt: string }[];
};

export function AdminDecisionsPage() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [councilType, setCouncilType] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const query = `/api/admin/decisions?search=${encodeURIComponent(search)}&councilType=${councilType}`;
  const { data, mutate } = useSWR<DecisionRow[]>(
    user ? query : null,
    adminFetcher(user),
  );

  const saveDecision = async (id: string) => {
    if (!user) return;
    const response = await adminFetch(user, `/api/admin/presentations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ councilDecision: editText }),
    });
    if (!response.ok) {
      toast.error("Kayıt başarısız");
      return;
    }
    toast.success("Karar güncellendi");
    setEditId(null);
    mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label>Arama</Label>
          <Input
            placeholder="Karar metni, hasta adı..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Konsey Türü</Label>
          <select
            className="select-field"
            value={councilType}
            onChange={(e) => setCouncilType(e.target.value)}
          >
            <option value="all">Tümü</option>
            {COUNCIL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {data?.map((row) => (
          <div key={row.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  className="text-left"
                  onClick={() =>
                    setExpanded(expanded === row.id ? null : row.id)
                  }
                >
                  <p className="font-medium text-text-primary">
                    {row.patient.firstName} {row.patient.lastName} — {row.councilType}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                    {row.councilDecision}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {row.councilDecisionBy?.name} ·{" "}
                    {row.councilDecisionAt
                      ? new Date(row.councilDecisionAt).toLocaleString("tr-TR")
                      : "—"}
                  </p>
                </button>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditId(row.id);
                    setEditText(row.councilDecision ?? "");
                  }}
                >
                  Karar Düzenle
                </Button>
                <a
                  href={`/konsey/${row.id}/yazdir`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  title="Yazdır"
                >
                  <Printer className="size-4" />
                </a>
              </div>
            </div>

            {expanded === row.id && (
              <div className="mt-4 border-t border-theme-border pt-4 text-sm">
                <p>
                  <strong>Tanı:</strong> {row.patient.diagnosis ?? "—"}
                </p>
                <p className="mt-2">
                  <strong>Klinik:</strong> {row.clinicalSummary ?? "—"}
                </p>
                <h4 className="mt-4 font-medium">Branş Yorumları</h4>
                <ul className="mt-2 space-y-2">
                  {row.branchComments.map((c, i) => (
                    <li key={i} className="rounded bg-elevated p-2">
                      <span className="text-xs text-text-tertiary">
                        {c.branch} — {c.author.name}
                      </span>
                      <p>{c.content}</p>
                    </li>
                  ))}
                </ul>
                {row.editHistory.length > 0 && (
                  <>
                    <h4 className="mt-4 font-medium">Düzenleme Geçmişi</h4>
                    <ul className="mt-2 text-xs text-text-tertiary">
                      {row.editHistory.map((h, i) => (
                        <li key={i}>
                          {h.editedBy} — {new Date(h.editedAt).toLocaleString("tr-TR")}:{" "}
                          {h.details}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {editId === row.id && (
              <div className="mt-4 space-y-2 border-t border-theme-border pt-4">
                <Textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveDecision(row.id)}>
                    Kaydet
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
