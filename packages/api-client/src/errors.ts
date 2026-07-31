import { type ApiErrorCode, apiErrorSchema } from "@better-lift/validators";

/**
 * Erreur remontée par le client. Les échecs réseau et les réponses d'erreur de
 * l'API passent par le même type : l'appelant n'a qu'un seul cas à traiter.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | "NETWORK_ERROR" | "INVALID_RESPONSE";
  readonly details: { path: string; message: string }[] | undefined;

  constructor(
    status: number,
    code: ApiErrorCode | "NETWORK_ERROR" | "INVALID_RESPONSE",
    message: string,
    details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Traduit une réponse non 2xx. Une erreur qui ne respecte pas le format de la
 * doc 04 (proxy, passerelle, HTML d'erreur) ne doit pas faire planter le
 * client : elle est ramenée au même type.
 */
export async function toApiClientError(response: Response): Promise<ApiClientError> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return new ApiClientError(
      response.status,
      "INTERNAL",
      `Réponse illisible (HTTP ${response.status}).`,
    );
  }

  const parsed = apiErrorSchema.safeParse(payload);

  if (!parsed.success) {
    return new ApiClientError(
      response.status,
      "INTERNAL",
      `Erreur inattendue (HTTP ${response.status}).`,
    );
  }

  return new ApiClientError(
    response.status,
    parsed.data.error.code,
    parsed.data.error.message,
    parsed.data.error.details,
  );
}
