import { LIBELLE_ZONE, type StatsPeriode, zonesTravaillees } from "@better-lift/shared";
import { Carte } from "./carte";
import { CarteCorps } from "./carte-corps";

export function Muscles({ stats }: { stats: StatsPeriode }) {
  const zones = stats.zones.slice(0, 8);
  const max = Math.max(1, ...zones.flatMap((z) => [z.series, z.reference]));

  return (
    <Carte
      titre="Séries par muscle"
      detail="trait : moyenne des 8 semaines d'avant"
      className="lg:col-span-7"
    >
      {zones.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune série comptée sur la période.
        </p>
      ) : (
        <div className="flex items-center gap-6">
          <CarteCorps zones={zonesTravaillees(stats.muscles)} />
          <ul className="flex flex-1 flex-col gap-2">
            {zones.map((z) => (
              <li
                key={z.zone}
                className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-[13px]"
              >
                <span>{LIBELLE_ZONE[z.zone]}</span>
                <span className="relative h-2 rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(z.series / max) * 100}%` }}
                  />
                  {z.reference > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 h-4 w-0.5 rounded bg-foreground"
                      style={{ left: `${(z.reference / max) * 100}%` }}
                    />
                  ) : null}
                </span>
                <span className="text-right text-muted-foreground">
                  {z.series}
                  <span className="text-muted-foreground/70"> / {z.reference}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Carte>
  );
}
