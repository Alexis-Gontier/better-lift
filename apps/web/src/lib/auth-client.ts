import { createAuthClient } from "better-auth/react";

import { env } from "./env";

/**
 * Client Better Auth du web. Il parle à la **même instance** que le mobile,
 * sur `NEXT_PUBLIC_API_URL` — il n'y a pas de serveur d'authentification côté
 * Next.
 *
 * `credentials: "include"` est indispensable : le web est sur `:3000` et l'API
 * sur `:3001`. Sans ça le navigateur n'émet pas le cookie de session, et
 * chaque requête ressort anonyme sans la moindre erreur visible.
 */
const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  fetchOptions: { credentials: "include" },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  /**
   * Changement de mot de passe depuis les réglages. Distinct de
   * `resetPassword`, qui répond à un jeton reçu par e-mail : ici la session
   * existe, et c'est l'ancien mot de passe qui fait preuve.
   */
  changePassword,
  /**
   * Les moyens de connexion du compte, un par fournisseur — dont `credential`,
   * qui n'existe que si un mot de passe a été choisi.
   *
   * C'est la seule source qui sache répondre à « ce compte a-t-il un mot de
   * passe ? », question que `GET /v1/me` n'expose pas : elle relève de
   * l'authentification, pas du profil. La suppression de compte s'en sert pour
   * savoir s'il y a quelque chose à confirmer (doc 04, § Compte).
   */
  listAccounts,
} = authClient;
