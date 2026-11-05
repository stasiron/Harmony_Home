import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import { useHousehold } from "@/context/HouseholdContext";
import { saveGlobalConfig } from "@/lib/globalConfig";

/** Ustawienia wszystkich mieszkań — widzi tylko administrator ogólny */
export function SuperAdminCard() {
  const { isSuperAdmin } = useHousehold();
  const config = useGlobalConfig();
  const [busy, setBusy] = useState(false);

  if (!isSuperAdmin) return null;

  const toggleNotice = async (googleLoginNotice: boolean) => {
    setBusy(true);
    try {
      await saveGlobalConfig({ googleLoginNotice });
    } catch (err) {
      console.error("Global config save failed:", err);
      toast.error("Nie udało się zapisać ustawienia.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-primary/30 bg-primary/5 p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Administrator ogólny</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ustawienia całej aplikacji — działają we wszystkich mieszkaniach.
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface/60 px-4 py-3">
        <div>
          <Label htmlFor="google-login-notice" className="font-medium">
            Informacja przed logowaniem Google
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Po wybraniu Google pokazuje miłe wyjaśnienie ekranu „aplikacja
            niezweryfikowana” i podpowiada logowanie linkiem na e-mail.
          </p>
        </div>
        <Switch
          id="google-login-notice"
          checked={config.googleLoginNotice}
          disabled={busy}
          onCheckedChange={(checked) => void toggleNotice(checked)}
        />
      </div>
    </section>
  );
}
