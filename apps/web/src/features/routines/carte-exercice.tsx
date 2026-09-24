import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ExerciceBrouillon, reposInvalide } from "./brouillon";
import { TableauSeries } from "./tableau-series";

export function CarteExercice({
  exercice,
  onChange,
  onRetirer,
}: {
  exercice: ExerciceBrouillon;
  onChange: (e: ExerciceBrouillon) => void;
  onRetirer: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercice.cle });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // Pendant le glisser, la carte FLOTTE : elle gagne l'ombre que la doctrine
      // réserve au passager, et la perd en se posant.
      className={`rounded-md border border-(--line) bg-(--surface-1) ${
        isDragging ? "relative z-10 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2 border-b border-(--line) px-2 py-1.5">
        {/* La poignée seule déclenche le glisser : les champs de la carte restent
            cliquables. Au clavier : Espace pour saisir, flèches, Espace pour poser. */}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Déplacer ${exercice.nom}`}
          className="grid size-7 cursor-grab place-items-center rounded text-(--ink-faint) hover:bg-(--surface-2) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--focus-ring) active:cursor-grabbing"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
          </svg>
        </button>
        {/* Le nom a toute la ligne, et passe à la ligne plutôt que d'être tronqué :
            dans un panneau étroit, c'est lui qu'on lit en premier. */}
        <span className="min-w-0 flex-1 text-sm leading-snug text-(--ink)">{exercice.nom}</span>
        <button
          type="button"
          onClick={onRetirer}
          aria-label={`Retirer ${exercice.nom} de la routine`}
          className="rounded px-2 py-1 text-xs text-(--ink-faint) hover:bg-(--surface-2) hover:text-(--ink) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
        >
          Retirer
        </button>
      </div>
      <TableauSeries
        nomExercice={exercice.nom}
        series={exercice.series}
        onChange={(series) => onChange({ ...exercice, series })}
        repos={
          <label className="flex items-center gap-1.5 text-[11px] text-(--ink-faint)">
            Repos (s)
            <input
              inputMode="numeric"
              placeholder="—"
              value={exercice.repos}
              onChange={(e) => onChange({ ...exercice, repos: e.target.value })}
              aria-invalid={reposInvalide(exercice.repos) || undefined}
              className={`w-14 rounded border bg-(--surface-1) px-2 py-1 font-mono text-xs text-(--ink) outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) ${
                reposInvalide(exercice.repos) ? "border-destructive" : "border-(--line)"
              }`}
            />
          </label>
        }
      />
    </li>
  );
}
