import { createMMKV, type MMKV } from "react-native-mmkv";

import { type WorkoutDraft } from "./draft";

/**
 * Persistance du brouillon de séance.
 *
 * **MMKV et non AsyncStorage** (doc 06) : les écritures sont **synchrones**. La
 * différence n'est pas une question de vitesse mais de garantie — avec une
 * écriture asynchrone, il existe une fenêtre entre la coche d'une série et son
 * arrivée sur le disque, et une app tuée pendant cette fenêtre perd la série.
 *
 * Un seul brouillon à la fois : on ne fait pas deux séances en parallèle, et
 * une clé unique rend la reprise au démarrage triviale.
 *
 * MMKV **4** : `createMMKV()` et non `new MMKV()`, `remove()` et non
 * `delete()`. La v4 est bâtie sur Nitro Modules, d'où le paquet compagnon.
 *
 * ## Pourquoi l'ouverture est paresseuse
 *
 * Appeler `createMMKV()` au chargement du module faisait **échouer l'import**
 * là où le module natif est absent — sur Expo Go, qui n'embarque qu'un jeu fixe
 * de modules. Et comme l'échec se produit à l'évaluation, il emporte tous les
 * modules importateurs : les écrans concernés perdent jusqu'à leur
 * `export default`, et Expo Router signale une route « sans export par défaut »
 * qui n'a plus rien à voir avec la cause.
 *
 * Un magasin ne doit jamais empêcher l'application de démarrer. L'ouverture est
 * donc différée au premier accès, et son échec est une **information**
 * (`isDraftPersisted()`) plutôt qu'une exception.
 */

const DRAFT_KEY = "draft/active";

let storage: MMKV | null = null;
let opened = false;

/**
 * Repli en mémoire quand le module natif manque.
 *
 * Il n'est **pas** silencieux : `isDraftPersisted()` renvoie `false` et
 * l'écran de séance l'affiche. Le masquer laisserait croire à la garantie de
 * reprise après crash, qui est précisément ce que ce repli ne tient pas —
 * un brouillon en mémoire disparaît avec le processus.
 */
const memory = new Map<string, string>();

function open(): MMKV | null {
  if (opened) {
    return storage;
  }

  opened = true;

  try {
    storage = createMMKV({ id: "better-lift-workout" });
  } catch {
    storage = null;
  }

  return storage;
}

/** `false` sur un environnement sans MMKV : le brouillon ne survit pas à l'app. */
export function isDraftPersisted(): boolean {
  return open() !== null;
}

export function readDraft(): WorkoutDraft | null {
  const raw = open()?.getString(DRAFT_KEY) ?? memory.get(DRAFT_KEY);

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
  const serialized = JSON.stringify(draft);
  const store = open();

  if (store) {
    store.set(DRAFT_KEY, serialized);
  } else {
    memory.set(DRAFT_KEY, serialized);
  }
}

export function clearDraft(): void {
  open()?.remove(DRAFT_KEY);
  memory.delete(DRAFT_KEY);
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
