/**
 * Les couleurs du web (`apps/web/src/styles/tokens.css`, thème sombre), reprises
 * telles quelles : le mobile partage la PALETTE, pas l'échelle (conception § 3).
 *
 * En salle, à bout de bras, entre deux séries : cibles larges, chiffres grands,
 * contraste franc. D'où des tailles qui n'ont rien à voir avec la densité du web.
 */
export const couleurs = {
  canvas: "#08090a",
  surface1: "#101214",
  surface2: "#181b1e",
  surface3: "#1e2226",
  ligne: "#24272b",
  ligneForte: "#32363b",
  encre: "#f2f3f5",
  encreDouce: "#b6bcc4",
  encrePale: "#868d96",
  encreFaible: "#6a717a",
  // L'action est un APLAT lime, texte sombre dessus (D28).
  accent: "#a8cf45",
  surAccent: "#0b0f04",
  accentLavis: "rgba(168, 207, 69, 0.14)",
  // Les muscles secondaires de la carte (D84) : le lime, estompé sur le corps.
  accentAttenue: "rgba(168, 207, 69, 0.45)",
  danger: "#a83e39",
  surDanger: "#fdf3f2",
  dangerEncre: "#e98b85",
} as const;

/** La plus petite cible tactile : 48 px, recommandation Android. */
export const CIBLE = 48;

export const taille = { petit: 13, courant: 16, grand: 20, titre: 26, chrono: 34 } as const;

export const espace = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
