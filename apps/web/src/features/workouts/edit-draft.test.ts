import { describe, expect, it } from "vitest";

import { type ExerciseSummary, type WorkoutDetail } from "@better-lift/validators";

import {
  columnsFor,
  countCompletedSets,
  type DraftAction,
  draftReducer,
  fromDetail,
  fromLocalInput,
  normalizeDecimal,
  toLocalInput,
  toStructure,
  type WorkoutEditDraft,
} from "./edit-draft";

const BENCH: ExerciseSummary = {
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
};

function workout(): WorkoutDetail {
  return {
    id: "wkt_1",
    routineId: "rtn_1",
    title: "Push A",
    notes: null,
    startedAt: "2026-08-01T16:00:00.000Z",
    endedAt: "2026-08-01T17:10:00.000Z",
    durationSec: 4200,
    visibility: "PRIVATE",
    totalVolumeKg: "1000.00",
    totalSets: 2,
    totalReps: 10,
    exerciseCount: 1,
    prCount: 0,
    createdAt: "2026-08-01T17:10:00.000Z",
    updatedAt: "2026-08-01T17:10:00.000Z",
    exercises: [
      {
        id: "wex_1",
        position: 0,
        notes: "Coudes serrés",
        restSec: 180,
        supersetGroup: null,
        exercise: BENCH,
        sets: [
          {
            id: "wst_1",
            position: 0,
            type: "WARMUP",
            reps: 10,
            weightKg: "40.00",
            durationSec: null,
            distanceM: null,
            rpe: null,
            completed: true,
            completedAt: "2026-08-01T16:05:00.000Z",
            isPr: false,
          },
          {
            id: "wst_2",
            position: 1,
            type: "NORMAL",
            reps: 5,
            weightKg: "100.00",
            durationSec: null,
            distanceM: null,
            rpe: "8.0",
            completed: false,
            completedAt: null,
            isPr: false,
          },
        ],
      },
    ],
  };
}

function apply(draft: WorkoutEditDraft, ...actions: DraftAction[]): WorkoutEditDraft {
  return actions.reduce(draftReducer, draft);
}

describe("fromDetail", () => {
  it("should carry what was actually done, validation flag included", () => {
    const draft = fromDetail(workout());
    const sets = draft.exercises[0]?.sets ?? [];

    expect(draft.title).toBe("Push A");
    expect(sets[0]?.weightKg).toBe("40.00");
    expect(sets[0]?.completed).toBe(true);
    // Une série non validée reste dans le brouillon : elle dit ce qui était
    // prévu et n'a pas été fait, et la supprimer effacerait cette information.
    expect(sets[1]?.completed).toBe(false);
  });

  it("should keep the original validation time", () => {
    const draft = fromDetail(workout());

    // Corriger une charge ne réécrit pas l'heure à laquelle la série a été
    // validée.
    expect(draft.exercises[0]?.sets[0]?.completedAt).toBe("2026-08-01T16:05:00.000Z");
  });
});

describe("toLocalInput / fromLocalInput", () => {
  it("should round-trip an instant through the local input format", () => {
    const iso = "2026-08-01T16:00:00.000Z";

    // L'entrée `datetime-local` attend une heure locale sans fuseau : découper
    // la chaîne ISO afficherait 16 h pour une séance de 18 h l'été à Paris.
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });

  it("should refuse an unparsable value rather than invent a date", () => {
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("pas une date")).toBeNull();
  });
});

describe("draftReducer", () => {
  it("should carry the previous values over to an added set", () => {
    const draft = fromDetail(workout());
    const exerciseKey = draft.exercises[0]?.key ?? "";
    const added = apply(draft, { type: "addSet", exerciseKey }).exercises[0]?.sets[2];

    expect(added?.weightKg).toBe("100.00");
    // La série ajoutée est réputée faite — on corrige une séance en notant ce
    // qu'on avait oublié — mais elle n'hérite pas de l'heure d'une autre.
    expect(added?.completed).toBe(true);
    expect(added?.completedAt).toBeNull();
  });

  it("should clear the validation time when a set is unchecked", () => {
    const draft = fromDetail(workout());
    const exerciseKey = draft.exercises[0]?.key ?? "";
    const setKey = draft.exercises[0]?.sets[0]?.key ?? "";

    const unchecked = apply(draft, { type: "toggleSet", exerciseKey, setKey });

    expect(unchecked.exercises[0]?.sets[0]?.completed).toBe(false);
    expect(unchecked.exercises[0]?.sets[0]?.completedAt).toBeNull();
  });

  it("should allow an exercise to keep zero set, unlike a routine", () => {
    const draft = fromDetail(workout());
    const exerciseKey = draft.exercises[0]?.key ?? "";
    const sets = draft.exercises[0]?.sets ?? [];

    const emptied = apply(
      draft,
      ...sets.map((set) => ({ type: "removeSet", exerciseKey, setKey: set.key }) as const),
    );

    // Un exercice commencé puis abandonné est une chose qui arrive vraiment, et
    // le contrat des séances l'accepte.
    expect(emptied.exercises[0]?.sets).toHaveLength(0);
  });

  it("should move an exercise and stop at the edges", () => {
    const draft = fromDetail(workout());
    const key = draft.exercises[0]?.key ?? "";

    const unchanged = apply(draft, { type: "moveExercise", key, direction: -1 });

    expect(unchanged.exercises[0]?.key).toBe(key);
  });
});

describe("toStructure", () => {
  it("should send what the API replaces, without positions", () => {
    const structure = toStructure(fromDetail(workout()));

    expect(structure?.title).toBe("Push A");
    expect(structure?.startedAt).toBe("2026-08-01T16:00:00.000Z");
    expect(structure?.exercises?.[0]?.exerciseId).toBe("exo_1");
    // L'ordre des tableaux porte la position : le serveur l'assigne (doc 04).
    expect(structure?.exercises?.[0]).not.toHaveProperty("position");
  });

  it("should keep the original validation time and omit the missing ones", () => {
    const draft = fromDetail(workout());
    const exerciseKey = draft.exercises[0]?.key ?? "";
    const structure = toStructure(apply(draft, { type: "addSet", exerciseKey }));

    expect(structure?.exercises?.[0]?.sets?.[0]?.completedAt).toBe("2026-08-01T16:05:00.000Z");
    // L'API pose la sienne pour toute série cochée qui arrive sans : inventer
    // un repli ici ferait exister deux règles pour la même valeur.
    expect(structure?.exercises?.[0]?.sets?.[2]?.completedAt).toBeUndefined();
  });

  it("should accept a decimal comma and send it as a point", () => {
    const draft = fromDetail(workout());
    const structure = toStructure(
      apply(draft, {
        type: "setSetField",
        exerciseKey: draft.exercises[0]?.key ?? "",
        setKey: draft.exercises[0]?.sets[1]?.key ?? "",
        field: "weightKg",
        value: "82,5",
      }),
    );

    expect(structure?.exercises?.[0]?.sets?.[1]?.weightKg).toBe("82.5");
  });

  it("should send a null end for a session still running", () => {
    const structure = toStructure(apply(fromDetail(workout()), { type: "setEndedAt", value: "" }));

    expect(structure?.endedAt).toBeNull();
  });

  it("should refuse to build a body without a valid start", () => {
    // Le seul champ sans repli sensé : l'envoyer inventé ferait glisser la
    // séance dans l'historique et fausserait le calendrier.
    expect(
      toStructure(apply(fromDetail(workout()), { type: "setStartedAt", value: "" })),
    ).toBeNull();
  });
});

describe("countCompletedSets", () => {
  it("should count only the validated sets, which alone feed volume and records", () => {
    expect(countCompletedSets(fromDetail(workout()))).toBe(1);
  });
});

describe("columnsFor", () => {
  it("should offer the fields the exercise type actually measures", () => {
    expect(columnsFor("WEIGHT_REPS")).toEqual(["weightKg", "reps"]);
    expect(columnsFor("DURATION")).toEqual(["durationSec"]);
    expect(columnsFor("DISTANCE_DURATION")).toEqual(["distanceM", "durationSec"]);
  });
});

describe("normalizeDecimal", () => {
  it("should trim and accept the french decimal comma", () => {
    expect(normalizeDecimal(" 82,50 ")).toBe("82.50");
  });
});
