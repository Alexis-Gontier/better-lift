import { createMiddleware } from "hono/factory";

import { type AppEnv, auth } from "../lib/auth.js";
import { ApiError } from "../lib/errors.js";

/**
 * Exige une session valide et met l'utilisateur à disposition du handler
 * (doc 04).
 *
 * Better Auth lit lui-même le cookie côté web et lira le header `Authorization`
 * côté mobile : c'est le même appel des deux côtés, et c'est précisément ce
 * qui permet à une instance unique de servir les deux clients.
 *
 * Un handler ne doit **jamais** lire l'identifiant utilisateur ailleurs que
 * dans `c.get("user")` — ni body, ni query.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    throw new ApiError("UNAUTHENTICATED", "Session absente ou expirée.");
  }

  c.set("user", session.user);

  await next();
});
