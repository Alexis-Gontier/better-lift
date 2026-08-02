import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiErrorSchema, exerciseListResponseSchema } from "@better-lift/validators";

const getSession = vi.hoisted(() => vi.fn());
const findManyTranslations = vi.hoisted(() => vi.fn());
const findFirstExercise = vi.hoisted(() => vi.fn());
const findUniqueExercise = vi.hoisted(() => vi.fn());
const createExerciseRow = vi.hoisted(() => vi.fn());
const updateExerciseRow = vi.hoisted(() => vi.fn());
const updateManyTranslations = vi.hoisted(() => vi.fn());

vi.mock("@better-lift/db", () => {
  const client = {
    exerciseTranslation: { findMany: findManyTranslations, updateMany: updateManyTranslations },
    exercise: {
      findFirst: findFirstExercise,
      findUnique: findUniqueExercise,
      create: createExerciseRow,
      update: updateExerciseRow,
    },
    // La transaction est jouée à plat : ce qui est testé ici est la suite
    // d'écritures, pas la garantie transactionnelle de Postgres.
    $transaction: (run: (tx: unknown) => unknown) => run(client),
  };

  return { checkDatabaseConnection: vi.fn(), prisma: client };
});

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
      // `null` = exercice du catalogue commun. C'est ce champ, et lui seul, qui
      // décide de `isCustom` (D22).
      ownerId: null,
      ...exerciseOverrides,
    },
  };
}

/** Corps minimal accepté par `POST /v1/exercises`. */
const CREATE_BODY = {
  name: "Curl marteau à la corde",
  bodyPart: "UPPER_ARMS",
  equipment: "Body Weight",
  target: "biceps",
} as const;

function postExercise(body: Record<string, unknown> = CREATE_BODY, query = "") {
  return app.request(`/v1/exercises${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

  it("should mark an owned exercise as custom", async () => {
    authenticate();
    const row = translationRow();
    findFirstExercise.mockResolvedValue({ ...row.exercise, ownerId: "usr_1", translations: [row] });

    const response = await app.request("/v1/exercises/exo_1");

    await expect(response.json()).resolves.toMatchObject({ isCustom: true });
  });

  it("should restrict the lookup to the catalogue and the caller's own exercises", async () => {
    authenticate();
    findFirstExercise.mockResolvedValue(null);

    await app.request("/v1/exercises/exo_1");

    // Sans cette clause, l'exercice personnalisé d'un autre serait lisible par
    // quiconque en devine l'identifiant.
    expect(findFirstExercise.mock.calls[0]?.[0]?.where).toMatchObject({
      OR: [{ ownerId: null }, { ownerId: "usr_1" }],
    });
  });
});

describe("Visibilité des exercices personnalisés", () => {
  it("should scope every listing to the catalogue plus the caller's own exercises", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    await app.request("/v1/exercises");

    expect(findManyTranslations.mock.calls[0]?.[0]?.where?.exercise).toMatchObject({
      isArchived: false,
      OR: [{ ownerId: null }, { ownerId: "usr_1" }],
    });
  });

  it("should return only the caller's exercises when custom=true", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    await app.request("/v1/exercises?custom=true");

    expect(findManyTranslations.mock.calls[0]?.[0]?.where?.exercise).toMatchObject({
      ownerId: "usr_1",
    });
  });

  it("should return only the common catalogue when custom=false", async () => {
    authenticate();
    findManyTranslations.mockResolvedValue([]);

    // Une query string ne transporte que du texte : sans conversion, `"false"`
    // serait vrai et le filtre ferait exactement l'inverse.
    await app.request("/v1/exercises?custom=false");

    expect(findManyTranslations.mock.calls[0]?.[0]?.where?.exercise).toMatchObject({
      ownerId: null,
    });
  });
});

describe("POST /v1/exercises", () => {
  function createdRow(overrides: Record<string, unknown> = {}) {
    const row = translationRow();

    return {
      ...row.exercise,
      id: "exo_custom",
      externalId: null,
      ownerId: "usr_1",
      name: CREATE_BODY.name,
      thumbnailUrl: null,
      animationUrl: null,
      attribution: null,
      translations: [
        { id: "trad_fr", locale: "fr", name: CREATE_BODY.name, instructions: [] },
        { id: "trad_en", locale: "en", name: CREATE_BODY.name, instructions: [] },
      ],
      ...overrides,
    };
  }

  it("should return 401 when no session is established", async () => {
    getSession.mockResolvedValue(null);

    expect((await postExercise()).status).toBe(401);
  });

  it("should create the exercise owned by the caller", async () => {
    authenticate();
    createExerciseRow.mockResolvedValue(createdRow());

    const response = await postExercise();

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ isCustom: true, attribution: null });
    expect(createExerciseRow.mock.calls[0]?.[0]?.data).toMatchObject({ ownerId: "usr_1" });
  });

  /**
   * Le point le plus facile à rater de tout ce lot. La liste est enracinée sur
   * `ExerciseTranslation` filtrée par locale : un exercice sans ligne en anglais
   * disparaîtrait pour un profil anglophone, sans erreur ni trace.
   */
  it("should write one translation per served locale", async () => {
    authenticate();
    createExerciseRow.mockResolvedValue(createdRow());

    await postExercise();

    expect(createExerciseRow.mock.calls[0]?.[0]?.data?.translations?.create).toEqual([
      { locale: "fr", name: CREATE_BODY.name, instructions: [] },
      { locale: "en", name: CREATE_BODY.name, instructions: [] },
    ]);
  });

  /**
   * Le seed normalise l'équipement en `snake_case` et le filtre compare la
   * chaîne telle quelle. Un exercice saisi « Body Weight » serait introuvable
   * par `?equipment=body_weight` — il existerait, sans jamais apparaître.
   */
  it("should normalise the equipment the way the seed does", async () => {
    authenticate();
    createExerciseRow.mockResolvedValue(createdRow());

    await postExercise();

    expect(createExerciseRow.mock.calls[0]?.[0]?.data).toMatchObject({ equipment: "body_weight" });
  });

  it("should never attach media to a custom exercise", async () => {
    authenticate();
    createExerciseRow.mockResolvedValue(createdRow());

    await postExercise();

    // Rien n'héberge d'image d'utilisateur, et le dataset Gym visual n'a aucun
    // rapport avec un exercice saisi à la main (D17).
    const { data } = createExerciseRow.mock.calls[0]?.[0] ?? {};

    expect(data.thumbnailUrl).toBeUndefined();
    expect(data.animationUrl).toBeUndefined();
    expect(data.attribution).toBeUndefined();
  });

  it("should reject a body missing a required field", async () => {
    authenticate();

    expect((await postExercise({ name: "Sans partie du corps" })).status).toBe(422);
  });

  it("should reject an unknown field rather than ignoring it", async () => {
    authenticate();

    // Un champ mal orthographié accepté en silence ferait croire à un
    // enregistrement qui n'a pas eu lieu.
    const response = await postExercise({ ...CREATE_BODY, ownerId: "usr_2" });

    expect(response.status).toBe(422);
  });
});

describe("PATCH /v1/exercises/:id", () => {
  function patch(id: string, body: Record<string, unknown>) {
    return app.request(`/v1/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should return 404 when the exercise belongs to someone else", async () => {
    authenticate();
    findUniqueExercise.mockResolvedValue({ id: "exo_9", ownerId: "usr_2" });

    const response = await patch("exo_9", { name: "Tentative" });

    // 404 et non 403 : révéler qu'il existe est déjà une fuite (règle n°8).
    expect(response.status).toBe(404);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("NOT_FOUND");
  });

  it("should return 403 when the exercise belongs to the common catalogue", async () => {
    authenticate();
    findUniqueExercise.mockResolvedValue({ id: "exo_1", ownerId: null });

    const response = await patch("exo_1", { name: "Tentative" });

    /**
     * Ici 403, pas 404 : l'exercice du catalogue est visible de tous, et
     * l'utilisateur vient peut-être de l'afficher. Répondre « introuvable »
     * contredirait le `GET` qui a réussi une seconde plus tôt, sans rien
     * protéger — son existence est déjà publique.
     */
    expect(response.status).toBe(403);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("FORBIDDEN");
  });

  it("should propagate a renamed exercise to every translation", async () => {
    authenticate();
    findUniqueExercise.mockResolvedValue({ id: "exo_custom", ownerId: "usr_1" });
    updateExerciseRow.mockResolvedValue({});
    updateManyTranslations.mockResolvedValue({ count: 2 });
    const row = translationRow();
    findFirstExercise.mockResolvedValue({
      ...row.exercise,
      ownerId: "usr_1",
      translations: [row],
    });

    const response = await patch("exo_custom", { name: "Curl marteau" });

    expect(response.status).toBe(200);
    // Sinon le nom changerait en français et resterait l'ancien en anglais.
    expect(updateManyTranslations.mock.calls[0]?.[0]).toMatchObject({
      where: { exerciseId: "exo_custom" },
      data: { name: "Curl marteau" },
    });
  });

  it("should reject an empty body", async () => {
    authenticate();

    expect((await patch("exo_custom", {})).status).toBe(422);
  });
});

describe("DELETE /v1/exercises/:id", () => {
  function remove(id: string) {
    return app.request(`/v1/exercises/${id}`, { method: "DELETE" });
  }

  it("should archive rather than delete, so history keeps referring to it", async () => {
    authenticate();
    findUniqueExercise.mockResolvedValue({ id: "exo_custom", ownerId: "usr_1" });
    updateExerciseRow.mockResolvedValue({});

    const response = await remove("exo_custom");

    expect(response.status).toBe(204);
    // Invariant 8 (doc 03) : un exercice référencé par une séance n'est jamais
    // supprimé, sous peine de trouer l'historique.
    expect(updateExerciseRow.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "exo_custom" },
      data: { isArchived: true },
    });
  });

  it("should return 404 when the exercise belongs to someone else", async () => {
    authenticate();
    findUniqueExercise.mockResolvedValue({ id: "exo_9", ownerId: "usr_2" });

    expect((await remove("exo_9")).status).toBe(404);
    expect(updateExerciseRow).not.toHaveBeenCalled();
  });

  it("should refuse to archive a catalogue exercise", async () => {
    authenticate();
    findUniqueExercise.mockResolvedValue({ id: "exo_1", ownerId: null });

    expect((await remove("exo_1")).status).toBe(403);
    expect(updateExerciseRow).not.toHaveBeenCalled();
  });
});
