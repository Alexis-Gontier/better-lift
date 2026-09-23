import type { ReactNode } from "react";
import { z } from "zod";
import { EtatChargement } from "./etat-chargement";
import { EtatErreur } from "./etat-erreur";

// Les données factices ne savent produire ni une attente ni un échec. Sans ce
// paramètre, chargement et erreur ne se vérifieraient qu'en modifiant le code le
// temps d'un coup d'œil — une manipulation qui ne laisse aucune trace et qu'on ne
// rejoue pas. Ici, les quatre états restent une propriété de l'écran, contrôlable
// à nouveau après le branchement des vraies données.
export const champEtat = z.enum(["chargement", "erreur"]).optional();

export type EtatForce = z.infer<typeof champEtat>;

/**
 * Rend l'état forcé par `?etat=`, ou `null` s'il n'y en a pas.
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
  if (etat === "chargement") return <EtatChargement />;
  return <EtatErreur message={message} onReessayer={onAbandon} />;
}
