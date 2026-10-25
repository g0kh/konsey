"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DSCard, DSSelect } from "@/components/ui/design-system";
import { SearchInput } from "@/components/ui/search-input";
import { COUNCIL_TYPES } from "@/lib/constants";
import type { StatusFilter } from "@/lib/presentation-utils";
import { useCurrentUser } from "@/lib/UserContext";
import { cn } from "@/lib/utils";

const STATUS_TOGGLES: { value: StatusFilter | ""; label: string }[] = [
  { value: "", label: "Tümü" },
  { value: "PENDING", label: "Bekliyor" },
  { value: "IN_COUNCIL", label: "Konseyde" },
  { value: "COMPLETED", label: "Tamamlandı" },
];

export function KonseyListFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { user } = useCurrentUser();
  const visibleCouncilTypes = !user
    ? []
    : user.role === "ADMIN"
      ? [...COUNCIL_TYPES]
      : COUNCIL_TYPES.filter((type) => user.preferredCouncilTypes.includes(type));

  const councilType = searchParams.get("councilType") ?? "all";
  const status = (searchParams.get("status") ?? "") as StatusFilter | "";
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const applyParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/konsey?${query}` : "/konsey");
      });
    },
    [router, searchParams],
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyParams({ search: searchInput.trim() || undefined });
  }

  return (
    <DSCard className={cn("mb-6 space-y-4 !p-5", isPending && "opacity-80")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-48">
            <label className="mb-1.5 block text-[14px] font-medium text-text-secondary">
              Konsey Türü
            </label>
            <DSSelect
              value={councilType}
              onChange={(e) =>
                applyParams({
                  councilType: e.target.value === "all" ? undefined : e.target.value,
                })
              }
            >
              <option value="all">Tümü</option>
              {visibleCouncilTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </DSSelect>
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_TOGGLES.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() =>
                  applyParams({ status: opt.value || undefined })
                }
                className={cn(
                  "filter-toggle",
                  status === opt.value && "filter-toggle-active",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <SearchInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hasta adı veya TC ile ara..."
          />
        </form>
        <Link href="/hasta-ekle" className={cn(buttonVariants(), "shrink-0")}>
          Hasta Ekle
        </Link>
      </div>
    </DSCard>
  );
}
