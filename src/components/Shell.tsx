import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AuthUserBadge } from "@/components/AuthUserBadge";
import { SubpageHeader } from "@/components/SubpageHeader";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen">
      <div className="fixed right-4 top-4 z-50 md:right-8">
        <AuthUserBadge />
      </div>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {!isHome && (
          <section className="mb-8">
            <SubpageHeader />
          </section>
        )}
        {children}
      </main>
    </div>
  );
}
