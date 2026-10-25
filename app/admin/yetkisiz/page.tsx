import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 text-center">
      <p className="mb-2 font-display text-6xl font-bold text-destructive">403</p>
      <h1 className="mb-2 text-xl font-semibold text-text-primary">
        Bu sayfaya erişim yetkiniz bulunmamaktadır.
      </h1>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        Yönetim paneline yalnızca ADMIN rolüne sahip kullanıcılar erişebilir.
        Lütfen admin hesabıyla giriş yapın.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Giriş Yap
        </Link>
        <Link href="/konsey" className={cn(buttonVariants({ variant: "outline" }))}>
          Konsey Listesi
        </Link>
      </div>
    </div>
  );
}
