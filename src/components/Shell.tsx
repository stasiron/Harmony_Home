import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SubpageHeader } from "@/components/SubpageHeader";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen">
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
