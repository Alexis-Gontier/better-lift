import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en laissant la dernière gagner.
 *
 * `clsx` aplatit les conditions, `twMerge` résout les conflits réels : sans
 * lui, `cn("px-2", "px-4")` produit les deux classes et c'est l'ordre du CSS
 * généré qui tranche, pas celui de l'appel.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
