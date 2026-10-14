import { describe, expect, it } from "vitest";
import { bilanRoutine, tendance } from "./bilan-routine.js";

const serie = (reps: number | null, chargeKg: number | null, type = "NORMALE", faite = true) => ({
  type: type as "NORMALE" | "ECHAUFFEMENT",
  reps,
  chargeKg,
  faite,
});

describe("bilanRoutine (D213)", () => {
  it("rend null sans séance", () => {
    expect(bilanRoutine([])).toBeNull();
  });

  it("compte, date la dernière, moyenne la durée et le volume de travail fait", () => {
    const bilan = bilanRoutine([
      {
        debut: "2026-10-01T17:00:00.000Z",
        fin: "2026-10-01T18:00:00.000Z",
        // 100 × 5 = 500 ; l'échauffement et la série non faite ne comptent pas.
        series: [serie(5, 100), serie(10, 40, "ECHAUFFEMENT"), serie(5, 100, "NORMALE", false)],
      },
      {
        debut: "2026-10-07T17:00:00.000Z",
        fin: "2026-10-07T17:30:00.000Z",
        // 80 × 10 = 800, et le poids du corps (charge nulle) ne pèse rien.
        series: [serie(10, 80), serie(12, null)],
      },
    ]);
    expect(bilan).toEqual({
      seances: 2,
      derniere: "2026-10-07T17:00:00.000Z",
      dureeMoyenneMin: 45,
      volumeMoyenKg: 650,
    });
  });
});

describe("tendance (D214)", () => {
  it("se tait sous deux valeurs", () => {
    expect(tendance([])).toBeNull();
    expect(tendance([80])).toBeNull();
  });

  it("compare la dernière à celle d'il y a jusqu'à quatre séances", () => {
    expect(tendance([70, 72, 75, 75, 80])).toBe("hausse");
    // Seule compte la valeur d'il y a quatre séances (70), pas la toute première (90).
    expect(tendance([90, 70, 72, 75, 75, 70])).toBe("stable");
    expect(tendance([80, 75])).toBe("baisse");
  });
});
