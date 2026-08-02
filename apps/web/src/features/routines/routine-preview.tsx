"use client";

import Link from "next/link";

import { ApiClientError, useRoutine } from "@better-lift/api-client";

import { formatRest, SET_TYPE_SHORT, SET_TYPE_TONE } from "./labels";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";
import { apiClient } from "@/lib/api";

/**
 * Aperçu d'une routine : ce qu'elle prescrit, en lecture seule.
 *
 * Les cibles non renseignées s'affichent « — » plutôt que `0` : une routine
 * qui ne demande qu'un nombre de séries est valide, et afficher un zéro
 * laisserait croire à une charge nulle prescrite.
 */
export function RoutinePreview({ id }: { id: string }) {
  const locale = useProfileLocale();
  const routine = useRoutine(apiClient, id, locale);

  if (routine.isPending) {
    return (
      <div className="space-y-3" aria-busy>
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-32 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (routine.isError) {
    const missing = routine.error instanceof ApiClientError && routine.error.status === 404;

    return (
      <div className="space-y-3 rounded-xl bg-surface-raised p-5">
        <p className="font-medium">
          {missing ? "Cette routine n’existe plus." : "Routine indisponible."}
        </p>
        <p className="text-sm text-ink-muted">
          {missing ? "Elle a pu être supprimée depuis." : routine.error.message}
        </p>
        <Link
          href="/routines"
          className="inline-block rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
        >
          Retour aux routines
        </Link>
      </div>
    );
  }

  const data = routine.data;

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="text-ink-muted">
            {data.exercises.length} exercice{data.exercises.length > 1 ? "s" : ""}
            {data.notes ? ` · ${data.notes}` : ""}
          </p>
        </div>

        <Link
          href={`/routines/${data.id}/edit`}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-surface"
        >
          Modifier
        </Link>
      </header>

      {data.exercises.length === 0 ? (
        <p className="rounded-xl bg-surface-raised p-5 text-sm text-ink-muted">
          Cette routine ne contient encore aucun exercice.
        </p>
      ) : (
        <ol className="space-y-3">
          {data.exercises.map((exercise, index) => (
            <li key={exercise.id} className="rounded-xl bg-surface-raised p-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-medium">
                  <span className="mr-2 text-ink-muted">{index + 1}.</span>
                  <Link href={`/exercises/${exercise.exercise.id}`} className="hover:underline">
                    {exercise.exercise.name}
                  </Link>
                </h2>
                <p className="text-sm text-ink-muted">
                  {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
                  {equipmentLabel(exercise.exercise.equipment)}
                  {exercise.restSec === null ? "" : ` · repos ${formatRest(exercise.restSec)}`}
                </p>
              </div>

              {exercise.notes && <p className="mb-2 text-sm text-ink-muted">{exercise.notes}</p>}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-muted">
                    <th scope="col" className="w-12 font-normal">
                      #
                    </th>
                    <th scope="col" className="font-normal">
                      kg
                    </th>
                    <th scope="col" className="font-normal">
                      Reps
                    </th>
                    <th scope="col" className="font-normal">
                      RPE
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {exercise.sets.map((set, setIndex) => (
                    <tr key={set.id}>
                      <td className={`py-1 ${SET_TYPE_TONE[set.type]}`}>
                        {SET_TYPE_SHORT[set.type] || setIndex + 1}
                      </td>
                      <td className="py-1 font-mono">{set.targetWeightKg ?? "—"}</td>
                      <td className="py-1 font-mono">{set.targetReps ?? "—"}</td>
                      <td className="py-1 font-mono">{set.targetRpe ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
