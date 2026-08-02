import { describe, expect, it } from "vitest";

import { type LastPerformance, type RoutineDetail } from "@better-lift/validators";

import {
  columnsFor,
  completedSetCount,
  draftFromRoutine,
  draftReducer,
  newWorkoutId,
  normalizeDecimal,
  toCreateWorkoutInput,
  type WorkoutDraft,
} from "./draft";

function routine(): RoutineDetail {
  return {
    id: "rtn_1",
    name: "Push A",
    folderId: null,
    notes: null,
    position: 0,
    exerciseCount: 1,
    lastPerformedAt: null,
    performedCount: 0,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    exercises: [
      {
        id: "rex_1",
        position: 0,
        notes: "Coudes serrés",
        restSec: 180,
        supersetGroup: null,
        exercise: {
          id: "exo_1",
          name: "Développé couché",
          type: "WEIGHT_REPS",
          bodyPart: "CHEST",
          equipment: "barbell",
          target: "pectorals",
          secondaryMuscles: [],
          thumbnailUrl: null,
          animationUrl: null,
          attribution: null,
          isCustom: false,
        },
        sets: [
          {
            id: "rst_1",
            position: 0,
            type: "WARMUP",
            targetReps: 10,
            targetWeightKg: "40.00",
            targetDurationSec: null,
            targetDistanceM: null,
            targetRpe: null,
          },
          {
            id: "rst_2",
            position: 1,
            type: "NORMAL",
            targetReps: 5,
            targetWeightKg: "100.00",
            targetDurationSec: null,
            targetDistanceM: null,
            targetRpe: "8.0",
          },
        ],
      },
    ],
  };
}

const PERFORMANCES: LastPerformance[] = [
  {
    exerciseId: "exo_1",
    workoutId: "wkt_old",
    performedAt: "2026-07-30T10:00:00.000Z",
    sets: [
      {
        position: 0,
        type: "WARMUP",
        reps: 10,
        weightKg: "40.00",
        durationSec: null,
        distanceM: null,
        rpe: null,
      },
      {
        position: 1,
        type: "NORMAL",
        reps: 5,
        weightKg: "102.50",
        durationSec: null,
        distanceM: null,
        rpe: null,
      },
    ],
  },
];

function start(): WorkoutDraft {
  const draft = draftFromRoutine(routine(), PERFORMANCES, new Date("2026-08-02T17:00:00.000Z"));

  if (!draft) {
    throw new Error("brouillon attendu");
  }

  return draft;
}

/** Le réducteur tolère `null` ; les tests travaillent sur un brouillon réel. */
function apply(
  draft: WorkoutDraft,
  ...actions: Parameters<typeof draftReducer>[1][]
): WorkoutDraft {
  const next = actions.reduce<WorkoutDraft | null>(
    (current, action) => draftReducer(current, action),
    draft,
  );

  if (!next) {
    throw new Error("brouillon attendu");
  }

  return next;
}

describe("draftFromRoutine", () => {
  it("should copy the exercise name so the draft survives the routine", () => {
    const draft = start();

    // Une séance est un instantané indépendant : elle ne doit pas redevenir
    // illisible parce que la routine a été supprimée depuis le web.
    expect(draft.exercises[0]?.name).toBe("Développé couché");
    expect(draft.exercises[0]?.exerciseType).toBe("WEIGHT_REPS");
    expect(draft.routineId).toBe("rtn_1");
  });

  it("should keep the set types but leave the values empty", () => {
    const draft = start();
    const sets = draft.exercises[0]?.sets ?? [];

    expect(sets.map((set) => set.type)).toEqual(["WARMUP", "NORMAL"]);
    // La cible n'est pas recopiée dans le champ : c'est la **dernière
    // performance** qui pré-remplit, pas une charge prescrite il y a six mois.
    expect(sets.map((set) => set.weightKg)).toEqual(["", ""]);
  });

  it("should carry the previous performance for the placeholders", () => {
    const previous = start().exercises[0]?.previous ?? [];

    expect(previous[1]?.label).toBe("102.50 × 5");
    expect(previous[1]?.values).toEqual({ weightKg: "102.50", reps: "5" });
  });

  it("should leave the previous column empty for a never-performed exercise", () => {
    const draft = draftFromRoutine(routine(), []);

    expect(draft.exercises[0]?.previous).toEqual([]);
  });
});

describe("draftReducer", () => {
  it("should date a set when it is validated and clear it when reopened", () => {
    const draft = start();
    const setKey = draft.exercises[0]?.sets[1]?.key ?? "";
    const exerciseKey = draft.exercises[0]?.key ?? "";

    const checked = apply(draft, {
      type: "toggleSet",
      exerciseKey,
      setKey,
      at: "2026-08-02T17:30:00.000Z",
    });

    expect(checked.exercises[0]?.sets[1]?.completed).toBe(true);
    expect(checked.exercises[0]?.sets[1]?.completedAt).toBe("2026-08-02T17:30:00.000Z");

    const unchecked = apply(checked, {
      type: "toggleSet",
      exerciseKey,
      setKey,
      at: "2026-08-02T17:31:00.000Z",
    });

    // Une série rouverte n'a pas été validée à l'instant où elle l'avait été.
    expect(unchecked.exercises[0]?.sets[1]?.completedAt).toBeNull();
  });

  it("should carry the last values over to a new set", () => {
    const draft = start();
    const exerciseKey = draft.exercises[0]?.key ?? "";

    const filled = apply(
      draft,
      {
        type: "setField",
        exerciseKey,
        setKey: draft.exercises[0]?.sets[1]?.key ?? "",
        field: "weightKg",
        value: "105",
      },
      { type: "addSet", exerciseKey },
    );

    const added = filled.exercises[0]?.sets[2];

    // Retaper la même charge entre deux séries est exactement la friction
    // que l'écran cherche à supprimer.
    expect(added?.weightKg).toBe("105");
    expect(added?.completed).toBe(false);
  });

  it("should not carry a warm-up type over to the next set", () => {
    const draft = start();
    const exerciseKey = draft.exercises[0]?.key ?? "";

    // On n'enchaîne pas deux échauffements par défaut : après l'échauffement
    // vient le travail.
    const added = apply(
      draft,
      { type: "removeSet", exerciseKey, setKey: draft.exercises[0]?.sets[1]?.key ?? "" },
      { type: "addSet", exerciseKey },
    );

    expect(added.exercises[0]?.sets[1]?.type).toBe("NORMAL");
  });

  it("should cycle the set type back to normal", () => {
    const draft = start();
    const exerciseKey = draft.exercises[0]?.key ?? "";
    const setKey = draft.exercises[0]?.sets[1]?.key ?? "";
    const cycle = { type: "cycleSetType", exerciseKey, setKey } as const;

    expect(apply(draft, cycle).exercises[0]?.sets[1]?.type).toBe("WARMUP");
    expect(apply(draft, cycle, cycle, cycle, cycle).exercises[0]?.sets[1]?.type).toBe("NORMAL");
  });

  it("should ignore every action but replace when no workout is running", () => {
    expect(draftReducer(null, { type: "setTitle", value: "Push A" })).toBeNull();
  });
});

describe("toCreateWorkoutInput", () => {
  it("should accept a decimal comma and send it as a point", () => {
    const draft = start();
    const exerciseKey = draft.exercises[0]?.key ?? "";

    const filled = apply(draft, {
      type: "setField",
      exerciseKey,
      setKey: draft.exercises[0]?.sets[1]?.key ?? "",
      field: "weightKg",
      value: "82,5",
    });

    const input = toCreateWorkoutInput(filled, new Date("2026-08-02T18:00:00.000Z"));

    // Sans normalisation, « 82,5 » partirait en `82` — une erreur muette sur
    // une charge, et un record faussé.
    expect(input.exercises?.[0]?.sets?.[1]?.weightKg).toBe("82.5");
  });

  it("should omit empty fields rather than send zeros", () => {
    const input = toCreateWorkoutInput(start(), new Date("2026-08-02T18:00:00.000Z"));
    const set = input.exercises?.[0]?.sets?.[0];

    // `0` et « rien tapé » sont deux choses différentes : un zéro se
    // stockerait comme une charge nulle réellement soulevée.
    expect(set?.weightKg).toBeUndefined();
    expect(set?.reps).toBeUndefined();
  });

  it("should keep unvalidated sets, which say what was planned and not done", () => {
    const input = toCreateWorkoutInput(start(), new Date("2026-08-02T18:00:00.000Z"));

    expect(input.exercises?.[0]?.sets).toHaveLength(2);
    expect(input.exercises?.[0]?.sets?.every((set) => set.completed === false)).toBe(true);
  });

  it("should send the client-generated id, which carries the idempotence", () => {
    const draft = start();
    const input = toCreateWorkoutInput(draft, new Date("2026-08-02T18:00:00.000Z"));

    expect(input.id).toBe(draft.id);
  });
});

describe("newWorkoutId", () => {
  it("should stay within the alphabet the contract accepts", () => {
    // Le contrat borne l'identifiant à l'alphabet des cuid : il est repris tel
    // quel dans une URL et dans une clé de cache.
    expect(newWorkoutId()).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it("should not repeat itself", () => {
    const ids = new Set(Array.from({ length: 200 }, newWorkoutId));

    expect(ids.size).toBe(200);
  });
});

describe("colonnes selon le type d'exercice", () => {
  it("should offer the fields the exercise type actually measures", () => {
    // Le tableau de la doc 03 décide des colonnes affichées : proposer une
    // charge sur un gainage n'a pas de sens.
    expect(columnsFor("WEIGHT_REPS")).toEqual(["weightKg", "reps"]);
    expect(columnsFor("DURATION")).toEqual(["durationSec"]);
    expect(columnsFor("DISTANCE_DURATION")).toEqual(["distanceM", "durationSec"]);
    expect(columnsFor("REPS_ONLY")).toEqual(["reps"]);
  });
});

describe("completedSetCount", () => {
  it("should count only validated sets", () => {
    const draft = start();

    expect(completedSetCount(draft)).toBe(0);
    expect(
      completedSetCount(
        apply(draft, {
          type: "toggleSet",
          exerciseKey: draft.exercises[0]?.key ?? "",
          setKey: draft.exercises[0]?.sets[0]?.key ?? "",
          at: "2026-08-02T17:10:00.000Z",
        }),
      ),
    ).toBe(1);
  });
});

describe("normalizeDecimal", () => {
  it("should trim and accept the french decimal comma", () => {
    expect(normalizeDecimal(" 82,50 ")).toBe("82.50");
    expect(normalizeDecimal("")).toBe("");
  });
});
