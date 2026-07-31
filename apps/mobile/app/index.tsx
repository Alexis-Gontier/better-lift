import { Stack } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { useHealth, useVersion } from "@better-lift/api-client";
import { estimate1RM, kgToLb, setVolume } from "@better-lift/core";

import { API_URL, apiClient } from "@/lib/api";

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
  return (
    <>
      <Stack.Screen options={{ title: "better-lift" }} />
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.subtitle}>Socle technique V0 — outil de terrain</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chaîne mobile → API</Text>
          <ApiStatus />
          <Text style={styles.hint}>{API_URL}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logique métier partagée</Text>
          <CoreCheck />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  subtitle: { color: "#9aa3ad", fontSize: 14 },
  card: { backgroundColor: "#1a1f25", borderRadius: 14, padding: 16, gap: 12 },
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
