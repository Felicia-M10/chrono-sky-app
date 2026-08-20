import type { TimeOfDay } from "@/hooks/useTimeOfDay";

const PHASES: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

/**
 * Fixed, cross-fading sky. All four layers are mounted; only the opacity of
 * the active phase changes, so the switch is a smooth transition.
 */
export function SkyBackground({ phase }: { phase: TimeOfDay }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {PHASES.map((p) => (
        <div
          key={p}
          data-phase={p}
          className="sky-layer"
          style={{ opacity: p === phase ? 1 : 0 }}
        />
      ))}

      <div className="sun-orb" style={{ opacity: phase === "night" ? 0 : 1 }} />
      <div className="moon-orb" style={{ opacity: phase === "night" ? 1 : 0 }} />
      <div className="star-field" style={{ opacity: phase === "night" ? 1 : 0 }} />
      <div className="sky-veil" />
    </div>
  );
}
