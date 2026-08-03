import { ApiClientError } from "@better-lift/api-client";
import { type CreateWorkoutInput } from "@better-lift/validators";

/**
 * File d'envoi des séances (doc 06, § Réseau).
 *
 * **Le hors ligne est un cas nominal, pas une dégradation.** Une salle en
 * sous-sol n'a pas de réseau ; une séance s'y remplit intégralement, et son
 * envoi attend. Ce module ne connaît ni React ni MMKV : il décide seulement
 * quoi envoyer, quand réessayer, et quand s'arrêter.
 *
 * ## Ce qui rend la file sûre
 *
 * L'identifiant de séance est généré par le client (règle non négociable n°7) :
 * `POST /v1/workouts` est donc **idempotent**, et un rejeu — après un accusé de
 * réception perdu, par exemple — renvoie la séance existante au lieu d'en créer
 * une seconde. C'est cette propriété qui autorise à réessayer sans compter.
 */

export interface QueuedWorkout {
  input: CreateWorkoutInput;
  /** Mise en file, pas fin de séance : `input.endedAt` porte celle-ci. */
  queuedAt: string;
  attempts: number;
  /** Horodatage absolu : un délai relatif ne survivrait pas à la fermeture de l'app. */
  nextAttemptAt: number;
  lastError: string | null;
  /**
   * L'API a refusé la séance pour une raison qu'un nouvel essai ne changera
   * pas. L'entrée **reste en file** : une séance réellement faite ne disparaît
   * jamais en silence, elle attend qu'on la regarde.
   */
  blocked: boolean;
}

/** Premier délai. Assez court pour couvrir une coupure d'ascenseur. */
const FIRST_DELAY_MS = 5_000;
/** Plafond : au-delà, c'est le retour du réseau qui réveillera la file, pas l'horloge. */
const MAX_DELAY_MS = 15 * 60_000;

/**
 * Croissance en puissances de trois : 5 s, 15 s, 45 s, 2 min 15, 6 min 45,
 * puis 15 minutes. Sans aléa — un seul appareil réessaie, il n'y a pas de
 * troupeau à disperser, et un délai déterministe se teste.
 */
export function retryDelayMs(attempts: number): number {
  return Math.min(FIRST_DELAY_MS * 3 ** Math.max(0, attempts - 1), MAX_DELAY_MS);
}

/**
 * Met une séance en file.
 *
 * Un identifiant déjà présent **remplace** l'entrée au lieu de s'y ajouter :
 * c'est la même séance, et l'API la traiterait comme telle. Le compteur repart
 * de zéro, la nouvelle tentative venant d'un geste de l'utilisateur.
 */
export function enqueue(
  queue: readonly QueuedWorkout[],
  input: CreateWorkoutInput,
  now: Date = new Date(),
): QueuedWorkout[] {
  const entry: QueuedWorkout = {
    input,
    queuedAt: now.toISOString(),
    attempts: 0,
    // Envoyée tout de suite : la file sert à retenir, pas à retarder.
    nextAttemptAt: now.getTime(),
    lastError: null,
    blocked: false,
  };

  return [...queue.filter((queued) => queued.input.id !== input.id), entry];
}

/** L'entrée à envoyer maintenant, s'il y en a une. */
export function dueEntry(
  queue: readonly QueuedWorkout[],
  now: number = Date.now(),
): QueuedWorkout | undefined {
  return queue.find((entry) => !entry.blocked && entry.nextAttemptAt <= now);
}

/** Le prochain réveil de l'horloge, `null` s'il n'y a rien à attendre. */
export function nextWakeUpMs(
  queue: readonly QueuedWorkout[],
  now: number = Date.now(),
): number | null {
  const dates = queue.filter((entry) => !entry.blocked).map((entry) => entry.nextAttemptAt);

  return dates.length === 0 ? null : Math.max(0, Math.min(...dates) - now);
}

export function afterSuccess(queue: readonly QueuedWorkout[], id: string): QueuedWorkout[] {
  return queue.filter((entry) => entry.input.id !== id);
}

/**
 * Une erreur qu'un nouvel essai peut résoudre : le réseau, une panne serveur,
 * un quota, une session expirée — l'utilisateur se reconnectera.
 *
 * Le reste vient du contenu de la requête. Réessayer produirait indéfiniment la
 * même réponse ; l'entrée est marquée et attend qu'on la regarde.
 *
 * `409` est **retenu comme définitif** : l'identifiant appartient à quelqu'un
 * d'autre (doc 04). C'est la seule façon dont un renvoi idempotent peut
 * échouer, et il échouera de la même façon éternellement.
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) {
    // Une erreur qu'on ne sait pas lire est traitée comme passagère : perdre
    // une séance est bien pire que de réessayer pour rien.
    return true;
  }

  return (
    error.code === "NETWORK_ERROR" ||
    error.status === 0 ||
    error.status === 401 ||
    error.status === 429 ||
    error.status >= 500
  );
}

export function afterFailure(
  queue: readonly QueuedWorkout[],
  id: string,
  error: unknown,
  now: number = Date.now(),
): QueuedWorkout[] {
  return queue.map((entry) => {
    if (entry.input.id !== id) {
      return entry;
    }

    const attempts = entry.attempts + 1;
    const retryable = isRetryable(error);

    return {
      ...entry,
      attempts,
      blocked: !retryable,
      lastError: error instanceof Error ? error.message : "Erreur inconnue.",
      // Une entrée bloquée garde une date passée : si l'utilisateur force
      // l'envoi, elle repart sans attendre.
      nextAttemptAt: retryable ? now + retryDelayMs(attempts) : now,
    };
  });
}

/**
 * Remet à échéance ce qui attendait un délai, sans toucher aux entrées
 * bloquées : au retour du réseau, la cause de l'attente a disparu.
 */
export function wakeAll(
  queue: readonly QueuedWorkout[],
  now: number = Date.now(),
): QueuedWorkout[] {
  return queue.map((entry) => (entry.blocked ? entry : { ...entry, nextAttemptAt: now }));
}

/** Force le prochain essai, sans attendre le délai — un geste de l'utilisateur. */
export function retryNow(
  queue: readonly QueuedWorkout[],
  now: number = Date.now(),
): QueuedWorkout[] {
  return queue.map((entry) => ({ ...entry, blocked: false, nextAttemptAt: now }));
}
