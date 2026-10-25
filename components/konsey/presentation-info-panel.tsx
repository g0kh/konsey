"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date-utils";
import { calculateAge } from "@/lib/imaging-utils";
import type { PresentationDetail } from "@/lib/types/presentation-detail";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const IMAGING_TABS = [
  { key: "pet" as const, label: "PET Görüntüleme" },
  { key: "mr" as const, label: "MR Görüntüleme" },
  { key: "ct" as const, label: "BT (Tomografi)" },
  { key: "pathology" as const, label: "Patoloji" },
  { key: "memeUsg" as const, label: "Ultrason" },
  { key: "other" as const, label: "Diğer" },
] as const;

function imagingTabHasContent(
  imaging: PresentationDetail["imaging"][keyof PresentationDetail["imaging"]],
) {
  return (
    imaging.entries.length > 0 || Boolean(imaging.notes) || Boolean(imaging.link)
  );
}

export function PresentationInfoPanel({
  presentation,
}: {
  presentation: PresentationDetail;
}) {
  const [activeTab, setActiveTab] =
    useState<(typeof IMAGING_TABS)[number]["key"]>("pet");

  const age = calculateAge(presentation.patient.birthDate);
  const activeImaging = presentation.imaging[activeTab];

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <section className="card p-5">
        <h2 className="text-[22px] font-semibold text-text-primary">
          {presentation.patient.firstName} {presentation.patient.lastName}
        </h2>
        <div className="mt-2 flex flex-wrap gap-3 tabular-nums text-sm text-text-secondary">
          <span>TC: {presentation.patient.tcNo}</span>
          {age && <span>{age}</span>}
        </div>
      </section>

      <section className="card bg-elevated/50 p-5">
        <p className="section-header !mb-2 !border-0 !pb-0 !text-xs">
          Konseye Sunulma Sebebi
        </p>
        <p className="detail-prose text-lg font-medium leading-relaxed text-text-primary">
          {presentation.presentationReason}
        </p>
      </section>

      {presentation.clinicalSummary && (
        <section className="card p-5">
          <h3 className="section-header">Klinik Özet</h3>
          <p className="detail-prose text-sm leading-relaxed text-text-secondary">
            {presentation.clinicalSummary}
          </p>
        </section>
      )}

      <section className="card p-5">
        <h3 className="section-header">Görüntüleme ve Patoloji</h3>
        <div className="mb-4 flex flex-wrap gap-1 border-b border-theme-border pb-px">
          {IMAGING_TABS.map((tab) => {
            const hasContent = imagingTabHasContent(presentation.imaging[tab.key]);

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                  activeTab === tab.key
                    ? "border-b-2 border-glow text-text-primary"
                    : "text-text-secondary hover:text-text-primary",
                  hasContent && activeTab !== tab.key && "text-text-primary",
                )}
              >
                {tab.label}
                {hasContent && (
                  <span className="ml-1.5 inline-block size-1.5 rounded-full bg-glow" />
                )}
              </button>
            );
          })}
        </div>

        {imagingTabHasContent(activeImaging) ? (
          <div className="space-y-4">
            {activeImaging.entries.length > 0 ? (
              activeImaging.entries.map((entry, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-theme-border bg-elevated/30 p-3"
                >
                  {activeImaging.entries.length > 1 && (
                    <p className="mb-2 text-xs font-medium text-text-tertiary">
                      Kayıt {index + 1}
                    </p>
                  )}
                  {entry.date && (
                    <p className="mb-1 text-xs font-medium text-text-secondary">
                      Tarih: {entry.date}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="detail-prose text-sm text-text-secondary">
                      {entry.notes}
                    </p>
                  )}
                  {entry.link && (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "mt-2 inline-flex gap-1.5",
                      )}
                    >
                      <ExternalLink className="size-3.5" />
                      Görüntülemeyi Aç
                    </a>
                  )}
                </div>
              ))
            ) : (
              <>
                {activeImaging.notes && (
                  <p className="detail-prose text-sm text-text-secondary">
                    {activeImaging.notes}
                  </p>
                )}
                {activeImaging.link && (
                  <a
                    href={activeImaging.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "inline-flex gap-1.5",
                    )}
                  >
                    <ExternalLink className="size-3.5" />
                    Görüntülemeyi Aç
                  </a>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Bu bölüm için kayıt yok</p>
        )}
      </section>

      <section className="card p-4 text-sm text-text-secondary">
        <p>
          <span className="font-medium text-text-primary">
            {presentation.submittedBy.name}
          </span>
          <span className="text-text-tertiary"> · </span>
          Konseye yönlendiren — {presentation.submittedBy.branch}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Sunum tarihi: {formatDateTime(presentation.createdAt)}
        </p>
      </section>
    </div>
  );
}
