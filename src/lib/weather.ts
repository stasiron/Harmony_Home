const CZESTOCHOWA = { latitude: 50.8118, longitude: 19.1203 };

export const WEATHER_CITY = "Częstochowa";

export type WeatherSnapshot = {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitationProbability: number;
  fetchedAt: string;
};

export type WeatherDayForecast = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeedMax: number;
};

export type WeatherHourPoint = {
  time: string;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverMid: number;
  cloudCoverHigh: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  visibility: number;
};

export type WeatherForecast = {
  current: WeatherSnapshot;
  days: WeatherDayForecast[];
  hourly: WeatherHourPoint[];
};

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  precipitation_probability?: number;
};

type OpenMeteoDailyResponse = {
  current: OpenMeteoCurrent;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    cloud_cover: number[];
    cloud_cover_low: number[];
    cloud_cover_mid: number[];
    cloud_cover_high: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    relative_humidity_2m: number[];
    visibility: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
};

export async function fetchCzestochowaWeather(): Promise<WeatherSnapshot> {
  const forecast = await fetchCzestochowaForecast();
  return forecast.current;
}

export async function fetchCzestochowaForecast(): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(CZESTOCHOWA.latitude),
    longitude: String(CZESTOCHOWA.longitude),
    current:
      "temperature_2m,weather_code,wind_speed_10m,precipitation_probability",
    hourly:
      "temperature_2m,precipitation_probability,precipitation,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m,relative_humidity_2m,visibility",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: "3",
    timezone: "Europe/Warsaw",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("weather fetch failed");

  const data = (await res.json()) as OpenMeteoDailyResponse;
  const current: WeatherSnapshot = {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
    windSpeed: Math.round(data.current.wind_speed_10m),
    precipitationProbability: data.current.precipitation_probability ?? 0,
    fetchedAt: data.current.time,
  };

  const days = data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i]!,
    tempMax: Math.round(data.daily.temperature_2m_max[i]!),
    tempMin: Math.round(data.daily.temperature_2m_min[i]!),
    precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]!),
  }));

  const hourly = data.hourly.time.map((time, i) => ({
    time,
    temperature: Math.round(data.hourly.temperature_2m[i]!),
    precipitationProbability: Math.round(
      data.hourly.precipitation_probability[i] ?? 0,
    ),
    precipitation: Math.round((data.hourly.precipitation[i] ?? 0) * 10) / 10,
    cloudCover: Math.round(data.hourly.cloud_cover[i] ?? 0),
    cloudCoverLow: Math.round(data.hourly.cloud_cover_low[i] ?? 0),
    cloudCoverMid: Math.round(data.hourly.cloud_cover_mid[i] ?? 0),
    cloudCoverHigh: Math.round(data.hourly.cloud_cover_high[i] ?? 0),
    windSpeed: Math.round(data.hourly.wind_speed_10m[i]!),
    windDirection: Math.round(data.hourly.wind_direction_10m[i] ?? 0),
    humidity: Math.round(data.hourly.relative_humidity_2m[i] ?? 0),
    visibility: Math.round((data.hourly.visibility[i] ?? 0) / 100) / 10,
  }));

  return { current, days, hourly };
}

export function formatHourlyChartLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHourlyTooltip(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function windDirectionLabel(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(degrees / 45) % 8;
  return dirs[idx]!;
}

export function formatForecastDay(dateIso: string, index: number): string {
  if (index === 0) return "Dziś";
  if (index === 1) return "Jutro";
  return new Date(dateIso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** WMO weather interpretation codes (Open-Meteo). */
export function weatherLabel(code: number): string {
  if (code === 0) return "Bezchmurnie";
  if (code <= 3) return "Częściowe zachmurzenie";
  if (code <= 48) return "Mgła";
  if (code <= 57) return "Mżawka";
  if (code <= 67) return "Deszcz";
  if (code <= 77) return "Śnieg";
  if (code <= 82) return "Przelotne opady";
  if (code <= 86) return "Opady śniegu";
  if (code <= 99) return "Burza";
  return "Pochmurno";
}

export type WeatherIconKind = "sun" | "cloud" | "rain";

export function weatherIconKind(code: number): WeatherIconKind {
  if (code === 0) return "sun";
  if (code <= 3) return "cloud";
  if (code <= 48) return "cloud";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95)
    return "rain";
  return "cloud";
}

/** Refresh interval — Open-Meteo updates frequently; 10 min keeps data current without spamming. */
export const WEATHER_REFRESH_MS = 10 * 60 * 1000;
