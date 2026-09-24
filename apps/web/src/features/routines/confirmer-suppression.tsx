import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Le danger a sa couleur, et elle ne fait que ça (D36) : ni l'action, ni le record. */
export function ConfirmerSuppression({
  nom,
  ouvert,
  onFermer,
  onConfirmer,
}: {
  nom: string;
  ouvert: boolean;
  onFermer: () => void;
  onConfirmer: () => void;
}) {
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent showCloseButton={false} className="gap-3 bg-(--surface-1) p-5 sm:max-w-sm">
        <DialogTitle className="text-base">Supprimer « {nom} » ?</DialogTitle>
        <DialogDescription className="text-sm text-(--ink-subtle)">
          La routine disparaît. Les séances déjà faites avec elle restent dans l'historique.
        </DialogDescription>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-md border border-(--line) px-3 py-2 text-sm text-(--ink) hover:bg-(--surface-2) focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
          >
            Garder
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            className="rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
          >
            Supprimer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
