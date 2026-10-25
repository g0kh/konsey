"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { PresentationInfoPanel } from "@/components/konsey/presentation-info-panel";
import { PresentationInteractionsPanel } from "@/components/konsey/presentation-interactions-panel";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { DetailSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/date-utils";
import { fetcher } from "@/lib/fetcher";
import {
  getCouncilTypeBadgeStyle,
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
} from "@/lib/presentation-utils";
import type { PresentationDetail } from "@/lib/types/presentation-detail";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL = 120_000;

export function PresentationDetailPage({ id }: { id: string }) {
  const { user } = useCurrentUser();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [localDecision, setLocalDecision] = useState("");

  const { data, error, isLoading, mutate } = useSWR<PresentationDetail>(
    `/api/presentations/${id}`,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  );

  useEffect(() => {
    if (data?.councilDecision) {
      setLocalDecision(data.councilDecision);
    }
  }, [data?.councilDecision]);

  async function updateStatus(
    status: "IN_COUNCIL" | "COMPLETED",
    councilDecision?: string,
  ) {
    if (!user) {
      toast.error("Lütfen kimlik seçin");
      return;
    }

    setStatusUpdating(true);
    try {
      const body: Record<string, string> = { status };

      if (status === "COMPLETED") {
        const decision = (councilDecision ?? localDecision).trim();
        if (!decision) {
          toast.error("Konsey kararı doldurulmalıdır");
          setStatusUpdating(false);
          return;
        }
        body.councilDecision = decision;
      }

      const response = await fetch(`/api/presentations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Durum güncellenemedi");
      }

      toast.success(
        status === "IN_COUNCIL"
          ? "Başarıyla güncellendi"
          : "Sunum tamamlandı olarak işaretlendi",
      );
      mutate();
    } catch (updateError) {
      toast.error(
        updateError instanceof Error ? updateError.message : "Bir hata oluştu",
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="error-panel p-8 text-center">
        <p>
          {error instanceof Error ? error.message : "Sunum bulunamadı"}
        </p>
        <Link
          href="/konsey"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
        >
          Listeye Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div>
        <Link
          href="/konsey"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 text-text-secondary",
          )}
        >
          ← Listeye Dön
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <span className={getCouncilTypeBadgeStyle(data.councilType)}>
            {data.councilType}
          </span>
          <span className={STATUS_BADGE_STYLES[data.status]}>
            {STATUS_LABELS[data.status]}
          </span>
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-text-secondary">
          {data.status === "COMPLETED" && data.councilDecisionAt ? (
            <p>
              Tamamlanma:{" "}
              <span className="font-medium text-text-primary">
                {formatDateTime(data.councilDecisionAt)}
              </span>
              {data.councilDecisionBy && (
                <>
                  {" "}
                  · Rapor:{" "}
                  <span className="font-medium text-text-primary">
                    {data.councilDecisionBy.name}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p>Mevcut durum: {STATUS_LABELS[data.status]}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {data.status === "COMPLETED" && data.councilDecision && (
            <Link
              href={`/konsey/${id}/sonuc`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Konsey Sonucu Yazdır
            </Link>
          )}
          {data.status === "PENDING" && (
            <Button
              type="button"
              size="sm"
              disabled={statusUpdating}
              onClick={() => updateStatus("IN_COUNCIL")}
            >
              Konseye Al
            </Button>
          )}
          {data.status === "IN_COUNCIL" && (
            <Button
              type="button"
              size="sm"
              disabled={statusUpdating}
              onClick={() =>
                updateStatus(
                  "COMPLETED",
                  localDecision || data.councilDecision || undefined,
                )
              }
              className="bg-status-complete hover:opacity-90"
            >
              Tamamlandı Olarak İşaretle
            </Button>
          )}
        </div>
      </div>

      <div className="min-w-0 max-w-full space-y-6">
        <PresentationInfoPanel presentation={data} />
        <PresentationInteractionsPanel
          presentation={data}
          user={user}
          councilDecision={localDecision}
          onCouncilDecisionChange={setLocalDecision}
          onRefresh={() => mutate()}
        />
      </div>
    </div>
  );
}
