import { describe, expect, it } from "vitest";
import { curve } from "./calculations";

const p = (date: string, value: number) => ({ date, valeur: value });

describe("courbe (D141)", () => {
  it("rend null sans point", () => {
    expect(curve([], 400, 100)).toBeNull();
  });

  it("pose un point seul au centre, sans record ni écart", () => {
    const c = curve([p("2026-09-01", 100)], 400, 100);
    expect(c?.xy).toEqual([{ x: 200, y: 50 }]);
    expect(c).toMatchObject({ ecartKg: 0, record: false });
  });

  it("étale les points dans la largeur, le plus haut en haut", () => {
    const c = curve([p("a", 100), p("b", 90), p("c", 110)], 400, 100);
    expect(c?.xy.map((x) => x.x)).toEqual([8, 200, 392]);
    expect(c?.xy[2]?.y).toBe(8); // le maximum touche la marge haute
    expect(c?.xy[1]?.y).toBe(92); // le minimum touche la marge basse
    expect(c).toMatchObject({ min: 90, max: 110, ecartKg: 10, record: true });
  });

  it("n'appelle pas record un dernier point en dessous du maximum", () => {
    const c = curve([p("a", 120), p("b", 110)], 400, 100);
    expect(c).toMatchObject({ ecartKg: -10, record: false });
  });
});
