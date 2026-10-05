import { describe, expect, it } from "vitest";
import { versCsv } from "./export.js";

describe("versCsv (D128)", () => {
  it("écrit l'en-tête puis une ligne par série, valeurs absentes vides", () => {
    const csv = versCsv([
      {
        date: "2026-10-03T17:00:00.000Z",
        seance: "Push A",
        exercice: "Développé couché",
        serie: 1,
        type: "NORMALE",
        chargeKg: 82.5,
        reps: 6,
        faite: true,
      },
      {
        date: "2026-10-03T17:00:00.000Z",
        seance: "Push A",
        exercice: "Dips",
        serie: 1,
        type: "ECHEC",
        chargeKg: null,
        reps: null,
        faite: false,
      },
    ]);
    expect(csv).toBe(
      "date,seance,exercice,serie,type,charge_kg,reps,faite\r\n" +
        "2026-10-03T17:00:00.000Z,Push A,Développé couché,1,NORMALE,82.5,6,true\r\n" +
        "2026-10-03T17:00:00.000Z,Push A,Dips,1,ECHEC,,,false\r\n",
    );
  });

  it("met entre guillemets un champ qui contient une virgule ou un guillemet", () => {
    const csv = versCsv([
      {
        date: "d",
        seance: 'Push "lourd", A',
        exercice: "e",
        serie: 1,
        type: "NORMALE",
        chargeKg: 1,
        reps: 1,
        faite: true,
      },
    ]);
    expect(csv.split("\r\n")[1]).toBe('d,"Push ""lourd"", A",e,1,NORMALE,1,1,true');
  });
});
