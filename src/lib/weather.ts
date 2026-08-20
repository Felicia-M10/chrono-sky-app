import polokwaneImg from "@/assets/polokwane.jpg";
import braamfonteinImg from "@/assets/braamfontein.jpg";
import pretoriaImg from "@/assets/pretoria.jpg";
import capetownImg from "@/assets/capetown.jpg";

export type Place = {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  image?: string;
};

export const DEFAULT_PLACES: Place[] = [
  {
    id: "polokwane",
    name: "Polokwane",
    region: "Limpopo",
    latitude: -23.9045,
    longitude: 29.4689,
    image: polokwaneImg,
  },
  {
    id: "braamfontein",
    name: "Braamfontein",
    region: "Johannesburg",
    latitude: -26.1929,
    longitude: 28.0305,
    image: braamfonteinImg,
  },
  {
    id: "pretoria",
    name: "Pretoria",
    region: "Gauteng",
    latitude: -25.7479,
    longitude: 28.2293,
    image: pretoriaImg,
  },
  {
    id: "capetown",
    name: "Cape Town",
    region: "Western Cape",
    latitude: -33.9249,
    longitude: 18.4241,
    image: capetownImg,
  },
];

export type Forecast = {
  current: {
    temperature: number;
    apparent: number;
    humidity: number;
    wind: number;
    code: number;
    isDay: boolean;
  };
  daily: {
    date: string;
    min: number;
    max: number;
    code: number;
    precipitation: number;
  }[];
};

export async function fetchForecast(place: Place): Promise<Forecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=7&temperature_unit=celsius&wind_speed_unit=kmh`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load weather data");
  const json = await res.json();

  return {
    current: {
      temperature: Math.round(json.current.temperature_2m),
      apparent: Math.round(json.current.apparent_temperature),
      humidity: Math.round(json.current.relative_humidity_2m),
      wind: Math.round(json.current.wind_speed_10m),
      code: json.current.weather_code,
      isDay: json.current.is_day === 1,
    },
    daily: json.daily.time.map((date: string, i: number) => ({
      date,
      min: Math.round(json.daily.temperature_2m_min[i]),
      max: Math.round(json.daily.temperature_2m_max[i]),
      code: json.daily.weather_code[i],
      precipitation: json.daily.precipitation_probability_max?.[i] ?? 0,
    })),
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    name: String(r.name),
    region: [r.admin1, r.country].filter(Boolean).join(", "),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  }));
}

export function weatherLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Unsettled";
}

export function weatherEmoji(code: number, isDay = true): string {
  if (code === 0 || code === 1) return isDay ? "☀️" : "🌙";
  if (code === 2) return isDay ? "⛅" : "☁️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}
