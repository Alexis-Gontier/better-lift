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

/**
 * Une variable présente mais vide vaut absente. Sans ça, un `GITHUB_CLIENT_ID=`
 * laissé dans le `.env` échouerait la validation au lieu de désactiver
 * proprement le fournisseur.
 */
const optionalSecret = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

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

  /** Secret de signature des sessions Better Auth. `openssl rand -base64 32`. */
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères."),
  /** URL publique de l'API : c'est elle qui construit les URL de callback OAuth. */
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),

  /**
   * OAuth GitHub. Optionnel : sans ces deux valeurs le fournisseur n'est
   * simplement pas enregistré et l'e-mail/mot de passe continue de fonctionner.
   * Les rendre obligatoires empêcherait de démarrer l'API tant que l'OAuth App
   * n'existe pas côté GitHub.
   */
  GITHUB_CLIENT_ID: optionalSecret,
  GITHUB_CLIENT_SECRET: optionalSecret,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
    .join("\n");

  throw new Error(`Configuration invalide :\n${details}`);
}

export const env = parsed.data;
