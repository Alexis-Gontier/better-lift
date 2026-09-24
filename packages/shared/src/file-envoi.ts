import type { SeanceEnCours } from "./seance.js";

/**
 * La file d'envoi des séances terminées — la logique, sans disque ni réseau.
 *
 * Elle garde la séance COMPLÈTE, noms d'exercices compris, et non le seul corps
 * à poster : une séance refusée doit pouvoir revenir à l'écran telle qu'elle
 * était (D10), et le corps envoyé ne porte pas les noms.
 *
 * La règle qui prime : une séance ne quitte la file que lorsque le serveur l'a
 * ENREGISTRÉE. Tout échec qui n'est pas de son fait se retente.
 */

export type ElementFile = {
  seance: SeanceEnCours;
  /** L'heure où l'on a terminé, en ISO. */
  fin: string;
  /** Le message du refus ; `null` tant qu'elle est à envoyer. */
  erreur: string | null;
};

export type IssueEnvoi = "envoyee" | "refusee" | "reessayer";

/** `null` : aucune réponse — réseau coupé, serveur injoignable. */
export function classerReponse(statut: number | null): IssueEnvoi {
  if (statut === 200 || statut === 201) return "envoyee";
  // Le serveur l'a lue et n'en veut pas : la renvoyer ne changerait rien.
  if (statut === 400 || statut === 409 || statut === 422) return "refusee";
  // 401 compris : une session expirée se renouvelle, la séance ne se jette pas.
  return "reessayer";
}

/** Met une séance en file ; la remettre remplace l'ancienne et efface son erreur. */
export function mettreEnFile(
  file: ElementFile[],
  seance: SeanceEnCours,
  fin: string,
): ElementFile[] {
  const element: ElementFile = { seance, fin, erreur: null };
  const i = file.findIndex((e) => e.seance.id === seance.id);
  return i < 0 ? [...file, element] : file.map((e, j) => (j === i ? element : e));
}

/** Les séances à tenter : celles qui n'ont pas été refusées. */
export function aEnvoyer(file: ElementFile[]): ElementFile[] {
  return file.filter((e) => e.erreur === null);
}

export function apresReponse(
  file: ElementFile[],
  id: string,
  reponse: { issue: "envoyee" } | { issue: "reessayer" } | { issue: "refusee"; message: string },
): ElementFile[] {
  if (reponse.issue === "envoyee") return file.filter((e) => e.seance.id !== id);
  if (reponse.issue === "reessayer") return file;
  return file.map((e) => (e.seance.id === id ? { ...e, erreur: reponse.message } : e));
}
