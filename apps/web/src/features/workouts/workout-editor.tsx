"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useReducer, useState } from "react";
import { toast } from "sonner";

import { useUpdateWorkout } from "@better-lift/api-client";
import { Alert, AlertDescription } from "@better-lift/ui/components/alert";
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
import { Spinner } from "@better-lift/ui/components/spinner";
import { Toggle } from "@better-lift/ui/components/toggle";
import { cn } from "@better-lift/ui/lib/utils";
import {
  type SetType,
  setTypeSchema,
  type WorkoutDetail,
  workoutStructureSchema,
} from "@better-lift/validators";

import {
  columnsFor,
  countCompletedSets,
  type DraftAction,
  type DraftExercise,
  draftReducer,
  fromDetail,
  toStructure,
} from "./edit-draft";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileUnits } from "@/features/account/use-profile-units";
import { ExerciseMedia } from "@/features/exercises/exercise-media";
import { ExercisePicker } from "@/features/exercises/exercise-picker";
import { ExerciseQuickView } from "@/features/exercises/exercise-quick-view";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";
import { SET_TYPE_LABELS, SET_TYPE_TONE } from "@/features/routines/labels";
import { apiClient } from "@/lib/api";

/** Libellé de chaque colonne saisissable, dans l'unité de stockage. */
const COLUMN_LABELS = {
  weightKg: "kg",
  reps: "Reps",
  durationSec: "Secondes",
  distanceM: "Mètres",
} as const;

function ExerciseCard({
  exercise,
  index,
  count,
  dispatch,
}: {
  exercise: DraftExercise;
  index: number;
  count: number;
  dispatch: (action: DraftAction) => void;
}) {
  const fieldId = useId();
  const columns = columnsFor(exercise.exercise.type);

  return (
    <Card size="sm" role="group" aria-label={exercise.exercise.name}>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        {/* Même en-tête que l'éditeur de routines : vignette, nom qui ouvre la
            fiche, puis partie du corps et matériel. Corriger une séance pose
            les mêmes questions que la construire. */}
        <div className="flex min-w-0 items-center gap-3">
          <ExerciseMedia
            url={exercise.exercise.thumbnailUrl}
            name={exercise.exercise.name}
            className="size-12 shrink-0 rounded-md"
          />

          <div className="min-w-0">
            <CardTitle className="truncate">
              <span className="mr-2 text-muted-foreground">{index + 1}.</span>
              <ExerciseQuickView exercise={exercise.exercise} />
            </CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
              {equipmentLabel(exercise.exercise.equipment)}
            </p>
          </div>
        </div>

        {/*
          Deux boutons plutôt qu'un glisser-déposer : corriger une séance
          passée, c'est réparer des valeurs, très rarement rejouer l'ordre des
          exercices. Le glissement demanderait la machinerie complète de
          l'éditeur de routines — capteurs, détection de collision filtrée,
          annonces au lecteur d'écran — pour un geste qu'on fait une fois par an,
          et deux boutons sont accessibles au clavier par construction.
        */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => dispatch({ type: "moveExercise", key: exercise.key, direction: -1 })}
            aria-label={`Monter ${exercise.exercise.name}`}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === count - 1}
            onClick={() => dispatch({ type: "moveExercise", key: exercise.key, direction: 1 })}
            aria-label={`Descendre ${exercise.exercise.name}`}
          >
            <ChevronDownIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "removeExercise", key: exercise.key })}
          >
            Retirer
          </Button>
        </div>
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
              placeholder="Coudes serrés…"
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

        {exercise.sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune série. L’exercice reste dans la séance : il dit qu’il a été commencé.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {/*
              Les colonnes suivent le type de l'exercice (doc 03) : proposer une
              charge sur un gainage n'a pas de sens, l'omettre sur un développé
              couché en perdrait la moitié.
            */}
            <div className="grid grid-cols-[8.5rem_repeat(3,1fr)_2.5rem_2rem] items-center gap-2 text-xs text-muted-foreground">
              <span>Type</span>
              {columns.map((column) => (
                <span key={column}>{COLUMN_LABELS[column]}</span>
              ))}
              {columns.length < 2 && <span />}
              <span>RPE</span>
              <span className="text-center">Fait</span>
              <span />
            </div>

            {exercise.sets.map((set, setIndex) => (
              <div
                key={set.key}
                className="grid grid-cols-[8.5rem_repeat(3,1fr)_2.5rem_2rem] items-center gap-2"
              >
                <Select
                  value={set.type}
                  onValueChange={(value) =>
                    dispatch({
                      type: "setSetType",
                      exerciseKey: exercise.key,
                      setKey: set.key,
                      value: value as SetType,
                    })
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className={cn("w-full text-xs font-medium", SET_TYPE_TONE[set.type])}
                    aria-label={`Type de la série ${setIndex + 1}`}
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

                {columns.map((column) => (
                  <Input
                    key={column}
                    type="text"
                    /*
                      `type="text"` et non `type="number"` : un champ numérique
                      avale la virgule des claviers français, refuse en silence
                      ce qu'il juge invalide, et défile sous la molette.
                    */
                    inputMode="decimal"
                    value={set[column]}
                    placeholder={COLUMN_LABELS[column]}
                    aria-label={`${COLUMN_LABELS[column]} — série ${setIndex + 1}`}
                    onChange={(event) =>
                      dispatch({
                        type: "setSetField",
                        exerciseKey: exercise.key,
                        setKey: set.key,
                        field: column,
                        value: event.target.value,
                      })
                    }
                  />
                ))}
                {columns.length < 2 && <span />}

                <Input
                  type="text"
                  inputMode="decimal"
                  value={set.rpe}
                  placeholder="RPE"
                  aria-label={`RPE — série ${setIndex + 1}`}
                  onChange={(event) =>
                    dispatch({
                      type: "setSetField",
                      exerciseKey: exercise.key,
                      setKey: set.key,
                      field: "rpe",
                      value: event.target.value,
                    })
                  }
                />

                {/*
                  La coche décide de tout : une série non validée ne compte ni
                  dans le volume ni dans les records (doc 03). La décocher est
                  une correction courante — la série notée par erreur — et elle
                  ne doit pas obliger à supprimer la ligne, qui dit ce qui était
                  prévu.
                */}
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={set.completed}
                  onPressedChange={() =>
                    dispatch({ type: "toggleSet", exerciseKey: exercise.key, setKey: set.key })
                  }
                  aria-label={`Série ${setIndex + 1} validée`}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <CheckIcon />
                </Toggle>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    dispatch({ type: "removeSet", exerciseKey: exercise.key, setKey: set.key })
                  }
                  aria-label={`Supprimer la série ${setIndex + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <XIcon />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => dispatch({ type: "addSet", exerciseKey: exercise.key })}
        >
          Ajouter une série
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Éditeur d'une séance **passée** (doc 05, D10).
 *
 * Trois partis pris, tous hérités de l'éditeur de routines :
 *
 * 1. **Tout vit dans un brouillon local.** Rien n'est envoyé avant
 *    l'enregistrement, qui fait un unique `PUT` — le serveur remplace la
 *    structure entière, ce qui permet de réordonner et de supprimer sans
 *    négocier chaque geste avec lui.
 * 2. **Les valeurs sont du texte jusqu'à l'envoi**, sinon on ne peut pas taper
 *    « 82, » avant « 82,5 » ni vider un champ.
 * 3. **La coche est l'information centrale**, pas la ligne : une série
 *    décochée reste affichée et dit ce qui était prévu.
 *
 * Ce que l'éditeur ne fait **pas**, contrairement à celui des routines : le
 * brouillon n'est pas sauvegardé en `localStorage`. Une routine se construit en
 * plusieurs fois ; une correction de séance se fait d'un trait, et proposer de
 * restaurer une correction vieille de trois jours sur une séance modifiée
 * depuis serait plus dangereux qu'utile.
 */
export function WorkoutEditor({ workout }: { workout: WorkoutDetail }) {
  const router = useRouter();
  const fieldId = useId();
  const [draft, dispatch] = useReducer(draftReducer, workout, fromDetail);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  /**
   * La locale n'est **pas** décorative ici : elle fait partie de la clé de
   * cache de la séance. Sans elle, la mutation écrirait sa réponse sous
   * `["workout", id, null]` pendant que le détail lit `["workout", id, "fr"]`
   * — et l'écran d'arrivée afficherait les anciens chiffres après un
   * enregistrement pourtant réussi. Trouvé en faisant tourner l'app, invisible
   * à la lecture.
   */
  const update = useUpdateWorkout(apiClient, useProfileLocale());
  const imperial = useProfileUnits() === "IMPERIAL";

  const run = useCallback((action: DraftAction) => {
    setDirty(true);
    dispatch(action);
  }, []);

  /** Dernier rempart : le navigateur demande confirmation avant de fermer. */
  useEffect(() => {
    if (!dirty) {
      return;
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    const structure = toStructure(draft);

    if (structure === null) {
      setError("La date de début est requise.");

      return;
    }

    const parsed = workoutStructureSchema.safeParse(structure);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "La séance est incomplète.");

      return;
    }

    setError(null);

    try {
      const saved = await update.mutateAsync({ id: workout.id, input: parsed.data });

      setDirty(false);
      router.push(`/workouts/${workout.id}`);

      /*
        Le recalcul des records est serveur et invisible depuis l'éditeur : une
        correction à la baisse peut en invalider un, une à la hausse en établir
        un. C'est la seule conséquence de l'enregistrement qu'on ne voit pas en
        arrivant sur le détail, donc la seule qui mérite d'être dite.
      */
      toast.success(
        saved.newRecords.length > 0
          ? `Séance enregistrée · ${saved.newRecords.length} record${
              saved.newRecords.length > 1 ? "s" : ""
            }.`
          : "Séance enregistrée.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    }
  }, [draft, update, workout.id, router]);

  const completed = countCompletedSets(draft);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Field>
            <FieldLabel htmlFor={`${fieldId}-title`}>Titre</FieldLabel>
            <Input
              id={`${fieldId}-title`}
              size="lg"
              value={draft.title}
              onChange={(event) => run({ type: "setTitle", value: event.target.value })}
              placeholder="Push A"
              className="text-lg font-medium"
            />
          </Field>

          <div className="flex flex-wrap items-end gap-3">
            <Field className="w-auto">
              <FieldLabel htmlFor={`${fieldId}-started`}>Début</FieldLabel>
              <Input
                id={`${fieldId}-started`}
                type="datetime-local"
                value={draft.startedAt}
                onChange={(event) => run({ type: "setStartedAt", value: event.target.value })}
              />
            </Field>

            <Field className="w-auto">
              <FieldLabel htmlFor={`${fieldId}-ended`}>Fin</FieldLabel>
              <Input
                id={`${fieldId}-ended`}
                type="datetime-local"
                value={draft.endedAt}
                onChange={(event) => run({ type: "setEndedAt", value: event.target.value })}
              />
            </Field>

            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor={`${fieldId}-notes`}>Notes</FieldLabel>
              <Input
                id={`${fieldId}-notes`}
                value={draft.notes}
                onChange={(event) => run({ type: "setNotes", value: event.target.value })}
                placeholder="Bonne séance, dos fatigué…"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {completed} série{completed > 1 ? "s" : ""} validée{completed > 1 ? "s" : ""}
          </p>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={update.isPending}
            aria-busy={update.isPending}
          >
            {update.isPending && <Spinner data-icon="inline-start" />}
            Enregistrer
          </Button>
        </div>
      </header>

      {/*
        Dit avant l'enregistrement, pas après : corriger une charge à la baisse
        peut faire tomber un record, que le serveur reconstruit alors depuis le
        reste de l'historique (D23). C'est la conséquence la moins attendue de
        cet écran.
      */}
      <p className="text-sm text-muted-foreground">
        Enregistrer recalcule les records des exercices touchés : un record établi sur cette séance
        peut disparaître si la performance qui le portait change.
      </p>

      {imperial && (
        /*
          Les champs éditent la valeur stockée, qui est en kg (règle non
          négociable n°3). Écrire « lb » sur la colonne mentirait, et convertir
          à l'aller comme au retour ferait dériver la charge à chaque
          enregistrement par arrondis successifs.
        */
        <p className="text-sm text-muted-foreground">
          Les charges se saisissent en <strong>kg</strong> ici, quelle que soit l’unité d’affichage
          du profil.
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Une seule colonne, comme l'éditeur de routines : le panneau d'ajout
          est passé en dialogue à sélection multiple (doc 05). */}
      <div className="space-y-3">
        {draft.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.key}
            exercise={exercise}
            index={index}
            count={draft.exercises.length}
            dispatch={run}
          />
        ))}

        {draft.exercises.length === 0 && (
          <Card size="sm">
            <CardContent className="text-sm text-muted-foreground">
              Cette séance n’a plus aucun exercice. L’enregistrer ainsi la laissera vide, sans la
              supprimer.
            </CardContent>
          </Card>
        )}

        <ExercisePicker
          className="w-full"
          label="Ajouter un exercice à la séance"
          onAdd={(added) => {
            for (const exercise of added) {
              run({ type: "addExercise", exercise });
            }
          }}
        />
      </div>
    </div>
  );
}
