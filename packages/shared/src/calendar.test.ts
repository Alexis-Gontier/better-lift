import { describe, expect, it } from "vitest";
import {
  decalerDeJours,
  formatHeure,
  formatJour,
  formatJourSemaine,
  formatMois,
  memeJour,
  parMois,
} from "./calendar.js";

describe("arithmétique civile", () => {
  it("rend le jour du fuseau demandé, pas celui d'UTC", () => {
    // 23 h 30 à Paris le samedi 20 septembre 2026 = 21 h 30 UTC le même jour.
    // Une heure de plus et UTC bascule au dimanche alors que Paris est encore samedi.
    const samediSoir = "2026-09-20T23:30:00+02:00";
    expect(formatJour(samediSoir, "Europe/Paris")).toBe("20 septembre 2026");
  });

  // Le test précédent passerait encore si `formatJour` ignorait son paramètre et
  // lisait le fuseau de la machine — laquelle est justement à Paris. Celui-ci ne
  // le peut pas : le même instant tombe un jour plus tard à Auckland.
  it("suit le fuseau demandé, et non celui de la machine", () => {
    const samediSoirParis = "2026-09-20T23:30:00+02:00"; // 21 h 30 UTC
    expect(formatJour(samediSoirParis, "Pacific/Auckland")).toBe("21 septembre 2026");
  });

  it("ne fait pas basculer une séance de fin de soirée au lendemain", () => {
    const a = "2026-09-20T23:30:00+02:00";
    const b = "2026-09-20T18:00:00+02:00";
    expect(memeJour(a, b, "Europe/Paris")).toBe(true);
  });

  it("distingue bien deux jours civils consécutifs", () => {
    const samedi = "2026-09-20T23:30:00+02:00";
    const dimanche = "2026-09-21T00:30:00+02:00";
    expect(memeJour(samedi, dimanche, "Europe/Paris")).toBe(false);
  });
});

describe("formatHeure", () => {
  it("rend l'heure du fuseau demandé, sur 24 heures", () => {
    // 16 h 12 UTC le 3 octobre : 18 h 12 à Paris (heure d'été).
    expect(formatHeure("2026-10-03T16:12:00.000Z", "Europe/Paris")).toBe("18:12");
    // 7 h 05 UTC en hiver : 8 h 05 à Paris, avec le zéro.
    expect(formatHeure("2026-12-01T07:05:00.000Z", "Europe/Paris")).toBe("08:05");
  });
});

describe("decalerDeJours", () => {
  it("recule d'un jour à la même heure", () => {
    expect(decalerDeJours("2026-10-23T16:00:00.000Z", -1, "Europe/Paris")).toBe(
      "2026-10-22T16:00:00.000Z",
    );
  });

  it("garde l'heure murale de l'autre côté du changement d'heure", () => {
    // Lundi 26 octobre 18 h à Paris (UTC+1) ; le samedi 24, 18 h c'est encore UTC+2.
    const lundi = "2026-10-26T17:00:00.000Z";
    const samedi = decalerDeJours(lundi, -2, "Europe/Paris");
    expect(samedi).toBe("2026-10-24T16:00:00.000Z");
    expect(formatHeure(samedi, "Europe/Paris")).toBe("18:00");
  });
});

describe("formatJourSemaine, formatMois", () => {
  it("écrit le jour dans le fuseau, l'année sur demande", () => {
    // 22 h 30 UTC le jeudi 22 : vendredi 23 à Paris.
    expect(formatJourSemaine("2026-10-22T22:30:00.000Z", "Europe/Paris")).toBe(
      "vendredi 23 octobre",
    );
    expect(formatJourSemaine("2026-10-22T22:30:00.000Z", "Europe/Paris", true)).toBe(
      "vendredi 23 octobre 2026",
    );
  });

  it("écrit le mois d'une clé", () => {
    expect(formatMois("2026-10")).toBe("octobre 2026");
    expect(formatMois("2027-01")).toBe("janvier 2027");
  });
});

describe("parMois", () => {
  const s = (debut: string) => ({ id: debut, debut });

  it("groupe par mois, la plus récente d'abord, sans réordonner", () => {
    const g = parMois(
      [s("2026-10-08T17:00:00.000Z"), s("2026-10-01T17:00:00.000Z"), s("2026-09-20T17:00:00.000Z")],
      "Europe/Paris",
    );
    expect(g.map((x) => [x.mois, x.seances.length])).toEqual([
      ["2026-10", 2],
      ["2026-09", 1],
    ]);
  });

  it("découpe dans le fuseau : le 31 octobre à 23 h 30 UTC est déjà novembre à Paris", () => {
    expect(parMois([s("2026-09-30T21:30:00.000Z")], "Europe/Paris")[0]?.mois).toBe("2026-09");
    expect(parMois([s("2026-10-31T23:30:00.000Z")], "Europe/Paris")[0]?.mois).toBe("2026-11");
  });
});
