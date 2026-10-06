const MARGE = 8;

/**
 * La géométrie de la courbe du 1RM estimé (D141) : chaque point placé dans un
 * cadre `largeur × hauteur` (le plus haut en haut), l'écart entre le premier et
 * le dernier, et si le dernier est un record — le plus haut de tous.
 */
export function courbe(
  points: readonly { date: string; valeur: number }[],
  largeur: number,
  hauteur: number,
): {
  xy: { x: number; y: number }[];
  min: number;
  max: number;
  ecartKg: number;
  record: boolean;
} | null {
  const premier = points[0];
  const dernier = points.at(-1);
  if (!premier || !dernier) return null;

  const valeurs = points.map((p) => p.valeur);
  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  const etendue = max - min;
  const xy = points.map((p, i) => ({
    x:
      points.length === 1 ? largeur / 2 : MARGE + (i / (points.length - 1)) * (largeur - 2 * MARGE),
    // Sans étendue (un point, ou des valeurs égales), la courbe court à mi-hauteur.
    y:
      etendue === 0
        ? hauteur / 2
        : MARGE + (1 - (p.valeur - min) / etendue) * (hauteur - 2 * MARGE),
  }));

  return {
    xy,
    min,
    max,
    ecartKg: Math.round((dernier.valeur - premier.valeur) * 10) / 10,
    record: points.length > 1 && dernier.valeur === max,
  };
}
