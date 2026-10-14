import type { ReactNode } from "react";
import { z } from "zod";
import { EtatChargement } from "./etat-chargement";
import { EtatErreur } from "./etat-erreur";

// Les données factices ne savent produire ni une attente ni un échec. Sans ce
// paramètre, chargement et erreur ne se vérifieraient qu'en modifiant le code le
// temps d'un coup d'œil — une manipulation qui ne laisse aucune trace et qu'on ne
// rejoue pas. Ici, les quatre états restent une propriété de l'écran, contrôlable
// à nouveau après le branchement des vraies données.
export const champEtat = z.enum(["loading", "error", "empty"]).optional();

export type EtatForce = z.infer<typeof champEtat>;

/**
 * Vrai quand `?state=empty` demande un jeu de données vide.
 *
 * « Empty » n'est pas un écran de remplacement mais une condition sur les données :
 * on vide le jeu et l'écran rend SON état vide, par son chemin de code réel. Un
 * substitut montrerait un composant, pas la branche qui le rendra pour de bon.
 */
export function estVideForce(etat: EtatForce): boolean {
  return import.meta.env.DEV && etat === "empty";
}

/**
 * Rend l'état forcé par `?state=`, ou `null` s'il n'y en a pas.
 *
 * Ne répond qu'en développement : `import.meta.env.DEV` vaut `false` au build,
 * la branche est éliminée et le paramètre devient sans effet en production.
 */
export function etatForceRendu(
  etat: EtatForce,
  message: string,
  onAbandon: () => void,
): ReactNode | null {
  if (!import.meta.env.DEV || !etat) return null;
  if (etat === "loading") return <EtatChargement />;
  if (etat === "error") return <EtatErreur message={message} onReessayer={onAbandon} />;
  // « empty » ne se substitue pas à l'écran : il se traite dans les données, via
  // `estVideForce`, pour que l'écran rende son propre état vide.
  return null;
}
