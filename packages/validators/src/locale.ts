import { z } from "zod";

/**
 * Langues servies par l'application (doc 01 : fr + en dès la V1).
 *
 * Elle a son fichier plutôt que d'être posée dans celui qui en a eu besoin le
 * premier : la locale traverse tout — profil, instructions d'exercice,
 * formatage des dates et des nombres —, et deux définitions finiraient par
 * diverger.
 *
 * Le dataset d'exercices en fournit dix ; le seed n'en importe que ces deux
 * (doc 08). Ajouter une langue ici sans l'ajouter au seed rendrait invisible
 * tout le catalogue dans cette langue.
 */
export const localeSchema = z.enum(["fr", "en"]);

export const DEFAULT_LOCALE = "fr";

export type Locale = z.infer<typeof localeSchema>;
