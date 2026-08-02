import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";

import { useCreateExercise } from "@better-lift/api-client";
import { bodyPartSchema, createExerciseSchema, exerciseTypeSchema } from "@better-lift/validators";

import { BODY_PART_LABELS, EXERCISE_TYPE_LABELS } from "./labels";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Création d'un exercice personnalisé, côté terrain.
 *
 * Le mobile crée mais **ne modifie pas** : le besoin réel est de nommer sur
 * place un mouvement que le catalogue ignore, entre deux séries. Retoucher un
 * exercice existant se fait sur le web, qui est l'atelier (doc 01) — et éviter
 * un second formulaire ici, c'est autant de saisie tactile en moins à soigner.
 *
 * Les choix se font par pastilles et non par un sélecteur natif : `@react-native
 * -picker/picker` est un module natif de plus, et le development build n'a
 * toujours pas tourné sur appareil (même raisonnement que D21).
 */

/** Découpe une saisie libre en liste, en écartant les entrées vides. */
function splitList(value: string, separator: string | RegExp): string[] {
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function ChipRow<T extends string>({
  values,
  labels,
  selected,
  onSelect,
}: {
  values: readonly T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {values.map((value) => {
        const active = value === selected;

        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive] as TextStyle[]}>
              {labels[value]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ExerciseForm() {
  const router = useRouter();
  const locale = useProfileLocale();
  const create = useCreateExercise(apiClient, locale);

  const [name, setName] = useState("");
  const [bodyPart, setBodyPart] = useState<(typeof bodyPartSchema.options)[number]>("CHEST");
  const [type, setType] = useState<(typeof exerciseTypeSchema.options)[number]>("WEIGHT_REPS");
  const [equipment, setEquipment] = useState("");
  const [target, setTarget] = useState("");
  const [secondaryMuscles, setSecondaryMuscles] = useState("");
  const [instructions, setInstructions] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit() {
    /**
     * Validé avec **le schéma de l'API**, jamais avec des règles réécrites ici :
     * deux jeux de contraintes finiraient par diverger, et l'utilisateur
     * découvrirait la vraie règle en recevant un 422 au milieu d'une séance.
     */
    const parsed = createExerciseSchema.safeParse({
      name,
      type,
      bodyPart,
      equipment,
      target,
      secondaryMuscles: splitList(secondaryMuscles, ","),
      instructions: splitList(instructions, /\r?\n/),
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
      const saved = await create.mutateAsync(parsed.data);

      // `replace` et non `push` : revenir en arrière sur un formulaire qu'on
      // vient de soumettre inviterait à créer un doublon.
      router.replace(`/exercise/${saved.id}`);
    } catch {
      // L'échec est affiché depuis l'état de la mutation, plus bas.
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Field label="Nom" error={errors.name}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Curl marteau à la corde"
          placeholderTextColor="#6d7680"
          autoFocus
        />
      </Field>

      <Field label="Partie du corps" error={errors.bodyPart}>
        <ChipRow
          values={bodyPartSchema.options}
          labels={BODY_PART_LABELS}
          selected={bodyPart}
          onSelect={setBodyPart}
        />
      </Field>

      <Field
        label="Ce qu'on note pendant la série"
        hint="Détermine les champs de saisie en séance."
        error={errors.type}
      >
        <ChipRow
          values={exerciseTypeSchema.options}
          labels={EXERCISE_TYPE_LABELS}
          selected={type}
          onSelect={setType}
        />
      </Field>

      <Field label="Équipement" error={errors.equipment}>
        <TextInput
          style={styles.input}
          value={equipment}
          onChangeText={setEquipment}
          placeholder="haltères"
          placeholderTextColor="#6d7680"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Muscle cible" error={errors.target}>
        <TextInput
          style={styles.input}
          value={target}
          onChangeText={setTarget}
          placeholder="biceps"
          placeholderTextColor="#6d7680"
          autoCapitalize="none"
        />
      </Field>

      <Field
        label="Muscles secondaires"
        hint="Séparés par des virgules. Facultatif."
        error={errors.secondaryMuscles}
      >
        <TextInput
          style={styles.input}
          value={secondaryMuscles}
          onChangeText={setSecondaryMuscles}
          placeholder="avant-bras, épaules"
          placeholderTextColor="#6d7680"
          autoCapitalize="none"
        />
      </Field>

      <Field
        label="Instructions"
        hint="Une étape par ligne. Facultatif."
        error={errors.instructions}
      >
        <TextInput
          style={[styles.input, styles.multiline]}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={4}
          placeholderTextColor="#6d7680"
        />
      </Field>

      {create.isError && <Text style={styles.error}>{create.error.message}</Text>}

      <Pressable
        style={[styles.submit, create.isPending && styles.submitDisabled]}
        onPress={() => void onSubmit()}
        disabled={create.isPending}
        accessibilityRole="button"
      >
        <Text style={styles.submitLabel}>
          {create.isPending ? "Enregistrement…" : "Créer l’exercice"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 18, paddingBottom: 48 },
  field: { gap: 8 },
  label: { color: "#f2f4f6", fontSize: 14, fontWeight: "500" },
  hint: { color: "#6d7680", fontSize: 12 },
  error: { color: "#f2777a", fontSize: 12 },
  input: {
    backgroundColor: "#171c22",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f2f4f6",
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    backgroundColor: "#1a1f25",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: "#7ad6a5" },
  chipLabel: { color: "#9aa3ad", fontSize: 13 },
  chipLabelActive: { color: "#101418", fontWeight: "600" },
  submit: {
    backgroundColor: "#7ad6a5",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitLabel: { color: "#101418", fontWeight: "600" },
});
