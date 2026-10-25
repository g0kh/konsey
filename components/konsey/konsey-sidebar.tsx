"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/fetcher";
import { formatCouncilDate } from "@/lib/presentation-utils";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

type WeekSession = {
  id: string;
  councilType: string;
  sessionDate: string;
  notes: string | null;
  createdBy: { name: string };
  presentationCount: number;
};

type BranchConsult = {
  id: string;
  question: string;
  presentationId: string;
  councilType: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    tcNo: string;
  };
  requestedBy: {
    name: string;
    branch: string;
  };
};

type KonseySidebarProps = {
  userBranch?: string;
};

export function KonseySidebar({ userBranch }: KonseySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: sessions = [], isLoading: sessionsLoading } = useSWR<
    WeekSession[]
  >("/api/council-sessions/week", fetcher, {
    refreshInterval: 120_000,
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const consultsKey = userBranch
    ? `/api/quick-consults/my-branch?branch=${encodeURIComponent(userBranch)}`
    : null;

  const { data: consults = [], isLoading: consultsLoading } = useSWR<
    BranchConsult[]
  >(consultsKey, fetcher, {
    refreshInterval: 120_000,
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const sidebarContent = (
    <div className="w-full space-y-6 xl:w-60">
      <section className="card bg-sidebar p-4">
        <h2 className="section-header !mb-3 !text-xs">
          Bu Haftanın Konseyler
        </h2>
        {sessionsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-text-secondary">Planlanmış oturum bulunmuyor</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="border-b border-theme-border pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium text-text-primary">
                  {session.councilType}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatCouncilDate(session.sessionDate)}
                </p>
                <p className="text-xs text-text-tertiary">
                  {session.presentationCount} sunum
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card bg-sidebar p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-header !mb-0 !border-0 !pb-0 !text-xs">
            Hızlı Görüş Kutum
          </h2>
          {consults.length > 0 && (
            <span className="badge badge-urgent !py-0.5">
              {consults.length}
            </span>
          )}
        </div>
        {!userBranch ? (
          <p className="text-sm text-text-secondary">
            Görüşleri görmek için kimlik seçin
          </p>
        ) : consultsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : consults.length === 0 ? (
          <p className="text-sm text-text-secondary">Bekleyen hızlı görüş talebi yok</p>
        ) : (
          <ul className="space-y-3">
            {consults.map((consult) => (
              <li key={consult.id}>
                <Link
                  href={`/konsey/${consult.presentationId}`}
                  className="card card-interactive block p-3 !translate-y-0"
                >
                  <p className="text-sm font-medium text-text-primary">
                    {consult.patient.firstName} {consult.patient.lastName}
                  </p>
                  <p className="text-xs text-text-secondary">{consult.councilType}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                    {consult.question}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {consult.requestedBy.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  return (
    <>
      <div className="hidden shrink-0 xl:block">{sidebarContent}</div>

      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mb-4 w-full justify-between",
          )}
        >
          Yan panel
          {isOpen ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
        {isOpen && sidebarContent}
      </div>
    </>
  );
}
