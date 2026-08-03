import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiErrorSchema, currentUserSchema, dataExportSchema } from "@better-lift/validators";

// L'instance Better Auth ouvrirait une connexion Prisma à la première requête :
// ces tests portent sur le contrat HTTP de la route protégée, pas sur le
// stockage des sessions. `getSession` est donc simulé.
const getSession = vi.hoisted(() => vi.fn());
const deleteUser = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const findFirstAccount = vi.hoisted(() => vi.fn());
const findManyExercises = vi.hoisted(() => vi.fn());
const findManyFolders = vi.hoisted(() => vi.fn());
const findManyRoutines = vi.hoisted(() => vi.fn());
const findManyWorkouts = vi.hoisted(() => vi.fn());
const findManyRecords = vi.hoisted(() => vi.fn());

/**
 * `Prisma.PrismaClientKnownRequestError` est utilisé par le service pour
 * reconnaître une violation d'unicité : le mock doit en fournir une classe
 * réelle, sinon l'`instanceof` échoue et le 409 ne serait jamais produit.
 */
class KnownRequestError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

vi.mock("@better-lift/db", () => ({
  checkDatabaseConnection: vi.fn(),
  prisma: {
    user: { findUnique, update },
    account: { findFirst: findFirstAccount },
    exercise: { findMany: findManyExercises },
    routineFolder: { findMany: findManyFolders },
    routine: { findMany: findManyRoutines },
    workout: { findMany: findManyWorkouts },
    personalRecord: { findMany: findManyRecords },
  },
  Prisma: { PrismaClientKnownRequestError: KnownRequestError },
}));

vi.mock("../lib/auth.js", () => ({
  auth: { api: { getSession, deleteUser }, handler: vi.fn() },
}));

const { createApp } = await import("../app.js");

const app = createApp();

const USER_ROW = {
  id: "usr_1",
  email: "alex@better-lift.local",
  name: "Alex",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  username: "alex",
  bio: null,
  unitSystem: "METRIC",
  locale: "fr",
  timezone: "Europe/Paris",
  defaultRestSec: 120,
  defaultVisibility: "PRIVATE",
  onboardedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ user: { ...USER_ROW, createdAt: USER_ROW.createdAt } });
});

function patch(body: unknown) {
  return app.request("/v1/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function remove(body: unknown) {
  return app.request("/v1/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Les charges sortent de Prisma en `Decimal`, et le contrat les veut en chaîne
 * à l'échelle de leur colonne (règle non négociable n°4). Le service n'appelle
 * que `toFixed` : ce leurre suffit, et évite d'instancier le client Prisma.
 */
function decimal(value: string) {
  return { toFixed: (scale: number) => Number(value).toFixed(scale) };
}

const DATES = {
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  updatedAt: new Date("2026-08-02T10:00:00.000Z"),
};

const CUSTOM_EXERCISE_ROW = {
  ...DATES,
  id: "exo_custom",
  slug: "tirage-maison",
  name: "Tirage maison",
  type: "WEIGHT_REPS",
  bodyPart: "BACK",
  equipment: "barbell",
  target: "lats",
  secondaryMuscles: ["biceps"],
  isArchived: false,
  translations: [{ locale: "fr", name: "Tirage maison", instructions: ["Tirer."] }],
};

const ROUTINE_ROW = {
  ...DATES,
  id: "rtn_1",
  name: "Push",
  folderId: null,
  notes: null,
  position: 0,
  lastPerformedAt: null,
  performedCount: 3,
  // Supprimée côté interface, toujours en base : un export doit le dire.
  deletedAt: new Date("2026-08-02T12:00:00.000Z"),
  exercises: [
    {
      id: "rex_1",
      exerciseId: "exo_custom",
      exercise: { name: "Tirage maison" },
      position: 0,
      notes: null,
      restSec: null,
      supersetGroup: null,
      sets: [
        {
          position: 0,
          type: "NORMAL",
          targetReps: 5,
          targetWeightKg: decimal("80"),
          targetDurationSec: null,
          targetDistanceM: null,
          targetRpe: decimal("8"),
        },
      ],
    },
  ],
};

const WORKOUT_ROW = {
  ...DATES,
  id: "wkt_1",
  routineId: "rtn_1",
  title: "Push du lundi",
  notes: null,
  startedAt: new Date("2026-08-01T17:00:00.000Z"),
  endedAt: new Date("2026-08-01T18:00:00.000Z"),
  durationSec: 3600,
  totalVolumeKg: decimal("4125"),
  totalSets: 5,
  totalReps: 50,
  prCount: 1,
  visibility: "PRIVATE",
  exercises: [
    {
      id: "wex_1",
      exerciseId: "exo_custom",
      exercise: { name: "Tirage maison" },
      position: 0,
      notes: null,
      restSec: null,
      supersetGroup: null,
      sets: [
        {
          position: 0,
          type: "NORMAL",
          reps: 5,
          weightKg: decimal("82.5"),
          durationSec: null,
          distanceM: null,
          rpe: null,
          completed: true,
          completedAt: new Date("2026-08-01T17:30:00.000Z"),
          isPr: true,
        },
      ],
    },
  ],
};

const RECORD_ROW = {
  exerciseId: "exo_custom",
  exercise: { name: "Tirage maison" },
  type: "BEST_WEIGHT",
  value: decimal("82.5"),
  reps: 5,
  weightKg: decimal("82.5"),
  achievedAt: new Date("2026-08-01T17:30:00.000Z"),
  workoutId: "wkt_1",
};

function stubExport() {
  findUnique.mockResolvedValue(USER_ROW);
  findManyExercises.mockResolvedValue([CUSTOM_EXERCISE_ROW]);
  findManyFolders.mockResolvedValue([
    { ...DATES, id: "fld_1", name: "Prise de masse", position: 0 },
  ]);
  findManyRoutines.mockResolvedValue([ROUTINE_ROW]);
  findManyWorkouts.mockResolvedValue([WORKOUT_ROW]);
  findManyRecords.mockResolvedValue([RECORD_ROW]);
}

describe("GET /v1/me", () => {
  it("should return 401 in the single error format when no session exists", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/v1/me");

    expect(response.status).toBe(401);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("should serve the profile of the session user, never an id read from the request", async () => {
    findUnique.mockResolvedValue(USER_ROW);

    // L'identifiant passé en query est un leurre : il ne doit avoir aucun effet.
    const response = await app.request("/v1/me?userId=usr_intrus");

    expect(response.status).toBe(200);
    expect(findUnique.mock.calls[0]?.[0]?.where).toEqual({ id: "usr_1" });

    const payload = currentUserSchema.parse(await response.json());

    expect(payload.unitSystem).toBe("METRIC");
    expect(payload.defaultRestSec).toBe(120);
  });

  it("should fall back to french when the stored locale is not one we serve", async () => {
    // La colonne est un `String` libre : Better Auth crée des comptes sans
    // passer par nos validateurs, une valeur inattendue ne doit pas faire
    // échouer la lecture du profil.
    findUnique.mockResolvedValue({ ...USER_ROW, locale: "de" });

    const response = await app.request("/v1/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ locale: "fr" });
  });

  it("should return 404 when the session outlives the deleted account", async () => {
    findUnique.mockResolvedValue(null);

    const response = await app.request("/v1/me");

    expect(response.status).toBe(404);
  });
});

describe("PATCH /v1/me", () => {
  it("should update only the fields provided", async () => {
    update.mockResolvedValue({ ...USER_ROW, unitSystem: "IMPERIAL" });

    const response = await patch({ unitSystem: "IMPERIAL" });

    expect(response.status).toBe(200);
    expect(update.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "usr_1" },
      data: { unitSystem: "IMPERIAL" },
    });
    await expect(response.json()).resolves.toMatchObject({ unitSystem: "IMPERIAL" });
  });

  it("should accept null to clear the optional profile fields", async () => {
    update.mockResolvedValue({ ...USER_ROW, username: null, bio: null });

    const response = await patch({ username: null, bio: null });

    expect(response.status).toBe(200);
    // Une simple absence de clé ne permettrait pas d'exprimer l'effacement.
    expect(update.mock.calls[0]?.[0]?.data).toEqual({ username: null, bio: null });
  });

  it("should translate a unique constraint violation into 409, not 500", async () => {
    update.mockRejectedValue(new KnownRequestError("P2002"));

    const response = await patch({ username: "alex" });

    expect(response.status).toBe(409);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("CONFLICT");
  });

  /**
   * Le corps est strict alors que l'API tolère les champs inconnus ailleurs :
   * sur une écriture, un champ mal orthographié serait silencieusement ignoré
   * et l'utilisateur croirait avoir enregistré son réglage.
   */
  it("should reject an unknown field instead of ignoring it", async () => {
    const response = await patch({ unitSysteme: "IMPERIAL" });

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it("should reject an empty body", async () => {
    const response = await patch({});

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ["defaultRestSec", { defaultRestSec: 5 }],
    ["defaultRestSec", { defaultRestSec: 100_000 }],
    ["username", { username: "Alex Gontier" }],
    ["locale", { locale: "de" }],
    ["unitSystem", { unitSystem: "STONES" }],
  ])("should reject an out-of-contract %s", async (_field, body) => {
    const response = await patch(body);

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it("should treat a malformed body as a client error, not an internal one", async () => {
    const response = await app.request("/v1/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: '{"unitSystem"',
    });

    // Hono lève un 400 quand il n'arrive pas à lire le corps. Le classer en
    // `INTERNAL` laissait croire à une panne serveur, et le contrat ne connaît
    // pas le 400.
    expect(response.status).toBe(422);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("should return 401 without a session, before touching the database", async () => {
    getSession.mockResolvedValue(null);

    const response = await patch({ unitSystem: "IMPERIAL" });

    expect(response.status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("POST /v1/me/export", () => {
  it("should return 401 without a session, before reading anything", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/v1/me/export", { method: "POST" });

    expect(response.status).toBe(401);
    expect(findManyWorkouts).not.toHaveBeenCalled();
  });

  it("should serve a document that matches the contract", async () => {
    stubExport();

    const response = await app.request("/v1/me/export", { method: "POST" });

    expect(response.status).toBe(200);

    const payload = dataExportSchema.parse(await response.json());

    expect(payload.version).toBe(1);
    expect(payload.profile.id).toBe("usr_1");
    expect(payload.customExercises).toHaveLength(1);
    expect(payload.routineFolders).toHaveLength(1);
    expect(payload.records[0]?.exerciseName).toBe("Tirage maison");
  });

  it("should offer the document as a dated attachment", async () => {
    stubExport();

    const response = await app.request("/v1/me/export", { method: "POST" });

    // Sans la date, deux exports s'écraseraient dans le dossier de
    // téléchargement.
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="better-lift-export-\d{4}-\d{2}-\d{2}\.json"$/,
    );
  });

  it("should serialize weights as decimal strings, never as numbers", async () => {
    stubExport();

    const response = await app.request("/v1/me/export", { method: "POST" });
    const payload = dataExportSchema.parse(await response.json());

    // `"82.50"` et non `82.5` : l'échelle de la colonne est portée jusqu'au
    // fichier, et un flottant IEEE 754 n'aurait rien à faire dans un export.
    expect(payload.workouts[0]?.exercises[0]?.sets[0]?.weightKg).toBe("82.50");
    expect(payload.workouts[0]?.totalVolumeKg).toBe("4125.00");
    expect(payload.routines[0]?.exercises[0]?.sets[0]?.targetRpe).toBe("8.0");
  });

  /**
   * La suppression d'une routine est **logique** : la ligne reste en base, donc
   * dans les données détenues, donc dans l'export. L'omettre serait un export
   * incomplet au sens du RGPD.
   */
  it("should include routines that were deleted from the interface", async () => {
    stubExport();

    const response = await app.request("/v1/me/export", { method: "POST" });
    const payload = dataExportSchema.parse(await response.json());

    expect(payload.routines[0]?.deletedAt).toBe("2026-08-02T12:00:00.000Z");
  });

  it("should scope every read to the session user, never to an id from the request", async () => {
    stubExport();

    await app.request("/v1/me/export?userId=usr_intrus", { method: "POST" });

    for (const read of [findManyFolders, findManyRoutines, findManyWorkouts, findManyRecords]) {
      expect(read.mock.calls[0]?.[0]?.where).toEqual({ userId: "usr_1" });
    }

    // Le catalogue commun n'appartient à personne : seuls les exercices
    // possédés sortent (D22).
    expect(findManyExercises.mock.calls[0]?.[0]?.where).toEqual({ ownerId: "usr_1" });
  });
});

describe("DELETE /v1/me", () => {
  const cookieHeaders = () =>
    new Headers([["set-cookie", "better-auth.session_token=; Max-Age=0; Path=/"]]);

  it("should return 401 without a session, before deleting anything", async () => {
    getSession.mockResolvedValue(null);

    const response = await remove({});

    expect(response.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("should require the password when the account carries one", async () => {
    findFirstAccount.mockResolvedValue({ id: "acc_1" });

    const response = await remove({});

    expect(response.status).toBe(422);
    expect(apiErrorSchema.parse(await response.json()).error.details?.[0]?.path).toBe("password");
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("should delete the account once the password is provided", async () => {
    deleteUser.mockResolvedValue({ headers: cookieHeaders(), response: { success: true } });

    const response = await remove({ password: "correct horse battery" });

    expect(response.status).toBe(204);
    expect(deleteUser.mock.calls[0]?.[0]?.body).toEqual({ password: "correct horse battery" });
    // Sans report du cookie périmé, le navigateur en garderait un pointant vers
    // un compte disparu, et chaque écran répondrait 401.
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  /**
   * Un compte créé par GitHub seul (D26) n'a jamais choisi de mot de passe :
   * en exiger un l'enfermerait dehors. C'est alors la fraîcheur de la session
   * que Better Auth vérifie.
   */
  it("should accept an empty body when the account has no password", async () => {
    findFirstAccount.mockResolvedValue(null);
    deleteUser.mockResolvedValue({ headers: cookieHeaders(), response: { success: true } });

    const response = await remove({});

    expect(response.status).toBe(204);
    expect(deleteUser.mock.calls[0]?.[0]?.body).toEqual({});
  });

  it("should report a wrong password as 422, not as an internal error", async () => {
    deleteUser.mockRejectedValue(
      new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD", message: "Invalid password" }),
    );

    const response = await remove({ password: "faux" });

    // Better Auth lève un 400 que le contrat ne connaît pas : sans traduction,
    // l'utilisateur lirait « erreur interne » pour une faute de frappe.
    expect(response.status).toBe(422);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("should ask for a fresh sign-in when the session is too old to confirm", async () => {
    findFirstAccount.mockResolvedValue(null);
    deleteUser.mockRejectedValue(
      new APIError("BAD_REQUEST", { code: "SESSION_EXPIRED", message: "Session is not fresh" }),
    );

    const response = await remove({});

    expect(response.status).toBe(401);
    expect(apiErrorSchema.parse(await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("should reject an unknown field instead of ignoring it", async () => {
    const response = await remove({ passwordd: "faux" });

    expect(response.status).toBe(422);
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
