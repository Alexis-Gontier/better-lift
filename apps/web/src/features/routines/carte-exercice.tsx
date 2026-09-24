import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const idRepos = useId();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // Pendant le glisser, la carte FLOTTE : elle gagne l'ombre que la doctrine
      // réserve au passager, et la perd en se posant.
      className={`rounded-xl border border-(--line) bg-(--surface-2) ${
        isDragging ? "relative z-10 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2 border-b border-(--line) px-2 py-1.5">
        {/* La poignée seule déclenche le glisser : les champs de la carte restent
            cliquables. Au clavier : Espace pour saisir, flèches, Espace pour poser. */}
        <Button
          variant="ghost"
          size="icon"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Déplacer ${exercice.nom}`}
          className="size-7 cursor-grab text-(--ink-faint) hover:text-(--ink) active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" />
        </Button>
        {/* Le nom a toute la ligne, et passe à la ligne plutôt que d'être tronqué :
            dans un panneau étroit, c'est lui qu'on lit en premier. */}
        <span className="min-w-0 flex-1 text-sm leading-snug text-(--ink)">{exercice.nom}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetirer}
          aria-label={`Retirer ${exercice.nom} de la routine`}
          className="text-xs text-(--ink-faint)"
        >
          Retirer
        </Button>
      </div>
      <TableauSeries
        nomExercice={exercice.nom}
        series={exercice.series}
        onChange={(series) => onChange({ ...exercice, series })}
        repos={
          <label
            htmlFor={idRepos}
            className="flex items-center gap-1.5 text-[11px] text-(--ink-faint)"
          >
            Repos (s)
            <Input
              id={idRepos}
              inputMode="numeric"
              placeholder="—"
              value={exercice.repos}
              onChange={(e) => onChange({ ...exercice, repos: e.target.value })}
              aria-invalid={reposInvalide(exercice.repos) || undefined}
              className="h-8 w-16 font-mono text-xs text-(--ink)"
            />
          </label>
        }
      />
    </li>
  );
}
