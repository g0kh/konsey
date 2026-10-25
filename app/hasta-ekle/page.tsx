import Link from "next/link";
import { PresentationForm } from "@/components/presentation-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HastaEklePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/konsey"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 text-text-secondary")}
        >
          ← Listeye Dön
        </Link>
        <h1 className="page-title">Konseye Hasta Sunumu</h1>
        <p className="page-subtitle">
          Hasta bilgilerini ve konsey sunum formunu adım adım doldurun
        </p>
      </div>
      <PresentationForm />
    </div>
  );
}
