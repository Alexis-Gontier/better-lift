export const ETATS = ["nominal", "vide", "chargement", "erreur"] as const;
export type Etat = (typeof ETATS)[number];

const estEtat = (v: unknown): v is Etat =>
  typeof v === "string" && (ETATS as readonly string[]).includes(v);

/** La recherche commune à toutes les pages : l'état forcé (pour la revue) et l'onglet. */
export function parseEtat(search: Record<string, unknown>): { etat?: Etat; onglet?: string } {
  const out: { etat?: Etat; onglet?: string } = {};
  if (estEtat(search.etat)) out.etat = search.etat;
  // L'onglet est validé par la page qui le lit : ici, seulement une chaîne non vide.
  if (typeof search.onglet === "string" && search.onglet !== "") out.onglet = search.onglet;
  return out;
}

/**
 * L'état qu'une page montre (D303) : celui que force l'URL (`?etat=`, pour la revue), sinon
 * celui de sa requête — chargement, puis erreur, puis vide ou nominal.
 */
export function etatAffiche(
  force: Etat | undefined,
  requete: { isPending: boolean; isError: boolean },
  vide: boolean,
): Etat {
  if (force) return force;
  if (requete.isPending) return "chargement";
  if (requete.isError) return "erreur";
  return vide ? "vide" : "nominal";
}
