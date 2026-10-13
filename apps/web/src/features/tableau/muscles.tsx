import { LIBELLE_ZONE, type StatsPeriode, zonesTravaillees } from "@better-lift/shared";
import { Carte } from "./carte";
import { CarteCorps } from "./carte-corps";

/** La carte du corps, puis les séries par zone en barres : comparer se lit mieux en longueur. */
export function Muscles({ stats }: { stats: StatsPeriode }) {
  const zones = stats.zones.slice(0, 6);
  const max = Math.max(1, ...zones.map((z) => z.series));

  return (
    <Carte titre="Muscles travaillés · séries" className="lg:col-span-7">
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
                className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-[13px]"
              >
                <span>{LIBELLE_ZONE[z.zone]}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-muted-foreground"
                    style={{ width: `${(z.series / max) * 100}%` }}
                  />
                </span>
                <span className="text-right text-muted-foreground">{z.series}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Carte>
  );
}
