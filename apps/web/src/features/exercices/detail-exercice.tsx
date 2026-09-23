import type { ExerciceFactice } from "@/mocks/exercices";
import { BadgeRecord } from "./badge-record";

export function DetailExercice({
  exercice,
  onFermer,
}: {
  exercice: ExerciceFactice;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{exercice.nom}</h2>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {exercice.groupe} · {exercice.equipement}
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

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* L'aplat face au contour, visibles en même temps : c'est exactement le
            cas à éprouver pour D28. */}
        <button
          type="button"
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        >
          Démarrer la séance
        </button>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Record</p>
          {exercice.record ? (
            <BadgeRecord kg={exercice.record.kg} reps={exercice.record.reps} />
          ) : (
            <p className="text-sm text-(--ink-faint)">
              Aucun record pour l'instant — il apparaîtra après ta première séance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
