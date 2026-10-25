"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "@/lib/toast";
import { PresentationInfoPanel } from "@/components/konsey/presentation-info-panel";
import { PresentationInteractionsPanel } from "@/components/konsey/presentation-interactions-panel";
import { Button } from "@/components/ui/button";
import { fuzzyScore } from "@/lib/fuzzy-search";
import { fetcher } from "@/lib/fetcher";
import type { PresentationListItem } from "@/lib/server/presentations";
import type { PresentationDetail } from "@/lib/types/presentation-detail";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";

type KonseySessionRunnerProps = {
  councilType: string;
  status: string;
};

type DirectoryUser = {
  id: string;
  name: string;
  branch: string;
};

export function KonseySessionRunner({
  councilType,
  status,
}: KonseySessionRunnerProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [queue, setQueue] = useState<PresentationListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localDecision, setLocalDecision] = useState("");
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [members, setMembers] = useState<DirectoryUser[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<DirectoryUser[]>([]);
  const [doctorQuery, setDoctorQuery] = useState("");

  const showLauncher =
    councilType !== "all" && councilType !== "" && status === "PENDING";

  const currentId = queue[currentIndex]?.id;

  const { data: presentation, mutate } = useSWR<PresentationDetail>(
    isOpen && currentId ? `/api/presentations/${currentId}` : null,
    fetcher,
  );

  useEffect(() => {
    if (presentation?.councilDecision) {
      setLocalDecision(presentation.councilDecision);
    } else {
      setLocalDecision("");
    }
  }, [presentation?.id, presentation?.councilDecision]);

  const searchResults = useMemo(() => {
    return directory
      .map((doctor) => ({
        doctor,
        score: fuzzyScore(doctorQuery, doctor.name, doctor.branch),
      }))
      .filter(
        (item) =>
          item.score > 0 &&
          !selectedDoctors.some((selected) => selected.id === item.doctor.id),
      )
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map((item) => item.doctor);
  }, [directory, doctorQuery, selectedDoctors]);

  function addDoctor(doctor: DirectoryUser) {
    setSelectedDoctors((current) =>
      current.some((item) => item.id === doctor.id) ? current : [...current, doctor],
    );
    setDoctorQuery("");
  }

  const openRoster = useCallback(async () => {
    setLoadingRoster(true);
    try {
      const response = await fetch(
        `/api/users/directory?councilType=${encodeURIComponent(councilType)}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        throw new Error("Hekim listesi yüklenemedi");
      }
      const payload = (await response.json()) as {
        members: DirectoryUser[];
        users: DirectoryUser[];
      };
      setMembers(payload.members);
      setDirectory(payload.users);
      setSelectedDoctors([]);
      setDoctorQuery("");
      setRosterOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hekimler yüklenemedi");
    } finally {
      setLoadingRoster(false);
    }
  }, [councilType]);

  const startSession = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const params = new URLSearchParams({
        councilType,
        status: "PENDING",
      });
      const response = await fetch(`/api/presentations?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Bekleyen hastalar yüklenemedi");
      }
      const items = (await response.json()) as PresentationListItem[];
      if (items.length === 0) {
        toast.error("Bu konsey türünde bekleyen hasta yok");
        return;
      }

      setQueue(items);
      setCurrentIndex(0);
      setIsOpen(true);

      const first = items[0];
      await fetch(`/api/presentations/${first.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_COUNCIL" }),
      });
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Oturum başlatılamadı");
    } finally {
      setLoadingQueue(false);
    }
  }, [councilType, mutate]);

  async function confirmRoster() {
    if (selectedDoctors.length === 0) {
      toast.error("Konseyde bulunan en az bir hekim seçin");
      return;
    }

    setSavingRoster(true);
    try {
      const response = await fetch("/api/council-sessions/roster", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          councilType,
          attendeeUserIds: selectedDoctors.map((doctor) => doctor.id),
        }),
      });
      const payload = (await response.json()) as { error?: string; sessionId?: string };
      if (!response.ok || !payload.sessionId) {
        throw new Error(payload.error ?? "Yoklama kaydedilemedi");
      }

      setSessionId(payload.sessionId);
      setRosterOpen(false);
      await startSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yoklama kaydedilemedi");
    } finally {
      setSavingRoster(false);
    }
  }

  async function goToNext() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      toast.success("Konsey oturumu tamamlandı");
      setIsOpen(false);
      router.refresh();
      return;
    }

    setCurrentIndex(nextIndex);
    const next = queue[nextIndex];
    try {
      await fetch(`/api/presentations/${next.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_COUNCIL" }),
      });
      void mutate();
    } catch {
      toast.error("Sonraki hasta yüklenemedi");
    }
  }

  async function completeAndNext() {
    if (!presentation || !user) {
      return;
    }

    const decision = localDecision.trim();
    if (!decision) {
      toast.error("Konsey kararı zorunludur");
      return;
    }

    try {
      const response = await fetch(`/api/presentations/${presentation.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          councilDecision: decision,
          sessionId,
          orderIndex: currentIndex,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Karar kaydedilemedi");
      }

      toast.success("Hasta tamamlandı");
      await goToNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    }
  }

  if (!showLauncher) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openRoster()}
        disabled={loadingQueue || loadingRoster}
        className={cn(
          "konsey-start-pulse fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] disabled:opacity-60",
        )}
      >
        <Play className="size-4" />
        {loadingQueue || loadingRoster ? "Hazırlanıyor..." : "Konseyi Başlat"}
      </button>

      {rosterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="card max-h-[85vh] w-full max-w-xl overflow-y-auto p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Konseyde olan hekimler
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {councilType} oturumuna giren hekimleri ekleyin. Kayıtlı
                  hekimlerde ad veya branş yazarak arayabilirsiniz.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRosterOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {members.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-text-primary">
                  Bu konseye üye hekimler
                </p>
                <div className="flex flex-wrap gap-2">
                  {members.map((doctor) => {
                    const added = selectedDoctors.some((item) => item.id === doctor.id);
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        disabled={added}
                        onClick={() => addDoctor(doctor)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm",
                          added
                            ? "border-accent-border bg-accent-subtle text-accent"
                            : "border-theme-border bg-surface text-text-primary hover:bg-elevated",
                        )}
                      >
                        {doctor.name}
                        <span className="text-text-secondary"> · {doctor.branch}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary" htmlFor="doctor-search">
                Hekim ara
              </label>
              <input
                id="doctor-search"
                className="input-field"
                value={doctorQuery}
                onChange={(event) => setDoctorQuery(event.target.value)}
                placeholder="Ad veya branş yazın"
                autoComplete="off"
              />
              {doctorQuery.trim() && (
                <ul className="overflow-hidden rounded-lg border border-theme-border">
                  {searchResults.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-text-secondary">
                      Eşleşen hekim yok
                    </li>
                  ) : (
                    searchResults.map((doctor) => (
                      <li key={doctor.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-elevated"
                          onClick={() => addDoctor(doctor)}
                        >
                          <span className="font-medium text-text-primary">{doctor.name}</span>
                          <span className="text-text-secondary">{doctor.branch}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-text-primary">
                Oturuma giren hekimler
              </p>
              {selectedDoctors.length === 0 ? (
                <p className="text-sm text-text-secondary">Henüz hekim eklenmedi.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedDoctors.map((doctor) => (
                    <li
                      key={doctor.id}
                      className="flex items-center justify-between rounded-lg border border-theme-border px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium text-text-primary">{doctor.name}</span>
                        <span className="text-text-secondary"> · {doctor.branch}</span>
                      </span>
                      <button
                        type="button"
                        className="text-sm font-medium text-urgent"
                        onClick={() =>
                          setSelectedDoctors((current) =>
                            current.filter((item) => item.id !== doctor.id),
                          )
                        }
                      >
                        Çıkar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="button"
              className="mt-5 w-full"
              disabled={savingRoster}
              onClick={() => void confirmRoster()}
            >
              {savingRoster ? "Kaydediliyor..." : "Hekimleri kaydet ve hastalara geç"}
            </Button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg">
          <header className="flex shrink-0 items-center justify-between border-b border-theme-border bg-surface px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Konsey Oturumu — {councilType}
              </p>
              <p className="text-xs text-text-secondary">
                Hasta {currentIndex + 1} / {queue.length}
                {queue[currentIndex] && (
                  <>
                    {" "}
                    · {queue[currentIndex].patient.firstName}{" "}
                    {queue[currentIndex].patient.lastName}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                Önceki
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void completeAndNext()}
              >
                Tamamla ve Sonraki
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {!presentation ? (
              <p className="text-sm text-text-secondary">Hasta yükleniyor...</p>
            ) : (
              <div className="mx-auto min-w-0 max-w-4xl space-y-6">
                <PresentationInfoPanel presentation={presentation} />
                <PresentationInteractionsPanel
                  presentation={presentation}
                  user={user}
                  councilDecision={localDecision}
                  onCouncilDecisionChange={setLocalDecision}
                  onRefresh={() => void mutate()}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
