import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiErrorSchema, exerciseListResponseSchema } from "@better-lift/validators";

const getSession = vi.hoisted(() => vi.fn());
const findManyTranslations = vi.hoisted(() => vi.fn());
const findFirstExercise = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", () => ({
  checkDatabaseConnection: vi.fn(),
  prisma: {
    exerciseTranslation: { findMany: findManyTranslations },
    exercise: { findFirst: findFirstExercise },
  },
}));

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

/**
 * Les espions sont partagés par tout le fichier : sans remise à zéro,
 * `mock.calls[0]` désignerait l'appel d'un test précédent et les assertions
 * porteraient sur la mauvaise requête.
 */
beforeEach(() => {
  vi.clearAllMocks();
});

function authenticate() {
  getSession.mockResolvedValue({
    user: {
      id: "usr_1",
      email: "alex@better-lift.local",
      name: "Alex",
      emailVerified: true,
      image: null,
      createdAt: new Date("2026-08-01T10:00:00.000Z"),
    },
  });
}

/**
 * Une ligne telle que la requête enracinée sur les traductions la ramène.
 * `suffix` nomme la traduction (`trad_1`, `trad_2`…) : c'est son identifiant qui
 * sert de curseur, pas celui de l'exercice.
 */
function translationRow(suffix = "1", exerciseOverrides: Record<string, unknown> = {}) {
  return {
    id: `trad_${suffix}`,
    locale: "fr",
    name: "Développé couché à la barre",
    instructions: ["Allongez-vous sur le banc.", "Descendez la barre."],
    exercise: {
      id: "exo_1",
      externalId: "0025",
      slug: "barbell-bench-press",
      name: "Barbell bench press",
      type: "WEIGHT_REPS",
      bodyPart: "CHEST",
      equipment: "barbell",
      target: "pectorals",
      secondaryMuscles: ["triceps", "delts"],
      thumbnailUrl: "https://cdn.test/0025.jpg",
      animationUrl: "https://cdn.test/0025.gif",
      attribution: "© Gym visual — https://gymvisual.com/",
      isArchived: false,
      ...exerciseOverrides,
    },
  };
}

describe("GET /v1/exercises", () => {
  it("should return 401 when no session is established", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/v1/exercises");

    expect(response.status).toBe(401);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("should return a contract-shaped page when the catalogue answers", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([translationRow()]);

    const response = await app.request("/v1/exercises");

    expect(response.status).toBe(200);

    const payload = exerciseListResponseSchema.parse(await response.json());

    expect(payload.hasMore).toBe(false);
    expect(payload.nextCursor).toBeNull();
    // Le nom servi est celui de la traduction, pas le nom de base anglais.
    expect(payload.data[0]?.name).toBe("Développé couché à la barre");
    // L'attribution voyage jusqu'au client : l'affichage est obligatoire (D17).
    expect(payload.data[0]?.attribution).toContain("Gym visual");
  });

  /**
   * On demande toujours un élément de plus que la page. C'est lui qui répond à
   * « reste-t-il quelque chose ? » sans le `count()` qu'un total imposerait, et
   * il ne doit jamais se retrouver dans les données renvoyées.
   */
  it("should not leak the look-ahead row into the page when more results exist", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([
      translationRow("1"),
      translationRow("2"),
      translationRow("3"),
    ]);

    const response = await app.request("/v1/exercises?limit=2");
    const payload = exerciseListResponseSchema.parse(await response.json());

    expect(findManyTranslations.mock.calls[0]?.[0]).toMatchObject({ take: 3 });
    expect(payload.data).toHaveLength(2);
    expect(payload.hasMore).toBe(true);
    // Le curseur pointe la dernière ligne **servie**, pas la ligne de sonde.
    expect(payload.nextCursor).toBe("trad_2");
  });

  it("should skip the cursor row itself when paginating", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    await app.request("/v1/exercises?cursor=trad_7");

    // Sans `skip: 1`, la première ligne de la page suivante serait la dernière
    // de la précédente.
    expect(findManyTranslations.mock.calls[0]?.[0]).toMatchObject({
      cursor: { id: "trad_7" },
      skip: 1,
    });
  });

  it("should accept a repeated filter and translate it into an IN clause", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    await app.request("/v1/exercises?bodyPart=CHEST&bodyPart=BACK");

    expect(findManyTranslations.mock.calls[0]?.[0]?.where?.exercise).toMatchObject({
      bodyPart: { in: ["CHEST", "BACK"] },
      isArchived: false,
    });
  });

  it("should accept a single occurrence of a repeatable filter", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    // Hono livre une chaîne quand la clé n'apparaît qu'une fois, un tableau
    // au-delà : sans normalisation, ce cas échouerait la validation.
    await app.request("/v1/exercises?bodyPart=CHEST");

    expect(findManyTranslations.mock.calls[0]?.[0]?.where?.exercise).toMatchObject({
      bodyPart: { in: ["CHEST"] },
    });
  });

  it("should search the translated name in the requested locale", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    await app.request("/v1/exercises?q=couch%C3%A9&locale=en");

    expect(findManyTranslations.mock.calls[0]?.[0]?.where).toMatchObject({
      locale: "en",
      name: { contains: "couché", mode: "insensitive" },
    });
  });

  it("should order by translated name so the catalogue reads alphabetically in the user's language", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    await app.request("/v1/exercises");

    // `id` départage : un ordre non déterministe rendrait le curseur faux.
    expect(findManyTranslations.mock.calls[0]?.[0]?.orderBy).toEqual([
      { name: "asc" },
      { id: "asc" },
    ]);
  });

  it("should reject a limit above the documented maximum", async () => {
    authenticate();

    const response = await app.request("/v1/exercises?limit=500");

    expect(response.status).toBe(422);
  });
});

describe("GET /v1/exercises/:id", () => {
  it("should return 404 when the exercise is unknown or archived", async () => {
    authenticate();
    findFirstExercise.mockResolvedValue(null);

    const response = await app.request("/v1/exercises/exo_inconnu");

    expect(response.status).toBe(404);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("NOT_FOUND");
  });

  it("should exclude archived exercises from the lookup itself", async () => {
    authenticate();
    findFirstExercise.mockResolvedValue(null);

    await app.request("/v1/exercises/exo_1");

    expect(findFirstExercise.mock.calls[0]?.[0]?.where).toMatchObject({
      id: "exo_1",
      isArchived: false,
    });
  });

  it("should serve localised instructions when the translation exists", async () => {
    authenticate();
    const row = translationRow();
    findFirstExercise.mockResolvedValue({ ...row.exercise, translations: [row] });

    const response = await app.request("/v1/exercises/exo_1?locale=fr");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "Développé couché à la barre",
      instructions: ["Allongez-vous sur le banc.", "Descendez la barre."],
      locale: "fr",
      isCustom: false,
    });
  });

  it("should fall back to the base name when the locale has no translation", async () => {
    authenticate();
    const row = translationRow();
    findFirstExercise.mockResolvedValue({ ...row.exercise, translations: [] });

    const response = await app.request("/v1/exercises/exo_1?locale=fr");

    // Mieux vaut un nom anglais qu'un champ vide : la fiche reste lisible.
    await expect(response.json()).resolves.toMatchObject({
      name: "Barbell bench press",
      instructions: [],
    });
  });

  it("should mark an exercise without externalId as custom", async () => {
    authenticate();
    const row = translationRow();
    findFirstExercise.mockResolvedValue({ ...row.exercise, externalId: null, translations: [row] });

    const response = await app.request("/v1/exercises/exo_1");

    await expect(response.json()).resolves.toMatchObject({ isCustom: true });
  });
});
