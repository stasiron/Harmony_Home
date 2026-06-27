import { AlertOctagon, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function StatusBanner() {
  const { guestsMode, alertCount, panic } = useApp();

  const items: {
    key: string;
    text: string;
    tone: "alert" | "warn" | "accent";
  }[] = [];
  if (panic?.active)
    items.push({
      key: "panic",
      text: `PANIC · guests in ${panic.minutes} min`,
      tone: "alert",
    });
  if (guestsMode)
    items.push({ key: "guests", text: "Guests Mode Active", tone: "accent" });
  if (alertCount > 0)
    items.push({
      key: "alert",
      text: `${alertCount} Red Alert${alertCount > 1 ? "s" : ""}`,
      tone: "alert",
    });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <div
          key={it.key}
          className={
            "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider " +
            (it.tone === "alert"
              ? "bg-alert/15 text-alert alert-glow"
              : it.tone === "warn"
                ? "bg-warn/15 text-warn"
                : "bg-accent/20 text-accent")
          }
        >
          {it.key === "guests" ? (
            <Users className="size-4" />
          ) : (
            <AlertOctagon className="size-4" />
          )}
          {it.text}
        </div>
      ))}
    </div>
  );
}
