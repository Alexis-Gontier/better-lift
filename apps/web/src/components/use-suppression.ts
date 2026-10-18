import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DELAI_ANNULATION_MS, differes } from "@/lib/differe";

/**
 * Supprimer avec « Annuler » (D302) : l'élément quitte le cache tout de suite, l'appel ne part
 * qu'à la fin du toast. Annuler remet le cache tel quel ; un échec aussi, et le dit.
 * `supprimer` doit passer `keepalive` : un départ de page envoie ce qui attend (`pagehide`).
 */
export function useSuppression<T>(options: {
  /** La clé de la liste dont l'élément sort. */
  cle: QueryKey;
  retirer: (donnees: T, id: string) => T;
  supprimer: (id: string) => Promise<void>;
  /** Ce qu'il faut rafraîchir une fois la suppression faite. */
  apres?: QueryKey[];
}) {
  const client = useQueryClient();
  return (id: string, libelle: string) => {
    const avant = client.getQueryData<T>(options.cle);
    if (avant !== undefined) client.setQueryData<T>(options.cle, options.retirer(avant, id));
    const restaurer = () => {
      if (avant !== undefined) client.setQueryData(options.cle, avant);
    };
    differes.programmer(id, async () => {
      try {
        await options.supprimer(id);
      } catch (e) {
        restaurer();
        toast.error(e instanceof Error ? e.message : "La suppression a échoué.");
      } finally {
        for (const cle of [options.cle, ...(options.apres ?? [])])
          void client.invalidateQueries({ queryKey: cle });
      }
    });
    toast(libelle, {
      duration: DELAI_ANNULATION_MS,
      action: {
        label: "Annuler",
        onClick: () => {
          if (differes.annuler(id)) restaurer();
        },
      },
    });
  };
}
