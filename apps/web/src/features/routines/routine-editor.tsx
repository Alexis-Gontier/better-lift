import {
  ArrowDown,
  Check,
  GripVertical,
  Link2,
  Minus,
  MoreHorizontal,
  Plus,
  Timer,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { useState } from "react";
import { ExerciseThumb } from "@/components/exercise-media";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  canLinkWithNext,
  chainsIntoNext,
  type Draft,
  type DraftExercise,
  linkWithNext,
  normalizeSupersets,
  SET_TYPES,
  setLabels,
  setTone,
  unlink,
} from "./routine-draft";

/**
 * La marque d'un champ modifiable dans l'éditeur (D250) : un fond teinté, sans contour. On voit
 * d'emblée ce qui se modifie, sans le mur de bordures ; le focus pose l'anneau.
 */
const filled =
  "border-transparent bg-muted/70 shadow-none hover:bg-muted dark:bg-input/40 dark:hover:bg-input/60";

/** Les repos proposés ; la valeur de la routine s'y ajoute si elle n'y est pas. */
const RESTS = [0, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 300];

/** Les colonnes d'une ligne de série : type, dernière fois, charge, répétitions, retrait. */
// « Dernière fois » a une largeur fixe : les champs restent près de l'étiquette de série.
const SET_GRID = "grid grid-cols-[2.25rem_6.5rem_8.5rem_8.5rem_1.75rem] items-center gap-3";

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

/** Une valeur de série : − / + autour du champ, l'unité à côté du nombre (D246). */
function SetField({
  value,
  unit,
  label,
  step,
  min,
  onChange,
}: {
  value: string;
  unit: string;
  label: string;
  step: number;
  min: number;
  onChange: (value: string) => void;
}) {
  return (
    <InputGroup className={cn("w-34", filled)}>
      <InputGroupAddon>
        <InputGroupButton
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={`Moins : ${label}`}
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
        className="text-center font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unit}</InputGroupText>
        <InputGroupButton
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={`Plus : ${label}`}
          onClick={() => onChange(stepValue(value, step, min))}
        >
          <Plus />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** Une étiquette de série dans sa case, en couleur selon son type (W, 1, F, D). */
function SetBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border font-semibold text-sm tabular-nums",
        tone,
      )}
    >
      {label}
    </span>
  );
}

/** Le type d'une série, choisi sur son étiquette, comme dans Hevy (D248, D249). */
function SetTypeButton({
  set,
  label,
  index,
  onChange,
}: {
  set: MockSet;
  label: string;
  index: number;
  onChange: (type: MockSet["type"]) => void;
}) {
  const current = set.type ?? "normal";
  const typeName = SET_TYPES.find((t) => t.value === current)?.label ?? "Normale";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label={`Type de la série ${index + 1} : ${typeName}`}
          className={cn("font-semibold tabular-nums", setTone(set.type))}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {SET_TYPES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            className="gap-3 py-1.5"
            onSelect={() => onChange(t.value === "normal" ? undefined : t.value)}
          >
            {/* La série normale montre son numéro réel, comme dans Hevy. */}
            <SetBadge label={t.short || (current === "normal" ? label : "1")} tone={t.tone} />
            {t.label}
            {t.value === current && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Une carte d'exercice de l'éditeur (D246) : la poignée sur toute la hauteur à gauche ; en tête
 * la vignette, le nom, le repos et le menu ⋯ ; un filet ; les séries, face à la dernière fois ;
 * un filet ; *Ajouter une série*. Les champs et les boutons se voient d'emblée : on lit la
 * carte comme un formulaire.
 */
function ExerciseEditor({
  exercise,
  chains,
  onChange,
  onRemove,
  onLink,
  onUnlink,
}: {
  exercise: MockRoutineExercise;
  /** Enchaîné au suivant dans un superset : son repos ne compte pas. */
  chains: boolean;
  onChange: (next: MockRoutineExercise) => void;
  onRemove: () => void;
  /** Absent quand il n'y a pas de suivant à lier. */
  onLink?: () => void;
  onUnlink: () => void;
}) {
  const info = exerciseBySlug(exercise.slug);
  const name = info?.name ?? exercise.slug;
  const setAt = (i: number, patch: Partial<MockSet>) =>
    onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  // La série ajoutée reprend la dernière, sans son type : une série normale de plus.
  const { type: _type, ...last } = exercise.sets.at(-1) ?? { kg: null, reps: 10 };
  const labels = setLabels(exercise.sets);
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
          className="flex w-7 shrink-0 cursor-grab items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </SortableItemHandle>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 p-3">
          <ExerciseThumb name={name} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{name}</span>
              {exercise.superset && (
                <Badge variant="secondary" className="shrink-0">
                  <Link2 data-icon="inline-start" />
                  Superset {exercise.superset}
                </Badge>
              )}
            </span>
            <span className="truncate text-muted-foreground text-xs">
              {info?.muscle} · {info?.equipment}
            </span>
          </div>
          {/* Repos et menu vont ensemble : un seul petit écart entre eux. */}
          <div className="flex shrink-0 items-center gap-1.5">
            {chains ? (
              <span className="flex w-32 items-center gap-1.5 px-2.5 text-muted-foreground text-sm">
                <ArrowDown className="size-4" /> Enchaîné
              </span>
            ) : (
              <Select
                value={String(exercise.restSeconds)}
                onValueChange={(v) => onChange({ ...exercise, restSeconds: Number(v) })}
              >
                <SelectTrigger size="sm" aria-label="Repos" className={cn("w-32", filled)}>
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
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label={`Actions : ${name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled={!onLink} onSelect={onLink}>
                  <Link2 /> Superset avec le suivant
                </DropdownMenuItem>
                {exercise.superset && (
                  <DropdownMenuItem onSelect={onUnlink}>
                    <Unlink /> Retirer du superset
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                  <Trash2 /> Retirer l'exercice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Les filets courent sur toute la largeur de la carte, poignée exceptée. */}
        <Separator />

        <div className="flex flex-col gap-1.5 p-3">
          <div className={cn(SET_GRID, "px-1 text-muted-foreground text-xs")}>
            <span>Série</span>
            <span>Dernière fois</span>
            <span>Charge</span>
            <span>Répétitions</span>
            <span />
          </div>
          {exercise.sets.map((set, i) => (
            <div key={i} className={cn(SET_GRID, "rounded-md px-1")}>
              <SetTypeButton
                set={set}
                label={labels[i] ?? String(i + 1)}
                index={i}
                onChange={(type) => setAt(i, { type })}
              />
              <span className="truncate text-muted-foreground text-sm tabular-nums">
                {lastTime(exercise.slug, i)}
              </span>
              <SetField
                label={`Charge de la série ${i + 1}`}
                unit="kg"
                step={2.5}
                min={0}
                value={set.kg === null ? "" : String(set.kg)}
                onChange={(v) => setAt(i, { kg: v === "" ? null : Number(v) })}
              />
              <SetField
                label={`Répétitions de la série ${i + 1}`}
                unit="rép."
                step={1}
                min={1}
                value={String(set.reps)}
                onChange={(v) => setAt(i, { reps: Number(v) })}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Retirer la série ${i + 1}`}
                className="text-muted-foreground/70 hover:text-foreground"
                disabled={exercise.sets.length === 1}
                onClick={() =>
                  onChange({ ...exercise, sets: exercise.sets.filter((_, j) => j !== i) })
                }
              >
                <X />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        <div className="p-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => onChange({ ...exercise, sets: [...exercise.sets, { ...last }] })}
          >
            <Plus data-icon="inline-start" /> Ajouter une série
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Le nom de la routine, modifiable dans la tête du panneau (D250) : pas de champ en double. */
export function RoutineNameInput({
  draft,
  onChange,
  autoFocus = false,
}: {
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
  autoFocus?: boolean;
}) {
  return (
    <Input
      aria-label="Nom de la routine"
      placeholder="Sans nom"
      autoFocus={autoFocus}
      className={cn("-ml-2 h-10 w-full max-w-xl px-2 font-medium text-2xl md:text-2xl", filled)}
      value={draft.name}
      onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
    />
  );
}

/** Sous le nom : le dossier, puis ce que la routine représente, en une ligne. */
export function RoutineMeta({
  draft,
  onChange,
  figures,
}: {
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
  figures: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Select value={draft.folder} onValueChange={(folder) => onChange((d) => ({ ...d, folder }))}>
        <SelectTrigger size="sm" aria-label="Dossier" className={cn("-ml-2", filled)}>
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
      {figures}
    </div>
  );
}

/** Les notes de la routine, repliées tant qu'il n'y en a pas (D250). */
function RoutineNotes({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
}) {
  const [open, setOpen] = useState(draft.notes !== "");
  if (!open)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 self-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus data-icon="inline-start" /> Ajouter une note
      </Button>
    );
  return (
    <Textarea
      aria-label="Notes de la routine"
      placeholder="Échauffement, consignes…"
      autoFocus={draft.notes === ""}
      className={cn("min-h-16", filled)}
      value={draft.notes}
      onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value }))}
    />
  );
}

/**
 * Le corps de l'éditeur : les notes, puis les exercices à réordonner. Le nom et le dossier
 * vivent dans la tête du panneau ; le panneau décide quand on enregistre (D243, D250).
 */
export function RoutineFields({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: (update: (d: Draft) => Draft) => void;
}) {
  const [picking, setPicking] = useState(false);

  const setExercise = (i: number, next: DraftExercise) =>
    onChange((d) => ({ ...d, exercises: d.exercises.map((e, j) => (j === i ? next : e)) }));

  return (
    <>
      <RoutineNotes draft={draft} onChange={onChange} />

      {/* Réordonnables à la poignée, à la souris ou au clavier (Espace, flèches, Espace). */}
      <Sortable
        value={draft.exercises}
        // Un glisser peut couper un superset : la normalisation le défait ou le renomme.
        onValueChange={(exercises) =>
          onChange((d) => ({ ...d, exercises: normalizeSupersets(exercises) }))
        }
        getItemValue={(e) => e.uid}
        className="flex flex-col gap-6"
      >
        {draft.exercises.map((e, i) => (
          <SortableItem key={e.uid} value={e.uid}>
            <ExerciseEditor
              exercise={e}
              onChange={(next) => setExercise(i, { ...next, uid: e.uid })}
              chains={chainsIntoNext(draft.exercises, i)}
              onRemove={() =>
                onChange((d) => ({
                  ...d,
                  exercises: normalizeSupersets(d.exercises.filter((_, j) => j !== i)),
                }))
              }
              onLink={
                canLinkWithNext(draft.exercises, i)
                  ? () => onChange((d) => ({ ...d, exercises: linkWithNext(d.exercises, i) }))
                  : undefined
              }
              onUnlink={() => onChange((d) => ({ ...d, exercises: unlink(d.exercises, i) }))}
            />
          </SortableItem>
        ))}
      </Sortable>

      <Button variant="outline" className="w-full" onClick={() => setPicking(true)}>
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
