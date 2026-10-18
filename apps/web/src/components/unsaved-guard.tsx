import { useBlocker } from "@tanstack/react-router";
import { type ReactNode, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Quitter un élément modifié et non enregistré demande confirmation (D239). `release` lève le
 * garde avant une navigation voulue (après une suppression ou une création, par exemple).
 */
export function useUnsavedGuard(
  dirty: boolean,
  what: string,
  /** Enregistre avant de partir, `false` en cas d'échec ; absent quand l'élément n'est pas enregistrable. */
  save?: () => Promise<boolean>,
): { guard: ReactNode; release: () => void } {
  const blocking = useRef(dirty);
  blocking.current = dirty;
  const blocker = useBlocker({
    shouldBlockFn: () => blocking.current,
    enableBeforeUnload: () => blocking.current,
    withResolver: true,
  });
  const guard = (
    // Échap ou un clic hors de la fenêtre : on reste, comme « Rester ».
    <AlertDialog
      open={blocker.status === "blocked"}
      onOpenChange={(open) => !open && blocker.reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {save ? "Enregistrer avant de quitter ?" : "Quitter sans enregistrer ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {save ? "Sans enregistrement, les" : "Les"} modifications de {what} seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>Rester</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
            {save ? "Ne pas enregistrer" : "Quitter"}
          </AlertDialogAction>
          {save && (
            <AlertDialogAction
              onClick={async () => {
                // Un enregistrement refusé garde la page : les modifications ne se perdent pas.
                if (!(await save())) return blocker.reset?.();
                blocking.current = false;
                blocker.proceed?.();
              }}
            >
              Enregistrer
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return {
    guard,
    release: () => {
      blocking.current = false;
    },
  };
}
