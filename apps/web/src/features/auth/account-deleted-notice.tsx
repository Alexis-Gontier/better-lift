"use client";

import { CircleCheckIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";

/**
 * Confirme une suppression de compte, sur le seul écran qui reste accessible
 * après elle.
 *
 * Sans ce mot, la suppression se solde par une redirection muette vers la
 * connexion — indistinguable d'une session expirée, c'est-à-dire du seul autre
 * événement qui amène ici sans qu'on l'ait demandé.
 *
 * Variante `default` : ce n'est pas une erreur, c'est ce qui a été demandé.
 */
export function AccountDeletedNotice() {
  const searchParams = useSearchParams();

  if (!searchParams.get("deleted")) {
    return null;
  }

  return (
    <Alert>
      <CircleCheckIcon className="text-primary" />
      <AlertTitle>Votre compte a été supprimé.</AlertTitle>
      <AlertDescription>
        Vos séances, vos routines et vos records ont été effacés. Merci d’être passé par là.
      </AlertDescription>
    </Alert>
  );
}
