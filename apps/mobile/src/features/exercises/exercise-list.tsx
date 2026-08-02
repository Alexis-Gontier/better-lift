import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useExercises } from "@better-lift/api-client";
import { type BodyPart, bodyPartSchema, type ExerciseSummary } from "@better-lift/validators";

import { BODY_PART_LABELS, equipmentLabel } from "./labels";
import { resolveMediaUrl } from "./media";
import { useDebouncedValue } from "./use-debounced-value";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 250;

function ExerciseRow({ exercise }: { exercise: ExerciseSummary }) {
  const media = resolveMediaUrl(exercise.thumbnailUrl);

  return (
    <Link href={`/exercise/${exercise.id}`} asChild>
      <Pressable style={styles.row}>
        {media ? (
          <Image source={{ uri: media }} style={styles.thumb} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.thumbInitial}>{exercise.name.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * Catalogue d'exercices (doc 06, § Exercices).
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
 * `FlatList` et non `FlashList` (doc 06) : la liste est paginée par curseur, on
 * ne monte donc jamais 1 324 lignes d'un coup. `FlashList` est un module natif
 * de plus à embarquer, et le development build n'est pas encore éprouvé sur
 * appareil — il sera temps quand la mesure le justifiera.
 */
export function ExerciseList() {
  const [draftQuery, setDraftQuery] = useState("");
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);

  const q = useDebouncedValue(draftQuery, SEARCH_DEBOUNCE_MS).trim();
  const locale = useProfileLocale();

  const query = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(bodyParts.length ? { bodyPart: bodyParts } : {}),
      locale,
    }),
    [q, bodyParts, locale],
  );

  const exercises = useExercises(apiClient, query);
  const items = useMemo(
    () => exercises.data?.pages.flatMap((page) => page.data) ?? [],
    [exercises.data],
  );

  /**
   * Mentions de copyright des seuls médias réellement affichés (D17, doc 08),
   * regroupées en pied de liste : la source est unique pour tout le catalogue,
   * et la répéter sous chaque ligne n'informerait pas mieux.
   */
  const attributions = useMemo(
    () => [
      ...new Set(
        items
          .filter((exercise) => resolveMediaUrl(exercise.thumbnailUrl))
          .map((exercise) => exercise.attribution)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [items],
  );

  /** Le tri garde la clé de cache TanStack stable quel que soit l'ordre des taps. */
  function toggleBodyPart(value: BodyPart) {
    setBodyParts((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value].sort((a, b) => a.localeCompare(b)),
    );
  }

  return (
    <View style={styles.screen}>
      {/* La recherche reste hors de la liste : dans un `ListHeaderComponent`,
          elle perdrait le focus à chaque re-rendu — et elle doit rester
          atteignable une fois la grille défilée. */}
      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          value={draftQuery}
          onChangeText={setDraftQuery}
          placeholder="Rechercher un exercice…"
          placeholderTextColor="#6d7680"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Rechercher un exercice"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {bodyPartSchema.options.map((bodyPart) => {
            const active = bodyParts.includes(bodyPart);

            return (
              <Pressable
                key={bodyPart}
                onPress={() => toggleBodyPart(bodyPart)}
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

      <FlatList
        data={items}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => <ExerciseRow exercise={item} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        // Assez tôt pour que la page suivante arrive avant le bas de la liste,
        // assez tard pour ne pas la demander dès l'affichage.
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (exercises.hasNextPage && !exercises.isFetchingNextPage) {
            void exercises.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          exercises.isPending ? (
            <ActivityIndicator color="#7ad6a5" style={styles.spacer} />
          ) : exercises.isError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Catalogue indisponible</Text>
              <Text style={styles.emptyHint}>{exercises.error.message}</Text>
              <Pressable style={styles.retry} onPress={() => void exercises.refetch()}>
                <Text style={styles.retryLabel}>Réessayer</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucun exercice ne correspond</Text>
              <Text style={styles.emptyHint}>Essayer avec moins de filtres.</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View>
            {exercises.isFetchingNextPage && (
              <ActivityIndicator color="#7ad6a5" style={styles.spacer} />
            )}
            {attributions.map((attribution) => (
              <Text key={attribution} style={styles.attribution}>
                {attribution}
              </Text>
            ))}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  input: {
    backgroundColor: "#171c22",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f2f4f6",
  },
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
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1a1f25",
    borderRadius: 12,
    padding: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  thumbFallback: { backgroundColor: "#222931", alignItems: "center", justifyContent: "center" },
  thumbInitial: { color: "#9aa3ad", fontSize: 18, fontWeight: "600" },
  rowText: { flex: 1 },
  rowTitle: { color: "#f2f4f6", fontSize: 15, fontWeight: "500" },
  rowMeta: { color: "#9aa3ad", fontSize: 13, marginTop: 2 },
  empty: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { color: "#f2f4f6", fontWeight: "600" },
  emptyHint: { color: "#9aa3ad", fontSize: 13, textAlign: "center" },
  retry: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a323b",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryLabel: { color: "#f2f4f6" },
  spacer: { paddingVertical: 24 },
  attribution: { color: "#6d7680", fontSize: 11, paddingTop: 12, textAlign: "center" },
});
