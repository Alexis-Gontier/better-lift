import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEtat } from "@/components/states/use-etat";
import { Button } from "@/components/ui/button";
import { dossierRenomme } from "./ecran";
import { routinesQuery, useCreerDossier } from "./queries";
import { nomLibre } from "./stats";

/**
 * Le pied de la liste : créer une routine, ou un dossier — nommé « Nouveau dossier », puis
 * aussitôt en saisie pour qu'on le renomme (D257). Masqué hors de l'état nominal.
 */
export function RoutinesFooter() {
  const force = useEtat();
  const liste = useQuery(routinesQuery());
  const creer = useCreerDossier();
  if (force && force !== "nominal") return null;
  if (!liste.data) return null;
  const pris = liste.data.dossiers.map((d) => d.nom);
  return (
    <>
      <Button asChild className="flex-1">
        <Link to="/routines/new" search>
          <Plus data-icon="inline-start" /> Nouvelle routine
        </Link>
      </Button>
      <Button
        variant="outline"
        disabled={creer.isPending}
        onClick={() =>
          creer.mutate(nomLibre("Nouveau dossier", pris), {
            onSuccess: (id) => dossierRenomme.set(id),
            onError: (e) => toast.error(e.message),
          })
        }
      >
        <FolderPlus data-icon="inline-start" /> Dossier
      </Button>
    </>
  );
}
