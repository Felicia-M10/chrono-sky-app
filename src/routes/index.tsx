import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Moon, Search, Sun, MapPin, Droplets, Wind, Thermometer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkyBackground } from "@/components/SkyBackground";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import {
  DEFAULT_PLACES,
  fetchForecast,
  searchPlaces,
  weatherEmoji,
  weatherLabel,
  type Place,
} from "@/lib/weather";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Watch — Live South African Weather & 7-Day Forecast" },
      {
        name: "description",
        content:
          "Weather Watch shows current conditions and a 7-day forecast in °C for Polokwane, Braamfontein, Pretoria and Cape Town, with a sky that follows your local time.",
      },
      { property: "og:title", content: "Weather Watch — Live Weather & 7-Day Forecast" },
      {
        property: "og:description",
        content:
          "Current weather and 7-day forecasts for Polokwane, Braamfontein, Pretoria and Cape Town, with a background that changes with your local time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ww-theme");
    const initial = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("ww-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

function Index() {
  const { now, phase, greeting } = useTimeOfDay();
  const { dark, toggle } = useDarkMode();

  const [places, setPlaces] = useState<Place[]>(DEFAULT_PLACES);
  const [activeId, setActiveId] = useState(DEFAULT_PLACES[0]!.id);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const active = useMemo(
    () => places.find((p) => p.id === activeId) ?? places[0]!,
    [places, activeId],
  );

  const { data, isPending, isError } = useQuery({
    queryKey: ["forecast", active.id, active.latitude, active.longitude],
    queryFn: () => fetchForecast(active),
    staleTime: 10 * 60 * 1000,
  });

  const localTime = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchPlaces(query);
      if (!results.length) {
        setSearchError(`No place found for “${query}”.`);
        return;
      }
      const found = results[0]!;
      setPlaces((prev) =>
        prev.some((p) => p.id === found.id) ? prev : [...prev, found],
      );
      setActiveId(found.id);
      setQuery("");
    } catch {
      setSearchError("Search is unavailable right now.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <SkyBackground phase={phase} />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Weather Watch
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Local time {localTime} · {phase} sky
            </p>
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full"
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </header>

        <form onSubmit={onSearch} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any city…"
              aria-label="Search for a city"
              className="glass-panel h-12 rounded-2xl pl-9"
            />
          </div>
          <Button type="submit" className="h-12 rounded-2xl px-6" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </form>
        {searchError && (
          <p className="mt-2 text-sm text-destructive">{searchError}</p>
        )}

        <nav className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {places.map((place) => (
            <button
              key={place.id}
              onClick={() => setActiveId(place.id)}
              aria-current={place.id === active.id}
              className={`glass-panel group relative w-40 shrink-0 overflow-hidden rounded-2xl text-left transition-transform hover:-translate-y-0.5 ${
                place.id === active.id ? "ring-2 ring-ring" : ""
              }`}
            >
              {place.image ? (
                <img
                  src={place.image}
                  alt={`${place.name} scenery`}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-20 w-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-full items-center justify-center bg-muted">
                  <MapPin className="size-5 text-muted-foreground" />
                </div>
              )}
              <span className="block px-3 py-2">
                <span className="block text-sm font-medium">{place.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {place.region}
                </span>
              </span>
            </button>
          ))}
        </nav>

        <main className="mt-5 space-y-5">
          <Card className="glass-panel overflow-hidden rounded-3xl border-0 p-0">
            <div className="grid gap-0 sm:grid-cols-[1.1fr_1fr]">
              <div className="p-6">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> {active.name}, {active.region}
                </p>
                {isPending ? (
                  <Skeleton className="mt-4 h-20 w-40" />
                ) : isError || !data ? (
                  <p className="mt-4 text-sm text-destructive">
                    Weather data is unavailable right now.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 flex items-end gap-3">
                      <span className="text-6xl font-semibold leading-none tracking-tight">
                        {data.current.temperature}°
                      </span>
                      <span className="pb-1 text-3xl" aria-hidden>
                        {weatherEmoji(data.current.code, data.current.isDay)}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-medium">
                      {weatherLabel(data.current.code)}
                    </p>
                    <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Thermometer className="size-3.5" /> Feels
                        </dt>
                        <dd className="mt-0.5 font-medium">{data.current.apparent}°C</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Droplets className="size-3.5" /> Humidity
                        </dt>
                        <dd className="mt-0.5 font-medium">{data.current.humidity}%</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Wind className="size-3.5" /> Wind
                        </dt>
                        <dd className="mt-0.5 font-medium">{data.current.wind} km/h</dd>
                      </div>
                    </dl>
                  </>
                )}
              </div>
              {active.image && (
                <img
                  src={active.image}
                  alt={`View of ${active.name}`}
                  width={800}
                  height={600}
                  className="h-48 w-full object-cover sm:h-full"
                />
              )}
            </div>
          </Card>

          <Card className="glass-panel rounded-3xl border-0 p-6">
            <h2 className="text-lg font-semibold tracking-tight">7-day forecast</h2>
            <ul className="mt-4 divide-y divide-border">
              {isPending
                ? Array.from({ length: 7 }).map((_, i) => (
                    <li key={i} className="py-3">
                      <Skeleton className="h-6 w-full" />
                    </li>
                  ))
                : (data?.daily ?? []).map((day, i) => (
                    <li
                      key={day.date}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="w-24 font-medium">
                        {i === 0
                          ? "Today"
                          : new Date(day.date).toLocaleDateString([], {
                              weekday: "short",
                              day: "numeric",
                            })}
                      </span>
                      <span className="flex flex-1 items-center gap-2 text-muted-foreground">
                        <span aria-hidden className="text-lg">
                          {weatherEmoji(day.code)}
                        </span>
                        <span className="truncate">{weatherLabel(day.code)}</span>
                      </span>
                      <span className="text-muted-foreground">{day.precipitation}%</span>
                      <span className="w-20 text-right tabular-nums">
                        <span className="font-semibold">{day.max}°</span>{" "}
                        <span className="text-muted-foreground">{day.min}°</span>
                      </span>
                    </li>
                  ))}
            </ul>
          </Card>
        </main>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Temperatures in °C · Sky updates automatically with your local time
        </footer>
      </div>
    </div>
  );
}
