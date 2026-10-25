"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

type BranchConsult = {
  id: string;
  question: string;
  presentationId: string;
  councilType: string;
  patient: { firstName: string; lastName: string };
  requestedBy: { name: string; branch: string };
};

type NotificationBellProps = {
  /** sidebar: panel opens toward main content; header: opens left from bell */
  placement?: "sidebar" | "header";
};

export function NotificationBell({ placement = "header" }: NotificationBellProps) {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const consultsKey = user ? "/api/quick-consults/my-branch" : null;

  const { data: consults = [] } = useSWR<BranchConsult[]>(consultsKey, fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const count = consults.length;
  const panelClass =
    placement === "sidebar"
      ? "left-full top-0 ml-2"
      : "right-0 mt-2";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-lg p-2 text-text-secondary transition-colors duration-200 hover:bg-elevated hover:text-text-primary"
        aria-label="Bildirimler"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-urgent px-1 text-[10px] font-bold text-on-primary">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "card absolute z-[60] w-80 max-w-[calc(100vw-2rem)] shadow-md",
            panelClass,
          )}
        >
          <div className="border-b border-theme-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">
              Bekleyen Hızlı Görüşler
            </p>
            <p className="text-xs text-text-secondary">{user.branch}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">
                Bekleyen hızlı görüş talebi yok
              </p>
            ) : (
              <ul>
                {consults.map((consult) => (
                  <li key={consult.id} className="border-b border-theme-border/50">
                    <Link
                      href={`/konsey/${consult.presentationId}`}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block px-4 py-3 transition-colors duration-200 hover:bg-elevated",
                      )}
                    >
                      <p className="text-sm font-medium text-text-primary">
                        {consult.patient.firstName} {consult.patient.lastName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {consult.requestedBy.name} · {consult.councilType}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                        {consult.question}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
