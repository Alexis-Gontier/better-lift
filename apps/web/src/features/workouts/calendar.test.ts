import { describe, expect, it } from "vitest";

import {
  currentMonthKey,
  dayKeyInZone,
  monthGrid,
  monthRange,
  parseMonthKey,
  shiftMonth,
} from "./calendar";

describe("dayKeyInZone", () => {
  it("rend le jour vécu par l'utilisateur, pas le jour UTC", () => {
    // 22 h 30 le mardi à Paris, soit encore le mardi — mais 20 h 30 UTC.
    expect(dayKeyInZone("2026-08-04T20:30:00.000Z", "Europe/Paris")).toBe("2026-08-04");
  });

  it("bascule au lendemain quand le fuseau du profil a déjà changé de jour", () => {
    // Minuit et demi le 5 à Paris est encore le 4 en UTC : c'est ce décalage
    // qui ferait sauter une séance de soirée d'une case du calendrier.
    expect(dayKeyInZone("2026-08-04T22:30:00.000Z", "Europe/Paris")).toBe("2026-08-05");
    expect(dayKeyInZone("2026-08-04T22:30:00.000Z", "UTC")).toBe("2026-08-04");
  });

  it("recule d'un jour à l'ouest", () => {
    expect(dayKeyInZone("2026-08-05T03:00:00.000Z", "America/Los_Angeles")).toBe("2026-08-04");
  });

  it("retombe sur UTC plutôt que de casser sur un fuseau invalide", () => {
    // Le profil accepte n'importe quelle chaîne : un écran blanc serait pire
    // qu'un calendrier décalé.
    expect(dayKeyInZone("2026-08-04T20:30:00.000Z", "Mars/Olympus_Mons")).toBe("2026-08-04");
  });
});

describe("parseMonthKey", () => {
  it("accepte un mois bien formé", () => {
    expect(parseMonthKey("2026-03", "UTC")).toBe("2026-03");
  });

  it("retombe sur le mois courant pour toute entrée illisible", () => {
    const current = currentMonthKey("UTC");

    for (const value of [null, "", "2026-13", "2026-00", "26-03", "2026-3", "bidon"]) {
      expect(parseMonthKey(value, "UTC")).toBe(current);
    }
  });
});

describe("shiftMonth", () => {
  it("passe l'année dans les deux sens", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("reste dans le mois voisin même depuis un mois court", () => {
    expect(shiftMonth("2026-02", 1)).toBe("2026-03");
    expect(shiftMonth("2026-03", -1)).toBe("2026-02");
  });
});

describe("monthRange", () => {
  it("élargit d'un jour de chaque côté pour couvrir tous les fuseaux", () => {
    // Sans cette marge, une séance du 1er au matin à Auckland (UTC+13) serait
    // hors fenêtre et disparaîtrait du calendrier.
    const { from, to } = monthRange("2026-08");

    expect(from).toBe("2026-07-31T00:00:00.000Z");
    expect(to).toBe("2026-09-02T00:00:00.000Z");
  });

  it("couvre le mois entier", () => {
    const { from, to } = monthRange("2026-02");

    expect(Date.parse(from)).toBeLessThan(Date.parse("2026-02-01T00:00:00.000Z"));
    expect(Date.parse(to)).toBeGreaterThan(Date.parse("2026-02-28T23:59:59.000Z"));
  });
});

describe("monthGrid", () => {
  it("fait toujours six semaines, pour que la grille ne change pas de hauteur", () => {
    for (const month of ["2026-02", "2026-08", "2027-05"]) {
      expect(monthGrid(month, "2026-08-04")).toHaveLength(42);
    }
  });

  it("commence le lundi", () => {
    // Le 1er août 2026 est un samedi : la grille démarre au lundi 27 juillet.
    const grid = monthGrid("2026-08", "2026-08-04");

    expect(grid[0]?.key).toBe("2026-07-27");
    expect(grid[0]?.inMonth).toBe(false);
  });

  it("ne démarre pas sur du remplissage quand le mois tombe un lundi", () => {
    // Le 1er juin 2026 est un lundi : aucun jour du mois précédent.
    const grid = monthGrid("2026-06", "2026-06-01");

    expect(grid[0]?.key).toBe("2026-06-01");
    expect(grid[0]?.inMonth).toBe(true);
  });

  it("marque les jours du mois et le jour courant", () => {
    const grid = monthGrid("2026-08", "2026-08-04");

    expect(grid.filter((day) => day.inMonth)).toHaveLength(31);
    expect(grid.filter((day) => day.isToday).map((day) => day.key)).toEqual(["2026-08-04"]);
  });

  it("n'a pas de jour courant quand on navigue dans un autre mois", () => {
    expect(monthGrid("2026-03", "2026-08-04").some((day) => day.isToday)).toBe(false);
  });
});
