import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { FOLDERS, type MockRoutineExercise, type MockSet } from "@/mocks/routines";
import { ExercisePicker, newRoutineExercise } from "./exercise-picker";
import type { Draft, DraftExercise } from "./routine-draft";

/**
 * Champ « nu » (variante A, D239) : sans bordure tant qu'on ne le survole pas, il se lit
 * comme du texte ; au survol et au focus, il redevient un champ.
 */
const bareField =
  "border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent";

function ExerciseEditor({
  exercise,
  bare,
  onChange,
  onRemove,
}: {
  exercise: MockRoutineExercise;
  bare: boolean;
  onChange: (next: MockRoutineExercise) => void;
  onRemove: () => void;
}) {
  const info = exerciseBySlug(exercise.slug);
  const setAt = (i: number, patch: Partial<MockSet>) =>
    onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const last = exercise.sets.at(-1) ?? { kg: null, reps: 10 };
  const field = bare ? bareField : undefined;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Un vrai bouton : sans focus possible, la poignée ne répondrait pas au clavier. */}
          <SortableItemHandle asChild>
            <button
              type="button"
              aria-label="Déplacer l'exercice"
              className="flex rounded text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="size-4" />
            </button>
          </SortableItemHandle>
          {info?.name ?? exercise.slug}
          {exercise.superset && (
            <span className="font-normal text-muted-foreground text-xs">
              · superset {exercise.superset}
            </span>
          )}
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Retirer l'exercice" onClick={onRemove}>
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-[3rem_7rem_7rem_2rem] items-center gap-2 text-muted-foreground text-xs">
          <span>Série</span>
          <span>Charge (kg)</span>
          <span>Répétitions</span>
          <span />
        </div>
        {exercise.sets.map((set, i) => (
          <div key={i} className="grid grid-cols-[3rem_7rem_7rem_2rem] items-center gap-2">
            <span className="text-muted-foreground text-sm tabular-nums">{i + 1}</span>
            <Input
              type="number"
              inputMode="decimal"
              step={2.5}
              min={0}
              placeholder="—"
              className={field}
              value={set.kg ?? ""}
              aria-label={`Charge de la série ${i + 1}`}
              onChange={(e) =>
                setAt(i, { kg: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              className={field}
              value={set.reps}
              aria-label={`Répétitions de la série ${i + 1}`}
              onChange={(e) => setAt(i, { reps: Number(e.target.value) })}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Retirer la série ${i + 1}`}
              disabled={exercise.sets.length === 1}
              onClick={() =>
                onChange({ ...exercise, sets: exercise.sets.filter((_, j) => j !== i) })
              }
            >
              <X />
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            variant={bare ? "ghost" : "outline"}
            size="sm"
            onClick={() => onChange({ ...exercise, sets: [...exercise.sets, { ...last }] })}
          >
            <Plus data-icon="inline-start" /> Ajouter une série
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            Repos (s)
            <Input
              type="number"
              min={0}
              step={15}
              className={cn("w-20", field)}
              aria-label="Repos en secondes"
              value={exercise.restSeconds}
              onChange={(e) => onChange({ ...exercise, restSeconds: Number(e.target.value) })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Les champs d'une routine : nom, dossier, notes, puis les exercices à réordonner. Ni en-tête
 * ni enregistrement : la variante qui l'affiche décide quand et comment on enregistre (D239).
 */
export function RoutineFields({
  draft,
  onChange,
  bare = false,
  autoFocusName = false,
}: {
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
  bare?: boolean;
  autoFocusName?: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const field = bare ? bareField : undefined;

  const setExercise = (i: number, next: DraftExercise) =>
    onChange((d) => ({ ...d, exercises: d.exercises.map((e, j) => (j === i ? next : e)) }));

  return (
    <>
      <Card>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 @lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="routine-name">Nom</FieldLabel>
                <Input
                  id="routine-name"
                  placeholder="Push A"
                  autoFocus={autoFocusName}
                  className={field}
                  value={draft.name}
                  onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="routine-folder">Dossier</FieldLabel>
                <Select
                  value={draft.folder}
                  onValueChange={(folder) => onChange((d) => ({ ...d, folder }))}
                >
                  <SelectTrigger id="routine-folder" className={cn("w-full", field)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {FOLDERS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="routine-notes">Notes</FieldLabel>
              <Textarea
                id="routine-notes"
                placeholder="Échauffement, consignes…"
                className={field}
                value={draft.notes}
                onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value }))}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Réordonnables à la poignée, à la souris ou au clavier (Espace, flèches, Espace). */}
      <Sortable
        value={draft.exercises}
        onValueChange={(exercises) => onChange((d) => ({ ...d, exercises }))}
        getItemValue={(e) => e.uid}
        className="flex flex-col gap-6"
      >
        {draft.exercises.map((e, i) => (
          <SortableItem key={e.uid} value={e.uid}>
            <ExerciseEditor
              exercise={e}
              bare={bare}
              onChange={(next) => setExercise(i, { ...next, uid: e.uid })}
              onRemove={() =>
                onChange((d) => ({ ...d, exercises: d.exercises.filter((_, j) => j !== i) }))
              }
            />
          </SortableItem>
        ))}
      </Sortable>

      <Button variant="outline" className="self-start" onClick={() => setPicking(true)}>
        <Plus data-icon="inline-start" /> Ajouter un exercice
      </Button>

      <ExercisePicker
        open={picking}
        onOpenChange={setPicking}
        onPick={(slug) =>
          onChange((d) => ({
            ...d,
            exercises: [
              ...d.exercises,
              { ...newRoutineExercise(slug), uid: `${slug}-${d.exercises.length}-${Date.now()}` },
            ],
          }))
        }
      />
    </>
  );
}
