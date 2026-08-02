import { memo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  COLUMN_LABELS,
  type Column,
  columnsFor,
  type DraftAction,
  type DraftExercise,
  type DraftSet,
  type PreviousSet,
} from "./draft";
import { SET_TYPE_SHORT, SET_TYPE_TONE } from "@/features/routines/labels";

/**
 * Une ligne de série.
 *
 * Le geste central du produit est la **coche** : elle valide la série et
 * déclenche le repos, en un seul appui (doc 06). Tout le reste de la ligne est
 * secondaire — dans le cas nominal, les champs sont déjà remplis par la
 * dernière séance et l'utilisateur ne tape rien.
 *
 * `memo` n'est pas décoratif : à chaque frappe, le brouillon entier est
 * remplacé, donc toutes les lignes de la séance se rerendraient. Sur une séance
 * de quarante séries, cela se sent au clavier.
 */
const SetRow = memo(function SetRow({
  set,
  index,
  columns,
  previous,
  exerciseKey,
  update,
  onComplete,
}: {
  set: DraftSet;
  index: number;
  columns: readonly Column[];
  previous: PreviousSet | undefined;
  exerciseKey: string;
  update: (action: DraftAction) => void;
  onComplete: () => void;
}) {
  return (
    <View style={[styles.row, set.completed && styles.rowDone]}>
      {/*
        Appui simple : changer de type — réversible, on repasse par le cycle.
        Appui **long** : supprimer. Le geste destructeur est le plus difficile
        des deux, jamais celui qu'on déclenche en visant mal entre deux séries.
        Le balayage prescrit par la doc 06 attend `react-native-gesture-handler`.
      */}
      <Pressable
        onPress={() => {
          update({ type: "cycleSetType", exerciseKey, setKey: set.key });
        }}
        onLongPress={() => {
          update({ type: "removeSet", exerciseKey, setKey: set.key });
        }}
        style={styles.cellIndex}
        accessibilityRole="button"
        accessibilityLabel={`Série ${index + 1}, type ${set.type}. Appui pour changer de type, appui long pour supprimer.`}
      >
        <Text style={[styles.indexText, { color: SET_TYPE_TONE[set.type] }]}>
          {SET_TYPE_SHORT[set.type] || index + 1}
        </Text>
      </Pressable>

      <Text style={[styles.cell, styles.previous]} numberOfLines={1}>
        {previous?.label ?? "—"}
      </Text>

      {columns.map((column) => (
        <TextInput
          key={column}
          value={set[column]}
          onChangeText={(value) => {
            update({ type: "setField", exerciseKey, setKey: set.key, field: column, value });
          }}
          // Clavier décimal : la charge s'écrit « 82,5 », le brouillon accepte
          // la virgule et normalise à l'envoi.
          inputMode="decimal"
          // Le placeholder reprend la valeur de la dernière séance, pas un
          // zéro : c'est le repère qui permet de décider de sa charge sans
          // réfléchir. Dans le cas nominal, il n'y a rien à taper.
          placeholder={previous?.values[column] ?? "—"}
          placeholderTextColor="#4d545c"
          selectTextOnFocus
          style={[styles.cell, styles.input, set.completed && styles.inputDone]}
          accessibilityLabel={`${COLUMN_LABELS[column]}, série ${index + 1}`}
        />
      ))}

      <Pressable
        onPress={onComplete}
        style={[styles.check, set.completed && styles.checkDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.completed }}
        accessibilityLabel={`Valider la série ${index + 1}`}
      >
        <Text style={[styles.checkMark, set.completed && styles.checkMarkDone]}>✓</Text>
      </Pressable>
    </View>
  );
});

export function ExerciseBlock({
  exercise,
  update,
  onSetCompleted,
}: {
  exercise: DraftExercise;
  update: (action: DraftAction) => void;
  /** Reçoit le repos de l'exercice : c'est lui qui arme le minuteur. */
  onSetCompleted: (restSec: number | null) => void;
}) {
  const columns = columnsFor(exercise.exerciseType);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {exercise.name}
        </Text>
        <Pressable
          onPress={() => {
            update({ type: "removeExercise", exerciseKey: exercise.key });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${exercise.name} de la séance`}
          hitSlop={8}
        >
          <Text style={styles.remove}>Retirer</Text>
        </Pressable>
      </View>

      {exercise.notes ? <Text style={styles.notes}>{exercise.notes}</Text> : null}

      <View style={styles.head}>
        <Text style={[styles.cellIndex, styles.headText]}>#</Text>
        <Text style={[styles.cell, styles.headText]}>Préc.</Text>
        {columns.map((column) => (
          <Text key={column} style={[styles.cell, styles.headText]}>
            {COLUMN_LABELS[column]}
          </Text>
        ))}
        <View style={styles.check} />
      </View>

      {exercise.sets.map((set, index) => (
        <SetRow
          key={set.key}
          set={set}
          index={index}
          columns={columns}
          previous={exercise.previous[index]}
          exerciseKey={exercise.key}
          update={update}
          onComplete={() => {
            update({
              type: "toggleSet",
              exerciseKey: exercise.key,
              setKey: set.key,
              at: new Date().toISOString(),
            });

            // Le repos ne se déclenche qu'à la validation, jamais à la
            // réouverture d'une série déjà cochée.
            if (!set.completed) {
              onSetCompleted(exercise.restSec);
            }
          }}
        />
      ))}

      <Pressable
        onPress={() => {
          update({ type: "addSet", exerciseKey: exercise.key });
        }}
        style={styles.addSet}
        accessibilityRole="button"
      >
        <Text style={styles.addSetLabel}>+ Ajouter une série</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1a1f25", borderRadius: 14, padding: 14, gap: 2 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: { color: "#f2f4f6", fontSize: 16, fontWeight: "500", flexShrink: 1 },
  remove: { color: "#6d7680", fontSize: 13 },
  notes: { color: "#9aa3ad", fontSize: 13, marginTop: 4 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#222931",
    gap: 8,
  },
  headText: { color: "#6d7680", fontSize: 12, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 4, gap: 8 },
  rowDone: { backgroundColor: "#18241d", borderRadius: 8 },
  cell: { flex: 1, fontSize: 15, textAlign: "center" },
  cellIndex: { width: 40, alignItems: "center" },
  indexText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  previous: { color: "#6d7680", fontSize: 13, fontVariant: ["tabular-nums"] },
  input: {
    color: "#f2f4f6",
    backgroundColor: "#222931",
    borderRadius: 8,
    paddingVertical: 8,
    fontVariant: ["tabular-nums"],
  },
  inputDone: { backgroundColor: "#243329" },
  check: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#222931",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: "#7ad6a5" },
  checkMark: { color: "#4d545c", fontSize: 18, fontWeight: "700" },
  checkMarkDone: { color: "#11161b" },
  addSet: { paddingVertical: 10, alignItems: "center" },
  addSetLabel: { color: "#7ad6a5", fontSize: 14 },
});
