import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins/bearer";

import { prisma } from "@better-lift/db";

import { env } from "./env.js";

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
 * GitHub n'est enregistré que si l'OAuth App existe. Sans ce garde-fou, l'API
 * refuserait de démarrer tant que les identifiants ne sont pas renseignés,
 * alors que l'e-mail/mot de passe, lui, n'en a pas besoin.
 */
const socialProviders =
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {};

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
    // minute. L'envoi arrivera avec le service d'e-mail, en V1.
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders,

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
