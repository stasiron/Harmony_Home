import { EyeOff, Lock } from "lucide-react";
import type { ReactNode } from "react";
import type { FeatureState, FeatureView } from "@/config/features";
import { useFeature } from "@/hooks/useFeature";
import { cn } from "@/lib/utils";

function restrictionLabel(state: FeatureState): string {
  return state === "hidden" ? "ukryte dla innych" : "zablokowane dla innych";
}

/** Mały znaczek dla administratora: inni tego nie widzą / nie mogą użyć */
export function RestrictedMark({
  view,
  className,
}: {
  view: FeatureView;
  className?: string;
}) {
  if (view.forOthers === "on" || view.forOthers === view.state) return null;
  const Icon = view.forOthers === "hidden" ? EyeOff : Lock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-warn",
        className,
      )}
      title={restrictionLabel(view.forOthers)}
    >
      <Icon className="size-3" />
      <span className="sr-only sm:not-sr-only">
        {restrictionLabel(view.forOthers)}
      </span>
    </span>
  );
}

/**
 * Główny przycisk, który administrator może zablokować albo ukryć.
 * Zablokowany: widoczny, przygaszony, z kłódką i „wkrótce”, nie działa.
 */
export function FeatureGate({
  feature,
  children,
  className,
}: {
  feature: string;
  children: ReactNode;
  className?: string;
}) {
  const view = useFeature(feature);
  if (view.state === "hidden") return null;
  if (view.state === "locked") {
    return (
      <span
        className={cn("relative inline-flex cursor-not-allowed", className)}
        title="Wkrótce"
        aria-disabled
      >
        <span inert className="pointer-events-none contents [&>*]:opacity-40">
          {children}
        </span>
        <span className="pointer-events-none absolute -right-1.5 -top-1.5 inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
          <Lock className="size-3" />
          wkrótce
        </span>
      </span>
    );
  }
  if (view.forOthers !== "on") {
    return (
      <span className={cn("relative inline-flex", className)}>
        {children}
        <RestrictedMark
          view={view}
          className="pointer-events-none absolute -right-1.5 -top-1.5"
        />
      </span>
    );
  }
  return <>{children}</>;
}

/** Znaczek na zakładce: „wkrótce” albo informacja dla administratora */
export function TabFlag({ view }: { view: FeatureView }) {
  if (view.state === "locked") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Lock className="size-3" />
        wkrótce
      </span>
    );
  }
  return <RestrictedMark view={view} />;
}
