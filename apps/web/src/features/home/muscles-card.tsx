import { LIBELLE_ZONE, type Zone } from "@better-lift/shared";
import { BodyMap } from "@/components/body-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { plural } from "@/lib/format";

/**
 * Les muscles de la période (D330), comme les statistiques de Hevy : séries par zone, triées,
 * et la carte du corps à côté (principaux à l'encre, secondaires en gris).
 */
export function MusclesCard({
  zones,
  principaux,
  secondaires,
}: {
  zones: { zone: Zone; series: number }[];
  principaux: string[];
  secondaires: string[];
}) {
  const max = zones[0]?.series ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscles</CardTitle>
        <CardDescription>Séries par muscle principal, hors échauffement</CardDescription>
      </CardHeader>
      <CardContent>
        {zones.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            Aucune séance sur la période.
          </p>
        ) : (
          <div className="grid @3xl:grid-cols-[1fr_auto] items-center gap-8">
            <ul className="flex flex-col gap-2.5">
              {zones.map(({ zone, series }) => (
                <li key={zone} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate">{LIBELLE_ZONE[zone]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(series / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-muted-foreground tabular-nums">
                    {plural(series, "série")}
                  </span>
                </li>
              ))}
            </ul>
            <BodyMap primary={principaux} secondary={secondaires} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
