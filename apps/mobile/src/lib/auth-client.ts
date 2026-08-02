import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { API_URL } from "./env";

/**
 * Client Better Auth du mobile. Il parle à la **même instance** que le web,
 * sur la même URL d'API — c'est tout l'intérêt (doc 09, risque 2).
 *
 * Ce qui change du web, c'est le transport : pas de bocal à cookies partagé
 * avec l'API, donc le plugin stocke le jeton de session renvoyé dans
 * `set-auth-token` et le rejoue. `expo-secure-store` le place dans le Keychain
 * iOS / Keystore Android, jamais dans AsyncStorage.
 *
 * `scheme` doit correspondre à `app.json` **et** figurer dans les
 * `trustedOrigins` du serveur : c'est par là que revient la redirection OAuth.
 */
const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    // `@better-auth/expo@1.6.25` déclare `getActions` avec un `BetterFetch`
    // paramétré plus étroitement que l'interface `BetterAuthClientPlugin` de
    // `better-auth@1.6.25` ne l'accepte. Les deux paquets sont pourtant à la
    // même version et résolvent la **même** copie de `better-auth` : ce n'est
    // pas une duplication pnpm mais un défaut de variance dans les types
    // publiés (doc 10). Le contrat d'exécution, lui, est celui de la
    // documentation officielle.
    //
    // `@ts-expect-error` plutôt qu'un cast : il préserve l'inférence de
    // session et des actions du plugin, et il **échouera** le jour où la
    // bibliothèque corrigera ses types — ce qui nous dira de le supprimer.
    // @ts-expect-error types de @better-auth/expo incompatibles, cf. ci-dessus
    expoClient({
      scheme: "betterlift",
      storagePrefix: "betterlift",
      storage: SecureStore,
    }),
  ],
});

// `signUp` n'est pas réexporté : la création de compte se fait sur le web en
// V1 (doc 06), le mobile se contente de connecter un compte existant.
export const { signIn, signOut, useSession } = authClient;

/** Nom du cookie de session, préfixé `__Secure-` dès que l'API est en HTTPS. */
const SESSION_COOKIE = /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/;

/**
 * Jeton de session à présenter aux routes applicatives en `Authorization:
 * Bearer` (doc 04). `packages/api-client` l'appelle avant chaque requête.
 *
 * Le plugin Expo stocke la session sous forme d'en-tête `Cookie` complet — il
 * n'expose pas le jeton nu. On l'en extrait : c'est la même valeur que celle
 * renvoyée dans `set-auth-token`, celle qu'attend le plugin `bearer()` du
 * serveur.
 */
export function getAuthToken(): string | null {
  // Conséquence du `@ts-expect-error` ci-dessus : les actions du plugin ne
  // remontent pas jusqu'au type du client. On réaffirme la seule qu'on
  // utilise, plutôt que d'affaiblir tout le reste par un cast global.
  const { getCookie } = authClient as unknown as { getCookie: () => string };
  const captured = getCookie().match(SESSION_COOKIE)?.[1];

  return captured ? decodeURIComponent(captured) : null;
}
