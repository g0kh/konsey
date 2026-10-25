"use client";

import { formatDateTime } from "@/lib/date-utils";
import { calculateAge } from "@/lib/imaging-utils";
import { IMAGING_FORM_SECTIONS } from "@/lib/imaging-data";
import { collectParticipatingDoctors } from "@/lib/participating-doctors";
import type { PresentationDetail } from "@/lib/types/presentation-detail";

type PresentationPrintViewProps = {
  presentation: PresentationDetail;
};

const IMAGING_KEY_MAP = {
  petScan: "pet",
  mrScan: "mr",
  ctScan: "ct",
  pathology: "pathology",
  memeUsg: "memeUsg",
  otherImaging: "other",
} as const;

export function PresentationPrintView({
  presentation,
}: PresentationPrintViewProps) {
  const age = calculateAge(presentation.patient.birthDate);
  const participatingDoctors = collectParticipatingDoctors({
    submittedBy: presentation.submittedBy,
    councilDecisionBy: presentation.councilDecisionBy,
    branchComments: presentation.branchComments,
    quickConsults: presentation.quickConsults.map((consult) => ({
      requestedBy: consult.requestedBy,
      respondedBy: consult.respondedBy,
      targetBranch: consult.targetBranch,
    })),
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: #1e293b !important;
          }
          header,
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-width: none !important;
          }
          .print-page {
            padding: 0 !important;
            max-width: none !important;
          }
          .print-section {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-theme-border pb-4">
        <p className="text-sm text-text-secondary">
          Yazdırma önizlemesi — {presentation.patient.firstName}{" "}
          {presentation.patient.lastName}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary"
        >
          Yazdır
        </button>
      </div>

      <div className="print-document print-page mx-auto max-w-3xl space-y-6 p-6">
        <header className="print-section border-b-2 print-border pb-4">
          <p className="text-xs font-semibold tracking-widest print-muted uppercase">
            İzmir Şehir Hastanesi — Onkoloji Konsey Raporu
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {presentation.patient.firstName} {presentation.patient.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm print-muted">
            <span>TC: {presentation.patient.tcNo}</span>
            {age && <span>{age}</span>}
            <span>{presentation.councilType}</span>
          </div>
          {presentation.councilDecisionAt && (
            <p className="mt-2 text-sm print-muted">
              Tamamlanma: {formatDateTime(presentation.councilDecisionAt)}
            </p>
          )}
        </header>

        <section className="print-section">
          <h2 className="mb-2 text-sm font-bold uppercase">
            Konseye Sunulma Sebebi
          </h2>
          <p className="text-sm leading-relaxed">
            {presentation.presentationReason}
          </p>
        </section>

        {presentation.clinicalSummary && (
          <section className="print-section">
            <h2 className="mb-2 text-sm font-bold uppercase">Klinik Özet</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {presentation.clinicalSummary}
            </p>
          </section>
        )}

        {IMAGING_FORM_SECTIONS.some((section) => {
          const key = IMAGING_KEY_MAP[section.name];
          const data = presentation.imaging[key];
          return data.entries.length > 0 || data.notes;
        }) && (
          <section className="print-section">
            <h2 className="mb-3 text-sm font-bold uppercase">
              Görüntüleme ve Patoloji
            </h2>
            <div className="space-y-3">
              {IMAGING_FORM_SECTIONS.map((section) => {
                const key = IMAGING_KEY_MAP[section.name];
                const data = presentation.imaging[key];
                if (!data.entries.length && !data.notes) {
                  return null;
                }

                return (
                  <div key={section.name}>
                    <h3 className="text-sm font-semibold">{section.label}</h3>
                    {data.entries.length > 0 ? (
                      <ul className="mt-1 space-y-2">
                        {data.entries.map((entry, index) => (
                          <li key={index} className="text-sm">
                            {data.entries.length > 1 && (
                              <span className="font-medium">
                                Kayıt {index + 1}:{" "}
                              </span>
                            )}
                            {entry.date && (
                              <span className="print-muted">[{entry.date}] </span>
                            )}
                            <span className="whitespace-pre-wrap">
                              {entry.notes}
                            </span>
                            {entry.link && (
                              <p className="mt-0.5 text-xs print-muted break-all">
                                {entry.link}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {data.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {presentation.branchComments.length > 0 && (
          <section className="print-section">
            <h2 className="mb-3 text-sm font-bold uppercase">
              Branş Yorumları
            </h2>
            <div className="space-y-3">
              {presentation.branchComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-2 print-border pl-3"
                >
                  <p className="text-xs font-medium print-muted">
                    {comment.branch} — {comment.author.name}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {presentation.councilDecision && (
          <section className="print-section card p-4">
            <h2 className="mb-2 text-sm font-bold uppercase">
              Konsey Sonucu
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {presentation.councilDecision}
            </p>
            {presentation.councilDecisionBy && (
              <p className="mt-3 text-xs print-muted">
                Konsey raporu yazan: {presentation.councilDecisionBy.name} (
                {presentation.councilDecisionBy.branch})
              </p>
            )}
          </section>
        )}

        {participatingDoctors.length > 0 && (
          <section className="print-section">
            <h2 className="mb-3 text-sm font-bold uppercase">
              Katılımcı Hekimler
            </h2>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {participatingDoctors.map((doctor) => (
                <li key={`${doctor.name}-${doctor.branch}`}>
                  {doctor.name}
                  <span className="print-muted"> · {doctor.branch}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="print-section border-t print-border pt-4 text-xs print-muted">
          <p>
            Yönlendiren: {presentation.submittedBy.name} (
            {presentation.submittedBy.branch})
          </p>
          <p>Sunum tarihi: {formatDateTime(presentation.createdAt)}</p>
        </footer>
      </div>
    </>
  );
}
