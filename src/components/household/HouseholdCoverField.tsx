import { useEffect, useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useHousehold } from "@/context/HouseholdContext";
import {
  fetchHouseholdCard,
  removeCover,
  saveCover,
} from "@/lib/householdCover";

/** Ustawienia → Mieszkanie: zdjęcie kafelka na ekranie wejścia (admin) */
export function HouseholdCoverField() {
  const { household, isAdmin } = useHousehold();
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const householdId = household?.id ?? null;
  const coverVersion = household?.cover?.updatedAt ?? null;

  useEffect(() => {
    setSrc(null);
    if (!householdId || !coverVersion) return;
    let alive = true;
    void fetchHouseholdCard(householdId)
      .then((card) => alive && setSrc(card?.coverSrc ?? null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [householdId, coverVersion]);

  if (!householdId || !isAdmin) return null;

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      console.error(message, err);
      toast.error(err instanceof Error && err.message ? err.message : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Zdjęcie mieszkania</Label>
      <p className="text-xs text-muted-foreground">
        Widać je na kafelku przy wejściu do aplikacji.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) {
            void run(
              () => saveCover(householdId, file),
              "Nie udało się zapisać zdjęcia.",
            );
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        {src && (
          <img
            src={src}
            alt="Zdjęcie mieszkania"
            className="h-20 w-28 rounded-xl border border-border object-cover"
          />
        )}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <ImageUp className="size-4" />
          {coverVersion ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
        </Button>
        {coverVersion && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void run(
                () => removeCover(householdId),
                "Nie udało się usunąć zdjęcia.",
              )
            }
          >
            <Trash2 className="size-4" />
            Usuń
          </Button>
        )}
      </div>
    </div>
  );
}
