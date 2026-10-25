"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  DSCard,
  DSSelect,
  FilterLabel,
  PageHeader,
} from "@/components/ui/design-system";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { COUNCIL_TYPES, type CouncilType } from "@/lib/constants";
import { formatDate } from "@/lib/date-utils";
import { fetcher } from "@/lib/fetcher";
import type { PresentationListItem } from "@/components/konsey/presentation-card";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";

export function SessionManagerPage() {
  const { user } = useCurrentUser();
  const [councilType, setCouncilType] = useState<CouncilType>(COUNCIL_TYPES[0]);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const pendingKey = `/api/presentations?councilType=${encodeURIComponent(councilType)}&status=PENDING`;
  const { data: pending = [], isLoading: pendingLoading } = useSWR<
    PresentationListItem[]
  >(pendingKey, fetcher);

  const { data: sessions = [], mutate: mutateSessions } = useSWR<
    {
      id: string;
      councilType: string;
      sessionDate: string;
      notes: string | null;
      presentations: {
        orderIndex: number;
        presentation: {
          id: string;
          presentationReason: string;
          patient: { firstName: string; lastName: string; tcNo: string };
        };
      }[];
    }[]
  >("/api/council-sessions", fetcher);

  if (!user) {
    return <p className="text-text-secondary">Oturum yönetimi için kimlik seçin.</p>;
  }

  if (user.role !== "ADMIN") {
    return (
      <DSCard>
        <p className="text-center text-[13px] text-pending">
          Bu sayfa yalnızca yönetici (ADMIN) kullanıcılar içindir.
        </p>
      </DSCard>
    );
  }

  const adminUser = user;

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function createSession() {
    if (selectedIds.length === 0) {
      toast.error("En az bir sunum seçin");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/council-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          councilType,
          sessionDate,
          createdByUserId: adminUser.id,
          notes,
          presentationIds: selectedIds,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Oturum oluşturulamadı");
      }
      const data = (await response.json()) as { id: string };
      toast.success("Başarıyla kaydedildi");
      setActiveSessionId(data.id);
      setSelectedIds([]);
      mutateSessions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  }

  async function startSession() {
    if (!activeSessionId) {
      toast.error("Önce bir oturum seçin veya oluşturun");
      return;
    }
    setIsStarting(true);
    try {
      const response = await fetch(
        `/api/council-sessions/${activeSessionId}/start`,
        { method: "POST" },
      );
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Oturum başlatılamadı");
      }
      const { updatedCount } = (await response.json()) as { updatedCount: number };
      toast.success(`Konsey oturumu başlatıldı (${updatedCount} sunum)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsStarting(false);
    }
  }

  function loadSession(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setActiveSessionId(sessionId);
    setCouncilType(session.councilType as CouncilType);
    setSessionDate(session.sessionDate.slice(0, 10));
    setNotes(session.notes ?? "");
    setSelectedIds(
      [...session.presentations]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((p) => p.presentation.id),
    );
  }

  return (
    <div>
      <PageHeader
        title="Konsey Oturumu Yönetimi"
        description="Oturum oluşturun, sunumları seçin ve konseyi başlatın"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left 60% */}
        <div className="space-y-6 lg:col-span-3">
          <DSCard>
            <h2 className="mb-4 text-[13px] font-semibold text-text-primary">
              Yeni Oturum Oluştur
            </h2>
            <div className="space-y-4">
              <div>
                <FilterLabel>Konsey Türü</FilterLabel>
                <DSSelect
                  value={councilType}
                  onChange={(e) => {
                    setCouncilType(e.target.value as CouncilType);
                    setSelectedIds([]);
                  }}
                >
                  {COUNCIL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </DSSelect>
              </div>
              <div>
                <FilterLabel>Tarih</FilterLabel>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div>
                <FilterLabel>Notlar</FilterLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="!h-20 min-h-[80px]"
                />
              </div>
            </div>

            <div className="my-5 border-b border-border" />

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={createSession}
                disabled={isSaving || selectedIds.length === 0}
              >
                Oturum Oluştur
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!activeSessionId || isStarting}
                onClick={startSession}
              >
                {isStarting ? "Başlatılıyor..." : "Oturumu Başlat"}
              </Button>
            </div>
          </DSCard>
        </div>

        {/* Right 40% */}
        <div className="space-y-6 lg:col-span-2">
          <DSCard className="!p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[13px] font-semibold text-text-primary">
                Mevcut Oturumlar
              </h2>
            </div>
            {sessions.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-text-secondary">
                Henüz oturum yok
              </p>
            ) : (
              <ul>
                {sessions.map((session) => {
                  const isActive = activeSessionId === session.id;
                  return (
                    <li key={session.id}>
                      <button
                        type="button"
                        onClick={() => loadSession(session.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 border-b border-border px-5 py-3 text-left transition-all duration-150 ease",
                          isActive
                            ? "border-l-2 border-l-accent bg-accent-subtle"
                            : "hover:bg-surface-2",
                        )}
                      >
                        <div>
                          <p className="text-[13px] font-medium text-text-primary">
                            {session.councilType}
                          </p>
                          <p className="text-[12px] text-text-secondary">
                            {formatDate(session.sessionDate)}
                          </p>
                        </div>
                        <span className="council-chip shrink-0">
                          {session.presentations.length} sunum
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </DSCard>

          <DSCard className="!p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[13px] font-semibold text-text-primary">
                Bekleyen Sunumlar
              </h2>
            </div>
            {pendingLoading ? (
              <div className="p-4">
                <CardGridSkeleton count={2} />
              </div>
            ) : pending.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-text-secondary">
                Bekleyen sunum yok
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {pending.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <li
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <label className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-all duration-150 ease hover:bg-surface-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(item.id)}
                          className="checkbox-ds mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-text-primary">
                            {item.patient.firstName} {item.patient.lastName}
                          </p>
                          <p className="line-clamp-1 text-[12px] text-text-secondary">
                            {item.presentationReason}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </DSCard>
        </div>
      </div>
    </div>
  );
}
