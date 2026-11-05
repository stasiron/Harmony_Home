import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { WeatherForecastCharts } from "@/components/weather/WeatherForecastCharts";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import {
  fetchForecast,
  formatForecastDay,
  householdWeatherLocation,
  weatherLabel,
  WEATHER_REFRESH_MS,
  type WeatherForecast,
} from "@/lib/weather";
import { useHousehold } from "@/context/HouseholdContext";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Pogoda · Homebase" },
      {
        name: "description",
        content: "Prognoza pogody na 3 dni dla miejscowości mieszkania.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <WeatherPage />
    </Shell>
  ),
});

function WeatherPage() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState(false);
  const { household } = useHousehold();
  const location = householdWeatherLocation(household);
  const locationKey = location
    ? `${location.latitude},${location.longitude}`
    : null;

  useEffect(() => {
    setForecast(null);
    setError(false);
    if (!location) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchForecast(location);
        if (!cancelled) {
          setForecast(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    load();
    const id = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // locationKey zmienia się razem z lokalizacją
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]);

  if (!location) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">Gdzie jest mieszkanie?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administrator ustawi miejscowość w Ustawieniach → Mieszkanie.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">Pogoda niedostępna</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Spróbuj odświeżyć stronę.
        </p>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Ładowanie prognozy…
      </div>
    );
  }

  const { current, days, hourly } = forecast;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Pogoda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {location.name} · prognoza 3-dniowa
        </p>
      </header>

      <section className="flex items-center gap-6 rounded-3xl border border-border bg-surface px-8 py-6 shadow-elevated">
        <WeatherIcon
          code={current.weatherCode}
          className="size-16 text-primary"
        />
        <div>
          <div className="text-5xl font-extralight tabular-clock md:text-6xl">
            {current.temperature}°
          </div>
          <div className="mt-1 text-muted-foreground">
            {weatherLabel(current.weatherCode)}
          </div>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wind className="size-4" /> {current.windSpeed} km/h
            </span>
            <span className="flex items-center gap-1">
              <CloudRain className="size-4" />{" "}
              {current.precipitationProbability}%
            </span>
          </div>
        </div>
      </section>

      <WeatherForecastCharts hourly={hourly} days={days} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {days.map((day, index) => (
          <div
            key={day.date}
            className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-elevated"
          >
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {formatForecastDay(day.date, index)}
            </div>
            <div className="flex items-center gap-4">
              <WeatherIcon
                code={day.weatherCode}
                className="size-10 text-primary"
              />
              <div>
                <div className="text-2xl font-light tabular-clock">
                  {day.tempMax}°{" "}
                  <span className="text-muted-foreground">
                    / {day.tempMin}°
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {weatherLabel(day.weatherCode)}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wind className="size-3" /> do {day.windSpeedMax} km/h
              </span>
              <span className="flex items-center gap-1">
                <CloudRain className="size-3" /> {day.precipitationProbability}%
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
