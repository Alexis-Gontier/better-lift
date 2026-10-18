import { useNavigate } from "@tanstack/react-router";
import { Dumbbell, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DetailColumns } from "@/components/detail-columns";
import { DetailHeader } from "@/components/list-detail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { filled } from "@/features/routines/routine-editor";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseHistory } from "@/mocks/exercise-history";
import {
  customSlug,
  deleteExercise,
  saveExercise,
  setExerciseDraftName,
} from "@/mocks/exercise-store";
import { EQUIPMENTS, type MockExercise, MUSCLES, mockExercises } from "@/mocks/exercises";
import { useRoutines } from "@/mocks/routine-store";

/** Ce qui se modifie d'une fiche (D264) : la note de tout exercice, le reste s'il est personnel. */
export type ExerciseDraft = Pick<MockExercise, "name" | "muscle" | "equipment"> & { note: string };

export const toExerciseDraft = (e: MockExercise): ExerciseDraft => ({
  name: e.name,
  muscle: e.muscle,
  equipment: e.equipment,
  note: e.note ?? "",
});

/** Combien de champs la fiche change : nom, muscle, équipement, note. */
export function exerciseChangeCount(draft: ExerciseDraft, saved: MockExercise): number {
  const was = toExerciseDraft(saved);
  return (
    Number(draft.name.trim() !== was.name) +
    Number(draft.muscle !== was.muscle) +
    Number(draft.equipment !== was.equipment) +
    Number(draft.note.trim() !== was.note.trim())
  );
}

/** La fiche enregistrée à partir du brouillon ; une note vide disparaît. */
export function fromExerciseDraft(draft: ExerciseDraft, saved: MockExercise): MockExercise {
  const note = draft.note.trim();
  const { note: _note, ...rest } = saved;
  return {
    ...rest,
    name: draft.name.trim(),
    muscle: draft.muscle,
    equipment: draft.equipment,
    ...(note ? { note } : {}),
  };
}

type OnChange = (update: (d: ExerciseDraft) => ExerciseDraft) => void;

/** Le nom d'un exercice personnel, modifiable dans la tête, comme celui d'une routine (D250). */
export function ExerciseNameInput({
  draft,
  onChange,
  autoFocus,
}: {
  draft: ExerciseDraft;
  onChange: OnChange;
  autoFocus?: boolean;
}) {
  return (
    <Input
      aria-label="Nom de l'exercice"
      placeholder="Sans nom"
      maxLength={120}
      autoFocus={autoFocus}
      className={cn(
        "h-11 w-auto min-w-24 max-w-full @2xl:min-w-72 px-2 font-medium text-2xl field-sizing-content md:text-2xl",
        filled,
      )}
      value={draft.name}
      onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
    />
  );
}

function Choice({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={cn("w-full", filled)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Muscle et équipement d'un exercice personnel, dans la colonne de droite (D264). */
export function ExerciseSettings({
  draft,
  onChange,
}: {
  draft: ExerciseDraft;
  onChange: OnChange;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Réglages</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Choice
            id="exercise-muscle"
            label="Muscle principal"
            value={draft.muscle}
            options={MUSCLES}
            onChange={(muscle) => onChange((d) => ({ ...d, muscle }))}
          />
          <Choice
            id="exercise-equipment"
            label="Équipement"
            value={draft.equipment}
            options={EQUIPMENTS}
            onChange={(equipment) => onChange((d) => ({ ...d, equipment }))}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

/** La note épinglée : un réglage de machine, une consigne. Elle suit l'exercice partout (D241). */
export function ExerciseNote({ draft, onChange }: { draft: ExerciseDraft; onChange: OnChange }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Note épinglée</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          aria-label="Note épinglée"
          placeholder="Réglage de machine, consigne…"
          className={filled}
          value={draft.note}
          onChange={(e) => onChange((d) => ({ ...d, note: e.target.value }))}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Le menu ⋯ d'un exercice personnel : Supprimer. Tant qu'une routine ou une séance s'en sert, la
 * fenêtre dit pourquoi on ne peut pas, plutôt que de laisser des références orphelines.
 */
export function ExerciseMenu({
  exercise,
  release,
}: {
  exercise: MockExercise;
  release: () => void;
}) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const routines = useRoutines().filter((r) => r.exercises.some((e) => e.slug === exercise.slug));
  const sessions = exerciseHistory(exercise.slug).length;
  const blockers = [
    routines.length > 0 && plural(routines.length, "routine"),
    sessions > 0 && plural(sessions, "séance"),
  ].filter(Boolean);

  function remove() {
    const undo = deleteExercise(exercise.slug);
    release();
    navigate({ to: "/exercises", search: true });
    toast(`« ${exercise.name} » supprimé`, {
      action: { label: "Annuler", onClick: undo },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Actions de l'exercice">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockers.length > 0
                ? `« ${exercise.name} » sert encore`
                : `Supprimer « ${exercise.name} » ?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockers.length > 0
                ? `Il figure dans ${blockers.join(" et ")}. ${
                    sessions > 0
                      ? "Une séance faite le garde : il reste dans vos exercices."
                      : "Retirez-le de ces routines avant de le supprimer."
                  }`
                : "Il disparaît de la liste de vos exercices."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {blockers.length > 0 ? (
              <AlertDialogCancel>Compris</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={remove}>
                  Supprimer
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const emptyDraft: ExerciseDraft = {
  name: "",
  muscle: MUSCLES[0] ?? "",
  equipment: EQUIPMENTS[0] ?? "",
  note: "",
};

/**
 * Création d'un exercice personnel (D238, D264) : le même gabarit que sa fiche, le curseur dans
 * le nom, muscle et équipement à droite. Rien n'est créé avant *Créer* ; la ligne brouillon de
 * la liste suit le nom tapé.
 */
export function NewExercisePane() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ExerciseDraft>(emptyDraft);
  const named = draft.name.trim() !== "";
  const { guard, release } = useUnsavedGuard(named, "cet exercice");
  useEffect(() => setExerciseDraftName(draft.name), [draft.name]);
  useEffect(() => () => setExerciseDraftName(""), []);

  function create() {
    const name = draft.name.trim();
    const slug = customSlug(
      name,
      mockExercises.map((e) => e.slug),
    );
    saveExercise(fromExerciseDraft(draft, { slug, name, muscle: "", equipment: "", custom: true }));
    release();
    navigate({ to: "/exercises/$slug", params: { slug }, search: true });
    toast.success(`« ${name} » créé`);
  }

  return (
    <>
      <DetailHeader
        title={<ExerciseNameInput draft={draft} onChange={setDraft} autoFocus />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/exercises", search: true })}
            >
              Annuler
            </Button>
            {!named && (
              <span className="text-muted-foreground text-sm" id="exercice-manque">
                Donnez-lui un nom
              </span>
            )}
            <Button size="sm" disabled={!named} aria-describedby="exercice-manque" onClick={create}>
              Créer
            </Button>
          </>
        }
      />
      <DetailColumns
        id="exercice-fiche"
        main={
          <Empty className="rounded-xl border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Dumbbell />
              </EmptyMedia>
              <EmptyTitle>Une machine de votre salle, une variante</EmptyTitle>
              <EmptyDescription>
                Une fois créé, il s'ajoute aux routines comme un exercice du catalogue ; sa
                progression apparaît ici après la première séance.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        aside={
          <>
            <ExerciseSettings draft={draft} onChange={setDraft} />
            <ExerciseNote draft={draft} onChange={setDraft} />
          </>
        }
      />
      {guard}
    </>
  );
}
