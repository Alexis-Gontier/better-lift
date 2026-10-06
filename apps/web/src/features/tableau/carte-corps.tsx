import { LIBELLE_ZONE, type ZoneTravaillee } from "@better-lift/shared";
import { CORPS_DOS, CORPS_FACE } from "./corps-svg";

// Les fenêtres du dessin d'origine : la face à gauche, le dos décalé de 724.
const VUES = [
  { cle: "face", traces: CORPS_FACE, viewBox: "0 0 724 1448" },
  { cle: "dos", traces: CORPS_DOS, viewBox: "724 0 724 1448" },
] as const;

/**
 * Silhouettes face et dos (D139) : principal en `--cal-4`, secondaire en `--cal-2` —
 * une intensité, comme le calendrier (D84, D127) —, le reste du corps en surface.
 */
export function CarteCorps({ zones }: { zones: readonly ZoneTravaillee[] }) {
  const teinte = (slug: string) => {
    if (slug === "head" || slug === "hair") return "var(--line-strong)";
    const z = zones.find((x) => x.zone === slug);
    if (!z) return "var(--surface-3)";
    return z.niveau === "principal" ? "var(--cal-4)" : "var(--cal-2)";
  };

  return (
    <div
      role="img"
      aria-label={`Muscles travaillés : ${zones.map((z) => LIBELLE_ZONE[z.zone]).join(", ") || "aucun"}`}
      className="flex shrink-0 gap-2"
    >
      {VUES.map(({ cle, traces, viewBox }) => (
        <svg key={cle} viewBox={viewBox} className="h-56 w-auto" aria-hidden="true">
          {Object.entries(traces).flatMap(([slug, chemins]) =>
            chemins.map((d) => <path key={d} d={d} fill={teinte(slug)} />),
          )}
        </svg>
      ))}
    </div>
  );
}
