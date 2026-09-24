import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { URL_AUTH } from "./config";

// `scheme` doit valoir EXACTEMENT le `scheme` de app.json — « better-lift ».
// C'est aussi lui que `trustedOrigins` porte côté API, en « better-lift:// ».
//
// `storage: SecureStore` est ce qui fait tenir la session au redémarrage : sans
// lui, le jeton vit en mémoire et disparaît à la fermeture de l'application.
export const authClient = createAuthClient({
  baseURL: URL_AUTH,
  plugins: [
    expoClient({
      scheme: "better-lift",
      storagePrefix: "better-lift",
      storage: SecureStore,
    }),
  ],
});
