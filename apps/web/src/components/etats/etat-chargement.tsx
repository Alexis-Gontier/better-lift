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
        <div key={i} className="flex h-[54px] items-center gap-3 border-b border-(--line) px-5">
          <div className="size-8.5 shrink-0 rounded-md bg-(--surface-2)" />
          <div
            className="h-3.5 rounded bg-(--surface-2)"
            style={{ width: LARGEURS[i % LARGEURS.length] }}
          />
        </div>
      ))}
    </div>
  );
}
