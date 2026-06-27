//#region node_modules/.nitro/vite/services/ssr/assets/weather-0dinpoNJ.js
var CZESTOCHOWA = {
	latitude: 50.8118,
	longitude: 19.1203
};
var WEATHER_CITY = "Częstochowa";
async function fetchCzestochowaWeather() {
	return (await fetchCzestochowaForecast()).current;
}
async function fetchCzestochowaForecast() {
	const params = new URLSearchParams({
		latitude: String(CZESTOCHOWA.latitude),
		longitude: String(CZESTOCHOWA.longitude),
		current: "temperature_2m,weather_code,wind_speed_10m,precipitation_probability",
		hourly: "temperature_2m,precipitation_probability,precipitation,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m,relative_humidity_2m,visibility",
		daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
		forecast_days: "3",
		timezone: "Europe/Warsaw"
	});
	const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
	if (!res.ok) throw new Error("weather fetch failed");
	const data = await res.json();
	return {
		current: {
			temperature: Math.round(data.current.temperature_2m),
			weatherCode: data.current.weather_code,
			windSpeed: Math.round(data.current.wind_speed_10m),
			precipitationProbability: data.current.precipitation_probability ?? 0,
			fetchedAt: data.current.time
		},
		days: data.daily.time.map((date, i) => ({
			date,
			weatherCode: data.daily.weather_code[i],
			tempMax: Math.round(data.daily.temperature_2m_max[i]),
			tempMin: Math.round(data.daily.temperature_2m_min[i]),
			precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
			windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i])
		})),
		hourly: data.hourly.time.map((time, i) => ({
			time,
			temperature: Math.round(data.hourly.temperature_2m[i]),
			precipitationProbability: Math.round(data.hourly.precipitation_probability[i] ?? 0),
			precipitation: Math.round((data.hourly.precipitation[i] ?? 0) * 10) / 10,
			cloudCover: Math.round(data.hourly.cloud_cover[i] ?? 0),
			cloudCoverLow: Math.round(data.hourly.cloud_cover_low[i] ?? 0),
			cloudCoverMid: Math.round(data.hourly.cloud_cover_mid[i] ?? 0),
			cloudCoverHigh: Math.round(data.hourly.cloud_cover_high[i] ?? 0),
			windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
			windDirection: Math.round(data.hourly.wind_direction_10m[i] ?? 0),
			humidity: Math.round(data.hourly.relative_humidity_2m[i] ?? 0),
			visibility: Math.round((data.hourly.visibility[i] ?? 0) / 100) / 10
		}))
	};
}
function formatHourlyChartLabel(iso) {
	return new Date(iso).toLocaleString("pl-PL", {
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function formatHourlyTooltip(iso) {
	return new Date(iso).toLocaleString("pl-PL", {
		weekday: "long",
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function windDirectionLabel(degrees) {
	return [
		"N",
		"NE",
		"E",
		"SE",
		"S",
		"SW",
		"W",
		"NW"
	][Math.round(degrees / 45) % 8];
}
function formatForecastDay(dateIso, index) {
	if (index === 0) return "Dziś";
	if (index === 1) return "Jutro";
	return new Date(dateIso).toLocaleDateString("pl-PL", {
		weekday: "long",
		day: "numeric",
		month: "long"
	});
}
/** WMO weather interpretation codes (Open-Meteo). */
function weatherLabel(code) {
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
function weatherIconKind(code) {
	if (code === 0) return "sun";
	if (code <= 3) return "cloud";
	if (code <= 48) return "cloud";
	if (code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95) return "rain";
	return "cloud";
}
/** Refresh interval — Open-Meteo updates frequently; 10 min keeps data current without spamming. */
var WEATHER_REFRESH_MS = 600 * 1e3;
//#endregion
export { formatForecastDay as a, weatherIconKind as c, fetchCzestochowaWeather as i, weatherLabel as l, WEATHER_REFRESH_MS as n, formatHourlyChartLabel as o, fetchCzestochowaForecast as r, formatHourlyTooltip as s, WEATHER_CITY as t, windDirectionLabel as u };
