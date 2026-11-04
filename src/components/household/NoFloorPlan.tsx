import { useRef, useState } from "react";
import { Check, Copy, ImageUp, Map as MapIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/context/HouseholdContext";
import {
  compressFloorPlan,
  removeFloorPlan,
  saveFloorPlan,
} from "@/lib/floorPlan";
import { buildFloorPlanPrompt } from "@/lib/floorPlanPrompt";
import { cn } from "@/lib/utils";

/** Krótka informacja w miejscu mapy (np. w formularzu obowiązku) */
export function NoFloorPlanNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-3 text-xs text-muted-foreground",
        className,
      )}
    >
      To mieszkanie nie ma jeszcze planu — miejsce wskaż strefą. Plan dodasz w
      Ustawieniach.
    </p>
  );
}

export function CopyFloorPlanPromptButton({
  householdName,
}: {
  householdName: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildFloorPlanPrompt(householdName));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        "Nie udało się skopiować — przeglądarka zablokowała schowek.",
      );
    }
  };
  return (
    <Button type="button" variant="secondary" onClick={() => void copy()}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Skopiowano" : "Skopiuj prompt do planu"}
    </Button>
  );
}

export function FloorPlanUploadButton({ label }: { label?: string }) {
  const { householdId } = useHousehold();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!householdId) return;
    setBusy(true);
    try {
      await saveFloorPlan(householdId, await compressFloorPlan(file));
      toast.success("Plan mieszkania zapisany.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się zapisać planu.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <ImageUp className="size-4" />
        {busy ? "Zapisywanie…" : (label ?? "Wgraj plan")}
      </Button>
    </>
  );
}

/** Ustawienia → plan mieszkania (zmienia tylko administrator) */
export function FloorPlanCard() {
  const { household, householdId, floorPlan, isAdmin } = useHousehold();
  if (!household || !householdId) return null;

  const remove = async () => {
    try {
      await removeFloorPlan(householdId);
    } catch {
      toast.error("Nie udało się usunąć planu.");
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <MapIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Plan mieszkania</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {floorPlan
              ? "Na planie zaznaczasz strefy i miejsca obowiązków."
              : "Bez planu mapa jest ukryta, a obowiązki grupują się po strefach. Skopiuj prompt, wklej go do generatora obrazów (np. Gemini, ChatGPT) razem ze szkicem lub zdjęciem rzutu — dostaniesz plan w stylu mieszkania testowego."}
          </p>
        </div>
      </div>

      {floorPlan && (
        <img
          src={floorPlan.src}
          alt="Plan mieszkania"
          className="w-full max-w-md rounded-2xl border border-border"
        />
      )}

      <div className="flex flex-wrap gap-2">
        {!floorPlan && (
          <CopyFloorPlanPromptButton householdName={household.name} />
        )}
        {isAdmin && (
          <FloorPlanUploadButton
            label={floorPlan ? "Zmień plan" : "Wgraj plan"}
          />
        )}
        {isAdmin && household.floorPlan.kind === "upload" && (
          <Button type="button" variant="outline" onClick={() => void remove()}>
            <Trash2 className="size-4" />
            Usuń plan
          </Button>
        )}
      </div>
      {!isAdmin && (
        <p className="text-xs text-muted-foreground">
          Plan zmienia administrator mieszkania.
        </p>
      )}
    </section>
  );
}
