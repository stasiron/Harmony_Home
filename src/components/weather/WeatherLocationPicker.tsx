import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchWeatherLocations } from "@/lib/weather";
import type { WeatherLocation } from "@/types";
import { cn } from "@/lib/utils";

/** Wybór miejscowości dla pogody — szukanie po nazwie (Open-Meteo) */
export function WeatherLocationPicker({
  value,
  onChange,
  inputId = "weather-location",
}: {
  value: WeatherLocation | null;
  onChange: (location: WeatherLocation) => void;
  inputId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLocation[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setBusy(true);
    setError(null);
    try {
      const found = await searchWeatherLocations(query);
      setResults(found);
      if (found.length === 0) setError("Nie znaleziono — spróbuj inaczej.");
    } catch {
      setError("Wyszukiwanie niedostępne — spróbuj za chwilę.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <p className="flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 text-primary" />
          <span className="font-medium">{value.name}</span>
          {value.region && (
            <span className="text-muted-foreground">· {value.region}</span>
          )}
        </p>
      )}
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim().length >= 2) void search();
            }
          }}
          placeholder={value ? "Zmień miejscowość…" : "np. Kraków"}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void search()}
          disabled={busy || query.trim().length < 2}
        >
          <Search className="size-4" />
          {busy ? "Szukam…" : "Szukaj"}
        </Button>
      </div>
      {error && <p className="text-xs text-muted-foreground">{error}</p>}
      {results && results.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {results.map((r) => {
            const selected =
              value?.latitude === r.latitude &&
              value?.longitude === r.longitude;
            return (
              <li key={`${r.latitude},${r.longitude}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(r);
                    setResults(null);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50",
                    selected && "bg-primary/10",
                  )}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {r.region}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
