import { describe, expect, it } from "vitest";
import { addDays } from "./stats";

describe("addDays", () => {
  it("ajoute des jours en franchissant les mois", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
