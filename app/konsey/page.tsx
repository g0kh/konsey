import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { KonseyListRefresh } from "@/components/konsey/konsey-list-refresh";
import { KonseyListSkeleton } from "@/components/konsey/konsey-list-skeleton";
import { KonseyListView } from "@/components/konsey/konsey-list-view";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/design-system";
import { cn } from "@/lib/utils";

const UrgentConsultsBanner = dynamic(
  () =>
    import("@/components/konsey/urgent-consults-banner").then(
      (mod) => mod.UrgentConsultsBanner,
    ),
  { ssr: false },
);

export default function KonseyPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const resolvedParams: Record<string, string | undefined> = {
    councilType:
      typeof searchParams.councilType === "string"
        ? searchParams.councilType
        : undefined,
    status:
      typeof searchParams.status === "string" ? searchParams.status : undefined,
    search:
      typeof searchParams.search === "string" ? searchParams.search : undefined,
  };

  return (
    <div>
      <KonseyListRefresh />
      <PageHeader
        title="Konsey Listesi"
        description="Bekleyen ve devam eden konsey sunumları"
        action={
          <Link href="/hasta-ekle" className={cn(buttonVariants())}>
            + Hasta Ekle
          </Link>
        }
      />

      <Suspense fallback={null}>
        <UrgentConsultsBanner />
      </Suspense>

      <Suspense fallback={<KonseyListSkeleton />}>
        <KonseyListView searchParams={resolvedParams} />
      </Suspense>
    </div>
  );
}
