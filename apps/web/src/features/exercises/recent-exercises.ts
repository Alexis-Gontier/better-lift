import { type ExerciseSummary } from "@better-lift/validators";

/**
 * Exercices récemment ajoutés depuis le dialogue de choix, **sur cet appareil**.
 *
 * ## Pourquoi le navigateur et pas l'API
 *
 * « Récemment utilisés » pourrait se dériver de l'historique des séances, et ce
 * serait plus juste — mais il faudrait un endpoint pour ça, et c'est une
 * commodité de saisie, pas une donnée du compte. Le `localStorage` répond au
 * cas réel : on construit ses routines depuis le même ordinateur, et les six
 * exercices qu'on vient de manipuler sont ceux qu'on va reprendre.
 *
 * Le stockage est **volontairement approximatif** : perdre cette liste ne perd
 * rien, elle se reconstruit à l'usage. D'où l'absence de synchronisation, de
 * migration de schéma, et l'avalement de toute erreur.
 */

const KEY = "better-lift:recent-exercises";
const LIMIT = 6;

/**
 * On stocke l'exercice entier, pas son identifiant.
 *
 * Un identifiant obligerait à le résoudre au montage — donc une requête de plus
 * avant de pouvoir afficher quoi que ce soit, pour une section qui doit être là
 * instantanément. Un résumé d'exercice pèse quelques centaines d'octets, et six
 * tiennent largement sous la limite du `localStorage`.
 *
 * Contrepartie assumée : un exercice renommé garde son ancien nom ici jusqu'à
 * ce qu'il soit rechoisi. C'est une liste de raccourcis, pas une source de
 * vérité — le catalogue reste juste juste à côté.
 */
export function readRecentExercises(): ExerciseSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filtrage minimal : on vérifie la forme dont dépend l'affichage, et rien
    // de plus. Une entrée écrite par une version antérieure est écartée plutôt
    // que migrée.
    return parsed.filter(
      (entry): entry is ExerciseSummary =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as ExerciseSummary).id === "string" &&
        typeof (entry as ExerciseSummary).name === "string",
    );
  } catch {
    return [];
  }
}

/** Les plus récents d'abord, sans doublon, tronqué à `LIMIT`. */
export function pushRecentExercises(added: readonly ExerciseSummary[]): void {
  if (typeof window === "undefined" || added.length === 0) {
    return;
  }

  const addedIds = new Set(added.map((exercise) => exercise.id));
  const next = [
    ...added,
    ...readRecentExercises().filter((exercise) => !addedIds.has(exercise.id)),
  ].slice(0, LIMIT);

  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota plein ou stockage refusé (navigation privée stricte) : la section
    // « récemment utilisés » restera vide, et c'est tout ce qu'on y perd.
  }
}
