import { beforeEach, describe, expect, it, vi } from "vitest";

import { type QueuedWorkout } from "./sync-queue";

const createMMKV = vi.hoisted(() => vi.fn());

vi.mock("react-native-mmkv", () => ({ createMMKV }));

const ENTRY: QueuedWorkout = {
  input: {
    id: "wkt_1",
    routineId: null,
    title: "Push A",
    startedAt: "2026-08-03T17:00:00.000Z",
    endedAt: "2026-08-03T18:00:00.000Z",
    exercises: [],
  },
  queuedAt: "2026-08-03T18:00:00.000Z",
  attempts: 0,
  nextAttemptAt: 1_785_000_000_000,
  lastError: null,
  blocked: false,
};

/** Le magasin garde son état d'ouverture et son cache : module neuf à chaque test. */
async function loadStore() {
  vi.resetModules();

  return import("./sync-store");
}

function fakeMMKV() {
  const values = new Map<string, string>();

  return {
    getString: (key: string) => values.get(key),
    set: (key: string, value: string) => values.set(key, value),
    remove: (key: string) => values.delete(key),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createMMKV.mockReturnValue(fakeMMKV());
});

describe("sync-store", () => {
  it("should round-trip the queue", async () => {
    const store = await loadStore();

    store.writeQueue([ENTRY]);
    expect(store.readQueue()).toEqual([ENTRY]);
  });

  it("should hand back the same snapshot until something is written", async () => {
    const store = await loadStore();

    store.writeQueue([ENTRY]);

    // `useSyncExternalStore` compare par identité : reconstruire le tableau à
    // chaque lecture ferait boucler le rendu.
    expect(store.readQueue()).toBe(store.readQueue());
  });

  it("should notify its subscribers on every write", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeToQueue(listener);

    store.writeQueue([ENTRY]);
    expect(listener).toHaveBeenCalledTimes(1);

    // Sans notification, un écran resté ouvert continuerait d'annoncer une
    // séance déjà partie.
    store.writeQueue([]);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.writeQueue([ENTRY]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("should drop entries it cannot recognise rather than fail to start", async () => {
    const storage = fakeMMKV();
    storage.set("sync/workouts", JSON.stringify([ENTRY, { input: {} }, null]));
    createMMKV.mockReturnValue(storage);

    const store = await loadStore();

    expect(store.readQueue()).toEqual([ENTRY]);
  });

  it("should survive malformed JSON", async () => {
    const storage = fakeMMKV();
    storage.set("sync/workouts", "{pas du json");
    createMMKV.mockReturnValue(storage);

    const store = await loadStore();

    expect(store.readQueue()).toEqual([]);
  });

  it("should still hold the queue in memory when the native module is missing", async () => {
    createMMKV.mockImplementation(() => {
      throw new Error('Failed to get NitroModules: The native "NitroModules" could not be found.');
    });

    const store = await loadStore();

    store.writeQueue([ENTRY]);

    // Le repli ne tient pas la reprise après crash — il tient la navigation
    // entre l'écran de séance et l'accueil, sans quoi la bannière ne verrait
    // jamais rien.
    expect(store.readQueue()).toEqual([ENTRY]);
  });
});
