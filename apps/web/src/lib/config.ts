/**
 * Où joindre l'API. En production, le web et l'API partagent l'origine (D18) : l'API sous
 * `/api`, Better Auth sous `/api/auth`, que son client construit depuis l'origine. En
 * développement, l'API tourne à part, sur le 3001.
 */
const URL_API = import.meta.env.PROD
  ? `${window.location.origin}/api`
  : (import.meta.env.VITE_API_URL ?? "http://localhost:3001");

export const URL_AUTH = import.meta.env.PROD ? window.location.origin : URL_API;
