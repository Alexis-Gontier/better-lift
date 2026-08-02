"use client";

import { useMemo, useState } from "react";

import { useExercises } from "@better-lift/api-client";
import { type BodyPart, bodyPartSchema, type ExerciseSummary } from "@better-lift/validators";

import { useProfileLocale } from "@/features/account/use-profile-locale";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";
import { useDebouncedValue } from "@/features/exercises/use-debounced-value";
import { apiClient } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Panneau d'ajout d'exercice de l'éditeur (doc 05).
 *
 * Il **reste ouvert** après un ajout : on ajoute rarement un seul exercice, et
 * le refermer à chaque fois transformerait la construction d'une routine de six
 * exercices en six allers-retours.
 *
 * Son état n'est pas dans l'URL, contrairement au catalogue : ici la recherche
 * est un outil de saisie, pas une vue à partager, et l'URL porte déjà
 * l'identité de la routine en cours d'édition.
 */
export function ExercisePicker({ onAdd }: { onAdd: (exercise: ExerciseSummary) => void }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const locale = useProfileLocale();

  const q = useDebouncedValue(draftQuery, SEARCH_DEBOUNCE_MS).trim();

  const query = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(bodyParts.length ? { bodyPart: bodyParts } : {}),
      locale,
    }),
    [q, bodyParts, locale],
  );

  const exercises = useExercises(apiClient, query);
  const items = useMemo(
    () => exercises.data?.pages.flatMap((page) => page.data) ?? [],
    [exercises.data],
  );

  function toggleBodyPart(value: BodyPart) {
    setBodyParts((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value].sort((a, b) => a.localeCompare(b)),
    );
  }

  return (
    <aside className="space-y-3 rounded-xl bg-surface-raised p-4" aria-label="Ajouter un exercice">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Ajouter un exercice
      </h2>

      <label htmlFor="picker-search" className="sr-only">
        Rechercher un exercice
      </label>
      <input
        id="picker-search"
        type="search"
        value={draftQuery}
        onChange={(event) => setDraftQuery(event.target.value)}
        placeholder="Rechercher…"
        autoComplete="off"
        className="w-full rounded-lg bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />

      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Filtrer par partie du corps</legend>
        {bodyPartSchema.options.map((bodyPart) => {
          const pressed = bodyParts.includes(bodyPart);

          return (
            <button
              key={bodyPart}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggleBodyPart(bodyPart)}
              className={`rounded-full px-2.5 py-1 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                pressed
                  ? "bg-accent font-medium text-surface"
                  : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {BODY_PART_LABELS[bodyPart]}
            </button>
          );
        })}
      </fieldset>

      {exercises.isPending && <p className="text-sm text-ink-muted">Chargement…</p>}

      {exercises.isError && (
        <p role="alert" className="text-sm text-danger">
          {exercises.error.message}
        </p>
      )}

      {exercises.isSuccess && items.length === 0 && (
        <p className="text-sm text-ink-muted">Aucun exercice ne correspond.</p>
      )}

      <ul className="max-h-96 space-y-1 overflow-y-auto">
        {items.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              onClick={() => onAdd(exercise)}
              className="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="block truncate text-sm">{exercise.name}</span>
              <span className="block truncate text-xs text-ink-muted">
                {exercise.isCustom ? "Personnalisé · " : ""}
                {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {exercises.hasNextPage && (
        <button
          type="button"
          onClick={() => void exercises.fetchNextPage()}
          disabled={exercises.isFetchingNextPage}
          className="w-full rounded-lg py-1.5 text-xs ring-1 ring-white/15 hover:bg-white/5 disabled:opacity-50"
        >
          {exercises.isFetchingNextPage ? "Chargement…" : "Charger la suite"}
        </button>
      )}
    </aside>
  );
}
