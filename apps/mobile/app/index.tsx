import { Link, Stack } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useHealth, useVersion } from "@better-lift/api-client";
import { estimate1RM, kgToLb, setVolume } from "@better-lift/core";

import { SessionPanel } from "@/features/auth/session-panel";
import { SyncBanner } from "@/features/workouts/sync-banner";
import { useStartWorkout } from "@/features/workouts/use-start-workout";
import { apiClient } from "@/lib/api";
import { API_URL } from "@/lib/env";

const SAMPLE_SET = { type: "NORMAL", completed: true, reps: 5, weightKg: "102.50" } as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** Preuve de la chaîne mobile → API attendue en V0. */
function ApiStatus() {
  const health = useHealth(apiClient);
  const version = useVersion(apiClient);

  if (health.isPending) {
    return <ActivityIndicator color="#7ad6a5" />;
  }

  if (health.isError) {
    return (
      <View style={styles.stack}>
        <Text style={styles.statusDown}>API injoignable</Text>
        <Text style={styles.hint}>{health.error.message}</Text>
        <Text style={styles.hint}>
          Depuis un téléphone physique, EXPO_PUBLIC_API_URL doit pointer sur l’IP LAN de la machine,
          pas sur localhost.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Text style={health.data.status === "ok" ? styles.statusOk : styles.statusDegraded}>
        {health.data.status === "ok" ? "API opérationnelle" : "API dégradée"}
      </Text>
      <Row label="Base de données" value={health.data.db === "ok" ? "connectée" : "injoignable"} />
      <Row label="Version API" value={health.data.version} />
      <Row label="Logique métier" value={version.data?.core ?? "…"} />
      <Row label="Uptime" value={`${health.data.uptimeSec} s`} />
    </View>
  );
}

/** Preuve que `packages/core` se résout aussi depuis Metro. */
function CoreCheck() {
  return (
    <View style={styles.stack}>
      <Row
        label={`Série — ${SAMPLE_SET.reps} × ${SAMPLE_SET.weightKg} kg`}
        value={`${kgToLb(SAMPLE_SET.weightKg)} lb`}
      />
      <Row label="Volume de la série" value={`${setVolume(SAMPLE_SET, "WEIGHT_REPS")} kg`} />
      <Row
        label="1RM estimé (Epley)"
        value={`${estimate1RM(SAMPLE_SET.weightKg, SAMPLE_SET.reps)} kg`}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { startFree, inProgress } = useStartWorkout(apiClient);

  return (
    <>
      <Stack.Screen options={{ title: "better-lift" }} />
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.subtitle}>Socle technique V0 — outil de terrain</Text>

        {/*
          En tête d'accueil : une séance mise en file est enregistrée du point
          de vue de l'utilisateur, et ne se retrouve nulle part ailleurs tant
          qu'elle n'est pas partie.
        */}
        <SyncBanner />

        {/*
          Une séance en cours n'est jamais écrasée : tant qu'il en existe une,
          ce bouton la reprend. La barre persistante de la doc 06 viendra avec
          les onglets ; d'ici là, c'est le seul chemin de retour depuis
          l'accueil.
        */}
        <Pressable style={styles.start} onPress={startFree} accessibilityRole="button">
          <Text style={styles.startLabel}>
            {inProgress ? "Reprendre la séance en cours" : "Séance libre"}
          </Text>
        </Pressable>

        <Link href="/routines" asChild>
          <Pressable style={styles.action}>
            <Text style={styles.actionLabel}>Mes routines</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
        </Link>

        <Link href="/exercises" asChild>
          <Pressable style={styles.action}>
            <Text style={styles.actionLabel}>Catalogue d’exercices</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
        </Link>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chaîne mobile → API</Text>
          <ApiStatus />
          <Text style={styles.hint}>{API_URL}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logique métier partagée</Text>
          <CoreCheck />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Better Auth</Text>
          <SessionPanel />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  subtitle: { color: "#9aa3ad", fontSize: 14 },
  card: { backgroundColor: "#1a1f25", borderRadius: 14, padding: 16, gap: 12 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1f25",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionLabel: { color: "#f2f4f6", fontSize: 15, fontWeight: "500" },
  start: {
    backgroundColor: "#7ad6a5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  startLabel: { color: "#11161b", fontSize: 15, fontWeight: "600" },
  actionChevron: { color: "#9aa3ad", fontSize: 20 },
  cardTitle: {
    color: "#9aa3ad",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stack: { gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  rowLabel: { color: "#9aa3ad", fontSize: 14, flexShrink: 1 },
  rowValue: { color: "#f2f4f6", fontSize: 14, fontVariant: ["tabular-nums"] },
  statusOk: { color: "#7ad6a5", fontWeight: "600", marginBottom: 4 },
  statusDegraded: { color: "#e8c468", fontWeight: "600", marginBottom: 4 },
  statusDown: { color: "#f08a7a", fontWeight: "600" },
  hint: { color: "#6d7680", fontSize: 12 },
});
