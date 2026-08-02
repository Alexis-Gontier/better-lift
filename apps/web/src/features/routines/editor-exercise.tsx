"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId } from "react";

import { setTypeSchema } from "@better-lift/validators";

import { type DraftAction, type DraftExercise, type DraftSet } from "./draft";
import { SET_TYPE_LABELS, SET_TYPE_TONE } from "./labels";
import { SortableRow, setDndId } from "./sortable";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";

const CELL_CLASS =
  "w-full rounded bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Une série du brouillon.
 *
 * `inputMode="decimal"` fait sortir le pavé numérique sur un portable, et
 * `type="text"` plutôt que `type="number"` est délibéré : un champ numérique
 * HTML avale la virgule des claviers français, refuse silencieusement les
 * valeurs qu'il juge invalides, et se met à défiler quand la molette passe
 * dessus. On préfère valider nous-mêmes.
 */
function SetRow({
  exerciseKey,
  set,
  index,
  dispatch,
  canRemove,
}: {
  exerciseKey: string;
  set: DraftSet;
  index: number;
  dispatch: (action: DraftAction) => void;
  canRemove: boolean;
}) {
  const fieldId = useId();

  return (
    <SortableRow id={setDndId(exerciseKey, set.key)} label={`la série ${index + 1}`}>
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_2rem] items-center gap-2 py-1">
        <div>
          <label htmlFor={`${fieldId}-type`} className="sr-only">
            Type de la série {index + 1}
          </label>
          <select
            id={`${fieldId}-type`}
            value={set.type}
            onChange={(event) =>
              dispatch({
                type: "setSetField",
                exerciseKey,
                setKey: set.key,
                field: "type",
                value: event.target.value,
              })
            }
            className={`w-full bg-transparent text-xs font-medium ${SET_TYPE_TONE[set.type]}`}
          >
            {setTypeSchema.options.map((type) => (
              <option key={type} value={type} className="text-foreground">
                {SET_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {(
          [
            { field: "targetWeightKg", label: "Charge en kg", placeholder: "kg" },
            { field: "targetReps", label: "Répétitions", placeholder: "reps" },
            { field: "targetRpe", label: "RPE", placeholder: "RPE" },
          ] as const
        ).map(({ field, label, placeholder }) => (
          <div key={field}>
            <label htmlFor={`${fieldId}-${field}`} className="sr-only">
              {label} — série {index + 1}
            </label>
            <input
              id={`${fieldId}-${field}`}
              type="text"
              inputMode="decimal"
              value={set[field]}
              placeholder={placeholder}
              onChange={(event) =>
                dispatch({
                  type: "setSetField",
                  exerciseKey,
                  setKey: set.key,
                  field,
                  value: event.target.value,
                })
              }
              className={CELL_CLASS}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => dispatch({ type: "removeSet", exerciseKey, setKey: set.key })}
          disabled={!canRemove}
          aria-label={`Supprimer la série ${index + 1}`}
          title={canRemove ? undefined : "Un exercice garde au moins une série."}
          className="rounded px-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
        >
          ×
        </button>
      </div>
    </SortableRow>
  );
}

export function EditorExercise({
  exercise,
  index,
  dispatch,
}: {
  exercise: DraftExercise;
  index: number;
  dispatch: (action: DraftAction) => void;
}) {
  const fieldId = useId();
  const setIds = exercise.sets.map((set) => setDndId(exercise.key, set.key));

  return (
    <section className="rounded-xl bg-card p-4" aria-label={exercise.exercise.name}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">
            <span className="mr-2 text-muted-foreground">{index + 1}.</span>
            {exercise.exercise.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
            {equipmentLabel(exercise.exercise.equipment)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: "removeExercise", key: exercise.key })}
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground ring-1 ring-border hover:text-destructive"
        >
          Retirer
        </button>
      </header>

      <div className="mb-3 grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor={`${fieldId}-rest`} className="mb-1 block text-xs text-muted-foreground">
            Repos (s)
          </label>
          <input
            id={`${fieldId}-rest`}
            type="text"
            inputMode="numeric"
            value={exercise.restSec}
            placeholder="défaut"
            onChange={(event) =>
              dispatch({
                type: "setExerciseField",
                key: exercise.key,
                field: "restSec",
                value: event.target.value,
              })
            }
            className={CELL_CLASS}
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-notes`} className="mb-1 block text-xs text-muted-foreground">
            Notes
          </label>
          <input
            id={`${fieldId}-notes`}
            type="text"
            value={exercise.notes}
            placeholder="Pause 1 s en bas…"
            onChange={(event) =>
              dispatch({
                type: "setExerciseField",
                key: exercise.key,
                field: "notes",
                value: event.target.value,
              })
            }
            className={CELL_CLASS}
          />
        </div>
      </div>

      {/* En-tête de colonnes, aligné sur la grille des lignes — la poignée
          occupe la première gouttière, d'où le décalage. */}
      <div className="ml-7 grid grid-cols-[3rem_1fr_1fr_1fr_2rem] gap-2 pb-1 text-xs text-muted-foreground">
        <span>Type</span>
        <span>kg</span>
        <span>Reps</span>
        <span>RPE</span>
        <span />
      </div>

      <SortableContext items={setIds} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-border">
          {exercise.sets.map((set, setIndex) => (
            <SetRow
              key={set.key}
              exerciseKey={exercise.key}
              set={set}
              index={setIndex}
              dispatch={dispatch}
              canRemove={exercise.sets.length > 1}
            />
          ))}
        </div>
      </SortableContext>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "addSet", exerciseKey: exercise.key })}
          className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-accent"
        >
          + Ajouter une série
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "duplicateLastSet", exerciseKey: exercise.key })}
          className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border hover:text-foreground"
        >
          Dupliquer la dernière
        </button>
      </div>
    </section>
  );
}
