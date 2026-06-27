import { Cloud, CloudRain, Sun } from "lucide-react";
import { weatherIconKind } from "@/lib/weather";

export function WeatherIcon({
  code,
  className = "size-12 text-primary",
}: {
  code: number;
  className?: string;
}) {
  const kind = weatherIconKind(code);
  const props = { className, strokeWidth: 1.4 as const };
  if (kind === "sun") return <Sun {...props} />;
  if (kind === "rain") return <CloudRain {...props} />;
  return <Cloud {...props} />;
}
