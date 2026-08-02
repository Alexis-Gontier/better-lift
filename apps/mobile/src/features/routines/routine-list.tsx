import { Link } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useRoutineFolders, useRoutines } from "@better-lift/api-client";
import { type RoutineSummary } from "@better-lift/validators";

import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Routines, côté terrain (doc 06).
 *
 * Le mobile **consulte**, il ne construit pas : la liste et l'aperçu suffisent
 * à retrouver ce qu'on a prévu en arrivant à la salle. L'édition sérieuse reste
 * sur le web, qui est l'atelier (doc 01), et l'édition simplifiée de D9 viendra
 * quand les séances lui donneront un usage — ajuster une routine sans pouvoir
 * la lancer n'en a pas.
 *
 * `ScrollView` et non `FlatList` : le nombre de routines est borné par l'effort
 * de leur auteur, quelques dizaines au plus, et le regroupement par dossier
 * demanderait des sections là où une simple boucle suffit (même raisonnement
 * que D21).
 */

function RoutineCard({ routine, locale }: { routine: RoutineSummary; locale: string }) {
  const lastPerformed = routine.lastPerformedAt
    ? // Locale du **profil**, pas celle de l'appareil.
      new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(routine.lastPerformedAt),
      )
    : "Jamais effectuée";

  return (
    <Link href={`/routine/${routine.id}`} asChild>
      <Pressable style={styles.card} accessibilityRole="button">
        <Text style={styles.cardTitle} numberOfLines={1}>
          {routine.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {routine.exerciseCount} exercice{routine.exerciseCount > 1 ? "s" : ""} · {lastPerformed}
        </Text>
      </Pressable>
    </Link>
  );
}

export function RoutineList() {
  const locale = useProfileLocale();
  const folders = useRoutineFolders(apiClient);
  const routines = useRoutines(apiClient);

  /**
   * Regroupement côté client : la liste n'est pas paginée et arrive entière,
   * donc un appel par dossier serait du trafic pur. Les dossiers vides sont
   * masqués ici, contrairement au web — on ne les gère pas depuis le mobile,
   * les afficher n'apporterait qu'une ligne morte sur un petit écran.
   */
  const groups = useMemo(() => {
    const all = routines.data ?? [];

    return [
      ...(folders.data ?? [])
        .map((folder) => ({
          key: folder.id,
          title: folder.name,
          routines: all.filter((routine) => routine.folderId === folder.id),
        }))
        .filter((group) => group.routines.length > 0),
      {
        key: "sans-dossier",
        title: "Sans dossier",
        routines: all.filter((routine) => routine.folderId === null),
      },
    ].filter((group) => group.routines.length > 0);
  }, [folders.data, routines.data]);

  if (routines.isPending || folders.isPending) {
    return <ActivityIndicator color="#7ad6a5" style={styles.spacer} />;
  }

  if (routines.isError) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Routines indisponibles</Text>
        <Text style={styles.emptyHint}>{routines.error.message}</Text>
        <Pressable
          style={styles.retry}
          onPress={() => void routines.refetch()}
          accessibilityRole="button"
        >
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Aucune routine</Text>
        <Text style={styles.emptyHint}>
          Une routine se construit sur le web : grand écran, clavier, glisser-déposer. Elle
          apparaîtra ici aussitôt.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} locale={locale} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 20 },
  group: { gap: 8 },
  groupTitle: {
    color: "#9aa3ad",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  card: { backgroundColor: "#1a1f25", borderRadius: 12, padding: 14, gap: 4 },
  cardTitle: { color: "#f2f4f6", fontSize: 16, fontWeight: "500" },
  cardMeta: { color: "#9aa3ad", fontSize: 13 },
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
});
