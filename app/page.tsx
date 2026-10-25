import { Suspense } from "react";
import { HomeLoginPage } from "@/components/auth/home-login-page";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-text-secondary">
          Yükleniyor…
        </div>
      }
    >
      <HomeLoginPage />
    </Suspense>
  );
}
