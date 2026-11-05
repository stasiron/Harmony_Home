import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHousehold } from "@/context/HouseholdContext";
import { normalizeIcalUrl } from "@/lib/personalIcal";

/**
 * Wspólny kalendarz domu (widzą wszyscy) + fragmenty adresu, po których
 * wydarzenie „u nas” włącza tryb gości. Ustawia administrator.
 */
export function SharedCalendarField() {
  const { household, isAdmin, setSharedCalendar } = useHousehold();
  const saved = household?.sharedCalendar ?? null;
  const [url, setUrl] = useState(saved?.icalUrl ?? "");
  const [address, setAddress] = useState(
    (saved?.guestLocationKeywords ?? []).join(", "),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUrl(saved?.icalUrl ?? "");
    setAddress((saved?.guestLocationKeywords ?? []).join(", "));
  }, [saved?.icalUrl, saved?.guestLocationKeywords]);

  if (!household) return null;

  if (!isAdmin) {
    return (
      <div className="space-y-1">
        <Label>Wspólny kalendarz domu</Label>
        <p className="text-sm text-muted-foreground">
          {saved ? "Podłączony — widać go w zakładce Kalendarz." : "Brak."}
        </p>
      </div>
    );
  }

  const normalized = url.trim() ? normalizeIcalUrl(url) : null;
  const keywords = address
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const save = async () => {
    setBusy(true);
    try {
      await setSharedCalendar(
        normalized
          ? { icalUrl: normalized, guestLocationKeywords: keywords }
          : null,
      );
      toast.success(
        normalized
          ? "Wspólny kalendarz zapisany."
          : "Wspólny kalendarz usunięty.",
      );
    } catch (err) {
      console.error("Shared calendar save failed:", err);
      toast.error("Nie udało się zapisać kalendarza.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="shared-calendar-url">
        Wspólny kalendarz domu (goście)
      </Label>
      <p className="text-xs text-muted-foreground">
        Widzą go wszyscy domownicy. Wizyta w tym kalendarzu (słowo „goście”,
        „wizyta”… w tytule albo Wasz adres w miejscu) włącza tryb gości dzień
        wcześniej.
      </p>
      <Input
        id="shared-calendar-url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Link iCal, np. https://calendar.google.com/calendar/ical/…"
      />
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Fragmenty adresu, np. Andersa, Częstochowa"
        aria-label="Fragmenty adresu mieszkania"
      />
      {url.trim() && !normalized && (
        <p className="text-xs text-muted-foreground">
          Potrzebny link iCal z Google, Outlooka albo iCloud (https://).
        </p>
      )}
      <Button
        variant="secondary"
        disabled={busy || Boolean(url.trim() && !normalized)}
        onClick={() => void save()}
      >
        {url.trim() ? "Zapisz kalendarz" : saved ? "Usuń kalendarz" : "Zapisz"}
      </Button>
    </div>
  );
}
