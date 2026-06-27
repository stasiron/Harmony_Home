import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CloudRain, Wind } from "lucide-react";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import {
  fetchCzestochowaWeather,
  weatherLabel,
  WEATHER_CITY,
  WEATHER_REFRESH_MS,
  type WeatherSnapshot,
} from "@/lib/weather";
import { cn } from "@/lib/utils";

export function ClockWeather() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await fetchCzestochowaWeather();
        if (!cancelled) {
          setWeather(snapshot);
          setWeatherError(false);
        }
      } catch {
        if (!cancelled) setWeatherError(true);
      }
    };

    load();
    const id = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <div className="tabular-clock text-7xl font-extralight leading-none md:text-8xl lg:text-9xl">
          {time}
        </div>
        <div className="mt-2 text-sm text-muted-foreground md:text-base">
          {date}
        </div>
      </div>

      <Link
        to="/weather"
        className={cn(
          "flex items-center gap-5 self-end rounded-3xl bg-surface px-6 py-4 transition-colors lg:justify-self-end",
          weather &&
            "hover:bg-surface-elevated hover:ring-1 hover:ring-primary/20",
        )}
      >
        {weather ? (
          <>
            <WeatherIcon code={weather.weatherCode} />
            <div>
              <div className="text-3xl font-light tabular-clock">
                {weather.temperature}°
              </div>
              <div className="text-xs text-muted-foreground">
                {weatherLabel(weather.weatherCode)} · {WEATHER_CITY}
              </div>
              <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wind className="size-3" /> {weather.windSpeed} km/h
                </span>
                <span className="flex items-center gap-1">
                  <CloudRain className="size-3" />{" "}
                  {weather.precipitationProbability}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="min-w-[10rem] text-sm text-muted-foreground">
            {weatherError ? "Pogoda niedostępna" : "Ładowanie pogody…"}
          </div>
        )}
      </Link>
    </div>
  );
}
