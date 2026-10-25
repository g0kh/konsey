"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { UserProvider } from "@/lib/UserContext";

const AUTH_LAYOUT_PATHS = new Set(["/", "/giris", "/kayit"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthLayout = AUTH_LAYOUT_PATHS.has(pathname);
  const showSidebar = !isAdminRoute && !isAuthLayout;

  return (
    <UserProvider>
      <div className="min-h-screen bg-bg text-text-primary">
        {showSidebar && <AppSidebar />}
        <main className={isAdminRoute || isAuthLayout ? "min-h-screen" : "app-main"}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "!bg-white !text-text-primary !border !border-border !text-[15px] !shadow-md",
            duration: 4000,
          }}
        />
      </div>
    </UserProvider>
  );
}
