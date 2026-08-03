import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { bodyPartSchema } from "@better-lift/validators";

import { BODY_PART_LABELS } from "./labels";
import { type ExerciseFilters as Filters } from "./use-exercise-search";

/** Les trois origines possibles, dans l'ordre où on les propose. */
const ORIGINS: ReadonlyArray<{ value: boolean | undefined; label: string }> = [
  { value: undefined, label: "Tous" },
  { value: false, label: "Catalogue" },
  { value: true, label: "Les miens" },
];

/**
 * Recherche, origine et parties du corps (doc 06, § Exercices).
 *
 * ## Deux écarts assumés avec le web
 *
 * Les filtres ne sont pas persistés : il n'y a pas d'URL à partager sur un
 * téléphone, et un état local suffit.
 *
 * L'équipement n'a pas ses pastilles ici. Ajouter une seconde rangée de filtres
 * mangerait le tiers haut de l'écran sur un appareil moyen, pour un usage qui
 * passe presque toujours par la recherche. Le filtre par partie du corps reste,
 * c'est celui qu'on utilise en salle.
 *
 * Le bloc reste **hors de la liste** : dans un `ListHeaderComponent`, le champ
 * de recherche perdrait le focus à chaque re-rendu — et il doit rester
 * atteignable une fois la grille défilée.
 */
export function ExerciseFilters({
  filters,
  autoFocus = false,
}: {
  filters: Filters;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.controls}>
      <TextInput
        style={styles.input}
        value={filters.draftQuery}
        onChangeText={filters.setDraftQuery}
        placeholder="Rechercher un exercice…"
        placeholderTextColor="#6d7680"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel="Rechercher un exercice"
      />

      {/*
        Un choix parmi trois, et non trois bascules : les origines s'excluent.
        `radio` le dit aux lecteurs d'écran, là où des bascules laisseraient
        croire qu'on peut les cumuler.
      */}
      <View style={styles.origins} accessibilityRole="radiogroup">
        {ORIGINS.map((origin) => {
          const active = filters.custom === origin.value;

          return (
            <Pressable
              key={origin.label}
              onPress={() => filters.setCustom(origin.value)}
              style={[styles.origin, active && styles.originActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.originLabel, active && styles.originLabelActive]}>
                {origin.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {bodyPartSchema.options.map((bodyPart) => {
          const active = filters.bodyParts.includes(bodyPart);

          return (
            <Pressable
              key={bodyPart}
              onPress={() => filters.toggleBodyPart(bodyPart)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {BODY_PART_LABELS[bodyPart]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  input: {
    backgroundColor: "#171c22",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f2f4f6",
  },
  origins: { flexDirection: "row", gap: 6 },
  origin: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  originActive: { backgroundColor: "#1a1f25" },
  originLabel: { color: "#6d7680", fontSize: 13 },
  originLabelActive: { color: "#f2f4f6", fontWeight: "600" },
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
});
