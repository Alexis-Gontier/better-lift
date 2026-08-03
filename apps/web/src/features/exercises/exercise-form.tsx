"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { ApiClientError, useCreateExercise, useUpdateExercise } from "@better-lift/api-client";
import { Alert, AlertDescription } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@better-lift/ui/components/field";
import { Input } from "@better-lift/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@better-lift/ui/components/select";
import { Spinner } from "@better-lift/ui/components/spinner";
import { Textarea } from "@better-lift/ui/components/textarea";
import {
  bodyPartSchema,
  createExerciseSchema,
  type ExerciseDetail,
  exerciseTypeSchema,
} from "@better-lift/validators";

import { BODY_PART_LABELS, EQUIPMENT_FILTERS, EXERCISE_TYPE_LABELS } from "./labels";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Formulaire d'exercice personnalisé, pour la création comme pour la
 * modification. Les deux écrans posent exactement les mêmes questions : les
 * séparer en deux composants ferait diverger la validation à la première
 * retouche.
 */

interface FormState {
  name: string;
  type: string;
  bodyPart: string;
  equipment: string;
  target: string;
  /** Saisis séparés par des virgules — plus rapide qu'une liste à puces à cliquer. */
  secondaryMuscles: string;
  /** Une étape par ligne. Le retour à la ligne est le séparateur naturel ici. */
  instructions: string;
}

function toFormState(exercise?: ExerciseDetail): FormState {
  return {
    name: exercise?.name ?? "",
    type: exercise?.type ?? "WEIGHT_REPS",
    bodyPart: exercise?.bodyPart ?? "CHEST",
    equipment: exercise?.equipment.replaceAll("_", " ") ?? "",
    target: exercise?.target ?? "",
    secondaryMuscles: exercise?.secondaryMuscles.join(", ") ?? "",
    instructions: exercise?.instructions.join("\n") ?? "",
  };
}

/** Découpe une saisie libre en liste, en écartant les entrées vides. */
function splitList(value: string, separator: string | RegExp): string[] {
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function ExerciseForm({ exercise }: { exercise?: ExerciseDetail }) {
  const router = useRouter();
  const locale = useProfileLocale();
  const fieldId = useId();

  const [form, setForm] = useState<FormState>(() => toFormState(exercise));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useCreateExercise(apiClient, locale);
  const update = useUpdateExercise(apiClient, locale);
  const mutation = exercise ? update : create;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  /**
   * `aria-describedby` ne doit citer que des nœuds réellement rendus : une
   * référence morte fait annoncer du vide à certains lecteurs d'écran. D'où un
   * identifiant d'erreur conditionnel plutôt que constant.
   */
  function errorProps(key: keyof FormState) {
    const message = errors[key];

    return {
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${fieldId}-${key}-error` : undefined,
    } as const;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    /**
     * Validé côté client avec **le schéma de l'API**, pas avec des règles
     * réécrites ici : deux jeux de contraintes finiraient par diverger, et
     * l'utilisateur découvrirait la vraie règle en recevant un 422.
     */
    const parsed = createExerciseSchema.safeParse({
      name: form.name,
      type: form.type,
      bodyPart: form.bodyPart,
      equipment: form.equipment,
      target: form.target,
      secondaryMuscles: splitList(form.secondaryMuscles, ","),
      instructions: splitList(form.instructions, /\r?\n/),
    });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }

    setErrors({});

    try {
      const saved = exercise
        ? await update.mutateAsync({ id: exercise.id, input: parsed.data })
        : await create.mutateAsync(parsed.data);

      router.push(`/exercises/${saved.id}`);
    } catch {
      // L'erreur est lue depuis l'état de la mutation, plus bas : la relancer
      // ici ferait remonter une promesse rejetée sans personne pour la traiter.
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor={`${fieldId}-name`}>Nom</FieldLabel>
          <Input
            id={`${fieldId}-name`}
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Curl marteau à la corde"
            {...errorProps("name")}
          />
          {errors.name && <FieldError id={`${fieldId}-name-error`}>{errors.name}</FieldError>}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={errors.bodyPart ? true : undefined}>
            <FieldLabel htmlFor={`${fieldId}-bodyPart`}>Partie du corps</FieldLabel>
            <Select value={form.bodyPart} onValueChange={(value) => set("bodyPart", value)}>
              <SelectTrigger id={`${fieldId}-bodyPart`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bodyPartSchema.options.map((bodyPart) => (
                  <SelectItem key={bodyPart} value={bodyPart}>
                    {BODY_PART_LABELS[bodyPart]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bodyPart && (
              <FieldError id={`${fieldId}-bodyPart-error`}>{errors.bodyPart}</FieldError>
            )}
          </Field>

          <Field data-invalid={errors.type ? true : undefined}>
            <FieldLabel htmlFor={`${fieldId}-type`}>Ce qu’on note pendant la série</FieldLabel>
            <Select value={form.type} onValueChange={(value) => set("type", value)}>
              <SelectTrigger id={`${fieldId}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exerciseTypeSchema.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {EXERCISE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type ? (
              <FieldError id={`${fieldId}-type-error`}>{errors.type}</FieldError>
            ) : (
              <FieldDescription>Détermine les champs de saisie en séance.</FieldDescription>
            )}
          </Field>

          <Field data-invalid={errors.equipment ? true : undefined}>
            <FieldLabel htmlFor={`${fieldId}-equipment`}>Équipement</FieldLabel>
            {/*
              Une liste de suggestions plutôt qu'un menu fermé : l'équipement est
              un texte libre côté API, et une salle a toujours une machine que le
              dataset ne connaît pas. `datalist` reste le seul moyen natif de
              proposer sans imposer — un `Select` fermerait la porte.
            */}
            <Input
              id={`${fieldId}-equipment`}
              list={`${fieldId}-equipment-options`}
              value={form.equipment}
              onChange={(event) => set("equipment", event.target.value)}
              placeholder="haltères"
              {...errorProps("equipment")}
            />
            <datalist id={`${fieldId}-equipment-options`}>
              {EQUIPMENT_FILTERS.map((equipment) => (
                <option key={equipment.value} value={equipment.value.replaceAll("_", " ")}>
                  {equipment.label}
                </option>
              ))}
            </datalist>
            {errors.equipment && (
              <FieldError id={`${fieldId}-equipment-error`}>{errors.equipment}</FieldError>
            )}
          </Field>

          <Field data-invalid={errors.target ? true : undefined}>
            <FieldLabel htmlFor={`${fieldId}-target`}>Muscle cible</FieldLabel>
            <Input
              id={`${fieldId}-target`}
              value={form.target}
              onChange={(event) => set("target", event.target.value)}
              placeholder="biceps"
              {...errorProps("target")}
            />
            {errors.target && (
              <FieldError id={`${fieldId}-target-error`}>{errors.target}</FieldError>
            )}
          </Field>
        </div>

        <Field data-invalid={errors.secondaryMuscles ? true : undefined}>
          <FieldLabel htmlFor={`${fieldId}-secondary`}>Muscles secondaires</FieldLabel>
          <Input
            id={`${fieldId}-secondary`}
            value={form.secondaryMuscles}
            onChange={(event) => set("secondaryMuscles", event.target.value)}
            placeholder="avant-bras, épaules"
            {...errorProps("secondaryMuscles")}
          />
          {errors.secondaryMuscles ? (
            <FieldError id={`${fieldId}-secondaryMuscles-error`}>
              {errors.secondaryMuscles}
            </FieldError>
          ) : (
            <FieldDescription>Séparés par des virgules. Facultatif.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={errors.instructions ? true : undefined}>
          <FieldLabel htmlFor={`${fieldId}-instructions`}>Instructions</FieldLabel>
          <Textarea
            id={`${fieldId}-instructions`}
            value={form.instructions}
            onChange={(event) => set("instructions", event.target.value)}
            rows={5}
            {...errorProps("instructions")}
          />
          {errors.instructions ? (
            <FieldError id={`${fieldId}-instructions-error`}>{errors.instructions}</FieldError>
          ) : (
            <FieldDescription>Une étape par ligne. Facultatif.</FieldDescription>
          )}
        </Field>

        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {mutation.error instanceof ApiClientError && mutation.error.status === 403
                ? "Les exercices du catalogue commun ne sont pas modifiables."
                : mutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
            {mutation.isPending && <Spinner data-icon="inline-start" />}
            {exercise ? "Enregistrer" : "Créer l’exercice"}
          </Button>

          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
