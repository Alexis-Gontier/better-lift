import { describe, expect, it } from "vitest";

import { isPersonalRecord, recordValue } from "./records.js";
import { type MeasuredSet } from "./types.js";

function set(overrides: Partial<MeasuredSet> = {}): MeasuredSet {
  return { type: "NORMAL", completed: true, reps: 5, weightKg: "100.00", ...overrides };
}

describe("isPersonalRecord", () => {
  it("est vrai quand aucun record n'existe encore", () => {
    expect(isPersonalRecord("80.00", null)).toBe(true);
    expect(isPersonalRecord("80.00", undefined)).toBe(true);
  });

  it("exige une valeur strictement supérieure : un record ne baisse jamais", () => {
    expect(isPersonalRecord("100.00", "90.00")).toBe(true);
    expect(isPersonalRecord("90.00", "100.00")).toBe(false);
  });

  it("refuse l'égalité pour que le record garde sa date d'origine", () => {
    expect(isPersonalRecord("100.00", "100.00")).toBe(false);
  });

  it("refuse une valeur nulle ou négative", () => {
    expect(isPersonalRecord(0, null)).toBe(false);
    expect(isPersonalRecord(-10, null)).toBe(false);
  });
});

describe("recordValue", () => {
  it("ignore l'échauffement et les séries non validées", () => {
    expect(recordValue(set({ type: "WARMUP" }), "WEIGHT_REPS", "BEST_WEIGHT")).toBeNull();
    expect(recordValue(set({ completed: false }), "WEIGHT_REPS", "BEST_WEIGHT")).toBeNull();
  });

  it("calcule la charge, le volume de série et les répétitions", () => {
    expect(recordValue(set(), "WEIGHT_REPS", "BEST_WEIGHT")).toBe(100);
    expect(recordValue(set(), "WEIGHT_REPS", "BEST_SET_VOLUME")).toBe(500);
    expect(recordValue(set(), "WEIGHT_REPS", "BEST_REPS")).toBe(5);
  });

  it("estime le 1RM", () => {
    expect(recordValue(set(), "WEIGHT_REPS", "BEST_1RM")).toBe(116.67);
  });

  it("n'estime pas de 1RM sur un exercice assisté : la charge est soustraite", () => {
    expect(recordValue(set(), "ASSISTED_BODYWEIGHT", "BEST_1RM")).toBeNull();
  });

  it("lit la durée et la distance", () => {
    const plank = set({ reps: null, weightKg: null, durationSec: 120 });
    expect(recordValue(plank, "DURATION", "BEST_DURATION")).toBe(120);

    const row = set({ reps: null, weightKg: null, distanceM: "5000.00" });
    expect(recordValue(row, "DISTANCE_DURATION", "BEST_DISTANCE")).toBe(5000);
  });

  it("renvoie null quand la mesure est absente", () => {
    const bodyweight = set({ weightKg: null });
    expect(recordValue(bodyweight, "BODYWEIGHT_REPS", "BEST_WEIGHT")).toBeNull();
    expect(recordValue(bodyweight, "BODYWEIGHT_REPS", "BEST_SET_VOLUME")).toBeNull();
  });
});
