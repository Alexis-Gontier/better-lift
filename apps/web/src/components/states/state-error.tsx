import { useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Erreur de chargement d'une page ; « Réessayer » retire l'état forcé par l'URL (D303) et relance
 * la requête quand la page en donne le moyen.
 */
export function StateError({ title, reessayer }: { title: string; reessayer?: () => void }) {
  const navigate = useNavigate();
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>Vérifiez votre connexion, puis réessayez.</p>
        {/* Sous le texte, pas en coin : dans une colonne étroite, le titre passerait dessous. */}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            reessayer?.();
            navigate({ to: ".", search: (p) => ({ ...p, etat: undefined }) });
          }}
        >
          Réessayer
        </Button>
      </AlertDescription>
    </Alert>
  );
}
