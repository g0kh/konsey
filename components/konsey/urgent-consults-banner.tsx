"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useCurrentUser } from "@/lib/UserContext";
import { AlertCircle } from "lucide-react";

type BranchConsult = {
  id: string;
  question: string;
  presentationId: string;
  councilType: string;
  patient: { firstName: string; lastName: string };
  requestedBy: { name: string; branch: string };
};

export function UrgentConsultsBanner() {
  const { user } = useCurrentUser();

  const consultsKey = user ? "/api/quick-consults/my-branch" : null;

  const { data: consults = [], isLoading } = useSWR<BranchConsult[]>(
    consultsKey,
    fetcher,
    { refreshInterval: 120000, revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  if (!user || isLoading || consults.length === 0) {
    return null;
  }

  return (
    <section className="urgent-banner p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="size-5 text-urgent" />
        <h2 className="text-[15px] font-semibold text-urgent">
          Acil Görüş Bekliyor ({consults.length})
        </h2>
      </div>
      <p className="mb-3 text-sm text-text-secondary">
        {user.branch} branşından yanıt bekleyen hızlı görüş talepleri var.
      </p>
      <ul className="space-y-2">
        {consults.map((consult) => (
          <li key={consult.id}>
            <Link
              href={`/konsey/${consult.presentationId}`}
              className="card card-clickable block !p-3"
            >
              <p className="text-sm font-medium text-text-primary">
                {consult.patient.firstName} {consult.patient.lastName}
              </p>
              <p className="text-xs text-text-secondary">
                {consult.requestedBy.name} · {consult.councilType}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-text-secondary">
                {consult.question}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
