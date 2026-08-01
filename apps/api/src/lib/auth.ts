import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins/bearer";

import { prisma } from "@better-lift/db";

import { resetPasswordEmail, verificationEmail } from "./emails.js";
import { env } from "./env.js";
import { sendEmailSafely } from "./mailer.js";

/**
 * Instance **unique** de Better Auth (doc 04).
 *
 * C'est le point que la doc 09 demandait de valider : une seule configuration
 * sert le web par cookie et servira le mobile par bearer token. Le plugin Expo
 * s'ajoutera ici, sans dupliquer ni diverger.
 *
 * Elle vit dans `apps/api` parce que c'est le seul endroit qui a le droit de
 * toucher Prisma (règle non négociable n°1).
 */

/**
 * Un fournisseur n'est enregistré que si son OAuth App existe. Sans ce
 * garde-fou, l'API refuserait de démarrer tant que les identifiants ne sont pas
 * renseignés, alors que l'e-mail/mot de passe, lui, n'en a pas besoin.
 *
 * Apple est volontairement absent : il exige un compte Apple Developer payant,
 * qui reste une action ouverte de la doc 09. La règle App Store 4.8 ne le rend
 * obligatoire qu'à la première soumission iOS (doc 04), pas avant.
 */
const socialProviders = {
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
};

/** Durée de validité du lien de réinitialisation. Reprise telle quelle dans l'e-mail. */
const RESET_PASSWORD_TTL_SECONDS = 60 * 60;

export const auth = betterAuth({
  appName: "better-lift",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  // Le client est un Proxy paresseux : l'adaptateur ne fait qu'appeler ses
  // méthodes, l'instanciation réelle a lieu à la première requête.
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    // La vérification d'e-mail est volontairement non bloquante (doc 09 D6) :
    // on n'enferme pas un inscrit derrière sa boîte mail dès la première
    // minute.
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,

    resetPasswordTokenExpiresIn: RESET_PASSWORD_TTL_SECONDS,

    /**
     * `url` est construite par Better Auth à partir du `redirectTo` envoyé par
     * le client : elle pointe sur `/reset-password/:token` de l'API, qui
     * valide le jeton puis renvoie sur la page web avec le jeton en query.
     * C'est ce détour qui évite d'afficher un formulaire pour un lien déjà
     * expiré.
     */
    sendResetPassword: async ({ user, url, token }) => {
      await sendEmailSafely(
        {
          to: user.email,
          // La clé porte le jeton, pas l'utilisateur : deux demandes
          // successives sont deux envois distincts (voir `mailer.ts`).
          idempotencyKey: `reset-password/${token}`,
          ...resetPasswordEmail({
            url,
            name: user.name,
            expiresInMinutes: RESET_PASSWORD_TTL_SECONDS / 60,
          }),
        },
        "reset-password",
      );
    },
  },

  emailVerification: {
    /**
     * L'e-mail part à l'inscription, mais l'accès n'y est pas conditionné
     * (D6). `requireEmailVerification` reste à `false` juste au-dessus : c'est
     * la combinaison des deux qui fait la « vérification non bloquante ».
     */
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url, token }) => {
      await sendEmailSafely(
        {
          to: user.email,
          idempotencyKey: `verify-email/${token}`,
          ...verificationEmail({ url, name: user.name }),
        },
        "verify-email",
      );
    },
  },

  socialProviders,

  /**
   * Quotas de la doc 04. Better Auth ne l'active que sur `NODE_ENV=production`
   * par défaut : on l'active partout, sinon la règle n'est jamais éprouvée
   * avant la mise en production.
   *
   * Le stockage est **en mémoire**, donc par instance. Suffisant tant que
   * l'API tourne sur un seul processus ; le jour où elle est répliquée, il
   * faudra passer `storage` à `"database"` (et ajouter le modèle `rateLimit`)
   * ou brancher un stockage secondaire. Noté en D20.
   */
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 10 },
      "/sign-up/email": { window: 15 * 60, max: 10 },
      // Les deux routes qui déclenchent un envoi d'e-mail : les serrer évite
      // autant le bourrage de comptes que de servir de relais de spam.
      "/request-password-reset": { window: 15 * 60, max: 5 },
      "/send-verification-email": { window: 15 * 60, max: 5 },
    },
  },

  /**
   * Les deux transports de session de la doc 04, sur la **même** instance :
   *
   *   - `expo()` gère le retour de redirection OAuth vers le scheme de l'app
   *     et le stockage de session côté client ;
   *   - `bearer()` accepte `Authorization: Bearer <token>`, ce que le web
   *     n'utilise pas et ce dont le mobile a besoin — il n'a pas de bocal à
   *     cookies partagé avec l'API.
   *
   * Rien ici n'est spécifique à une plateforme : c'est le point que la doc 09
   * demandait de vérifier.
   */
  plugins: [expo(), bearer()],

  /**
   * Le web est sur une autre origine que l'API (`:3000` contre `:3001`) : sans
   * cette liste, Better Auth rejette la requête au contrôle CSRF. En
   * production ce sera `https://better-lift.app` face à
   * `https://api.better-lift.app` (D2).
   *
   * `betterlift://` est le scheme de l'app mobile (`app.json`) : sans lui, la
   * redirection de fin d'OAuth n'a nulle part où revenir.
   */
  trustedOrigins: [...env.CORS_ORIGINS, "betterlift://"],

  advanced: {
    /**
     * Le `proxy.ts` du web lit le cookie de session côté serveur Next pour
     * décider d'une redirection. Encore faut-il que le navigateur le lui
     * envoie, et la règle diffère selon l'environnement :
     *
     *   - en développement, le web et l'API partagent l'hôte `localhost` et ne
     *     se distinguent que par le port. **Les cookies ne sont pas cloisonnés
     *     par port** : celui posé par `:3001` arrive tel quel sur `:3000`,
     *     rien à faire ;
     *   - en production ce sont deux hôtes, `better-lift.app` et
     *     `api.better-lift.app` (D2). Sans cette option, le cookie reste
     *     rattaché au seul hôte de l'API et le web ne le voit jamais — le
     *     `proxy.ts` renverrait alors tout le monde sur `/login`, y compris
     *     les sessions valides.
     *
     * Le domaine n'est pas forcé : Better Auth le déduit de `baseURL`.
     */
    crossSubDomainCookies: {
      enabled: new URL(env.WEB_APP_URL).hostname !== new URL(env.BETTER_AUTH_URL).hostname,
    },
  },
});

/** Session et utilisateur tels que Better Auth les renvoie, sans les redéclarer. */
type Session = typeof auth.$Infer.Session;

/**
 * Environnement Hono de l'application. Il porte l'utilisateur injecté par
 * `requireAuth` : sans ce typage, `c.get("user")` serait `any` et la règle
 * « jamais d'identifiant lu ailleurs que dans le contexte » ne tiendrait que
 * par discipline.
 */
export type AppEnv = { Variables: { user: Session["user"] } };
