const MARGIN = 8;

/**
 * La géométrie de la courbe du 1RM estimé (D141) : chaque point placé dans un
 * cadre `largeur × hauteur` (le plus haut en haut), l'écart entre le premier et
 * le dernier, et si le dernier est un record — le plus haut de tous.
 */
export function curve(
  points: readonly { date: string; valeur: number }[],
  width: number,
  height: number,
): {
  xy: { x: number; y: number }[];
  min: number;
  max: number;
  ecartKg: number;
  record: boolean;
} | null {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;

  const values = points.map((p) => p.valeur);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const xy = points.map((p, i) => ({
    x: points.length === 1 ? width / 2 : MARGIN + (i / (points.length - 1)) * (width - 2 * MARGIN),
    // Sans étendue (un point, ou des valeurs égales), la courbe court à mi-hauteur.
    y: range === 0 ? height / 2 : MARGIN + (1 - (p.valeur - min) / range) * (height - 2 * MARGIN),
  }));

  return {
    xy,
    min,
    max,
    ecartKg: Math.round((last.valeur - first.valeur) * 10) / 10,
    record: points.length > 1 && last.valeur === max,
  };
}
