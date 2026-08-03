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
} = authClient;
