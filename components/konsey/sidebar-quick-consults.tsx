"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/fetcher";
import { formatDateTime } from "@/lib/date-utils";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import { MessageSquarePlus } from "lucide-react";

type MyConsult = {
  id: string;
  question: string;
  targetBranch: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  presentationId: string;
  councilType: string;
  patient: { firstName: string; lastName: string; tcNo: string };
  followUps: Array<{
    id: string;
    question: string;
    response: string | null;
    createdAt: string;
  }>;
};

type SidebarQuickConsultsProps = {
  userBranch: string;
  onNavigate?: () => void;
};

export function SidebarQuickConsults({
  userBranch,
  onNavigate,
}: SidebarQuickConsultsProps) {
  const { user } = useCurrentUser();
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [additionText, setAdditionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: branchPending = [] } = useSWR<MyConsult[]>(
    "/api/quick-consults/my-branch",
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );

  const { data: myRequests = [], mutate } = useSWR<MyConsult[]>(
    user ? "/api/quick-consults/my-requests" : null,
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false },
  );

  async function submitAddition(consult: MyConsult) {
    if (!additionText.trim()) {
      toast.error("Ekleme metni zorunludur");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/quick-consults", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId: consult.presentationId,
          targetBranch: consult.targetBranch,
          question: additionText.trim(),
          parentConsultId: consult.id,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Ekleme gönderilemedi");
      }

      toast.success("Hızlı görüşe ekleme yapıldı");
      setAddingToId(null);
      setAdditionText("");
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card bg-sidebar p-3">
        <h2 className="section-header !mb-2 !border-0 !pb-0 !text-xs">
          Branşıma Gelen ({userBranch})
        </h2>
        {branchPending.length === 0 ? (
          <p className="text-xs text-text-secondary">Bekleyen talep yok</p>
        ) : (
          <ul className="space-y-2">
            {branchPending.slice(0, 5).map((consult) => (
              <li key={consult.id}>
                <Link
                  href={`/konsey/${consult.presentationId}`}
                  onClick={onNavigate}
                  className="block rounded-md border border-theme-border bg-surface px-2.5 py-2 transition-colors hover:bg-elevated"
                >
                  <p className="text-xs font-medium text-text-primary">
                    {consult.patient.firstName} {consult.patient.lastName}
                  </p>
                  <p className="line-clamp-2 text-[11px] text-text-secondary">
                    {consult.question}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card bg-sidebar p-3">
        <h2 className="section-header !mb-2 !border-0 !pb-0 !text-xs">
          Gönderdiğim Hızlı Görüşler
        </h2>
        {myRequests.length === 0 ? (
          <p className="text-xs text-text-secondary">Henüz talep göndermediniz</p>
        ) : (
          <ul className="space-y-2">
            {myRequests.slice(0, 6).map((consult) => (
              <li
                key={consult.id}
                className="rounded-md border border-theme-border bg-surface px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/konsey/${consult.presentationId}`}
                      onClick={onNavigate}
                      className="text-xs font-medium text-text-primary hover:text-accent"
                    >
                      {consult.patient.firstName} {consult.patient.lastName}
                    </Link>
                    <p className="text-[11px] text-text-secondary">
                      {consult.councilType} → {consult.targetBranch}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      consult.response
                        ? "bg-active-bg text-active"
                        : "bg-pending-bg text-pending",
                    )}
                  >
                    {consult.response ? "Yanıtlandı" : "Bekliyor"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-primary">{consult.question}</p>
                {consult.followUps.length > 0 && (
                  <div className="mt-2 space-y-1 border-l-2 border-accent-border pl-2">
                    {consult.followUps.map((followUp) => (
                      <p key={followUp.id} className="text-[11px] text-text-secondary">
                        <span className="font-semibold text-accent">Ekleme:</span>{" "}
                        {followUp.question}
                      </p>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[10px] text-text-muted">
                  {formatDateTime(consult.createdAt)}
                </p>
                {addingToId === consult.id ? (
                  <div className="mt-2 space-y-2 border-t border-theme-border pt-2">
                    <Textarea
                      rows={3}
                      className="min-h-[72px] text-xs text-text-primary"
                      placeholder="Ekleme metnini yazın..."
                      value={additionText}
                      onChange={(e) => setAdditionText(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={submitting}
                        onClick={() => void submitAddition(consult)}
                      >
                        Gönder
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setAddingToId(null);
                          setAdditionText("");
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 w-full text-xs"
                    onClick={() => {
                      setAddingToId(consult.id);
                      setAdditionText("");
                    }}
                  >
                    <MessageSquarePlus className="mr-1 size-3" />
                    Ekleme Yap
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
