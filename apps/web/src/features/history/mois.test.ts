import { cleJour } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import { parMois } from "./mois";

const paris = (iso: string) => cleJour(iso, "Europe/Paris");
const s = (debut: string) => ({ id: debut, debut });

describe("parMois", () => {
  it("groupe par mois, la plus récente d'abord, sans réordonner", () => {
    const g = parMois(
      [s("2026-10-08T17:00:00.000Z"), s("2026-10-01T17:00:00.000Z"), s("2026-09-20T17:00:00.000Z")],
      paris,
    );
    expect(g.map((x) => [x.mois, x.seances.length])).toEqual([
      ["2026-10", 2],
      ["2026-09", 1],
    ]);
  });

  it("découpe dans le fuseau : le 30 septembre à 23 h 30 à Paris reste en septembre", () => {
    // 21 h 30 UTC le 30 : 23 h 30 à Paris, le même jour ; et 22 h 30 UTC le 31 octobre
    // est déjà le 1er novembre à Paris.
    expect(parMois([s("2026-09-30T21:30:00.000Z")], paris)[0]?.mois).toBe("2026-09");
    expect(parMois([s("2026-10-31T23:30:00.000Z")], paris)[0]?.mois).toBe("2026-11");
  });
});
