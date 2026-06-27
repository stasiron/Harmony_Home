import type { ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatForecastDay,
  formatHourlyChartLabel,
  formatHourlyTooltip,
  windDirectionLabel,
  type WeatherDayForecast,
  type WeatherHourPoint,
} from "@/lib/weather";

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
};

type ChartRow = {
  label: string;
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
  windLabel: string;
  humidity: number;
  visibility: number;
};

function toChartRows(hourly: WeatherHourPoint[]): ChartRow[] {
  return hourly.map((point) => ({
    label: formatHourlyChartLabel(point.time),
    time: point.time,
    temperature: point.temperature,
    precipitationProbability: point.precipitationProbability,
    precipitation: point.precipitation,
    cloudCover: point.cloudCover,
    cloudCoverLow: point.cloudCoverLow,
    cloudCoverMid: point.cloudCoverMid,
    cloudCoverHigh: point.cloudCoverHigh,
    windSpeed: point.windSpeed,
    windDirection: point.windDirection,
    windLabel: windDirectionLabel(point.windDirection),
    humidity: point.humidity,
    visibility: point.visibility,
  }));
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function HourlyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <div className="font-medium">{formatHourlyTooltip(row.time)}</div>
      <div className="mt-1 space-y-0.5 text-muted-foreground">
        <div>Temp: {row.temperature}°C</div>
        <div>
          Opady: {row.precipitationProbability}% · {row.precipitation} mm
        </div>
        <div>
          Chmury: {row.cloudCover}% (n.{row.cloudCoverLow} / ś.
          {row.cloudCoverMid} / w.
          {row.cloudCoverHigh})
        </div>
        <div>
          Wiatr: {row.windSpeed} km/h · {row.windLabel} ({row.windDirection}°)
        </div>
        <div>
          Wilgotność: {row.humidity}% · Widoczność: {row.visibility} km
        </div>
      </div>
    </div>
  );
}

const xAxisProps = {
  dataKey: "label" as const,
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  interval: 7,
  tickMargin: 8,
};

export function WeatherForecastCharts({
  hourly,
  days,
}: {
  hourly: WeatherHourPoint[];
  days: WeatherDayForecast[];
}) {
  const hourlyData = toChartRows(hourly);

  const dailyData = days.map((day, index) => ({
    name: formatForecastDay(day.date, index),
    max: day.tempMax,
    min: day.tempMin,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Temperatura co godzinę · 3 dni">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis {...xAxisProps} />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                unit="°"
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <Tooltip content={<HourlyTooltip />} />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperatura"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Opady · szansa i mm/h">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyData}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis {...xAxisProps} />
              <YAxis
                yAxisId="pct"
                stroke="var(--color-chart-2)"
                fontSize={12}
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                yAxisId="mm"
                orientation="right"
                stroke="var(--color-chart-1)"
                fontSize={12}
                unit="mm"
              />
              <Tooltip content={<HourlyTooltip />} />
              <Legend />
              <Bar
                yAxisId="mm"
                dataKey="precipitation"
                name="Opad mm/h"
                fill="var(--color-chart-1)"
                opacity={0.55}
                radius={[3, 3, 0, 0]}
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="precipitationProbability"
                name="Szansa %"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Zachmurzenie · warstwy chmur">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis {...xAxisProps} />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip content={<HourlyTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cloudCover"
                name="Całość"
                stroke="var(--color-foreground)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cloudCoverLow"
                name="Nisko"
                stroke="var(--color-chart-3)"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cloudCoverMid"
                name="Średnio"
                stroke="var(--color-chart-4)"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cloudCoverHigh"
                name="Wysoko"
                stroke="var(--color-chart-5)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Nisko / średnio / wysoko = pokrycie chmur na różnych wysokościach (%).
        </p>
      </ChartCard>

      <ChartCard title="Wiatr · prędkość i kierunek">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyData}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis {...xAxisProps} />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                unit=" km/h"
              />
              <Tooltip content={<HourlyTooltip />} />
              <Area
                type="monotone"
                dataKey="windSpeed"
                name="Prędkość"
                fill="var(--color-primary)"
                fillOpacity={0.15}
                stroke="var(--color-primary)"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Kierunek w tooltipie (N, NE, E…) — skąd wieje wiatr.
        </p>
      </ChartCard>

      <ChartCard title="Wilgotność i widoczność">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyData}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis {...xAxisProps} />
              <YAxis
                yAxisId="hum"
                stroke="var(--color-chart-2)"
                fontSize={12}
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                yAxisId="vis"
                orientation="right"
                stroke="var(--color-chart-3)"
                fontSize={12}
                unit="km"
              />
              <Tooltip content={<HourlyTooltip />} />
              <Legend />
              <Line
                yAxisId="hum"
                type="monotone"
                dataKey="humidity"
                name="Wilgotność"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="vis"
                type="monotone"
                dataKey="visibility"
                name="Widoczność"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Min / max dzienne">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                unit="°"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}°C`]}
              />
              <Legend />
              <Bar
                dataKey="max"
                name="Maks."
                fill="var(--color-primary)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="min"
                name="Min."
                fill="var(--color-muted-foreground)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
