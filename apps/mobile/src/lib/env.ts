/**
 * Configuration d'exécution du mobile.
 *
 * Ce module ne dépend de rien, et c'est sa raison d'être : `api.ts` a besoin du
 * jeton que produit `auth-client.ts`, qui a lui-même besoin de l'URL de l'API.
 * Faire vivre l'URL dans `api.ts` créait donc un cycle d'imports
 * (`api → auth-client → api`) — Metro le tolère en avertissant, mais l'un des
 * deux modules voit alors l'autre partiellement initialisé, et la valeur
 * observée dépend de l'ordre d'évaluation. Une constante isolée supprime le
 * cycle au lieu de vivre avec.
 *
 * `localhost` désigne le téléphone, pas la machine de développement : depuis un
 * appareil physique, l'URL doit être l'IP LAN de la machine (doc 02).
 * `EXPO_PUBLIC_*` est inlinée au bundle, donc référencée littéralement.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
