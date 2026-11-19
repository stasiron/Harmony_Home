import { Lock, Users } from "lucide-react";
import { useScope } from "@/context/ScopeContext";
import { cn } from "@/lib/utils";

/**
 * Duży przełącznik u góry strony: komu pokazujemy to, co teraz dodajemy.
 * „Tylko dla mnie” wygląda zwyczajnie; „Dla wszystkich” jest wyraźnie
 * zaznaczone, żeby trudno było się pomylić.
 */
export function ScopeSwitch({ what = "nowe wpisy" }: { what?: string }) {
  const { scope, setScope, canPrivate } = useScope();
  const shared = scope === "public";

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Kto zobaczy nowe wpisy"
        className={cn(
          "grid grid-cols-2 gap-1.5 rounded-2xl border p-1.5 transition-colors",
          shared
            ? "border-accent/70 bg-accent/10 shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_25%,transparent)]"
            : "border-border bg-surface",
        )}
      >
        <button
          type="button"
          role="radio"
          aria-checked={!shared}
          disabled={!canPrivate}
          onClick={() => setScope("private")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:text-base",
            !shared
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Lock className="size-4 shrink-0" />
          Tylko dla mnie
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={shared}
          onClick={() => setScope("public")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors sm:text-base",
            shared
              ? "bg-accent text-background shadow-md"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-4 shrink-0" />
          Dla wszystkich
        </button>
      </div>
      <p
        className={cn(
          "px-1 text-xs",
          shared ? "font-medium text-accent" : "text-muted-foreground",
        )}
      >
        {!canPrivate
          ? "Na urządzeniu bez konta wszystko jest wspólne — prywatne wpisy wymagają zalogowania."
          : shared
            ? `Uwaga: ${what} zobaczą wszyscy domownicy.`
            : `${what.charAt(0).toUpperCase()}${what.slice(1)} widzisz tylko Ty.`}
      </p>
    </div>
  );
}
