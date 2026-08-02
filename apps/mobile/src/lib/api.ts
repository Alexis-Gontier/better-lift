import { createApiClient } from "@better-lift/api-client";

import { getAuthToken } from "./auth-client";
import { API_URL } from "./env";

export const apiClient = createApiClient({
  baseUrl: API_URL,
  // Le mobile n'a pas de bocal à cookies partagé avec l'API : chaque requête
  // présente le jeton de session en `Authorization: Bearer` (doc 04).
  getAuthToken,
});
