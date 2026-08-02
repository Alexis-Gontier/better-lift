import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emptyDraft } from "./draft";
import { clearDraft, loadDraft, saveDraft } from "./draft-storage";

/**
 * `localStorage` n'existe pas dans l'environnement Node de Vitest : on en pose
 * un minimal plutôt que de basculer tout le fichier en `jsdom` pour trois
 * appels.
 */
function stubStorage() {
  const store = new Map<string, string>();

  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });

  return store;
}

let store: Map<string, string>;

beforeEach(() => {
  store = stubStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveDraft / loadDraft", () => {
  it("should round-trip a draft", () => {
    const draft = { ...emptyDraft(), name: "Push A" };

    saveDraft("rtn_1", draft);

    expect(loadDraft("rtn_1")).toEqual(draft);
  });

  it("should keep creation and edition drafts apart", () => {
    saveDraft(null, { ...emptyDraft(), name: "Nouvelle" });
    saveDraft("rtn_1", { ...emptyDraft(), name: "Existante" });

    // Sinon ouvrir « nouvelle routine » proposerait de restaurer le brouillon
    // d'une routine éditée la veille.
    expect(loadDraft(null)?.name).toBe("Nouvelle");
    expect(loadDraft("rtn_1")?.name).toBe("Existante");
  });

  it("should forget a draft once cleared", () => {
    saveDraft("rtn_1", emptyDraft());
    clearDraft("rtn_1");

    expect(loadDraft("rtn_1")).toBeNull();
  });
});

describe("loadDraft", () => {
  it("should return null rather than crash on unreadable content", () => {
    // La valeur vient du disque de l'utilisateur : elle a pu être tronquée,
    // ou écrite par une version antérieure de l'application.
    store.set("better-lift:routine-draft:rtn_1", "{ pas du json");

    expect(loadDraft("rtn_1")).toBeNull();
  });

  it("should reject a well-formed object that is not a draft", () => {
    store.set("better-lift:routine-draft:rtn_1", JSON.stringify({ name: "Push A" }));

    // Un brouillon sans `exercises` remplacerait l'écran par un état
    // inutilisable : mieux vaut n'en proposer aucun.
    expect(loadDraft("rtn_1")).toBeNull();
  });

  it("should survive a storage that throws", () => {
    // Navigation privée sur certains navigateurs : `getItem` lève.
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("stockage indisponible");
      },
    });

    expect(loadDraft("rtn_1")).toBeNull();
  });
});

describe("saveDraft", () => {
  it("should stay silent when the quota is exceeded", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("quota dépassé");
      },
    });

    // Un brouillon non sauvegardé ne doit jamais empêcher d'éditer.
    expect(() => saveDraft("rtn_1", emptyDraft())).not.toThrow();
  });
});
