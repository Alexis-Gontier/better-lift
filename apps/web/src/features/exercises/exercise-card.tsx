import Link from "next/link";

import { type ExerciseSummary } from "@better-lift/validators";

import { ExerciseMedia } from "./exercise-media";
import { BODY_PART_LABELS, equipmentLabel } from "./labels";

export function ExerciseCard({ exercise }: { exercise: ExerciseSummary }) {
  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="flex items-center gap-3 rounded-xl bg-surface-raised p-3 ring-1 ring-transparent transition hover:ring-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <ExerciseMedia
        url={exercise.thumbnailUrl}
        name={exercise.name}
        className="size-14 shrink-0 rounded-lg"
      />

      <div className="min-w-0">
        <p className="truncate font-medium">{exercise.name}</p>
        <p className="truncate text-sm text-ink-muted">
          {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
        </p>
      </div>
    </Link>
  );
}

/** Squelette de carte, aux dimensions exactes de la vraie : la grille ne saute pas au chargement. */
export function ExerciseCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-raised p-3" aria-hidden>
      <div className="size-14 shrink-0 animate-pulse rounded-lg bg-white/5" />
      <div className="w-full space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}
