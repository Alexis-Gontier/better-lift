import { describe, expect, it } from "vitest";
import { deltaText, durationText, filterSessions, groupByMonth } from "./calculations";

describe("grouperParMois", () => {
  it("groupe par mois civil dans le fuseau, dans l'ordre reçu", () => {
    const sessions = [
      { id: "a", debut: "2026-10-03T08:00:00.000Z" },
      // 30 septembre 22 h 30 UTC : déjà le 1er octobre à Paris, 0 h 30.
      { id: "b", debut: "2026-09-30T22:30:00.000Z" },
      { id: "c", debut: "2026-09-12T08:00:00.000Z" },
    ];
    const g = groupByMonth(sessions, "Europe/Paris");
    expect(g.map((x) => [x.cle, x.libelle, x.seances.map((s) => s.id)])).toEqual([
      ["2026-10", "Octobre 2026", ["a", "b"]],
      ["2026-09", "Septembre 2026", ["c"]],
    ]);
  });

  it("rend une liste vide sans séance", () => {
    expect(groupByMonth([], "Europe/Paris")).toEqual([]);
  });
});

describe("texteEcart", () => {
  it("dit la charge, les reps au singulier et au pluriel, et l'égalité", () => {
    expect(deltaText({ genre: "charge", deltaKg: 2.5 })).toBe("+2,5 kg");
    expect(deltaText({ genre: "charge", deltaKg: -5 })).toBe("−5 kg");
    expect(deltaText({ genre: "reps", delta: -1 })).toBe("−1 rep");
    expect(deltaText({ genre: "reps", delta: 2 })).toBe("+2 reps");
    expect(deltaText({ genre: "egal" })).toBe("=");
  });
});

describe("filtrerSeances", () => {
  const sessions = [
    { id: "a", nom: "Push A", apercu: [{ nom: "Développé couché" }] },
    { id: "b", nom: "Jambes", apercu: [{ nom: "Squat" }, { nom: "Presse à cuisses" }] },
  ];

  it("rend tout sans texte", () => {
    expect(filterSessions(sessions, "  ")).toEqual(sessions);
  });
  it("cherche dans le nom, sans casse", () => {
    expect(filterSessions(sessions, "push").map((s) => s.id)).toEqual(["a"]);
  });
  it("cherche dans les exercices, sans accents", () => {
    expect(filterSessions(sessions, "developpe").map((s) => s.id)).toEqual(["a"]);
    expect(filterSessions(sessions, "PRESSE A").map((s) => s.id)).toEqual(["b"]);
  });
});

describe("dureeTexte", () => {
  it("passe aux heures au-delà de 59 minutes", () => {
    expect(durationText(45)).toBe("45 min");
    expect(durationText(125)).toBe("2 h 05");
  });
});
