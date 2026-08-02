import { type RecordType } from "@better-lift/validators";

/**
 * Libellés et formats de l'historique. Sans React ni appel réseau : c'est la
 * partie testable des écrans de séance, et elle se teste sans monter un
 * composant.
 */

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

/**
 * Durée d'une séance, à la minute.
 *
 * La seconde est retirée volontairement : elle est exacte mais parasite — on
 * compare des séances entre elles, pas des sprints. Sous la minute on écrit
 * « moins d'une minute » plutôt que « 0 min », qui se lit comme une donnée
 * manquante alors que c'est une séance réelle, juste très courte (une seule
 * série corrigée après coup, par exemple).
 */
export function formatDuration(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) {
    return "moins d’une minute";
  }

  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);

  if (hours === 0) {
    return `${minutes} min`;
  }

  // Minutes sur deux chiffres : « 1 h 05 » et non « 1 h 5 », qui se lit mal en
  // colonne à côté d'un « 1 h 45 ».
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

/**
 * Durée d'une **série**, en `m:ss` — une planche, un rameur, un gainage.
 *
 * Rien à voir avec `formatDuration`, qui arrondit à la minute : ici la seconde
 * est la donnée. Un « moins d'une minute » sur une planche de 45 secondes
 * effacerait précisément ce qu'on est venu lire.
 */
export function formatSetDuration(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, "0");

  // Les minutes ne passent à deux chiffres qu'en présence d'heures : « 0:45 »
  // se lit mieux que « 00:45 », mais « 1:05:05 » a besoin du zéro.
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

/**
 * Accord au pluriel. Le français ne met pas de `s` à 0 ni à 1 — un « 1 séries »
 * dans un résumé de séance saute aux yeux.
 */
export function plural(count: number, singular: string, many = `${singular}s`): string {
  return `${count} ${count > 1 ? many : singular}`;
}

/**
 * Libellés des six types de record, servis par `GET /v1/stats/records`.
 *
 * Formulés comme ce qu'on a battu, pas comme un nom de colonne : « Charge max »
 * plutôt que « BEST_WEIGHT ». Le 1RM garde son sigle, qui est le mot du domaine
 * — l'écrire « répétition maximale estimée » serait plus long et moins clair
 * pour qui s'entraîne.
 */
export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  BEST_1RM: "1RM estimé",
  BEST_WEIGHT: "Charge max",
  BEST_SET_VOLUME: "Volume sur une série",
  BEST_REPS: "Répétitions max",
  BEST_DURATION: "Durée max",
  BEST_DISTANCE: "Distance max",
};
