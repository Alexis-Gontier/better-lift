import { Link, useNavigate } from "@tanstack/react-router";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/page";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { exerciseBySlug, mockExercises } from "@/mocks/exercises";
import {
  FOLDERS,
  type MockRoutine,
  type MockRoutineExercise,
  type MockSet,
} from "@/mocks/routines";

/** Un exercice du brouillon porte un identifiant stable : le glisser-déposer en a besoin. */
type DraftExercise = MockRoutineExercise & { uid: string };
type Draft = { name: string; folder: string; notes: string; exercises: DraftExercise[] };

const emptyDraft: Draft = { name: "", folder: FOLDERS[0], notes: "", exercises: [] };

function toDraft(routine: MockRoutine): Draft {
  return {
    name: routine.name,
    folder: routine.folder,
    notes: routine.notes ?? "",
    exercises: routine.exercises.map((e, i) => ({
      ...e,
      uid: `${e.slug}-${i}`,
      sets: e.sets.map((s) => ({ ...s })),
    })),
  };
}

function ExerciseEditor({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: MockRoutineExercise;
  onChange: (next: MockRoutineExercise) => void;
  onRemove: () => void;
}) {
  const info = exerciseBySlug(exercise.slug);
  const setAt = (i: number, patch: Partial<MockSet>) =>
    onChange({
      ...exercise,
      sets: exercise.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const last = exercise.sets.at(-1) ?? { kg: 0, reps: 10 };
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
              value={set.kg}
              aria-label={`Charge de la série ${i + 1}`}
              onChange={(e) => setAt(i, { kg: Number(e.target.value) })}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={1}
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
            variant="outline"
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
              className="w-20"
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

export function RoutineEditor({ routine }: { routine?: MockRoutine }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => (routine ? toDraft(routine) : emptyDraft));
  const [picking, setPicking] = useState(false);

  const setExercise = (i: number, next: DraftExercise) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, j) => (j === i ? next : e)) }));

  function save() {
    // Pas d'API dans le wireframe : on revient simplement là d'où l'on vient.
    if (routine) navigate({ to: "/routines/$id", params: { id: routine.id } });
    else navigate({ to: "/routines" });
  }

  return (
    <Page
      title={routine ? "Modifier la routine" : "Nouvelle routine"}
      actions={
        <>
          <Button variant="outline" asChild>
            {routine ? (
              <Link to="/routines/$id" params={{ id: routine.id }}>
                Annuler
              </Link>
            ) : (
              <Link to="/routines">Annuler</Link>
            )}
          </Button>
          <Button onClick={save} disabled={!draft.name.trim() || draft.exercises.length === 0}>
            Enregistrer
          </Button>
        </>
      }
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="routine-name">Nom</FieldLabel>
                <Input
                  id="routine-name"
                  placeholder="Push A"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="routine-folder">Dossier</FieldLabel>
                <Select
                  value={draft.folder}
                  onValueChange={(folder) => setDraft((d) => ({ ...d, folder }))}
                >
                  <SelectTrigger id="routine-folder" className="w-full">
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
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Réordonnables à la poignée, à la souris ou au clavier (Espace, flèches, Espace). */}
      <Sortable
        value={draft.exercises}
        onValueChange={(exercises) => setDraft((d) => ({ ...d, exercises }))}
        getItemValue={(e) => e.uid}
        className="flex flex-col gap-6"
      >
        {draft.exercises.map((e, i) => (
          <SortableItem key={e.uid} value={e.uid}>
            <ExerciseEditor
              exercise={e}
              onChange={(next) => setExercise(i, { ...next, uid: e.uid })}
              onRemove={() =>
                setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, j) => j !== i) }))
              }
            />
          </SortableItem>
        ))}
      </Sortable>

      <Button variant="outline" className="self-start" onClick={() => setPicking(true)}>
        <Plus data-icon="inline-start" /> Ajouter un exercice
      </Button>

      <CommandDialog
        open={picking}
        onOpenChange={setPicking}
        title="Ajouter un exercice"
        description="Rechercher dans le catalogue"
      >
        <Command>
          <CommandInput placeholder="Rechercher un exercice…" />
          <CommandList>
            <CommandEmpty>Aucun exercice.</CommandEmpty>
            <CommandGroup heading="Catalogue">
              {mockExercises.map((ex) => (
                <CommandItem
                  key={ex.slug}
                  value={`${ex.name} ${ex.muscle}`}
                  onSelect={() => {
                    setDraft((d) => ({
                      ...d,
                      exercises: [
                        ...d.exercises,
                        {
                          uid: `${ex.slug}-${d.exercises.length}-${Date.now()}`,
                          slug: ex.slug,
                          sets: [{ kg: 0, reps: 10 }],
                          restSeconds: 90,
                        },
                      ],
                    }));
                    setPicking(false);
                  }}
                >
                  {ex.name}
                  <span className="ml-auto text-muted-foreground text-xs">{ex.muscle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </Page>
  );
}
