import { useMatch } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Le libellé qu'une page de détail donne à sa miette (« Push A » plutôt que « Détail ») : la page
 * a déjà sa donnée, elle le déclare ; le fil d'Ariane le lit, par identifiant de route.
 */
let libelles: ReadonlyMap<string, string> = new Map();
const abonnes = new Set<() => void>();

function poser(id: string, libelle: string | undefined) {
  const suivant = new Map(libelles);
  if (libelle) suivant.set(id, libelle);
  else suivant.delete(id);
  libelles = suivant;
  for (const f of abonnes) f();
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

/** Les libellés posés, par identifiant de route. */
export const useCrumbLabels = () => useSyncExternalStore(abonner, () => libelles);

/** Donne son libellé à la miette de la route qui rend ce composant ; le retire en partant. */
export function useCrumbLabel(libelle: string | undefined) {
  const { id } = useMatch({ strict: false });
  useEffect(() => {
    poser(id, libelle);
    return () => poser(id, undefined);
  }, [id, libelle]);
}
