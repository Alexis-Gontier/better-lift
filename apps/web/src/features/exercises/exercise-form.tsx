"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { ApiClientError, useCreateExercise, useUpdateExercise } from "@better-lift/api-client";
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

const INPUT_CLASS =
  "w-full rounded-lg bg-surface-raised px-3 py-2 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Field({
  htmlFor,
  label,
  hint,
  error,
  children,
}: {
  /** Sans cette liaison explicite, cliquer le libellé ne place pas le curseur. */
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
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
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-5" noValidate>
      <Field htmlFor={`${fieldId}-name`} label="Nom" error={errors.name}>
        <input
          id={`${fieldId}-name`}
          value={form.name}
          onChange={(event) => set("name", event.target.value)}
          placeholder="Curl marteau à la corde"
          className={INPUT_CLASS}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor={`${fieldId}-bodyPart`} label="Partie du corps" error={errors.bodyPart}>
          <select
            id={`${fieldId}-bodyPart`}
            value={form.bodyPart}
            onChange={(event) => set("bodyPart", event.target.value)}
            className={INPUT_CLASS}
          >
            {bodyPartSchema.options.map((bodyPart) => (
              <option key={bodyPart} value={bodyPart}>
                {BODY_PART_LABELS[bodyPart]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          htmlFor={`${fieldId}-type`}
          label="Ce qu'on note pendant la série"
          hint="Détermine les champs de saisie en séance."
          error={errors.type}
        >
          <select
            id={`${fieldId}-type`}
            value={form.type}
            onChange={(event) => set("type", event.target.value)}
            className={INPUT_CLASS}
          >
            {exerciseTypeSchema.options.map((type) => (
              <option key={type} value={type}>
                {EXERCISE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>

        <Field htmlFor={`${fieldId}-equipment`} label="Équipement" error={errors.equipment}>
          {/*
            Une liste de suggestions plutôt qu'un menu fermé : l'équipement est
            un texte libre côté API, et une salle a toujours une machine que le
            dataset ne connaît pas.
          */}
          <input
            id={`${fieldId}-equipment`}
            list={`${fieldId}-equipment-options`}
            value={form.equipment}
            onChange={(event) => set("equipment", event.target.value)}
            placeholder="haltères"
            className={INPUT_CLASS}
          />
          <datalist id={`${fieldId}-equipment-options`}>
            {EQUIPMENT_FILTERS.map((equipment) => (
              <option key={equipment.value} value={equipment.value.replaceAll("_", " ")}>
                {equipment.label}
              </option>
            ))}
          </datalist>
        </Field>

        <Field htmlFor={`${fieldId}-target`} label="Muscle cible" error={errors.target}>
          <input
            id={`${fieldId}-target`}
            value={form.target}
            onChange={(event) => set("target", event.target.value)}
            placeholder="biceps"
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <Field
        htmlFor={`${fieldId}-secondary`}
        label="Muscles secondaires"
        hint="Séparés par des virgules. Facultatif."
        error={errors.secondaryMuscles}
      >
        <input
          id={`${fieldId}-secondary`}
          value={form.secondaryMuscles}
          onChange={(event) => set("secondaryMuscles", event.target.value)}
          placeholder="avant-bras, épaules"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        htmlFor={`${fieldId}-instructions`}
        label="Instructions"
        hint="Une étape par ligne. Facultatif."
        error={errors.instructions}
      >
        <textarea
          id={`${fieldId}-instructions`}
          value={form.instructions}
          onChange={(event) => set("instructions", event.target.value)}
          rows={5}
          className={INPUT_CLASS}
        />
      </Field>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {mutation.error instanceof ApiClientError && mutation.error.status === 403
            ? "Les exercices du catalogue commun ne sont pas modifiables."
            : mutation.error.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
        >
          {mutation.isPending ? "Enregistrement…" : exercise ? "Enregistrer" : "Créer l’exercice"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm ring-1 ring-white/15 hover:bg-white/5"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
