import { PERIODES, type Periode } from "@better-lift/shared";

/**
 * La période de l'Accueil (D330) : le dernier choix, gardé dans ce navigateur, sinon trois mois.
 * Pas dans l'URL : pour deux ou trois comptes, le lien partagé et le retour arrière sur une
 * période n'ont pas d'usage, et une seule source vaut mieux que deux.
 */
const CLE = "better-lift:accueil-periode";
const PAR_DEFAUT: Periode = "3m";

/** Le stockage peut manquer (navigation privée, données bloquées) : on s'en passe. */
export function periodeRetenue(): Periode {
  try {
    const v = localStorage.getItem(CLE);
    return PERIODES.includes(v as Periode) ? (v as Periode) : PAR_DEFAUT;
  } catch {
    return PAR_DEFAUT;
  }
}

export function retenirPeriode(p: Periode) {
  try {
    localStorage.setItem(CLE, p);
  } catch {
    // Sans stockage, l'Accueil rouvrira simplement sur trois mois.
  }
}
