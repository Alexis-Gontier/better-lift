import { useNetworkState } from "expo-network";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { useCreateWorkout } from "@better-lift/api-client";

import {
  afterFailure,
  afterSuccess,
  dueEntry,
  nextWakeUpMs,
  type QueuedWorkout,
  retryNow,
  wakeAll,
} from "./sync-queue";
import { readQueue, subscribeToQueue, writeQueue } from "./sync-store";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Vue de la file, pour les écrans qui l'affichent.
 *
 * `useSyncExternalStore` plutôt qu'un état local : la file est écrite depuis
 * ailleurs — le coureur, la fin de séance — et un écran qui ne s'abonnerait pas
 * continuerait d'annoncer une séance déjà partie.
 */
export function useSyncQueue(): QueuedWorkout[] {
  return useSyncExternalStore(subscribeToQueue, readQueue);
}

/**
 * Coureur d'envoi des séances en attente (doc 06, § Réseau).
 *
 * Monté **une seule fois**, à la racine : la file appartient à l'application,
 * pas à un écran. Elle doit continuer de se vider pendant qu'on consulte son
 * historique, et surtout survivre à la fermeture de l'écran de séance.
 *
 * ## Trois réveils, pour trois façons de retrouver le réseau
 *
 * 1. **L'horloge**, pour le délai de la tentative suivante.
 * 2. **Le retour de la connectivité**, qui remet les entrées à échéance : au
 *    retour du réseau, on n'attend pas la fin d'un backoff de quinze minutes.
 * 3. **Le retour au premier plan**, parce qu'une app en arrière-plan pendant
 *    toute une séance ne voit passer ni l'un ni l'autre.
 *
 * Un seul envoi à la fois, et on s'arrête au premier échec : les séances
 * suivantes partageraient le même réseau, insister ne ferait que consommer la
 * batterie pour la même réponse.
 */
export function useWorkoutSync(): void {
  const locale = useProfileLocale();
  const { mutateAsync } = useCreateWorkout(apiClient, locale);
  const queue = useSyncQueue();
  const network = useNetworkState();

  /** Un seul passage à la fois : deux réveils simultanés enverraient deux fois. */
  const running = useRef(false);

  const flush = useCallback(async () => {
    if (running.current) {
      return;
    }

    running.current = true;

    /**
     * Une séance n'est tentée qu'une fois par passage. Sans ce garde-fou, une
     * entrée qui resterait en file après un envoi réussi — un identifiant qui
     * ne correspond pas, un format inattendu — ferait tourner la boucle sans
     * fin, et l'API avec elle.
     */
    const attempted = new Set<string>();

    try {
      for (let entry = dueEntry(readQueue()); entry; entry = dueEntry(readQueue())) {
        if (attempted.has(entry.input.id)) {
          return;
        }

        attempted.add(entry.input.id);

        try {
          await mutateAsync(entry.input);

          // La file est **relue** à chaque tour : une séance a pu y entrer
          // pendant l'envoi de la précédente.
          writeQueue(afterSuccess(readQueue(), entry.input.id));
        } catch (error) {
          writeQueue(afterFailure(readQueue(), entry.input.id, error));

          return;
        }
      }
    } finally {
      running.current = false;
    }
  }, [mutateAsync]);

  // 1. L'horloge. Le délai vient de la file elle-même : une entrée qui vient
  //    d'échouer repousse le réveil, une entrée à échéance le déclenche tout de
  //    suite.
  useEffect(() => {
    const delay = nextWakeUpMs(queue);

    if (delay === null) {
      return;
    }

    const timer = setTimeout(() => {
      void flush();
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [queue, flush]);

  // 2. Le retour du réseau. Seule la **transition** compte : `useNetworkState`
  //    republie son état à chaque changement de type de connexion, et remettre
  //    la file à échéance à chaque passage wifi → 4G annulerait le backoff.
  const wasReachable = useRef(network.isInternetReachable);

  useEffect(() => {
    const reachable = network.isInternetReachable;

    if (reachable && wasReachable.current === false) {
      writeQueue(wakeAll(readQueue()));
      void flush();
    }

    wasReachable.current = reachable;
  }, [network.isInternetReachable, flush]);

  // 3. Le retour au premier plan. Les minuteurs ne battent pas de façon fiable
  //    en arrière-plan ; les échéances, elles, sont des dates absolues.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void flush();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [flush]);
}

/**
 * « Réessayer maintenant » : remet toute la file à échéance, y compris les
 * entrées bloquées. Une entrée bloquée échouera de nouveau — c'est une réponse
 * honnête à un geste explicite, et la seule façon de vérifier qu'un refus tient
 * toujours après une reconnexion.
 */
export function retryQueueNow(): void {
  writeQueue(retryNow(readQueue()));
}
