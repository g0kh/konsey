"use client";

import { formatDateTime } from "@/lib/date-utils";
import { calculateAge } from "@/lib/imaging-utils";
import type { PresentationDetail } from "@/lib/types/presentation-detail";
import { IMAGING_FORM_SECTIONS } from "@/lib/imaging-data";

type CouncilResultPrintViewProps = {
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

export function CouncilResultPrintView({
  presentation,
}: CouncilResultPrintViewProps) {
  const age = calculateAge(presentation.patient.birthDate);
  const printDate = formatDateTime(new Date().toISOString());

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }
          html,
          body,
          .app-shell,
          .app-main,
          main {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            box-shadow: none !important;
          }
          .app-sidebar,
          .app-mobile-header,
          .no-print,
          nav {
            display: none !important;
          }
        }
        .result-print-doc {
          color: #000;
          background: #fff;
          font-family: Georgia, "Times New Roman", serif;
        }
        .result-print-box {
          border: 3px solid #000;
          padding: 16px 18px;
          background: #fff;
          font-weight: 700;
        }
        .result-print-rule {
          border-color: #000;
        }
        .result-print-muted {
          color: #333;
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
        <p className="text-sm text-text-secondary">
          Konsey sonucu yazdırma — {presentation.patient.firstName}{" "}
          {presentation.patient.lastName}
        </p>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          Yazdır
        </button>
      </div>

      <article className="result-print-root result-print-doc mx-auto max-w-[210mm] space-y-5 bg-white p-2 text-[11pt] leading-relaxed sm:p-4">
        <header className="border-b-2 border-black pb-4 text-center">
          <p className="text-[10pt] font-semibold uppercase tracking-[0.2em]">
            İzmir Şehir Hastanesi
          </p>
          <h1 className="mt-2 text-[18pt] font-bold uppercase tracking-wide">
            {presentation.councilType}
          </h1>
          <p className="result-print-muted mt-1 text-[10pt]">
            Onkoloji Konsey Sonuç Raporu
          </p>
        </header>

        <section className="grid gap-1 border-b border-black pb-4 text-[10.5pt] sm:grid-cols-2">
          <p>
            <span className="font-semibold">Hasta:</span>{" "}
            {presentation.patient.firstName} {presentation.patient.lastName}
          </p>
          <p>
            <span className="font-semibold">TC:</span> {presentation.patient.tcNo}
          </p>
          {age && (
            <p>
              <span className="font-semibold">Yaş:</span> {age}
            </p>
          )}
          <p>
            <span className="font-semibold">Yönlendiren:</span>{" "}
            {presentation.submittedBy.name} ({presentation.submittedBy.branch})
          </p>
          {presentation.councilDecisionAt && (
            <p className="sm:col-span-2">
              <span className="font-semibold">Konsey tarihi:</span>{" "}
              {formatDateTime(presentation.councilDecisionAt)}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">
            Sunulma Sebebi
          </h2>
          <p className="whitespace-pre-wrap">{presentation.presentationReason}</p>
        </section>

        {presentation.clinicalSummary && (
          <section>
            <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">
              Klinik Özet
            </h2>
            <p className="whitespace-pre-wrap">{presentation.clinicalSummary}</p>
          </section>
        )}

        {presentation.currentTreatment && (
          <section>
            <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">
              Mevcut Tedavi
            </h2>
            <p className="whitespace-pre-wrap">{presentation.currentTreatment}</p>
          </section>
        )}

        {IMAGING_FORM_SECTIONS.some((section) => {
          const key = IMAGING_KEY_MAP[section.name];
          const data = presentation.imaging[key];
          return data.entries.length > 0 || data.notes;
        }) && (
          <section>
            <h2 className="mb-3 text-[11pt] font-bold uppercase tracking-wide">
              Konsey Bulguları ve Görüntüleme
            </h2>
            <div className="space-y-3">
              {IMAGING_FORM_SECTIONS.map((section) => {
                const key = IMAGING_KEY_MAP[section.name];
                const data = presentation.imaging[key];
                if (!data.entries.length && !data.notes) {
                  return null;
                }

                return (
                  <div key={section.name} className="border-l-2 border-black pl-3">
                    <h3 className="font-semibold">{section.label}</h3>
                    {data.entries.length > 0 ? (
                      <ul className="mt-1 space-y-2">
                        {data.entries.map((entry, index) => (
                          <li key={index} className="whitespace-pre-wrap">
                            {data.entries.length > 1 && (
                              <span className="font-medium">Kayıt {index + 1}: </span>
                            )}
                            {entry.date && (
                              <span className="result-print-muted">
                                [{entry.date}]{" "}
                              </span>
                            )}
                            {entry.notes}
                            {entry.link && (
                              <p className="result-print-muted mt-0.5 text-[9pt] break-all">
                                {entry.link}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap">{data.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {presentation.branchComments.length > 0 && (
          <section>
            <h2 className="mb-3 text-[11pt] font-bold uppercase tracking-wide">
              Branş Görüşleri
            </h2>
            <div className="space-y-2">
              {presentation.branchComments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-black pl-3">
                  <p className="text-[10pt] font-semibold">
                    {comment.branch} — {comment.author.name}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {presentation.quickConsults.length > 0 && (
          <section>
            <h2 className="mb-3 text-[11pt] font-bold uppercase tracking-wide">
              Hızlı Görüşler
            </h2>
            <div className="space-y-2">
              {presentation.quickConsults.map((consult) => (
                <div key={consult.id} className="border-l-2 border-black pl-3">
                  <p className="text-[10pt] font-semibold">
                    {consult.targetBranch} — {consult.requestedBy.name}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{consult.question}</p>
                  {consult.response && (
                    <p className="mt-1 whitespace-pre-wrap">
                      <span className="font-semibold">Yanıt: </span>
                      {consult.response}
                    </p>
                  )}
                  {consult.followUps.map((followUp) => (
                    <div key={followUp.id} className="mt-2">
                      <p className="whitespace-pre-wrap">{followUp.question}</p>
                      {followUp.response && (
                        <p className="mt-1 whitespace-pre-wrap">
                          <span className="font-semibold">Yanıt: </span>
                          {followUp.response}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {(presentation.attendees?.length ?? 0) > 0 && (
          <section>
            <h2 className="mb-2 text-[11pt] font-bold uppercase tracking-wide">
              Konseye Katılan Hekimler
            </h2>
            <ul className="space-y-1">
              {presentation.attendees?.map((attendee) => (
                <li key={attendee.id}>
                  {attendee.name} — {attendee.branch}
                </li>
              ))}
            </ul>
          </section>
        )}

        {presentation.councilDecision && (
          <section className="result-print-box mt-6">
            <h2 className="mb-3 text-center text-[12pt] font-bold uppercase tracking-widest">
              Konsey Sonucu
            </h2>
            <p className="whitespace-pre-wrap text-[11pt] font-bold leading-relaxed">
              {presentation.councilDecision}
            </p>
            {presentation.councilDecisionBy && (
              <p className="result-print-muted mt-4 border-t border-black pt-3 text-[10pt]">
                Konsey raporu yazan: {presentation.councilDecisionBy.name} (
                {presentation.councilDecisionBy.branch})
              </p>
            )}
          </section>
        )}

        {(presentation.supplementaryOpinions?.length ?? 0) > 0 && (
          <section>
            <h2 className="mb-3 text-[11pt] font-bold uppercase tracking-wide">
              Ek Görüşler
            </h2>
            <div className="space-y-2">
              {presentation.supplementaryOpinions?.map((opinion) => (
                <div key={opinion.id} className="border-l-2 border-black pl-3">
                  <p className="text-[10pt] font-semibold">
                    {opinion.author.name} — {opinion.branch} ·{" "}
                    {formatDateTime(opinion.createdAt)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{opinion.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="result-print-muted border-t border-black pt-3 text-[9pt]">
          <p>Yazdırma: {printDate}</p>
          <p>İzmir Şehir Hastanesi — Onkoloji Konsey Sistemi</p>
        </footer>
      </article>
    </>
  );
}
