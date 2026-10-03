import { describe, expect, it } from "vitest";
import { resumeSemaine, routineASuivre } from "./accueil.js";

const PARIS = "Europe/Paris";

describe("resumeSemaine (D110)", () => {
  // Samedi 3 octobre 2026, 18 h à Paris : la semaine va du lundi 28 septembre
  // au dimanche 4 octobre.
  const maintenant = new Date("2026-10-03T16:00:00.000Z");

  it("compte les séances et le volume de la semaine, du lundi au dimanche", () => {
    const r = resumeSemaine(
      [
        { debut: "2026-09-29T17:00:00.000Z", volumeKg: 7310 }, // mardi
        { debut: "2026-10-01T17:00:00.000Z", volumeKg: 9840 }, // jeudi
        { debut: "2026-09-27T17:00:00.000Z", volumeKg: 5000 }, // dimanche d'avant
      ],
      maintenant,
      PARIS,
    );
    expect(r.seances).toBe(2);
    expect(r.volumeKg).toBe(17150);
    expect(r.jours).toEqual([false, true, false, true, false, false, false]);
    expect(r.aujourdhui).toBe(5);
  });

  // Le piège payé une fois : le dimanche 23 h 30 à Paris est déjà lundi en UTC
  // l'hiver, et inversement le lundi 0 h 30 à Paris est encore dimanche en UTC.
  it("découpe les jours dans le fuseau, jamais en UTC", () => {
    const r = resumeSemaine(
      [{ debut: "2026-09-27T22:30:00.000Z", volumeKg: 100 }], // lundi 0 h 30 à Paris
      maintenant,
      PARIS,
    );
    expect(r.seances).toBe(1);
    expect(r.jours[0]).toBe(true);
  });

  it("une semaine sans séance", () => {
    const r = resumeSemaine([], maintenant, PARIS);
    expect(r).toEqual({ seances: 0, volumeKg: 0, jours: Array(7).fill(false), aujourdhui: 5 });
  });
});

describe("routineASuivre (D110)", () => {
  const routines = [{ id: "push" }, { id: "pull" }, { id: "jambes" }];

  it("propose celle qui suit la dernière routine faite, dans l'ordre de la liste", () => {
    const seances = [
      { routineId: "pull", debut: "2026-10-01T17:00:00.000Z" },
      { routineId: "push", debut: "2026-09-29T17:00:00.000Z" },
    ];
    expect(routineASuivre(routines, seances)?.id).toBe("jambes");
  });

  it("revient à la première après la dernière", () => {
    expect(
      routineASuivre(routines, [{ routineId: "jambes", debut: "2026-10-01T17:00:00.000Z" }])?.id,
    ).toBe("push");
  });

  it("ignore les séances vides et les routines supprimées", () => {
    const seances = [
      { routineId: null, debut: "2026-10-02T17:00:00.000Z" },
      { routineId: "supprimee", debut: "2026-10-01T17:00:00.000Z" },
      { routineId: "push", debut: "2026-09-29T17:00:00.000Z" },
    ];
    expect(routineASuivre(routines, seances)?.id).toBe("pull");
  });

  it("propose la première sans historique, rien sans routine", () => {
    expect(routineASuivre(routines, [])?.id).toBe("push");
    expect(routineASuivre([], [])).toBeNull();
  });
});
