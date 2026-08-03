import { createMMKV, type MMKV } from "react-native-mmkv";

/**
 * Magasin local des séances : brouillon en cours et file d'envoi.
 *
 * **MMKV et non AsyncStorage** (doc 06) : les écritures sont **synchrones**. La
 * différence n'est pas une question de vitesse mais de garantie — avec une
 * écriture asynchrone, il existe une fenêtre entre la coche d'une série et son
 * arrivée sur le disque, et une app tuée pendant cette fenêtre perd la série.
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
 * (`isPersisted()`) plutôt qu'une exception.
 */

let storage: MMKV | null = null;
let opened = false;

/**
 * Repli en mémoire quand le module natif manque.
 *
 * Il n'est **pas** silencieux : `isPersisted()` renvoie `false` et l'écran de
 * séance l'affiche. Le masquer laisserait croire à la garantie de reprise après
 * crash, qui est précisément ce que ce repli ne tient pas — une valeur en
 * mémoire disparaît avec le processus.
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

/** `false` sur un environnement sans MMKV : rien ne survit à la fermeture. */
export function isPersisted(): boolean {
  return open() !== null;
}

export function getString(key: string): string | null {
  return open()?.getString(key) ?? memory.get(key) ?? null;
}

export function setString(key: string, value: string): void {
  const store = open();

  if (store) {
    store.set(key, value);
  } else {
    memory.set(key, value);
  }
}

export function remove(key: string): void {
  open()?.remove(key);
  memory.delete(key);
}
