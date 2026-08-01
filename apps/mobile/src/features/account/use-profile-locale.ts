import { useMe } from "@better-lift/api-client";
import { DEFAULT_LOCALE, type Locale } from "@better-lift/validators";

import { apiClient } from "@/lib/api";

/**
 * Locale du **profil**, pas celle de l'appareil : le réglage suit le compte,
 * pas le téléphone sur lequel on l'ouvre.
 *
 * Le repli sur `DEFAULT_LOCALE` pendant le chargement de `GET /v1/me` est
 * assumé — c'est la valeur que l'API appliquerait d'elle-même.
 */
export function useProfileLocale(): Locale {
  return useMe(apiClient).data?.locale ?? DEFAULT_LOCALE;
}
