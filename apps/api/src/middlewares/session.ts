import { createMiddleware } from "hono/factory";

/** Ce que le middleware sait lire d'une session : l'identifiant, rien de plus. */
export type LireSession = (headers: Headers) => Promise<{ user: { id: string } } | null>;

export type VariablesSession = { userId: string };

/**
 * Exige une session, et pose `userId` dans le contexte (D53).
 *
 * Le lecteur est INJECTÉ : ce module n'importe pas Better Auth, dont la
 * construction exige `SIGNUP_ALLOWLIST`. Les tests passent un lecteur simulé ;
 * `app.ts` branche le vrai. Sans session : 401, et la route n'est jamais atteinte.
 */
export function exigerSession(lire: LireSession) {
  return createMiddleware<{ Variables: VariablesSession }>(async (c, next) => {
    const session = await lire(c.req.raw.headers);
    if (!session) return c.json({ erreur: "Connexion requise." }, 401);
    c.set("userId", session.user.id);
    await next();
  });
}
