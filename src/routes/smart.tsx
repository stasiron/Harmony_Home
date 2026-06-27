import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Shell } from "@/components/Shell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/smart")({
  head: () => ({
    meta: [
      { title: "Smart Home · Homebase" },
      { name: "description", content: "Home Assistant devices linked to household chores." },
    ],
  }),
  component: () => (<Shell><SmartPage /></Shell>),
});

function SmartPage() {
  const { devices, triggerDevice, tasks } = useApp();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Smart Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devices from Home Assistant appear here and can update or create chores.
        </p>
      </header>

      {devices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <Cpu className="mx-auto size-10 text-muted-foreground" strokeWidth={1.4} />
          <h2 className="mt-4 text-lg font-semibold">No devices connected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect Home Assistant to sync vacuum, washer, sensors and other entities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => {
            const linked = tasks.find((t) => t.id === d.linkedTaskId);
            return (
              <div key={d.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Cpu className="size-3.5" /> {d.room}
                    </div>
                    <div className="mt-1 truncate text-lg font-semibold">{d.name}</div>
                    <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {d.type}
                    </div>
                  </div>
                  <Switch checked={d.triggered} onCheckedChange={() => triggerDevice(d.id)} />
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  {linked && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-primary" />
                      Auto-completes: <span className="font-medium text-foreground">{linked.name}</span>
                    </div>
                  )}
                  {d.generatesTask && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-accent" />
                      Generates: <span className="font-medium text-foreground">{d.generatesTask}</span>
                    </div>
                  )}
                  {!linked && !d.generatesTask && <div>Sensor input only.</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
