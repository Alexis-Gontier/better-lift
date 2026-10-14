import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Le danger a sa couleur, et elle ne fait que ça (D36) : ni l'action, ni le record. */
export function ConfirmerSuppression({
  nom,
  description = "La routine disparaît. Les séances déjà faites avec elle restent dans l'historique.",
  ouvert,
  onFermer,
  onConfirmer,
}: {
  nom: string;
  /** Ce que la suppression emporte, et ce qu'elle laisse. */
  description?: string;
  ouvert: boolean;
  onFermer: () => void;
  onConfirmer: () => void;
}) {
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent
        showCloseButton={false}
        className="gap-3 bg-secondary-background p-5 sm:max-w-sm"
      >
        <DialogTitle className="text-base">Supprimer « {nom} » ?</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {description}
        </DialogDescription>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            Garder
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            className="rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Supprimer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
