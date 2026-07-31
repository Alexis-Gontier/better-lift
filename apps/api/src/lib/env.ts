import { config as loadEnv } from "dotenv";
import { z } from "zod";

/**
 * La configuration est validée au démarrage : un crash immédiat au boot vaut
 * mieux qu'un `undefined` qui se propage en production (doc 02).
 *
 * Ce module doit être importé **avant** `@better-lift/db`, qui lit
 * `DATABASE_URL` au moment de son import.
 */
loadEnv({ path: [".env", "../../.env"], quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise (connexion poolée Neon)."),
  /**
   * Origines autorisées, séparées par des virgules. Jamais `*` : le CORS reste
   * restreint aux origines connues (doc 07).
   */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Version applicative, renseignée par la CI au déploiement. */
  APP_VERSION: z.string().default("0.0.0"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
    .join("\n");

  throw new Error(`Configuration invalide :\n${details}`);
}

export const env = parsed.data;
