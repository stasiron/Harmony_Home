import { useRef, useState } from "react";
import {
  ArrowRightLeft,
  Home,
  ImageUp,
  KeyRound,
  LogIn,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyFloorPlanPromptButton } from "@/components/household/NoFloorPlan";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { HOUSEHOLD_PRESETS } from "@/config/presets";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { compressFloorPlan } from "@/lib/floorPlan";
import type { FloorPlanUpload } from "@/lib/householdSetup";
import type { HouseholdPresetId } from "@/types";
import { cn } from "@/lib/utils";

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function Card({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function MigrateLegacyCard() {
  const { migrateLegacy } = useHousehold();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await migrateLegacy();
      toast.success("Mieszkanie przeniesione — jesteś administratorem.");
    } catch (err) {
      console.error("Legacy migration failed:", err);
      toast.error(errorText(err, "Migracja się nie udała."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      icon={<ArrowRightLeft className="size-5" />}
      title="Przenieś obecne mieszkanie"
      description="Obowiązki z historią, domownicy, zakupy, todo, pranie i strefy trafią do nowego modelu. Zostajesz administratorem; resztę domowników zaprosisz kodem. Stare dane zostają nietknięte."
    >
      <Button onClick={() => void run()} disabled={busy}>
        {busy ? "Przenoszenie…" : "Przenieś HomeHarmony"}
      </Button>
    </Card>
  );
}

export function JoinHouseholdCard() {
  const { joinHousehold } = useHousehold();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setBusy(true);
    try {
      await joinHousehold(code);
      setCode("");
    } catch (err) {
      console.error("Join failed:", err);
      toast.error(errorText(err, "Nie udało się dołączyć."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      icon={<KeyRound className="size-5" />}
      title="Dołącz kodem"
      description="Kod zaproszenia podaje administrator mieszkania (Ustawienia → Mieszkanie). Działa też na wspólnym tablecie bez konta."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && code.trim() && void join()}
          placeholder="np. K7M2QX9P"
          className="font-mono uppercase tracking-widest"
          aria-label="Kod zaproszenia"
        />
        <Button onClick={() => void join()} disabled={busy || !code.trim()}>
          {busy ? "Dołączanie…" : "Dołącz"}
        </Button>
      </div>
    </Card>
  );
}

export function CreateHouseholdCard({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const { createHousehold } = useHousehold();
  const fileRef = useRef<HTMLInputElement>(null);
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const [name, setName] = useState("");
  const [presetId, setPresetId] = useState<HouseholdPresetId>("family");
  const [profiles, setProfiles] = useState<string[]>(() => [firstName, ""]);
  const [myIndex, setMyIndex] = useState<number | null>(firstName ? 0 : null);
  const [floorPlan, setFloorPlan] = useState<FloorPlanUpload | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Card
        icon={<Home className="size-5" />}
        title="Nowe mieszkanie"
        description="Do założenia mieszkania potrzebne jest konto (Google albo link na e-mail) — zostaniesz jego administratorem."
      >
        <LoginDialog
          trigger={
            <Button>
              <LogIn className="size-4" />
              Zaloguj się
            </Button>
          }
        />
      </Card>
    );
  }

  const named = profiles.map((p) => p.trim()).filter(Boolean);
  const canSubmit = name.trim().length > 0 && named.length > 0 && !busy;

  const setProfile = (index: number, value: string) =>
    setProfiles((prev) => prev.map((p, i) => (i === index ? value : p)));

  const removeProfile = (index: number) => {
    setProfiles((prev) => prev.filter((_, i) => i !== index));
    setMyIndex((current) =>
      current === null || current === index
        ? null
        : current > index
          ? current - 1
          : current,
    );
  };

  const pickFloorPlan = async (file: File) => {
    try {
      setFloorPlan(await compressFloorPlan(file));
    } catch (err) {
      toast.error(errorText(err, "Nie udało się wczytać planu."));
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      // Indeks „to ja” liczony po odfiltrowaniu pustych pól
      const keptIndexes = profiles
        .map((p, i) => (p.trim() ? i : -1))
        .filter((i) => i >= 0);
      const myProfileIndex =
        myIndex === null ? null : keptIndexes.indexOf(myIndex);
      await createHousehold({
        name,
        presetId,
        profileNames: named,
        myProfileIndex:
          myProfileIndex === null || myProfileIndex < 0 ? null : myProfileIndex,
        floorPlan,
      });
      toast.success("Mieszkanie gotowe.");
      setName("");
      setProfiles([firstName, ""]);
      setMyIndex(firstName ? 0 : null);
      setFloorPlan(null);
      onCreated?.();
    } catch (err) {
      console.error("Create household failed:", err);
      toast.error(errorText(err, "Nie udało się utworzyć mieszkania."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      icon={<Home className="size-5" />}
      title="Nowe mieszkanie"
      description="Widzą je tylko osoby, które zaprosisz. Wszystko zmienisz później."
    >
      <div className="space-y-1.5">
        <Label htmlFor="household-name">Nazwa</Label>
        <Input
          id="household-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Mieszkanie na Mokotowie"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Preset</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {HOUSEHOLD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setPresetId(preset.id)}
              aria-pressed={presetId === preset.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                presetId === preset.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <span className="block font-semibold">{preset.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {preset.description} · {preset.chores.length} obowiązków
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Domownicy</Label>
        <p className="text-xs text-muted-foreground">
          Także osoby bez konta — obowiązki przypiszesz po imieniu. Zaznacz,
          który to Ty.
        </p>
        <div className="space-y-2">
          {profiles.map((profile, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={profile}
                onChange={(e) => setProfile(index, e.target.value)}
                placeholder={`Domownik ${index + 1}`}
                aria-label={`Domownik ${index + 1}`}
              />
              <Button
                type="button"
                size="sm"
                variant={myIndex === index ? "secondary" : "ghost"}
                className="shrink-0"
                onClick={() => setMyIndex(myIndex === index ? null : index)}
              >
                {myIndex === index ? "To ja" : "To ja?"}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label="Usuń domownika"
                disabled={profiles.length === 1}
                onClick={() => removeProfile(index)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setProfiles((prev) => [...prev, ""])}
        >
          <Plus className="size-4" />
          Dodaj osobę
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Plan mieszkania (opcjonalnie)</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void pickFloorPlan(file);
          }}
        />
        {floorPlan ? (
          <div className="space-y-2">
            <img
              src={floorPlan.dataUrl}
              alt="Podgląd planu"
              className="w-full max-w-sm rounded-2xl border border-border"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFloorPlan(null)}
            >
              <Trash2 className="size-4" />
              Bez planu
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Bez planu mapa jest ukryta. Nie masz ładnego rzutu? Skopiuj prompt
              i wygeneruj plan w stylu mieszkania testowego.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <ImageUp className="size-4" />
                Wybierz obraz
              </Button>
              <CopyFloorPlanPromptButton
                householdName={name.trim() || "Moje mieszkanie"}
              />
            </div>
          </>
        )}
      </div>

      <Button onClick={() => void submit()} disabled={!canSubmit}>
        {busy ? "Tworzenie…" : "Utwórz mieszkanie"}
      </Button>
    </Card>
  );
}

/** Ekran dla osoby bez żadnego mieszkania — też w /households */
export function HouseholdStart() {
  const { canMigrateLegacy } = useHousehold();
  return (
    <div className="space-y-4">
      {canMigrateLegacy && <MigrateLegacyCard />}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <CreateHouseholdCard />
        <JoinHouseholdCard />
      </div>
    </div>
  );
}
