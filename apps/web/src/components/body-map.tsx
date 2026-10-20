import { LIBELLE_ZONE, zonesTravaillees } from "@better-lift/shared";
import { cn } from "@/lib/utils";
import { DOS, FACE, type Partie } from "./body-map-traces";

type Props = { primary: string[]; secondary?: string[] };

/**
 * Silhouette face et dos (D331), le dessin du mobile : principaux à l'encre, secondaires en
 * gris, le reste du corps — tête, mains, pieds compris — au ton de la carte. Les muscles du
 * catalogue passent par `zonesTravaillees` de `shared`, comme sur le téléphone ; les couleurs
 * sont des classes de tokens, donc la silhouette suit le thème sans relire le DOM.
 */
export function BodyMap({ primary, secondary = [] }: Props) {
  const zones = zonesTravaillees([
    ...primary.map((m) => ({ musclePrincipal: m, musclesSecondaires: [] })),
    { musclePrincipal: "", musclesSecondaires: secondary },
  ]);
  const niveau = new Map(zones.map((z) => [z.zone as string, z.niveau]));
  const libelle = zones.length
    ? `Muscles travaillés : ${zones.map((z) => LIBELLE_ZONE[z.zone]).join(", ")}`
    : "Silhouette";

  return (
    <div className="flex justify-center gap-4" role="img" aria-label={libelle}>
      <Silhouette parties={FACE} viewBox="0 0 724 1448" niveau={niveau} />
      <Silhouette parties={DOS} viewBox="724 0 724 1448" niveau={niveau} />
    </div>
  );
}

function Silhouette({
  parties,
  viewBox,
  niveau,
}: {
  parties: readonly Partie[];
  viewBox: string;
  niveau: Map<string, "principal" | "secondaire">;
}) {
  return (
    <svg viewBox={viewBox} className="h-auto w-full max-w-36" aria-hidden>
      {parties.map((p) => (
        <g
          key={p.slug}
          className={cn(
            niveau.get(p.slug) === "principal"
              ? "fill-foreground"
              : niveau.get(p.slug) === "secondaire"
                ? "fill-muted-foreground"
                : "fill-(--body-map)",
          )}
        >
          {p.d.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}
