import { useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Erreur de chargement d'une page ; « Réessayer » retire l'état forcé du prototype. */
export function StateError({ title }: { title: string }) {
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
          onClick={() => navigate({ to: ".", search: (p) => ({ ...p, etat: undefined }) })}
        >
          Réessayer
        </Button>
      </AlertDescription>
    </Alert>
  );
}
