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
): { guard: ReactNode; release: () => void } {
  const blocking = useRef(dirty);
  blocking.current = dirty;
  const blocker = useBlocker({
    shouldBlockFn: () => blocking.current,
    enableBeforeUnload: () => blocking.current,
    withResolver: true,
  });
  const guard = (
    <AlertDialog open={blocker.status === "blocked"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter sans enregistrer ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les modifications de {what} seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>Rester</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
            Quitter
          </AlertDialogAction>
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
