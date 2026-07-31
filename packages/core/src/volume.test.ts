import { describe, expect, it } from "vitest";

import { type ExerciseType, type MeasuredSet } from "./types.js";
import {
  contributesToVolume,
  exerciseVolume,
  MAX_WORKOUT_DURATION_SEC,
  setVolume,
  workoutDurationSec,
  workoutTotals,
  workoutVolume,
} from "./volume.js";

function set(overrides: Partial<MeasuredSet> = {}): MeasuredSet {
  return { type: "NORMAL", completed: true, reps: 10, weightKg: "80.00", ...overrides };
}

describe("setVolume", () => {
  it("multiplie les répétitions par la charge", () => {
    expect(setVolume(set(), "WEIGHT_REPS")).toBe(800);
  });

  it("accepte une charge sérialisée en chaîne comme en nombre", () => {
    expect(setVolume(set({ weightKg: "82.50" }), "WEIGHT_REPS")).toBe(825);
    expect(setVolume(set({ weightKg: 82.5 }), "WEIGHT_REPS")).toBe(825);
  });

  it("exclut l'échauffement", () => {
    expect(setVolume(set({ type: "WARMUP" }), "WEIGHT_REPS")).toBe(0);
  });

  it("exclut une série planifiée mais non validée", () => {
    expect(setVolume(set({ completed: false }), "WEIGHT_REPS")).toBe(0);
  });

  it("compte les séries à l'échec et dégressives", () => {
    expect(setVolume(set({ type: "FAILURE" }), "WEIGHT_REPS")).toBe(800);
    expect(setVolume(set({ type: "DROP" }), "WEIGHT_REPS")).toBe(800);
  });

  it("compte la charge additionnelle d'une traction lestée", () => {
    expect(setVolume(set({ reps: 8, weightKg: "20.00" }), "WEIGHTED_BODYWEIGHT")).toBe(160);
  });

  it.each<ExerciseType>([
    "BODYWEIGHT_REPS",
    "ASSISTED_BODYWEIGHT",
    "REPS_ONLY",
    "DURATION",
    "DURATION_WEIGHT",
    "DISTANCE_DURATION",
  ])("ne compte pas le type %s", (exerciseType) => {
    expect(contributesToVolume(exerciseType)).toBe(false);
    expect(setVolume(set(), exerciseType)).toBe(0);
  });

  it("renvoie 0 sur des valeurs absentes ou nulles", () => {
    expect(setVolume(set({ reps: null }), "WEIGHT_REPS")).toBe(0);
    expect(setVolume(set({ weightKg: null }), "WEIGHT_REPS")).toBe(0);
    expect(setVolume(set({ reps: 0 }), "WEIGHT_REPS")).toBe(0);
  });

  it("arrondit au centième plutôt que de laisser dériver la virgule flottante", () => {
    expect(setVolume(set({ reps: 3, weightKg: "0.10" }), "WEIGHT_REPS")).toBe(0.3);
  });
});

describe("exerciseVolume / workoutVolume", () => {
  const pressExercise = {
    exerciseType: "WEIGHT_REPS" as const,
    sets: [
      set({ type: "WARMUP", reps: 12, weightKg: "40.00" }),
      set({ reps: 10, weightKg: "80.00" }),
      set({ reps: 8, weightKg: "85.00" }),
      set({ reps: 6, weightKg: "90.00", completed: false }),
    ],
  };

  it("somme les séries validées hors échauffement", () => {
    expect(exerciseVolume(pressExercise)).toBe(1480);
  });

  it("somme les exercices d'une séance", () => {
    const workout = {
      exercises: [
        pressExercise,
        { exerciseType: "BODYWEIGHT_REPS" as const, sets: [set({ reps: 20, weightKg: null })] },
      ],
    };

    expect(workoutVolume(workout)).toBe(1480);
  });

  it("renvoie 0 pour une séance vide", () => {
    expect(workoutVolume({ exercises: [] })).toBe(0);
  });
});

describe("workoutTotals", () => {
  it("compte les séries et répétitions validées, échauffement exclu", () => {
    const totals = workoutTotals({
      exercises: [
        {
          exerciseType: "WEIGHT_REPS",
          sets: [
            set({ type: "WARMUP", reps: 12, weightKg: "40.00" }),
            set({ reps: 10, weightKg: "80.00" }),
            set({ reps: 8, weightKg: "85.00" }),
          ],
        },
        {
          exerciseType: "BODYWEIGHT_REPS",
          sets: [set({ reps: 15, weightKg: null }), set({ reps: 12, weightKg: null })],
        },
      ],
    });

    expect(totals).toEqual({ totalVolumeKg: 1480, totalSets: 4, totalReps: 45 });
  });
});

describe("workoutDurationSec", () => {
  const startedAt = new Date("2026-07-31T18:00:00Z");

  it("mesure l'écart entre le début et la fin", () => {
    expect(workoutDurationSec(startedAt, new Date("2026-07-31T19:12:30Z"))).toBe(4350);
  });

  it("renvoie 0 tant que la séance est en cours", () => {
    expect(workoutDurationSec(startedAt, null)).toBe(0);
  });

  it("borne à 24 h une séance laissée ouverte toute la nuit", () => {
    expect(workoutDurationSec(startedAt, new Date("2026-08-03T09:00:00Z"))).toBe(
      MAX_WORKOUT_DURATION_SEC,
    );
  });

  it("renvoie 0 sur une fin antérieure au début", () => {
    expect(workoutDurationSec(startedAt, new Date("2026-07-31T17:00:00Z"))).toBe(0);
  });
});
