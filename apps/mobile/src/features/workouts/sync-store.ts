import { getString, remove, setString } from "./storage";
import { type QueuedWorkout } from "./sync-queue";

/**
 * Persistance de la file d'envoi.
 *
 * ## Pourquoi un abonnement
 *
 * Deux lecteurs vivent en même temps : le coureur monté à la racine, qui envoie,
 * et les écrans qui affichent « séance en attente ». Sans notification, un
 * écran resté ouvert continuerait d'annoncer une séance déjà partie.
 *
 * L'instantané est **mis en cache** et ne change de référence qu'à l'écriture :
 * `useSyncExternalStore` compare par identité, et reconstruire le tableau à
 * chaque lecture ferait boucler le rendu.
 */

const QUEUE_KEY = "sync/workouts";

const EMPTY: QueuedWorkout[] = [];

let cache: QueuedWorkout[] | null = null;
const listeners = new Set<() => void>();

export function readQueue(): QueuedWorkout[] {
  if (cache) {
    return cache;
  }

  const raw = getString(QUEUE_KEY);

  if (!raw) {
    cache = EMPTY;

    return cache;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    // Une file illisible — écrite par une version antérieure du format — est
    // jetée plutôt que de faire échouer le démarrage. C'est le seul endroit du
    // produit où l'on accepte de perdre une séance, et il vaut mieux que
    // l'application ne démarre plus du tout.
    cache = Array.isArray(parsed) ? parsed.filter(isQueued) : EMPTY;
  } catch {
    cache = EMPTY;
  }

  return cache;
}

export function writeQueue(queue: QueuedWorkout[]): void {
  cache = queue;

  if (queue.length === 0) {
    remove(QUEUE_KEY);
  } else {
    setString(QUEUE_KEY, JSON.stringify(queue));
  }

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToQueue(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Contrôle de forme minimal, comme pour le brouillon : ce qu'on vérifie n'est
 * pas une entrée hostile mais un changement de format entre deux versions
 * installées. Une entrée méconnaissable est écartée, les autres passent.
 */
function isQueued(value: unknown): value is QueuedWorkout {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<QueuedWorkout>;

  return (
    typeof candidate.input === "object" &&
    candidate.input !== null &&
    typeof candidate.input.id === "string" &&
    typeof candidate.nextAttemptAt === "number"
  );
}
