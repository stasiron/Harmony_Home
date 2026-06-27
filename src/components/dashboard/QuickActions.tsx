import { useEffect, useState } from "react";
import { Siren, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const { panic, startPanic, endPanic, visibleTasks } = useApp();
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!panic?.active) return;
    const end = new Date(panic.startedAt).getTime() + panic.minutes * 60 * 1000;
    const tick = () => setRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [panic]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center justify-between rounded-2xl border border-alert/30 bg-alert/10 px-5 py-4 text-left transition-colors hover:bg-alert/15 alert-glow"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-alert/20 text-alert">
              <Siren className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-alert">Guests Panic Button</div>
              <div className="text-xs text-muted-foreground">
                {panic?.active ? `${fmt(remaining)} · ${visibleTasks.length} blitz tasks` : "Surprise guests incoming?"}
              </div>
            </div>
          </div>
          {panic?.active ? <Timer className="size-5 text-alert" /> : <Siren className="size-5 text-alert" />}
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-alert/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="size-5 text-alert" /> Express Blitzkrieg
            </DialogTitle>
            <DialogDescription>
              How long until guests arrive? We'll surface only the absolute essentials and split them across active members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {[15, 30, 45].map((m) => (
              <button
                key={m}
                onClick={() => {
                  startPanic(m as 15 | 30 | 45);
                  setOpen(false);
                }}
                className="rounded-2xl border border-border bg-surface p-6 text-center transition-colors hover:border-alert/40 hover:bg-alert/10"
              >
                <div className="text-3xl font-light tabular-clock">{m}</div>
                <div className="text-xs text-muted-foreground">minutes</div>
              </button>
            ))}
          </div>
          {panic?.active && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => { endPanic(); setOpen(false); }}>
                <X className="size-4" /> Cancel active panic
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
