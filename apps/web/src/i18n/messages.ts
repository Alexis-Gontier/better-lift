import { type Locale } from "@better-lift/validators";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

/**
 * Catalogues de traduction du web.
 *
 * Importés statiquement, pas chargés à la demande : les deux réunis pèsent
 * quelques kilo-octets, et un chargement asynchrone imposerait un état de
 * transition à chaque changement de langue pour une économie invisible. On
 * réévaluera le jour où une troisième langue arrivera.
 *
 * **Le français est la source.** Son catalogue est celui qu'on écrit en
 * premier, et le type des clés en dérive : une clé traduite en anglais mais
 * absente du français est une faute de compilation, ce qui est exactement le
 * sens de la relation entre les deux.
 */
export const MESSAGES: Record<Locale, typeof fr> = { fr, en };

export type Messages = typeof fr;
