import { Skeleton } from "@/components/ui/skeleton";

// Largeurs fixes, jamais tirées au hasard : une largeur aléatoire rend le
// composant inutilisable dès qu'un rendu serveur entre en jeu, et rend les
// captures d'écran instables d'un lancement à l'autre.
const LARGEURS = ["72%", "58%", "81%", "64%", "76%", "52%", "69%", "60%"];

export function EtatChargement({ lignes = 8 }: { lignes?: number }) {
  return (
    <div className="flex flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      {Array.from({ length: lignes }, (_, i) => (
        // Clé par indice : ces rangées n'ont pas d'identité et ne peuvent pas
        // être réordonnées — il n'y a rien d'autre à quoi s'accrocher.
        <div
          key={i}
          className="flex h-[54px] flex-col justify-center gap-1.5 border-b border-border px-5"
        >
          <Skeleton className="h-3.5 bg-muted" style={{ width: LARGEURS[i % LARGEURS.length] }} />
          <Skeleton className="h-2.5 w-24 bg-muted" />
        </div>
      ))}
    </div>
  );
}
