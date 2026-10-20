import { describe, expect, it } from "vitest";
import { type Couleurs, clair, sombre } from "./palette";

type Rgba = [number, number, number, number];

/** `#rrggbb` ou `rgba(r, g, b, a)`. */
function lire(couleur: string): Rgba {
  if (couleur.startsWith("#")) {
    const n = (i: number) => Number.parseInt(couleur.slice(i, i + 2), 16);
    return [n(1), n(3), n(5), 1];
  }
  const [r, g, b, a] = couleur
    .replace(/[^\d.,]/g, "")
    .split(",")
    .map(Number);
  return [r, g, b, a ?? 1];
}

/** Une couleur translucide posée sur un fond opaque. */
function poser(couleur: string, fond: string): Rgba {
  const [r, g, b, a] = lire(couleur);
  const [fr, fg, fb] = lire(fond);
  return [r * a + fr * (1 - a), g * a + fg * (1 - a), b * a + fb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(a: Rgba, b: Rgba): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const TEXTES = [
  "encre",
  "encreSecondaire",
  "encreTertiaire",
  "encreAttenuee",
  "dangerEncre",
  "superset",
] as const satisfies readonly (keyof Couleurs)[];

describe.each([
  ["sombre", sombre],
  ["clair", clair],
] as const)("la palette %s", (_nom, c) => {
  // Le canevas, les cartes, les feuilles : là où du texte se pose.
  const surfaces = [c.canevas, c.surface1, c.surface2];

  it.each(TEXTES)("%s tient 4,5:1 sur chaque surface", (role) => {
    for (const s of surfaces) {
      expect(contraste(lire(c[role]), lire(s))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("le texte posé sur l'aplat d'action tient 4,5:1", () => {
    expect(contraste(lire(c.surAction), lire(c.action))).toBeGreaterThanOrEqual(4.5);
  });

  it("le texte posé sur l'aplat de danger tient 4,5:1", () => {
    expect(contraste(lire(c.surDanger), lire(c.danger))).toBeGreaterThanOrEqual(4.5);
  });

  it("le badge record se lit sur son fond teinté, sur le canevas et les cartes", () => {
    for (const s of [c.canevas, c.surface1]) {
      expect(contraste(lire(c.recordEncre), poser(c.recordFond, s))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("le registre est gris : seuls le danger et le voile ont une teinte (D316)", () => {
    const teintes = ["danger", "surDanger", "dangerEncre", "voile"];
    for (const [role, valeur] of Object.entries(c)) {
      if (teintes.includes(role)) continue;
      expect(valeur, role).toMatch(/^#([0-9a-f]{2})\1\1$/i);
    }
  });
});
