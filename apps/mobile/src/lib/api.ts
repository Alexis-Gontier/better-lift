import { createApiClient } from "@better-lift/api-client";

/**
 * `localhost` désigne le téléphone, pas la machine de développement : depuis un
 * appareil physique, l'URL doit être l'IP LAN de la machine (doc 02).
 * `EXPO_PUBLIC_*` est inlinée au bundle, donc référencée littéralement.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiClient = createApiClient({ baseUrl: API_URL });
