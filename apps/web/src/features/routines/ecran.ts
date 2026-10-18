import { signal } from "@/hooks/signal";

/**
 * L'état d'écran des Routines, partagé entre la liste et le panneau : rien ici n'est enregistré.
 */

/** Le nom tapé dans la routine en création : sa ligne en tête de liste le suit (D238). */
export const nomBrouillon = signal("");

/** Le dossier dont le nom est en saisie (juste créé, ou « Renommer »). */
export const dossierRenomme = signal<string | null>(null);
