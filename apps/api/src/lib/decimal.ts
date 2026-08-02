import { type Prisma } from "@better-lift/db";

/**
 * Les `Decimal` sortent de l'API en **chaîne** (règle non négociable n°4), avec
 * l'échelle de leur colonne.
 *
 * `toString()` donnerait `"100"` là où le contrat annonce `"100.00"`, et un
 * client qui compare deux charges sous forme de chaînes — ce que fait un cache
 * de requêtes — y verrait deux valeurs différentes.
 */
export function toDecimalString(value: Prisma.Decimal | null, scale: number): string | null {
  return value === null ? null : value.toFixed(scale);
}
