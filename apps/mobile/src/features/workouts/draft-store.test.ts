import { beforeEach, describe, expect, it, vi } from "vitest";

import { type WorkoutDraft } from "./draft";

const createMMKV = vi.hoisted(() => vi.fn());

vi.mock("react-native-mmkv", () => ({ createMMKV }));

const DRAFT: WorkoutDraft = {
  id: "wkt_local_1",
  routineId: "rtn_1",
  title: "Push A",
  notes: "",
  startedAt: "2026-08-02T17:00:00.000Z",
  exercises: [],
};

/** Le magasin garde son état d'ouverture : chaque test repart d'un module neuf. */
async function loadStore() {
  vi.resetModules();

  return import("./draft-store");
}

/** Imite MMKV : seules `getString`, `set` et `remove` sont appelées. */
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
});

describe("quand le module natif est présent", () => {
  it("should round-trip the draft through MMKV", async () => {
    createMMKV.mockReturnValue(fakeMMKV());

    const store = await loadStore();

    expect(store.isDraftPersisted()).toBe(true);

    store.writeDraft(DRAFT);
    expect(store.readDraft()).toEqual(DRAFT);

    store.clearDraft();
    expect(store.readDraft()).toBeNull();
  });

  it("should let a writer recognise its own version on disk", async () => {
    createMMKV.mockReturnValue(fakeMMKV());

    const store = await loadStore();

    // C'est ce qui permet à l'écran de séance de distinguer sa propre écriture
    // de celle du sélecteur, et de ne reprendre la version du disque que
    // lorsqu'elle vient d'ailleurs.
    const written = store.writeDraft(DRAFT);

    expect(store.readDraftRaw()).toBe(written);

    store.writeDraft({ ...DRAFT, title: "Séance libre" });
    expect(store.readDraftRaw()).not.toBe(written);
  });

  it("should open the storage once, not on every access", async () => {
    createMMKV.mockReturnValue(fakeMMKV());

    const store = await loadStore();

    store.readDraft();
    store.writeDraft(DRAFT);
    store.readDraft();

    // Le brouillon est réécrit à **chaque** mutation d'une séance : rouvrir le
    // magasin à chaque fois serait un coût payé des centaines de fois.
    expect(createMMKV).toHaveBeenCalledTimes(1);
  });
});

/**
 * Le cas qui a réellement cassé l'app : sur Expo Go, le module natif de MMKV
 * n'existe pas. Tant que `createMMKV()` était appelé au chargement du module,
 * l'échec emportait tous les écrans importateurs — jusqu'à leur `export
 * default`, si bien qu'Expo Router signalait une route « sans export par
 * défaut » qui n'avait plus rien à voir avec la cause.
 */
describe("quand le module natif est absent", () => {
  beforeEach(() => {
    createMMKV.mockImplementation(() => {
      throw new Error('Failed to get NitroModules: The native "NitroModules" could not be found.');
    });
  });

  it("should not throw when the module is imported", async () => {
    await expect(loadStore()).resolves.toBeDefined();
  });

  it("should report that the draft is not persisted", async () => {
    const store = await loadStore();

    // La garantie perdue doit être **lisible** : l'écran de séance l'affiche.
    expect(store.isDraftPersisted()).toBe(false);
  });

  it("should still hold the draft in memory rather than lose it outright", async () => {
    const store = await loadStore();

    store.writeDraft(DRAFT);

    // Le repli ne tient pas la reprise après crash — il tient la navigation
    // entre l'aperçu d'une routine et l'écran de séance, sans quoi rien ne
    // fonctionnerait du tout.
    expect(store.readDraft()).toEqual(DRAFT);

    store.clearDraft();
    expect(store.readDraft()).toBeNull();
  });
});

describe("brouillon illisible", () => {
  it("should discard a draft written by an older format", async () => {
    const storage = fakeMMKV();
    storage.set("draft/active", JSON.stringify({ id: "wkt_1" }));
    createMMKV.mockReturnValue(storage);

    const store = await loadStore();

    // On perd un brouillon, jamais l'accès à l'application.
    expect(store.readDraft()).toBeNull();
  });

  it("should discard malformed JSON", async () => {
    const storage = fakeMMKV();
    storage.set("draft/active", "{pas du json");
    createMMKV.mockReturnValue(storage);

    const store = await loadStore();

    expect(store.readDraft()).toBeNull();
  });
});
