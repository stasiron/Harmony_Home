import { Siren } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const { panic, startPanic, endPanic, visibleTasks } = useApp();

  const togglePanic = () => {
    if (panic?.active) endPanic();
    else startPanic();
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      <button
        type="button"
        onClick={togglePanic}
        className={cn(
          "group flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors",
          panic?.active
            ? "border-alert bg-alert/15 alert-glow hover:bg-alert/20"
            : "border-alert/30 bg-alert/10 hover:bg-alert/15",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-alert/20 text-alert">
            <Siren className="size-5" />
          </div>
          <div>
            <div className="font-semibold text-alert">Guests Panic Button</div>
            <div className="text-xs text-muted-foreground">
              {panic?.active
                ? `PANIC aktywny · ${visibleTasks.length} priorytetowych obowiązków`
                : "Włącz listę od najważniejszych (goście)"}
            </div>
          </div>
        </div>
        <Siren className="size-5 text-alert" />
      </button>
    </div>
  );
}
