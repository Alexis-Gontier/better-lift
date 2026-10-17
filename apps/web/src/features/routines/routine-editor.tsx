import { GripVertical, Minus, MoreHorizontal, Plus, Timer, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ExerciseThumb } from "@/components/exercise-media";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatLoad, formatRest } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { lastSets } from "@/mocks/generated-workouts";
import { FOLDERS, type MockRoutineExercise, type MockSet } from "@/mocks/routines";
import { ExercisePicker, newRoutineExercise } from "./exercise-picker";
import type { Draft, DraftExercise } from "./routine-draft";

/**
 * Champ « nu » (variante A, D239) : sans bordure tant qu'on ne le survole pas, il se lit
 * comme du texte ; au survol et au focus, il redevient un champ.
 */
const bareField =
  "border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent";

/** Le même effet sur un groupe (champ + unité) : la bordure est celle du groupe. */
const bareGroup = "border-transparent hover:border-input dark:bg-transparent";

/** Les repos proposés ; la valeur de la routine s'y ajoute si elle n'y est pas. */
const RESTS = [0, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 300];

/** « 25 kg × 15 » : la série de même rang à la dernière séance, ou la dernière connue. */
function lastTime(slug: string, i: number): string {
  const last = lastSets(slug);
  const set = last?.[i] ?? last?.at(-1);
  return set ? `${formatLoad(set[0])} × ${set[1]}` : "—";
}

/** Le pas suivant, sans dérive des flottants (2,5 + 2,5 + 2,5…) ni passage sous le minimum. */
export function stepValue(value: string, delta: number, min: number): string {
  const n = value.trim() === "" ? (delta > 0 ? 0 : min) : Number(value);
  if (Number.isNaN(n)) return value;
  return String(Math.max(min, Math.round((n + delta) * 100) / 100));
}

/**
 * Une valeur de série : − / + autour du champ, l'unité à côté du nombre. En champs nus, les
 * boutons n'apparaissent qu'au survol ou au focus : la ligne se lit comme du texte.
 */
function SetField({
  value,
  unit,
  label,
  bare,
  step,
  min,
  onChange,
}: {
  value: string;
  unit: string;
  label: string;
  bare: boolean;
  step: number;
  min: number;
  onChange: (value: string) => void;
}) {
  const reveal = bare
    ? "opacity-0 transition-opacity group-hover/input-group:opacity-100 group-focus-within/input-group:opacity-100"
    : undefined;
  return (
    <InputGroup className={cn("w-36", bare && bareGroup)}>
      <InputGroupAddon>
        <InputGroupButton
          size="icon-xs"
          aria-label={`Moins : ${label}`}
          className={reveal}
          onClick={() => onChange(stepValue(value, -step, min))}
        >
          <Minus />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        placeholder="—"
        aria-label={label}
        // Sans les flèches natives : les boutons − / + les remplacent.
        className="text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unit}</InputGroupText>
        <InputGroupButton
          size="icon-xs"
          aria-label={`Plus : ${label}`}
          className={reveal}
          onClick={() => onChange(stepValue(value, step, min))}
        >
          <Plus />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * Une carte d'exercice de l'éditeur : la poignée sur toute la hauteur à gauche ; en tête la
 * vignette, le nom, le repos et le menu ⋯ ; un filet sur toute la largeur ; puis les séries,
 * face à la dernière fois.
 */
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
  const name = info?.name ?? exercise.slug;
  const setAt = (i: number, patch: Partial<MockSet>) =>
    onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const last = exercise.sets.at(-1) ?? { kg: null, reps: 10 };
  const rests = RESTS.includes(exercise.restSeconds)
    ? RESTS
    : [...RESTS, exercise.restSeconds].sort((x, y) => x - y);

  return (
    <Card size="sm" className="flex-row gap-0 py-0">
      {/* Un vrai bouton : sans focus possible, la poignée ne répondrait pas au clavier. */}
      <SortableItemHandle asChild>
        <button
          type="button"
          aria-label={`Déplacer : ${name}`}
          className="flex w-8 shrink-0 cursor-grab items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </SortableItemHandle>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 p-3">
          <ExerciseThumb name={name} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">
              {name}
              {exercise.superset && (
                <span className="font-normal text-muted-foreground text-xs">
                  {" "}
                  · superset {exercise.superset}
                </span>
              )}
            </span>
            <span className="truncate text-muted-foreground text-xs">
              {info?.muscle} · {info?.equipment}
            </span>
          </div>
          <Select
            value={String(exercise.restSeconds)}
            onValueChange={(v) => onChange({ ...exercise, restSeconds: Number(v) })}
          >
            <SelectTrigger size="sm" aria-label="Repos" className={cn("w-32", bare && bareField)}>
              <Timer className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {rests.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r === 0 ? "Sans repos" : formatRest(r)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions : ${name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                <Trash2 /> Retirer l'exercice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Le filet court sur toute la largeur de la carte, poignée exceptée. */}
        <Separator />

        <div className="flex flex-col gap-1 p-3">
          <div className="grid grid-cols-[2.5rem_1fr_9rem_9rem_2rem] items-center gap-2 px-1 text-muted-foreground text-xs">
            <span>Série</span>
            <span>Dernière fois</span>
            <span>Charge</span>
            <span>Répétitions</span>
            <span />
          </div>
          {exercise.sets.map((set, i) => (
            <div
              key={i}
              className="grid grid-cols-[2.5rem_1fr_9rem_9rem_2rem] items-center gap-2 rounded-md px-1 hover:bg-muted/40"
            >
              <span className="text-muted-foreground text-sm tabular-nums">{i + 1}</span>
              <span className="truncate text-muted-foreground text-sm tabular-nums">
                {lastTime(exercise.slug, i)}
              </span>
              <SetField
                label={`Charge de la série ${i + 1}`}
                unit="kg"
                step={2.5}
                min={0}
                bare={bare}
                value={set.kg === null ? "" : String(set.kg)}
                onChange={(v) => setAt(i, { kg: v === "" ? null : Number(v) })}
              />
              <SetField
                label={`Répétitions de la série ${i + 1}`}
                unit="rép."
                step={1}
                min={1}
                bare={bare}
                value={String(set.reps)}
                onChange={(v) => setAt(i, { reps: Number(v) })}
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
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-muted-foreground"
            onClick={() => onChange({ ...exercise, sets: [...exercise.sets, { ...last }] })}
          >
            <Plus data-icon="inline-start" /> Ajouter une série
          </Button>
        </div>
      </div>
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
