import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InlineField } from "@/components/inline-field";
import { DetailHeader } from "@/components/list-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { customSlug, saveExercise, setExerciseDraftName } from "@/mocks/exercise-store";
import { EQUIPMENTS, type MockExercise, MUSCLES, mockExercises } from "@/mocks/exercises";

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
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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

type Draft = Pick<MockExercise, "name" | "muscle" | "equipment">;
const emptyDraft: Draft = { name: "", muscle: MUSCLES[0] ?? "", equipment: EQUIPMENTS[0] ?? "" };

/**
 * Création d'un exercice personnalisé (D238, D240) : nom, muscle, équipement, dans le panneau.
 * Rien n'est créé avant *Créer* ; la ligne brouillon de la liste suit le nom tapé.
 */
export function NewExercisePane() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const dirty = draft.name.trim() !== "";
  const { guard, release } = useUnsavedGuard(dirty, "cet exercice");
  useEffect(() => setExerciseDraftName(draft.name), [draft.name]);
  useEffect(() => () => setExerciseDraftName(""), []);

  function create() {
    const name = draft.name.trim();
    const slug = customSlug(
      name,
      mockExercises.map((e) => e.slug),
    );
    saveExercise({ ...draft, name, slug, custom: true });
    release();
    navigate({ to: "/exercises/$slug", params: { slug }, search: true });
    toast.success(`« ${name} » créé`);
  }

  return (
    <>
      <DetailHeader
        title={draft.name.trim() || "Nouvel exercice"}
        subtitle={`${draft.muscle} · ${draft.equipment}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/exercises", search: true })}
            >
              Annuler
            </Button>
            <Button size="sm" disabled={!dirty} onClick={create}>
              Créer
            </Button>
          </>
        }
      />
      <Card>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="exercise-name">Nom</FieldLabel>
              <Input
                id="exercise-name"
                placeholder="Presse à cuisses de la salle"
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </Field>
            <div className="grid gap-4 @lg:grid-cols-2">
              <Choice
                id="exercise-muscle"
                label="Muscle principal"
                value={draft.muscle}
                options={MUSCLES}
                onChange={(muscle) => setDraft((d) => ({ ...d, muscle }))}
              />
              <Choice
                id="exercise-equipment"
                label="Équipement"
                value={draft.equipment}
                options={EQUIPMENTS}
                onChange={(equipment) => setDraft((d) => ({ ...d, equipment }))}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
      {guard}
    </>
  );
}

/** Enregistre une retouche de fiche et propose de l'annuler (D240, comme la variante C). */
export function commitExercise(next: MockExercise, previous: MockExercise) {
  saveExercise(next);
  toast.success("Enregistré", {
    id: "exercice-enregistre",
    action: { label: "Annuler", onClick: () => saveExercise(previous) },
  });
}

/** Le nom d'un exercice personnalisé, modifiable au clic dans la tête de sa fiche. */
export function CustomExerciseName({ exercise }: { exercise: MockExercise }) {
  return (
    <InlineField
      label="Nom de l'exercice"
      value={exercise.name}
      inputClassName="h-9 font-medium md:text-xl"
      onCommit={(name) =>
        name.trim() && commitExercise({ ...exercise, name: name.trim() }, exercise)
      }
    />
  );
}

/** Muscle et équipement d'un exercice personnalisé, enregistrés dès qu'on les change. */
export function CustomExerciseFields({ exercise }: { exercise: MockExercise }) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-4 @lg:grid-cols-2">
        <Choice
          id="custom-muscle"
          label="Muscle principal"
          value={exercise.muscle}
          options={MUSCLES}
          onChange={(muscle) => commitExercise({ ...exercise, muscle }, exercise)}
        />
        <Choice
          id="custom-equipment"
          label="Équipement"
          value={exercise.equipment}
          options={EQUIPMENTS}
          onChange={(equipment) => commitExercise({ ...exercise, equipment }, exercise)}
        />
      </CardContent>
    </Card>
  );
}
