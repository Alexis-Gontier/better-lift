import { useWorkoutSync } from "./use-workout-sync";

/**
 * Monte la file d'envoi à la racine de l'application.
 *
 * Un composant sans rendu plutôt qu'un appel dans le layout : les hooks de la
 * file s'abonnent au réseau et à l'état de l'app, et les isoler ici évite de
 * faire rerendre l'arbre entier — donc chaque écran — à chaque changement de
 * connectivité.
 */
export function WorkoutSyncRunner(): null {
  useWorkoutSync();

  return null;
}
