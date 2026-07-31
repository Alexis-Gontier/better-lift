import { z } from "zod";

/**
 * Contrat de `GET /v1/me` (doc 04, § Authentification).
 *
 * Ce que l'API accepte d'exposer de la session : de quoi afficher un en-tête
 * connecté, rien de plus. Les champs de profil (unité, locale, fuseau)
 * viendront avec la V1, quand ils existeront en base.
 */
export const currentUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  createdAt: z.iso.datetime(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
