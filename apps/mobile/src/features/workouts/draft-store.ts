import { createMMKV } from "react-native-mmkv";

import { type WorkoutDraft } from "./draft";

/**
 * Persistance du brouillon de séance.
 *
 * **MMKV et non AsyncStorage** (doc 06) : les écritures sont **synchrones**. La
 * différence n'est pas une question de vitesse mais de garantie — avec une
 * écriture asynchrone, il existe une fenêtre entre la coche d'une série et son
 * arrivée sur le disque, et une app tuée pendant cette fenêtre perd la série.
 * Une séance perdue par erreur est l'incident le plus grave du point de vue de
 * quelqu'un qui vient de faire l'effort.
 *
 * Un seul brouillon à la fois : on ne fait pas deux séances en parallèle, et
 * une clé unique rend la reprise au démarrage triviale.
 */

// MMKV **4** : `createMMKV()` et non `new MMKV()`, et `remove()` et non
// `delete()`. La v4 est bâtie sur Nitro Modules, d'où le paquet compagnon —
// c'est la version que `expo install` retient pour le SDK 57.
const storage = createMMKV({ id: "better-lift-workout" });

const DRAFT_KEY = "draft/active";

export function readDraft(): WorkoutDraft | null {
  const raw = storage.getString(DRAFT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    // Un brouillon illisible — écrit par une version antérieure du format —
    // est jeté plutôt que de faire échouer le démarrage de l'app. On perd un
    // brouillon, jamais l'accès à l'application.
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: WorkoutDraft): void {
  storage.set(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  storage.remove(DRAFT_KEY);
}

/**
 * Contrôle de forme minimal, pas une validation de schéma.
 *
 * Le brouillon n'a jamais traversé le réseau : il vient de cette app, sur ce
 * téléphone. Ce qu'on vérifie ici n'est pas une entrée hostile mais un
 * changement de format entre deux versions installées.
 */
function isDraft(value: unknown): value is WorkoutDraft {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<WorkoutDraft>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.startedAt === "string" &&
    Array.isArray(candidate.exercises)
  );
}
