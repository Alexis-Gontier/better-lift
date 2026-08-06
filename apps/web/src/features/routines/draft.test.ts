import { describe, expect, it } from "vitest";

import { type ExerciseSummary } from "@better-lift/validators";

import {
  countSets,
  type DraftAction,
  draftReducer,
  emptyDraft,
  normalizeDecimal,
  type RoutineDraft,
  toStructure,
} from "./draft";

function exercise(id: string, name = "Développé couché"): ExerciseSummary {
  return {
    id,
    name,
    type: "WEIGHT_REPS",
    bodyPart: "CHEST",
    equipment: "barbell",
    target: "pectorals",
    secondaryMuscles: [],
    thumbnailUrl: null,
    animationUrl: null,
    attribution: null,
    isCustom: false,
  };
}

/** Rejoue une suite d'actions, comme le ferait l'écran. */
function apply(draft: RoutineDraft, ...actions: DraftAction[]): RoutineDraft {
  return actions.reduce(draftReducer, draft);
}

const WITH_TWO = apply(
  emptyDraft(),
  { type: "addExercise", exercise: exercise("exo_1", "Développé couché") },
  { type: "addExercise", exercise: exercise("exo_2", "Rowing barre") },
);

describe("draftReducer", () => {
  it("should give a new exercise one set rather than none", () => {
    // Le contrat en exige au moins une : découvrir la règle à l'enregistrement
    // serait une mauvaise surprise en fin de saisie.
    expect(WITH_TWO.exercises[0]?.sets).toHaveLength(1);
  });

  it("should give every exercise and set a distinct key", () => {
    const keys = WITH_TWO.exercises.flatMap((entry) => [
      entry.key,
      ...entry.sets.map((set) => set.key),
    ]);

    // Les clés portent le glisser-déposer : deux identiques le rendraient fou.
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("should reorder exercises when one is dropped onto another", () => {
    const first = WITH_TWO.exercises[0]?.key ?? "";
    const second = WITH_TWO.exercises[1]?.key ?? "";

    const moved = draftReducer(WITH_TWO, { type: "moveExercise", from: second, to: first });

    expect(moved.exercises.map((entry) => entry.exercise.name)).toEqual([
      "Rowing barre",
      "Développé couché",
    ]);
  });

  it("should leave the order untouched when the drop target is unknown", () => {
    const first = WITH_TWO.exercises[0]?.key ?? "";

    // Un déposé sur une clé disparue ne doit pas réordonner au hasard.
    expect(
      draftReducer(WITH_TWO, { type: "moveExercise", from: first, to: "cle_inconnue" }).exercises,
    ).toBe(WITH_TWO.exercises);
  });

  it("should copy the last set's values when adding a set", () => {
    const key = WITH_TWO.exercises[0]?.key ?? "";
    const setKey = WITH_TWO.exercises[0]?.sets[0]?.key ?? "";

    const filled = apply(
      WITH_TWO,
      { type: "setSetField", exerciseKey: key, setKey, field: "targetReps", value: "5" },
      { type: "setSetField", exerciseKey: key, setKey, field: "targetWeightKg", value: "100" },
      { type: "addSet", exerciseKey: key },
    );

    const sets = filled.exercises[0]?.sets ?? [];

    // C'est ce qui économise l'essentiel des saisies d'une routine (doc 05).
    expect(sets).toHaveLength(2);
    expect(sets[1]).toMatchObject({ targetReps: "5", targetWeightKg: "100" });
    // …mais avec une identité propre, sinon les deux lignes seraient liées.
    expect(sets[1]?.key).not.toBe(sets[0]?.key);
  });

  it("should keep one set when the last one is removed", () => {
    const key = WITH_TWO.exercises[0]?.key ?? "";
    const setKey = WITH_TWO.exercises[0]?.sets[0]?.key ?? "";

    const emptied = draftReducer(WITH_TWO, { type: "removeSet", exerciseKey: key, setKey });

    // Un exercice sans série n'a rien à prescrire, et le contrat le refuserait.
    expect(emptied.exercises[0]?.sets).toHaveLength(1);
  });

  it("should remove an exercise without touching the others", () => {
    const first = WITH_TWO.exercises[0]?.key ?? "";

    const removed = draftReducer(WITH_TWO, { type: "removeExercise", key: first });

    expect(removed.exercises.map((entry) => entry.exercise.name)).toEqual(["Rowing barre"]);
  });
});

describe("normalizeDecimal", () => {
  it("should accept the comma a French numeric keypad produces", () => {
    // Refuser « 82,5 » pour cette seule raison serait incompréhensible.
    expect(normalizeDecimal("82,5")).toBe("82.5");
  });

  it("should trim without altering an already valid value", () => {
    expect(normalizeDecimal(" 100.00 ")).toBe("100.00");
  });
});

describe("toStructure", () => {
  it("should omit empty target fields rather than sending zeros", () => {
    const structure = toStructure(WITH_TWO);
    const set = structure.exercises?.[0]?.sets[0];

    /**
     * Distinguer « non prescrit » de « prescrit à zéro » est tout l'intérêt
     * d'un gabarit : une routine peut ne demander qu'un nombre de séries.
     */
    expect(set?.targetReps).toBeUndefined();
    expect(set?.targetWeightKg).toBeUndefined();
    expect(set?.targetRpe).toBeUndefined();
  });

  it("should send no position at all", () => {
    const structure = toStructure(WITH_TWO);

    // L'ordre du tableau porte la position, le serveur l'assigne (doc 04) —
    // et le corps étant strict, en envoyer une répondrait 422.
    expect(structure.exercises?.[0]).not.toHaveProperty("position");
    expect(structure.exercises?.[0]?.sets[0]).not.toHaveProperty("position");
  });

  it("should normalise a decimal typed with a comma", () => {
    const key = WITH_TWO.exercises[0]?.key ?? "";
    const setKey = WITH_TWO.exercises[0]?.sets[0]?.key ?? "";

    const filled = draftReducer(WITH_TWO, {
      type: "setSetField",
      exerciseKey: key,
      setKey,
      field: "targetWeightKg",
      value: "82,5",
    });

    expect(toStructure(filled).exercises?.[0]?.sets[0]?.targetWeightKg).toBe("82.5");
  });

  it("should trim the name and blank out empty notes", () => {
    const named = apply(
      WITH_TWO,
      { type: "setName", value: "  Push A  " },
      { type: "setNotes", value: "   " },
    );

    const structure = toStructure(named);

    expect(structure.name).toBe("Push A");
    expect(structure.notes).toBeNull();
  });
});

describe("countSets", () => {
  it("should total the sets across every exercise", () => {
    const key = WITH_TWO.exercises[0]?.key ?? "";

    expect(countSets(apply(WITH_TWO, { type: "addSet", exerciseKey: key }))).toBe(3);
  });
});
