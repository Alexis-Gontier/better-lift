import { formatJour } from "@better-lift/shared";
import { BadgeRecord } from "@/features/exercices/badge-record";
import type { SeanceFactice } from "@/mocks/seances";

const FUSEAU = "Europe/Paris";

export function DetailSeance({
  seance,
  onFermer,
}: {
  seance: SeanceFactice;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{seance.titre}</h2>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {formatJour(seance.debutIso, FUSEAU)} · {seance.dureeMin} min
          </p>
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le panneau de détail"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-(--line) text-(--ink-subtle) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-auto px-5 py-4">
        {seance.exercices.map((ex) => (
          <div key={ex.nom}>
            <p className="mb-2 text-sm font-medium text-(--ink)">{ex.nom}</p>
            <ul className="flex flex-col gap-1">
              {ex.series.map((serie, i) => (
                <li
                  key={`${ex.nom}-${i}`}
                  className="flex items-center gap-3 rounded-md bg-(--surface-2) px-3 py-2"
                >
                  <span className="w-5 shrink-0 font-mono text-xs text-(--ink-faint)">{i + 1}</span>
                  <span className="flex-1 font-mono text-sm text-(--ink-muted)">
                    {String(serie.kg).replace(".", ",")} kg × {serie.reps}
                  </span>
                  {serie.record ? <BadgeRecord kg={serie.kg} reps={serie.reps} /> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
