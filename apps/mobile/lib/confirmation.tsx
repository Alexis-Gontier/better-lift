import type { LucideIcon } from "lucide-react-native";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { Feuille, type OptionFeuille } from "../components/ui/feuille";

type Demande = { titre: string; message?: string; options: OptionFeuille[] };

const Ouvrir = createContext<((d: Demande) => void) | null>(null);

/**
 * Les questions de l'application (« Abandonner la séance ? ») dans une feuille
 * basse du thème, plus dans l'alerte native : elle s'affichait en blanc en
 * thème sombre, et ses deux boutons de même couleur ne distinguaient pas
 * l'action destructive. Une seule feuille, montée à la racine.
 */
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [demande, setDemande] = useState<Demande | null>(null);
  return (
    <Ouvrir.Provider value={setDemande}>
      {children}
      <Feuille
        visible={demande !== null}
        titre={demande?.titre}
        message={demande?.message}
        options={demande?.options ?? []}
        onFermer={() => setDemande(null)}
      />
    </Ouvrir.Provider>
  );
}

/** Ouvre une feuille de choix quelconque (un menu sans question). */
export function useFeuille(): (d: Demande) => void {
  const ouvrir = useContext(Ouvrir);
  if (!ouvrir) throw new Error("useFeuille hors de ConfirmationProvider");
  return ouvrir;
}

/**
 * Demande confirmation d'une action. Elle vient en tête, en couleur de danger
 * si elle détruit ; « Annuler » ferme, en dernier.
 */
export function useConfirmer() {
  const ouvrir = useFeuille();
  return useCallback(
    (q: {
      titre: string;
      message: string;
      action: string;
      onConfirmer: () => void;
      danger?: boolean;
      icone?: LucideIcon;
      annuler?: string;
    }) =>
      ouvrir({
        titre: q.titre,
        message: q.message,
        options: [
          { libelle: q.action, danger: q.danger ?? true, icone: q.icone, onPress: q.onConfirmer },
          { libelle: q.annuler ?? "Annuler" },
        ],
      }),
    [ouvrir],
  );
}

/** Un fait à lire, sans choix : une seule option, qui ferme. */
export function useInformer() {
  const ouvrir = useFeuille();
  return useCallback(
    (titre: string, message: string) => ouvrir({ titre, message, options: [{ libelle: "OK" }] }),
    [ouvrir],
  );
}
