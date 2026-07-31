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
   * Racine publique du web. Les liens des e-mails y reviennent : l'API ne sert
   * aucune page, un lien qui pointerait sur `BETTER_AUTH_URL` afficherait du
   * JSON à l'utilisateur.
   */
  WEB_APP_URL: z.string().url().default("http://localhost:3000"),

  /**
   * OAuth GitHub. Optionnel : sans ces deux valeurs le fournisseur n'est
   * simplement pas enregistré et l'e-mail/mot de passe continue de fonctionner.
   * Les rendre obligatoires empêcherait de démarrer l'API tant que l'OAuth App
   * n'existe pas côté GitHub.
   */
  GITHUB_CLIENT_ID: optionalSecret,
  GITHUB_CLIENT_SECRET: optionalSecret,

  /** OAuth Google, même règle d'optionalité que GitHub. */
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,

  /**
   * Envoi d'e-mails (doc 09 D20). Absente, l'API bascule sur le transport
   * console : en développement on lit le lien dans le terminal plutôt que
   * d'exiger un compte Resend pour créer un compte de test.
   */
  RESEND_API_KEY: optionalSecret,
  /**
   * Expéditeur des e-mails transactionnels, au format `Nom <adresse>`.
   * `onboarding@resend.dev` est le bac à sable de Resend : il ne délivre qu'à
   * l'adresse du compte Resend, ce qui suffit pour un premier essai mais
   * jamais pour la production.
   */
  EMAIL_FROM: z.string().min(1).default("better-lift <onboarding@resend.dev>"),
});

const parsed = envSchema
  .superRefine((value, ctx) => {
    /**
     * Le repli console est un confort de développement, pas un mode dégradé
     * acceptable en production : sans clé, personne ne recevrait jamais son
     * lien de réinitialisation et rien ne le signalerait. On échoue au boot.
     */
    if (value.NODE_ENV === "production" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY est requise en production : sans elle, aucun e-mail ne part.",
      });
    }
  })
  .safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
    .join("\n");

  throw new Error(`Configuration invalide :\n${details}`);
}

export const env = parsed.data;
