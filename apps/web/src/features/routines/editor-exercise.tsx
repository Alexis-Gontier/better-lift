"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { XIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { Field, FieldLabel } from "@better-lift/ui/components/field";
import { Input } from "@better-lift/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@better-lift/ui/components/select";
import { cn } from "@better-lift/ui/lib/utils";
import { setTypeSchema } from "@better-lift/validators";

import { type DraftAction, type DraftExercise, type DraftSet } from "./draft";
import { SET_TYPE_LABELS, SET_TYPE_TONE } from "./labels";
import { SortableRow, setDndId } from "./sortable";
import { useWeightUnitLabel } from "@/features/account/units";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";

/** La grille des lignes de série, partagée avec l'en-tête de colonnes. */
const SET_GRID = "grid grid-cols-[7rem_1fr_1fr_1fr_2rem] items-center gap-2";

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
      <div className={cn(SET_GRID, "py-1")}>
        <div>
          <label htmlFor={`${fieldId}-type`} className="sr-only">
            Type de la série {index + 1}
          </label>
          {/*
            Le type colore son propre déclencheur : une série d'échauffement ne
            compte ni dans le volume ni dans les records (invariant 1, doc 03),
            et la distinguer d'un coup d'œil n'est donc pas cosmétique.
          */}
          <Select
            value={set.type}
            onValueChange={(value) =>
              dispatch({
                type: "setSetField",
                exerciseKey,
                setKey: set.key,
                field: "type",
                value,
              })
            }
          >
            <SelectTrigger
              id={`${fieldId}-type`}
              size="sm"
              className={cn("w-full text-xs font-medium", SET_TYPE_TONE[set.type])}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setTypeSchema.options.map((type) => (
                <SelectItem key={type} value={type}>
                  {SET_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(
          [
            { field: "targetWeightKg", label: "Charge", placeholder: "charge" },
            { field: "targetReps", label: "Répétitions", placeholder: "reps" },
            { field: "targetRpe", label: "RPE", placeholder: "RPE" },
          ] as const
        ).map(({ field, label, placeholder }) => (
          <div key={field}>
            <label htmlFor={`${fieldId}-${field}`} className="sr-only">
              {label} — série {index + 1}
            </label>
            <Input
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
            />
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "removeSet", exerciseKey, setKey: set.key })}
          disabled={!canRemove}
          aria-label={`Supprimer la série ${index + 1}`}
          title={canRemove ? undefined : "Un exercice garde au moins une série."}
          className="text-muted-foreground hover:text-destructive"
        >
          <XIcon />
        </Button>
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
  const weightUnit = useWeightUnitLabel();
  const setIds = exercise.sets.map((set) => setDndId(exercise.key, set.key));

  return (
    /*
      `role="group"` plutôt qu'un `<section aria-label>` : `Card` rend un `<div>`
      et n'accepte pas `asChild`. Le groupe est d'ailleurs le bon rôle — une
      routine de six exercices ferait six régions de navigation, ce qui encombre
      la liste des repères pour un gain nul.
    */
    <Card size="sm" role="group" aria-label={exercise.exercise.name}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">
            <span className="mr-2 text-muted-foreground">{index + 1}.</span>
            {exercise.exercise.name}
          </CardTitle>
          <p className="truncate text-sm text-muted-foreground">
            {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
            {equipmentLabel(exercise.exercise.equipment)}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: "removeExercise", key: exercise.key })}
        >
          Retirer
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <Field>
            <FieldLabel htmlFor={`${fieldId}-rest`}>Repos (s)</FieldLabel>
            <Input
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
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldId}-notes`}>Notes</FieldLabel>
            <Input
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
            />
          </Field>
        </div>

        {/*
            En-tête de colonnes, aligné sur la grille des lignes — la poignée
            occupe la première gouttière, d'où le décalage.

            L'unité vient du profil : la routine prescrit des kilos en base
            (règle non négociable n°3), mais un profil impérial doit lire « lb ».
          */}
        <div className={cn(SET_GRID, "ml-10 pb-1 text-xs text-muted-foreground")}>
          <span>Type</span>
          <span>{weightUnit}</span>
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

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "addSet", exerciseKey: exercise.key })}
          >
            Ajouter une série
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "duplicateLastSet", exerciseKey: exercise.key })}
          >
            Dupliquer la dernière
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
