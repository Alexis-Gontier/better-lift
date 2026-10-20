import { PERIODES, type Periode } from "@better-lift/shared";

/**
 * La période de l'Accueil (D330) vit dans l'URL (`rechercheAccueil` de `shared`) : elle nourrit
 * la requête, survit au rechargement et au retour. Sans `?periode` (l'Accueil rouvert par la
 * barre latérale), on reprend le dernier choix de ce navigateur, puis trois mois.
 */

const CLE = "better-lift:accueil-periode";
const PAR_DEFAUT: Periode = "3m";

/** Le stockage peut manquer (navigation privée, données bloquées) : on s'en passe. */
function lireStockage(): Periode | null {
  try {
    const v = localStorage.getItem(CLE);
    return PERIODES.includes(v as Periode) ? (v as Periode) : null;
  } catch {
    return null;
  }
}

export function retenirPeriode(p: Periode) {
  try {
    localStorage.setItem(CLE, p);
  } catch {
    // Sans stockage, l'Accueil rouvrira simplement sur trois mois.
  }
}

/** La période affichée : celle de l'URL, sinon la dernière choisie, sinon trois mois. */
export const periodeEffective = (depuisUrl: Periode | undefined): Periode =>
  depuisUrl ?? lireStockage() ?? PAR_DEFAUT;
