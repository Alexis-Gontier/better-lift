import { useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Erreur de chargement d'une page ; « Réessayer » retire l'état forcé du prototype. */
export function StateError({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>Vérifiez votre connexion, puis réessayez.</AlertDescription>
      <AlertAction>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: ".", search: (p) => ({ ...p, etat: undefined }) })}
        >
          Réessayer
        </Button>
      </AlertAction>
    </Alert>
  );
}
