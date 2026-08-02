// `z` doit venir de @hono/zod-openapi, pas de "zod" : sinon `.openapi()`
// n'existe pas (doc 02).
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import {
  apiErrorSchema,
  reorderSchema,
  routineFolderInputSchema,
  routineFolderListResponseSchema,
  routineFolderSchema,
} from "@better-lift/validators";

import { type AppEnv } from "../lib/auth.js";
import { validationHook } from "../lib/validation-hook.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createFolder,
  deleteFolder,
  listFolders,
  reorderFolders,
  updateFolder,
} from "../services/routine-folder.service.js";

const unauthenticated = {
  description: "Session absente ou expirée.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const invalidBody = {
  description: "Corps invalide.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const folderNotFound = {
  description: "Dossier inexistant ou appartenant à autrui.",
  content: { "application/json": { schema: apiErrorSchema } },
} as const;

const idParam = z.object({ id: z.string().min(1) });

const listRoute = createRoute({
  method: "get",
  path: "/v1/routine-folders",
  tags: ["Routines"],
  summary: "Dossiers de routines",
  description:
    "Classés par position. `routineCount` exclut les routines supprimées : " +
    "une suppression est logique, et compter la ligne restée en base ferait " +
    "annoncer trois routines à un dossier qui n'en montre qu'une.",
  responses: {
    200: {
      description: "Dossiers de l'utilisateur.",
      content: { "application/json": { schema: routineFolderListResponseSchema } },
    },
    401: unauthenticated,
  },
});

const postRoute = createRoute({
  method: "post",
  path: "/v1/routine-folders",
  tags: ["Routines"],
  summary: "Créer un dossier",
  description: "Le dossier se range en dernier.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: routineFolderInputSchema } },
    },
  },
  responses: {
    201: {
      description: "Dossier créé.",
      content: { "application/json": { schema: routineFolderSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

const patchRoute = createRoute({
  method: "patch",
  path: "/v1/routine-folders/{id}",
  tags: ["Routines"],
  summary: "Renommer un dossier",
  request: {
    params: idParam,
    body: {
      required: true,
      content: { "application/json": { schema: routineFolderInputSchema } },
    },
  },
  responses: {
    200: {
      description: "Dossier renommé.",
      content: { "application/json": { schema: routineFolderSchema } },
    },
    401: unauthenticated,
    404: folderNotFound,
    422: invalidBody,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/v1/routine-folders/{id}",
  tags: ["Routines"],
  summary: "Supprimer un dossier",
  description:
    "Les routines qu'il contient **remontent à la racine**, elles ne sont " +
    "jamais supprimées. C'est `onDelete: SetNull` en base qui le garantit.",
  request: { params: idParam },
  responses: {
    204: { description: "Dossier supprimé." },
    401: unauthenticated,
    404: folderNotFound,
  },
});

const reorderRoute = createRoute({
  method: "post",
  path: "/v1/routine-folders/reorder",
  tags: ["Routines"],
  summary: "Réordonner les dossiers",
  description:
    "La liste **complète** des identifiants dans leur nouvel ordre, et non un " +
    "déplacement relatif : un « monte de deux » appliqué à une liste qui a " +
    "bougé entre-temps range l'élément ailleurs, sans erreur. Ce qui " +
    "n'appartient pas à l'appelant est ignoré.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: reorderSchema } },
    },
  },
  responses: {
    200: {
      description: "Dossiers réordonnés.",
      content: { "application/json": { schema: routineFolderListResponseSchema } },
    },
    401: unauthenticated,
    422: invalidBody,
  },
});

export const routineFoldersRouter = new OpenAPIHono<AppEnv>({ defaultHook: validationHook });

routineFoldersRouter.use("/v1/routine-folders", requireAuth);
routineFoldersRouter.use("/v1/routine-folders/*", requireAuth);

// `reorder` avant `{id}` : sans cet ordre, `/reorder` serait lu comme un
// identifiant de dossier par la route de modification.
routineFoldersRouter.openapi(reorderRoute, async (c) => {
  const folders = await reorderFolders(c.req.valid("json").ids, c.get("user").id);

  return c.json({ data: folders }, 200);
});

routineFoldersRouter.openapi(listRoute, async (c) => {
  return c.json({ data: await listFolders(c.get("user").id) }, 200);
});

routineFoldersRouter.openapi(postRoute, async (c) => {
  return c.json(await createFolder(c.req.valid("json"), c.get("user").id), 201);
});

routineFoldersRouter.openapi(patchRoute, async (c) => {
  const { id } = c.req.valid("param");

  return c.json(await updateFolder(id, c.req.valid("json"), c.get("user").id), 200);
});

routineFoldersRouter.openapi(deleteRoute, async (c) => {
  await deleteFolder(c.req.valid("param").id, c.get("user").id);

  return c.body(null, 204);
});
