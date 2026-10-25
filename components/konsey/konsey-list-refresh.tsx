"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_MS = 300_000;

/** Yalnızca geliştirmede periyodik yenileme — production'da kapalı (performans) */
export function KonseyListRefresh() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const id = window.setInterval(() => {
      router.refresh();
    }, REFRESH_MS);

    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
