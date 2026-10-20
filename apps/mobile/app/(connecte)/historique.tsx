import { Ecran } from "@/components/ui/ecran";
import { Vide } from "@/components/ui/etats";
import { TitreOnglet } from "@/components/ui/titre-onglet";

/**
 * L'onglet Historique (D319) : l'onglet seul pour l'instant. La liste et le
 * détail des séances viendront (`GET /seances`, `GET /seances/:id`).
 */
export default function Historique() {
  return (
    <Ecran className="flex-1 bg-background" edges={["top"]}>
      <TitreOnglet titre="Historique" />
      <Vide
        titre="Rien à afficher pour l'instant"
        message="Tes séances passées apparaîtront ici."
      />
    </Ecran>
  );
}
