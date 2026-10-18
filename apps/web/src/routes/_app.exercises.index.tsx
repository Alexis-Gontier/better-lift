import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DetailPlaceholder } from "@/components/list-detail";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/exercises/")({
  component: () => (
    <DetailPlaceholder
      title="Aucun exercice ouvert"
      description="Choisissez-en un pour sa progression, son historique et ses records, ou ajoutez une machine de votre salle."
    >
      <Button asChild variant="outline">
        <Link to="/exercises/new" search>
          <Plus data-icon="inline-start" /> Exercice personnalisé
        </Link>
      </Button>
    </DetailPlaceholder>
  ),
});
