import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useCreateWorkout } from "@better-lift/api-client";

import { completedSetCount, toCreateWorkoutInput, type WorkoutDraft } from "./draft";
import { ExerciseBlock } from "./exercise-block";
import { RestTimer } from "./rest-timer";
import { formatElapsed, useTicker } from "./use-ticker";
import { useWorkoutDraft } from "./use-workout-draft";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/** Repos par défaut d'un exercice qui n'en fixe pas. Aligné sur `User.defaultRestSec`. */
const FALLBACK_REST_SEC = 120;

/**
 * Écran de séance active — celui qui fait ou défait le produit (doc 06).
 *
 * Trois propriétés portent tout le reste :
 *
 * 1. **Rien ne se perd.** Chaque mutation réécrit le brouillon en MMKV, de
 *    façon synchrone. L'app tuée entre deux séries reprend là où elle était.
 * 2. **Le chrono ne dérive pas.** Il se calcule depuis `startedAt`, jamais en
 *    incrémentant un compteur qui s'arrêterait en arrière-plan.
 * 3. **Le réseau n'intervient qu'à la fin.** Tout le remplissage est local ;
 *    l'envoi est un seul appel, idempotent par construction.
 */
export function ActiveWorkout() {
  const locale = useProfileLocale();
  const { draft, resumed, update, discard } = useWorkoutDraft();
  const createWorkout = useCreateWorkout(apiClient, locale);

  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  // L'horloge ne bat que s'il y a une séance : sans elle, elle ne ferait que
  // réveiller React une fois par seconde pour rien.
  const now = useTicker(draft !== null);

  const armRest = useCallback((restSec: number | null) => {
    setRestEndsAt(Date.now() + (restSec ?? FALLBACK_REST_SEC) * 1000);
  }, []);

  if (!draft) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Aucune séance en cours</Text>
        <Text style={styles.emptyHint}>
          Ouvrir une routine et lancer « Démarrer la séance ». Une séance interrompue se retrouve
          ici telle qu'elle était.
        </Text>
        <Pressable
          onPress={() => {
            router.replace("/routines");
          }}
          style={styles.primary}
          accessibilityRole="button"
        >
          <Text style={styles.primaryLabel}>Voir mes routines</Text>
        </Pressable>
      </View>
    );
  }

  const elapsed = Math.floor((now - Date.parse(draft.startedAt)) / 1000);
  const done = completedSetCount(draft);

  async function finish(current: WorkoutDraft) {
    try {
      const saved = await createWorkout.mutateAsync(toCreateWorkoutInput(current, new Date()));

      // Le brouillon ne part qu'**après** l'accusé de réception. Le supprimer
      // d'abord, c'est perdre la séance si l'envoi échoue.
      discard();
      router.replace(`/workout/${saved.id}`);
    } catch {
      // L'erreur est portée par la mutation, affichée sous la barre d'action :
      // le brouillon reste intact et l'envoi se retente.
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            setLeaving((value) => !value);
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Quitter la séance"
        >
          <Text style={styles.close}>✕</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {draft.title}
          </Text>
          <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
        </View>

        <Pressable
          onPress={() => {
            void finish(draft);
          }}
          disabled={done === 0 || createWorkout.isPending}
          style={[styles.finish, (done === 0 || createWorkout.isPending) && styles.finishOff]}
          accessibilityRole="button"
          accessibilityLabel="Terminer et enregistrer la séance"
        >
          {createWorkout.isPending ? (
            <ActivityIndicator color="#11161b" size="small" />
          ) : (
            <Text style={styles.finishLabel}>✓</Text>
          )}
        </Pressable>
      </View>

      {resumed ? (
        <Text style={styles.resumed}>Séance reprise là où elle s'était arrêtée.</Text>
      ) : null}

      {/*
        `✕` ne quitte jamais directement (doc 06) : une séance abandonnée par
        erreur est un incident grave. Les deux issues sont explicites, et
        « Reprendre plus tard » conserve le brouillon.
      */}
      {leaving ? (
        <View style={styles.leaving}>
          <Pressable
            onPress={() => {
              router.replace("/");
            }}
            style={styles.leavingAction}
            accessibilityRole="button"
          >
            <Text style={styles.leavingLabel}>Reprendre plus tard</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              discard();
              router.replace("/");
            }}
            style={[styles.leavingAction, styles.leavingDanger]}
            accessibilityRole="button"
          >
            <Text style={styles.leavingDangerLabel}>Abandonner la séance</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.summary}>
          {done} série{done > 1 ? "s" : ""} validée{done > 1 ? "s" : ""}
        </Text>

        {draft.exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.key}
            exercise={exercise}
            update={update}
            onSetCompleted={armRest}
          />
        ))}

        {draft.exercises.length === 0 ? (
          <Text style={styles.emptyHint}>
            Tous les exercices ont été retirés. Abandonner la séance, ou en relancer une depuis une
            routine.
          </Text>
        ) : null}

        {createWorkout.isError ? (
          <Text style={styles.error}>
            Enregistrement impossible : {createWorkout.error.message}. La séance est conservée,
            l'envoi peut être retenté.
          </Text>
        ) : null}
      </ScrollView>

      {restEndsAt === null ? null : (
        <RestTimer
          endsAt={restEndsAt}
          now={now}
          onAdjust={(deltaSec) => {
            setRestEndsAt((value) => (value === null ? null : value + deltaSec * 1000));
          }}
          onDismiss={() => {
            setRestEndsAt(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222931",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  close: { color: "#9aa3ad", fontSize: 20, width: 36 },
  title: { color: "#f2f4f6", fontSize: 15, fontWeight: "500" },
  elapsed: { color: "#7ad6a5", fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "600" },
  finish: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#7ad6a5",
    alignItems: "center",
    justifyContent: "center",
  },
  finishOff: { backgroundColor: "#2a323a" },
  finishLabel: { color: "#11161b", fontSize: 18, fontWeight: "700" },
  resumed: {
    color: "#e8c468",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    textAlign: "center",
  },
  leaving: { flexDirection: "row", gap: 10, padding: 16 },
  leavingAction: {
    flex: 1,
    backgroundColor: "#222931",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  leavingLabel: { color: "#f2f4f6", fontSize: 14 },
  leavingDanger: { backgroundColor: "#3a2422" },
  leavingDangerLabel: { color: "#f08a7a", fontSize: 14 },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  summary: { color: "#9aa3ad", fontSize: 13 },
  error: { color: "#f08a7a", fontSize: 13 },
  empty: { padding: 24, gap: 10, alignItems: "center", justifyContent: "center", flex: 1 },
  emptyTitle: { color: "#f2f4f6", fontSize: 16, fontWeight: "600" },
  emptyHint: { color: "#9aa3ad", fontSize: 13, textAlign: "center" },
  primary: {
    backgroundColor: "#7ad6a5",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryLabel: { color: "#11161b", fontSize: 15, fontWeight: "600" },
});
