/**
 * Les suppressions différées (D302) : la ligne quitte l'écran tout de suite, l'appel ne part qu'à
 * l'échéance. « Annuler » n'a donc rien à défaire côté serveur. Sans React : le hook qui s'en sert
 * vit dans `components/use-suppression.ts`.
 */
export function creerDifferes(delaiMs: number) {
  const enAttente = new Map<
    string,
    { minuteur: ReturnType<typeof setTimeout>; executer: () => Promise<void> }
  >();
  const annuler = (cle: string) => {
    const e = enAttente.get(cle);
    if (!e) return false;
    clearTimeout(e.minuteur);
    enAttente.delete(cle);
    return true;
  };
  return {
    programmer(cle: string, executer: () => Promise<void>) {
      annuler(cle);
      const minuteur = setTimeout(() => {
        enAttente.delete(cle);
        void executer();
      }, delaiMs);
      enAttente.set(cle, { minuteur, executer });
    },
    annuler,
    /** Exécute tout ce qui attend, tout de suite (départ de page). */
    vider() {
      for (const [cle, e] of [...enAttente]) {
        annuler(cle);
        void e.executer();
      }
    },
  };
}

/** Le délai d'annulation : la durée du toast. */
export const DELAI_ANNULATION_MS = 5000;

/** Une seule file pour l'application. */
export const differes = creerDifferes(DELAI_ANNULATION_MS);

// Un départ de page envoie ce qui attend ; les appels portent `keepalive` pour lui survivre.
if (typeof window !== "undefined") window.addEventListener("pagehide", () => differes.vider());
