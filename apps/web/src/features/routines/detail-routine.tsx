import {
  ABREGE_TYPE_SERIE,
  formaterCharge,
  LIBELLE_TYPE_SERIE,
  type RoutineDetail,
} from "@better-lift/shared";
import { SYSTEME_UNITES } from "@/lib/unites";
import { BoutonFermer } from "./bouton-fermer";

/** « 90 s », « 2 min », « 2 min 30 » : ce qu'on lit d'un coup d'œil. */
function formaterRepos(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  const reste = sec % 60;
  return reste ? `${min} min ${String(reste).padStart(2, "0")}` : `${min} min`;
}

export function DetailRoutine({
  routine,
  onModifier,
  onFermer,
}: {
  routine: RoutineDetail;
  onModifier: () => void;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight">{routine.nom}</h2>
        <BoutonFermer onFermer={onFermer} />
      </div>

      <div className="flex flex-col gap-4 overflow-auto px-5 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
          >
            Démarrer cette routine
          </button>
          <button
            type="button"
            onClick={onModifier}
            className="rounded-md border border-(--line) px-4 py-3 text-sm text-(--ink) hover:bg-(--surface-2) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
          >
            Modifier
          </button>
        </div>

        <ol className="flex flex-col gap-3">
          {routine.exercices.map((ex, i) => (
            // L'index entre dans la clé : le même exercice peut figurer deux fois.
            <li key={`${ex.slug}-${i}`} className="rounded-md border border-(--line)">
              <div className="flex items-baseline gap-2 border-b border-(--line) px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-(--ink)">{ex.nom}</span>
                {ex.reposSec ? (
                  <span className="shrink-0 text-[11px] text-(--ink-faint)">
                    Repos {formaterRepos(ex.reposSec)}
                  </span>
                ) : null}
              </div>
              <ol className="px-3 py-1.5">
                {ex.series.map((serie, j) => (
                  <li
                    key={j}
                    className="flex items-center gap-3 py-1 font-mono text-xs text-(--ink-subtle)"
                  >
                    <span className="w-4 text-(--ink-faint)">{j + 1}</span>
                    <span className="w-6" title={LIBELLE_TYPE_SERIE[serie.type]}>
                      {ABREGE_TYPE_SERIE[serie.type]}
                    </span>
                    <span className="w-14 text-(--ink)">
                      {serie.repsCible === null ? "—" : `${serie.repsCible} reps`}
                    </span>
                    <span className="text-(--ink)">
                      {serie.chargeCibleKg === null
                        ? "—"
                        : formaterCharge(serie.chargeCibleKg, SYSTEME_UNITES)}
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
