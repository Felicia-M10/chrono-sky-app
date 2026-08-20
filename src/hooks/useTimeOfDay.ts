import { useEffect, useState } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export function timeOfDayFor(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

export function greetingFor(phase: TimeOfDay): string {
  switch (phase) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    default:
      return "Good night";
  }
}

/**
 * Tracks the viewer's local time of day and keeps updating while the page
 * stays open, so the background follows morning -> afternoon -> evening -> night.
 */
export function useTimeOfDay() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const phase: TimeOfDay = now ? timeOfDayFor(now) : "afternoon";
  return { now, phase, greeting: greetingFor(phase) };
}
