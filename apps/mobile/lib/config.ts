/**
 * L'URL de l'API, en un seul endroit : l'authentification et les requêtes la
 * partagent. Sur ÉMULATEUR Android, l'hôte se joint en 10.0.2.2, pas en
 * localhost — qui désignerait l'émulateur lui-même.
 */
export const URL_API = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001";

/**
 * Better Auth construit lui-même `/api/auth` à partir de l'ORIGINE. En
 * production, `URL_API` vaut « https://<domaine>/api » : on retire ce suffixe.
 * En développement, `URL_API` est déjà l'origine de l'API (le 3001).
 */
export const URL_AUTH = URL_API.replace(/\/api\/?$/, "");
