import { type ChargeZone, LIBELLE_ZONE, zonesTravaillees } from "@better-lift/shared";
import { cn } from "@/lib/utils";
import { DOS, FACE, type Partie } from "./body-map-traces";

type Props =
  | { primary: string[]; secondary?: string[]; charge?: never }
  | { charge: readonly ChargeZone[]; primary?: never; secondary?: never };

/**
 * Les quatre teintes de la carte de chaleur (D332), du ton du corps vers l'encre : mêlées par
 * `color-mix`, elles suivent le thème sans autre token.
 */
export const TEINTE_CHARGE = [
  "fill-[color-mix(in_oklch,var(--body-map),var(--foreground)_30%)]",
  "fill-[color-mix(in_oklch,var(--body-map),var(--foreground)_55%)]",
  "fill-[color-mix(in_oklch,var(--body-map),var(--foreground)_78%)]",
  "fill-foreground",
] as const;

const series = (n: number) =>
  `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} série${n >= 2 ? "s" : ""}`;

type Teinte = { classe: string; titre?: string };

/**
 * Silhouette face et dos (D331), le dessin du mobile, le reste du corps — tête, mains, pieds
 * compris — au ton de la carte. Deux lectures : principaux à l'encre et secondaires en gris
 * (`primary`, `secondary` : des muscles du catalogue, par `zonesTravaillees` comme sur le
 * téléphone), ou une carte de chaleur des séries par zone (`charge`, D332). Les couleurs sont
 * des classes de tokens : la silhouette suit le thème sans relire le DOM.
 */
export function BodyMap(props: Props) {
  const teintes = new Map<string, Teinte>();
  let libelle: string;
  if (props.charge) {
    for (const c of props.charge) {
      teintes.set(c.zone, {
        classe: TEINTE_CHARGE[c.niveau - 1] ?? "fill-foreground",
        titre: `${LIBELLE_ZONE[c.zone]} · ${series(c.series)}`,
      });
    }
    libelle = `Séries par muscle : ${props.charge
      .map((c) => `${LIBELLE_ZONE[c.zone]} ${series(c.series)}`)
      .join(", ")}`;
  } else {
    const zones = zonesTravaillees([
      ...props.primary.map((m) => ({ musclePrincipal: m, musclesSecondaires: [] })),
      { musclePrincipal: "", musclesSecondaires: props.secondary ?? [] },
    ]);
    for (const z of zones) {
      teintes.set(z.zone, {
        classe: z.niveau === "principal" ? "fill-foreground" : "fill-muted-foreground",
      });
    }
    libelle = zones.length
      ? `Muscles travaillés : ${zones.map((z) => LIBELLE_ZONE[z.zone]).join(", ")}`
      : "Silhouette";
  }

  return (
    <div className="flex justify-center gap-4" role="img" aria-label={libelle}>
      <Silhouette parties={FACE} viewBox="0 0 724 1448" teintes={teintes} />
      <Silhouette parties={DOS} viewBox="724 0 724 1448" teintes={teintes} />
    </div>
  );
}

function Silhouette({
  parties,
  viewBox,
  teintes,
}: {
  parties: readonly Partie[];
  viewBox: string;
  teintes: Map<string, Teinte>;
}) {
  return (
    <svg viewBox={viewBox} className="h-auto w-full max-w-36" aria-hidden>
      {parties.map((p) => {
        const t = teintes.get(p.slug);
        return (
          <g key={p.slug} className={cn(t?.classe ?? "fill-(--body-map)")}>
            {/* L'infobulle du navigateur au survol : la zone et ses séries. */}
            {t?.titre && <title>{t.titre}</title>}
            {p.d.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
