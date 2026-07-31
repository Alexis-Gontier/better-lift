import { createApiClient } from "@better-lift/api-client";

import { env } from "./env";

/**
 * Le web passe toujours par l'API, jamais par Prisma — y compris depuis un
 * Server Component (règle non négociable n°1, doc 09 D3).
 */
export const apiClient = createApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
