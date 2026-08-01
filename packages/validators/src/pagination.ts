import { z } from "zod";

/**
 * Pagination **par curseur**, jamais par offset (doc 04).
 *
 * La raison est concrète : l'historique s'insère par le haut. Avec un offset,
 * une séance enregistrée entre deux pages décale tout et le client revoit la
 * même ligne — ou en saute une. Un curseur désigne une position dans l'ordre,
 * pas un rang.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  /** Opaque pour le client : il le renvoie tel quel, sans l'interpréter. */
  cursor: z.string().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Enveloppe commune des listes paginées.
 *
 * `hasMore` est redondant avec `nextCursor !== null` et c'est volontaire : un
 * client qui teste la présence de données plutôt que celle du curseur est le
 * cas d'usage le plus fréquent, et le rendre explicite évite qu'il déduise mal.
 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });
}

export type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
