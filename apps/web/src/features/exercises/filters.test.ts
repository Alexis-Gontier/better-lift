import { describe, expect, it } from "vitest";

import {
  type CatalogFilters,
  EMPTY_FILTERS,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  toggleValue,
  toListQuery,
} from "./filters";

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("parseFilters", () => {
  it("lit une recherche et des filtres multiples", () => {
    expect(parseFilters(params("q=curl&bodyPart=CHEST&bodyPart=BACK&equipment=barbell"))).toEqual({
      q: "curl",
      bodyPart: ["BACK", "CHEST"],
      equipment: ["barbell"],
      custom: undefined,
    });
  });

  it("distingue les trois origines possibles", () => {
    expect(parseFilters(params("custom=true")).custom).toBe(true);
    expect(parseFilters(params("custom=false")).custom).toBe(false);
    expect(parseFilters(params("")).custom).toBeUndefined();
  });

  it("retombe sur les deux origines devant une valeur d'origine incomprise", () => {
    // Montrer plus est moins surprenant que de vider l'écran sur un `?custom=1`
    // écrit à la main ou tronqué par un partage.
    expect(parseFilters(params("custom=1")).custom).toBeUndefined();
  });

  it("rend des filtres vides sur une URL nue", () => {
    expect(parseFilters(params(""))).toEqual(EMPTY_FILTERS);
  });

  it("écarte silencieusement une partie du corps inconnue", () => {
    // Un vieux lien ou une valeur tapée à la main ne doit pas casser l'écran.
    expect(parseFilters(params("bodyPart=PECS&bodyPart=CHEST")).bodyPart).toEqual(["CHEST"]);
  });

  it("normalise l'équipement en minuscules et dédoublonne", () => {
    expect(
      parseFilters(params("equipment=Barbell&equipment=barbell&equipment=%20")).equipment,
    ).toEqual(["barbell"]);
  });

  it("tronque une recherche trop longue plutôt que de laisser l'API répondre 422", () => {
    expect(parseFilters(params(`q=${"a".repeat(200)}`)).q).toHaveLength(100);
  });

  it("ordonne les valeurs indépendamment de l'ordre de l'URL", () => {
    // L'ordre est ce qui rend la clé de cache TanStack stable.
    expect(parseFilters(params("bodyPart=SHOULDERS&bodyPart=BACK")).bodyPart).toEqual(
      parseFilters(params("bodyPart=BACK&bodyPart=SHOULDERS")).bodyPart,
    );
  });
});

describe("serializeFilters", () => {
  it("omet les filtres vides", () => {
    expect(serializeFilters(EMPTY_FILTERS)).toBe("");
  });

  it("omet une recherche qui n'est que des espaces", () => {
    expect(serializeFilters({ ...EMPTY_FILTERS, q: "   " })).toBe("");
  });

  it("répète la clé pour un filtre multiple", () => {
    const filters: CatalogFilters = { ...EMPTY_FILTERS, bodyPart: ["BACK", "CHEST"] };

    expect(serializeFilters(filters)).toBe("bodyPart=BACK&bodyPart=CHEST");
  });

  it("écrit une origine explicite, y compris quand elle vaut false", () => {
    // `false` n'est pas « non renseigné » : c'est « le catalogue commun seul ».
    expect(serializeFilters({ ...EMPTY_FILTERS, custom: false })).toBe("custom=false");
  });

  it("fait un aller-retour fidèle avec parseFilters", () => {
    const filters: CatalogFilters = {
      q: "développé couché",
      bodyPart: ["CHEST"],
      equipment: ["barbell"],
      custom: true,
    };

    expect(parseFilters(params(serializeFilters(filters)))).toEqual(filters);
  });
});

describe("toListQuery", () => {
  it("n'envoie que les paramètres réellement renseignés", () => {
    expect(toListQuery(EMPTY_FILTERS)).toEqual({});
  });

  it("nettoie la recherche avant de l'envoyer", () => {
    expect(toListQuery({ ...EMPTY_FILTERS, q: "  squat  " })).toEqual({ q: "squat" });
  });

  it("transmet une origine à false plutôt que de la confondre avec une absence", () => {
    expect(toListQuery({ ...EMPTY_FILTERS, custom: false })).toEqual({ custom: false });
  });
});

describe("hasActiveFilters", () => {
  it("ignore une recherche vide de sens", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: "  " })).toBe(false);
  });

  it("détecte un filtre coché", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, bodyPart: ["CHEST"] })).toBe(true);
  });

  it("compte l'origine comme un filtre actif", () => {
    // Sans cela, « Les miens » resterait sélectionné sans bouton pour en sortir.
    expect(hasActiveFilters({ ...EMPTY_FILTERS, custom: true })).toBe(true);
  });
});

describe("toggleValue", () => {
  it("ajoute une valeur absente en gardant l'ordre stable", () => {
    expect(toggleValue(["CHEST"], "BACK")).toEqual(["BACK", "CHEST"]);
  });

  it("retire une valeur déjà présente", () => {
    expect(toggleValue(["BACK", "CHEST"], "BACK")).toEqual(["CHEST"]);
  });
});
