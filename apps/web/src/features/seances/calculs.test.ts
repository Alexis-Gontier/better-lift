import { describe, expect, it } from "vitest";
import { filtrerSeances, grouperParMois, texteEcart } from "./calculs";

describe("grouperParMois", () => {
  it("groupe par mois civil dans le fuseau, dans l'ordre reçu", () => {
    const seances = [
      { id: "a", debut: "2026-10-03T08:00:00.000Z" },
      // 30 septembre 22 h 30 UTC : déjà le 1er octobre à Paris, 0 h 30.
      { id: "b", debut: "2026-09-30T22:30:00.000Z" },
      { id: "c", debut: "2026-09-12T08:00:00.000Z" },
    ];
    const g = grouperParMois(seances, "Europe/Paris");
    expect(g.map((x) => [x.cle, x.libelle, x.seances.map((s) => s.id)])).toEqual([
      ["2026-10", "Octobre 2026", ["a", "b"]],
      ["2026-09", "Septembre 2026", ["c"]],
    ]);
  });

  it("rend une liste vide sans séance", () => {
    expect(grouperParMois([], "Europe/Paris")).toEqual([]);
  });
});

describe("texteEcart", () => {
  it("dit la charge, les reps au singulier et au pluriel, et l'égalité", () => {
    expect(texteEcart({ genre: "charge", deltaKg: 2.5 })).toBe("+2,5 kg");
    expect(texteEcart({ genre: "charge", deltaKg: -5 })).toBe("−5 kg");
    expect(texteEcart({ genre: "reps", delta: -1 })).toBe("−1 rep");
    expect(texteEcart({ genre: "reps", delta: 2 })).toBe("+2 reps");
    expect(texteEcart({ genre: "egal" })).toBe("=");
  });
});

describe("filtrerSeances", () => {
  const seances = [
    { id: "a", nom: "Push A", apercu: [{ nom: "Développé couché" }] },
    { id: "b", nom: "Jambes", apercu: [{ nom: "Squat" }, { nom: "Presse à cuisses" }] },
  ];

  it("rend tout sans texte", () => {
    expect(filtrerSeances(seances, "  ")).toEqual(seances);
  });
  it("cherche dans le nom, sans casse", () => {
    expect(filtrerSeances(seances, "push").map((s) => s.id)).toEqual(["a"]);
  });
  it("cherche dans les exercices, sans accents", () => {
    expect(filtrerSeances(seances, "developpe").map((s) => s.id)).toEqual(["a"]);
    expect(filtrerSeances(seances, "PRESSE A").map((s) => s.id)).toEqual(["b"]);
  });
});
