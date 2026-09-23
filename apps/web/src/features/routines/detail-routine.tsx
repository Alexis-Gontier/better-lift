import type { RoutineFactice } from "@/mocks/routines";

export function DetailRoutine({
  routine,
  onFermer,
}: {
  routine: RoutineFactice;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight">{routine.nom}</h2>
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

      <div className="flex flex-col gap-4 px-5 py-4">
        <button
          type="button"
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          Démarrer cette routine
        </button>

        <ul className="flex flex-col">
          {routine.exercices.map((ex) => (
            <li
              key={ex.nom}
              className="flex items-center gap-3 border-b border-(--line) py-2.5 last:border-0"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-(--ink)">{ex.nom}</span>
              <span className="shrink-0 font-mono text-xs text-(--ink-subtle)">
                {ex.series} × {ex.repsCible}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
