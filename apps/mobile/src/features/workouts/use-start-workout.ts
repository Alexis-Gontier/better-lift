import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { type ApiClient } from "@better-lift/api-client";
import { type RoutineDetail } from "@better-lift/validators";

import { draftFromRoutine, newWorkoutDraft } from "./draft";
import { readDraft, writeDraft } from "./draft-store";

const ACTIVE_HREF = "/workout/active" as const;

/**
 * Le paramètre ne transporte **pas** le brouillon — celui-ci reste sur le
 * disque — mais l'intention de l'entrée : commencer, et non reprendre. Sans
 * lui, l'écran de séance ne verrait qu'un brouillon trouvé sur le disque, et
 * annoncerait « séance reprise » à chaque démarrage.
 */
const FRESH_HREF = "/workout/active?fresh=1" as const;

/**
 * « Démarrer cette routine » et « Séance libre ».
 *
 * ## Une séance en cours n'est jamais écrasée
 *
 * S'il existe déjà un brouillon, ce bouton **reprend** la séance au lieu d'en
 * commencer une autre. Le cas arrive tout seul : on quitte l'écran de séance
 * par mégarde, on retombe sur ses routines, on appuie sur « Démarrer ». Écraser
 * silencieusement le brouillon détruirait un entraînement en cours — la seule
 * donnée de l'app qui n'existe nulle part ailleurs.
 *
 * ## Le brouillon passe par le disque, pas par la route
 *
 * Il est écrit en MMKV **avant** la navigation ; l'écran de séance le relit au
 * montage, exactement comme il relirait une séance interrompue. Un seul chemin
 * d'entrée, donc un seul chemin à éprouver, et la reprise après crash cesse
 * d'être un cas particulier.
 */
export function useStartWorkout(client: ApiClient) {
  const [inProgress, setInProgress] = useState(() => readDraft() !== null);
  const [starting, setStarting] = useState(false);

  // Relu à chaque retour sur l'écran : la séance a pu être terminée ou
  // abandonnée pendant qu'il restait monté sous la pile de navigation.
  useFocusEffect(
    useCallback(() => {
      setInProgress(readDraft() !== null);
    }, []),
  );

  const start = useCallback(
    async (routine: RoutineDetail) => {
      // Relu au moment de l'appui, et non pris de l'état : c'est la seule
      // lecture dont la fraîcheur est garantie.
      if (readDraft() !== null) {
        router.push(ACTIVE_HREF);

        return;
      }

      setStarting(true);

      try {
        const exerciseIds = routine.exercises.map((exercise) => exercise.exercise.id);

        /**
         * Une panne réseau ne doit pas empêcher de commencer : sans repères, on
         * s'entraîne quand même. C'est tout l'intérêt d'une séance locale.
         */
        const performances = await client.getLastPerformance(exerciseIds).catch(() => []);

        writeDraft(draftFromRoutine(routine, performances));
        router.push(FRESH_HREF);
      } finally {
        setStarting(false);
      }
    },
    [client],
  );

  /**
   * Séance libre : le brouillon naît vide, les exercices se choisissent depuis
   * l'écran de séance. Le chrono part donc tout de suite — en salle, on
   * commence l'échauffement avant de savoir ce qu'on fera.
   *
   * Aucun appel réseau : sans exercice, il n'y a pas de performance passée à
   * demander. Une séance libre se démarre donc hors ligne.
   */
  const startFree = useCallback(() => {
    if (readDraft() !== null) {
      router.push(ACTIVE_HREF);

      return;
    }

    writeDraft(newWorkoutDraft());
    router.push(FRESH_HREF);
  }, []);

  return { start, startFree, starting, inProgress };
}
