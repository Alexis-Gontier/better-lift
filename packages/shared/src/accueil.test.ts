import { describe, expect, it } from "vitest";
import { routineASuivre } from "./accueil.js";

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
