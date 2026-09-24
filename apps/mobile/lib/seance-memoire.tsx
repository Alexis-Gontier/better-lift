import type { SeanceEnCours } from "@better-lift/shared";
import { createContext, type ReactNode, useContext, useState } from "react";

/**
 * DESSIN (PR 1) : la séance en cours tenue EN MÉMOIRE, pour éprouver les écrans.
 *
 * Ce contexte disparaît en PR 3 : le brouillon passera par le DISQUE sous une
 * clé unique, et l'écran de séance le relira de là — jamais d'un paramètre de
 * route ni d'un état React, qui ne survivent pas à un arrêt forcé (§ 8).
 */
type Contexte = { seance: SeanceEnCours | null; setSeance: (s: SeanceEnCours | null) => void };

const SeanceContexte = createContext<Contexte | null>(null);

export function SeanceProvider({ children }: { children: ReactNode }) {
  const [seance, setSeance] = useState<SeanceEnCours | null>(null);
  return (
    <SeanceContexte.Provider value={{ seance, setSeance }}>{children}</SeanceContexte.Provider>
  );
}

export function useSeance(): Contexte {
  const c = useContext(SeanceContexte);
  if (!c) throw new Error("useSeance hors de SeanceProvider");
  return c;
}
