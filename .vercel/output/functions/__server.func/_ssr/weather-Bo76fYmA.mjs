import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { m as CloudRain, n as Wind } from "../_libs/lucide-react.mjs";
import { n as Shell } from "./Shell-DkFWZdh3.mjs";
import { a as formatForecastDay, l as weatherLabel, n as WEATHER_REFRESH_MS, o as formatHourlyChartLabel, r as fetchCzestochowaForecast, s as formatHourlyTooltip, t as WEATHER_CITY, u as windDirectionLabel } from "./weather-0dinpoNJ.mjs";
import { t as WeatherIcon } from "./WeatherIcon-DiFpk1fb.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, f as Legend, i as YAxis, l as Bar, n as BarChart, o as Area, r as LineChart, s as Line, t as ComposedChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/weather-Bo76fYmA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var tooltipStyle = {
	background: "var(--color-popover)",
	border: "1px solid var(--color-border)",
	borderRadius: 12
};
function toChartRows(hourly) {
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
		visibility: point.visibility
	}));
}
function ChartCard({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border border-border bg-surface p-5 shadow-elevated",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
			children: title
		}), children]
	});
}
function HourlyTooltip({ active, payload }) {
	if (!active || !payload?.[0]?.payload) return null;
	const row = payload[0].payload;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-medium",
			children: formatHourlyTooltip(row.time)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1 space-y-0.5 text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"Temp: ",
					row.temperature,
					"°C"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"Opady: ",
					row.precipitationProbability,
					"% · ",
					row.precipitation,
					" mm"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"Chmury: ",
					row.cloudCover,
					"% (n.",
					row.cloudCoverLow,
					" / ś.",
					row.cloudCoverMid,
					" / w.",
					row.cloudCoverHigh,
					")"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"Wiatr: ",
					row.windSpeed,
					" km/h · ",
					row.windLabel,
					" (",
					row.windDirection,
					"°)"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"Wilgotność: ",
					row.humidity,
					"% · Widoczność: ",
					row.visibility,
					" km"
				] })
			]
		})]
	});
}
var xAxisProps = {
	dataKey: "label",
	stroke: "var(--color-muted-foreground)",
	fontSize: 11,
	interval: 7,
	tickMargin: 8
};
function WeatherForecastCharts({ hourly, days }) {
	const hourlyData = toChartRows(hourly);
	const dailyData = days.map((day, index) => ({
		name: formatForecastDay(day.date, index),
		max: day.tempMax,
		min: day.tempMin
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 gap-4 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Temperatura co godzinę · 3 dni",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: hourlyData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-border)",
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { ...xAxisProps }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "var(--color-muted-foreground)",
									fontSize: 12,
									unit: "°",
									domain: ["dataMin - 2", "dataMax + 2"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HourlyTooltip, {}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "temperature",
									name: "Temperatura",
									stroke: "var(--color-primary)",
									strokeWidth: 2,
									dot: false
								})
							]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Opady · szansa i mm/h",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
							data: hourlyData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-border)",
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { ...xAxisProps }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									yAxisId: "pct",
									stroke: "var(--color-chart-2)",
									fontSize: 12,
									unit: "%",
									domain: [0, 100]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									yAxisId: "mm",
									orientation: "right",
									stroke: "var(--color-chart-1)",
									fontSize: 12,
									unit: "mm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HourlyTooltip, {}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									yAxisId: "mm",
									dataKey: "precipitation",
									name: "Opad mm/h",
									fill: "var(--color-chart-1)",
									opacity: .55,
									radius: [
										3,
										3,
										0,
										0
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									yAxisId: "pct",
									type: "monotone",
									dataKey: "precipitationProbability",
									name: "Szansa %",
									stroke: "var(--color-chart-2)",
									strokeWidth: 2,
									dot: false
								})
							]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ChartCard, {
				title: "Zachmurzenie · warstwy chmur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: hourlyData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-border)",
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { ...xAxisProps }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "var(--color-muted-foreground)",
									fontSize: 12,
									unit: "%",
									domain: [0, 100]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HourlyTooltip, {}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "cloudCover",
									name: "Całość",
									stroke: "var(--color-foreground)",
									strokeWidth: 2,
									dot: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "cloudCoverLow",
									name: "Nisko",
									stroke: "var(--color-chart-3)",
									strokeWidth: 1.5,
									dot: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "cloudCoverMid",
									name: "Średnio",
									stroke: "var(--color-chart-4)",
									strokeWidth: 1.5,
									dot: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "cloudCoverHigh",
									name: "Wysoko",
									stroke: "var(--color-chart-5)",
									strokeWidth: 1.5,
									dot: false
								})
							]
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[11px] text-muted-foreground",
					children: "Nisko / średnio / wysoko = pokrycie chmur na różnych wysokościach (%)."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ChartCard, {
				title: "Wiatr · prędkość i kierunek",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
							data: hourlyData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-border)",
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { ...xAxisProps }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "var(--color-muted-foreground)",
									fontSize: 12,
									unit: " km/h"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HourlyTooltip, {}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "windSpeed",
									name: "Prędkość",
									fill: "var(--color-primary)",
									fillOpacity: .15,
									stroke: "var(--color-primary)",
									strokeWidth: 2
								})
							]
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[11px] text-muted-foreground",
					children: "Kierunek w tooltipie (N, NE, E…) — skąd wieje wiatr."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Wilgotność i widoczność",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
							data: hourlyData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-border)",
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { ...xAxisProps }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									yAxisId: "hum",
									stroke: "var(--color-chart-2)",
									fontSize: 12,
									unit: "%",
									domain: [0, 100]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									yAxisId: "vis",
									orientation: "right",
									stroke: "var(--color-chart-3)",
									fontSize: 12,
									unit: "km"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HourlyTooltip, {}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									yAxisId: "hum",
									type: "monotone",
									dataKey: "humidity",
									name: "Wilgotność",
									stroke: "var(--color-chart-2)",
									strokeWidth: 2,
									dot: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									yAxisId: "vis",
									type: "monotone",
									dataKey: "visibility",
									name: "Widoczność",
									stroke: "var(--color-chart-3)",
									strokeWidth: 2,
									dot: false
								})
							]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
				title: "Min / max dzienne",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: dailyData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-border)",
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "name",
									stroke: "var(--color-muted-foreground)",
									fontSize: 12
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "var(--color-muted-foreground)",
									fontSize: 12,
									unit: "°"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									contentStyle: tooltipStyle,
									formatter: (value) => [`${value}°C`]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "max",
									name: "Maks.",
									fill: "var(--color-primary)",
									radius: [
										6,
										6,
										0,
										0
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "min",
									name: "Min.",
									fill: "var(--color-muted-foreground)",
									radius: [
										6,
										6,
										0,
										0
									]
								})
							]
						})
					})
				})
			})
		]
	});
}
function WeatherPage() {
	const [forecast, setForecast] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const data = await fetchCzestochowaForecast();
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
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-lg font-semibold",
			children: "Pogoda niedostępna"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted-foreground",
			children: "Spróbuj odświeżyć stronę."
		})]
	});
	if (!forecast) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "py-16 text-center text-sm text-muted-foreground",
		children: "Ładowanie prognozy…"
	});
	const { current, days, hourly } = forecast;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold tracking-tight md:text-4xl",
				children: "Pogoda"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [WEATHER_CITY, " · prognoza 3-dniowa"]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex items-center gap-6 rounded-3xl border border-border bg-surface px-8 py-6 shadow-elevated",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherIcon, {
					code: current.weatherCode,
					className: "size-16 text-primary"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-5xl font-extralight tabular-clock md:text-6xl",
						children: [current.temperature, "°"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-muted-foreground",
						children: weatherLabel(current.weatherCode)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-4 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wind, { className: "size-4" }),
								" ",
								current.windSpeed,
								" km/h"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudRain, { className: "size-4" }),
								" ",
								current.precipitationProbability,
								"%"
							]
						})]
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherForecastCharts, {
				hourly,
				days
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-1 gap-4 md:grid-cols-3",
				children: days.map((day, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-elevated",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-semibold uppercase tracking-wider text-muted-foreground",
							children: formatForecastDay(day.date, index)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherIcon, {
								code: day.weatherCode,
								className: "size-10 text-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-2xl font-light tabular-clock",
								children: [
									day.tempMax,
									"° ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground",
										children: [
											"/ ",
											day.tempMin,
											"°"
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground",
								children: weatherLabel(day.weatherCode)
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-4 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wind, { className: "size-3" }),
									" do ",
									day.windSpeedMax,
									" km/h"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudRain, { className: "size-3" }),
									" ",
									day.precipitationProbability,
									"%"
								]
							})]
						})
					]
				}, day.date))
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeatherPage, {}) });
//#endregion
export { SplitComponent as component };
