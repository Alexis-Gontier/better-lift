import type { RoutineResume, RoutineSaisie } from "@better-lift/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSuppression } from "@/components/use-suppression";
import { api, lire } from "@/lib/api";

/**
 * Les routines et leurs dossiers (D300). LE PIÈGE DES CLÉS : lectures et écritures partagent la
 * racine `["routines"]`, et chaque écriture l'invalide EN ENTIER — liste, dossiers, détails.
 * Une clé plus étroite laisserait l'écran sur l'ancienne version après un enregistrement réussi.
 */
const routinesKeys = {
  all: ["routines"] as const,
  liste: () => ["routines", "liste"] as const,
  detail: (id: string) => ["routines", "detail", id] as const,
  seances: (id: string) => ["routines", "seances", id] as const,
  precedentes: (slugs: readonly string[]) => ["routines", "precedentes", [...slugs]] as const,
};

/** Un appel qui survit au départ de la page (D302) ; `init` remplace celui du client. */
const KEEPALIVE = { init: { keepalive: true, credentials: "include" as const } };

type Liste = { routines: RoutineResume[]; dossiers: { id: string; nom: string }[] };

export const routinesQuery = () =>
  queryOptions({
    queryKey: routinesKeys.liste(),
    queryFn: async (): Promise<Liste> => {
      const res = await lire(() => api.routines.$get(), "Les routines n'ont pas pu être chargées.");
      return res.json();
    },
  });

export const routineQuery = (id: string) =>
  queryOptions({
    queryKey: routinesKeys.detail(id),
    queryFn: async () => {
      const res = await lire(
        () => api.routines[":id"].$get({ param: { id } }),
        "Cette routine n'a pas pu être chargée.",
      );
      return res.json();
    },
  });

/** Ses séances, pour ses stats (D311) : cent suffisent à trois mois. */
export const seancesRoutineQuery = (id: string) =>
  queryOptions({
    queryKey: routinesKeys.seances(id),
    queryFn: async () => {
      const res = await lire(
        () => api.seances.$get({ query: { routine: id, taille: "100" } }),
        "Les séances de la routine n'ont pas pu être chargées.",
      );
      return (await res.json()).seances;
    },
  });

/** Par slug, toutes les séries de la dernière séance qui le contenait : « Dernière fois ». */
export const precedentesQuery = (slugs: readonly string[]) =>
  queryOptions({
    queryKey: routinesKeys.precedentes(slugs),
    queryFn: async () => {
      const res = await lire(
        () => api.seances.precedentes.$get({ query: { slugs: slugs.join(",") } }),
        "La dernière fois n'a pas pu être chargée.",
      );
      return res.json();
    },
    enabled: slugs.length > 0,
  });

function useInvalider() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: routinesKeys.all });
}

export function useCreerRoutine() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (saisie: RoutineSaisie) => {
      const res = await lire(
        () => api.routines.$post({ json: saisie }),
        "La routine n'a pas pu être créée.",
      );
      return (await res.json()).id;
    },
    onSuccess: invalider,
  });
}

export function useEnregistrerRoutine(id: string) {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (saisie: RoutineSaisie) => {
      await lire(
        () => api.routines[":id"].$put({ param: { id }, json: saisie }),
        "La routine n'a pas pu être enregistrée.",
      );
    },
    onSuccess: invalider,
  });
}

/** Ranger une routine (D297) : la liste bouge AVANT la réponse, et revient en cas d'échec. */
export function useDeplacerRoutine() {
  const client = useQueryClient();
  const cle = routinesKeys.liste();
  return useMutation({
    mutationFn: async (p: { id: string; dossierId: string | null }) => {
      await lire(
        () => api.routines[":id"].$patch({ param: { id: p.id }, json: { dossierId: p.dossierId } }),
        "La routine n'a pas pu être rangée.",
      );
    },
    onMutate: async (p) => {
      await client.cancelQueries({ queryKey: cle });
      const avant = client.getQueryData<Liste>(cle);
      if (avant)
        client.setQueryData<Liste>(cle, {
          ...avant,
          routines: avant.routines.map((r) =>
            r.id === p.id ? { ...r, dossierId: p.dossierId } : r,
          ),
        });
      return { avant };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.avant) client.setQueryData(cle, ctx.avant);
    },
    onSettled: () => client.invalidateQueries({ queryKey: routinesKeys.all }),
  });
}

export function useCreerDossier() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (nom: string) => {
      const res = await lire(
        () => api.dossiers.$post({ json: { nom } }),
        "Le dossier n'a pas pu être créé.",
      );
      return (await res.json()).id;
    },
    onSuccess: invalider,
  });
}

export function useRenommerDossier() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (p: { id: string; nom: string }) => {
      await lire(
        () => api.dossiers[":id"].$patch({ param: { id: p.id }, json: { nom: p.nom } }),
        "Le dossier n'a pas pu être renommé.",
      );
    },
    onSuccess: invalider,
  });
}

/** Supprimer une routine, avec « Annuler » (D302) ; son détail sort du cache. */
export function useSupprimerRoutine() {
  const client = useQueryClient();
  return useSuppression<Liste>({
    cle: routinesKeys.liste(),
    retirer: (l, id) => ({ ...l, routines: l.routines.filter((r) => r.id !== id) }),
    supprimer: async (id) => {
      await lire(
        () => api.routines[":id"].$delete({ param: { id } }, KEEPALIVE),
        "La routine n'a pas pu être supprimée.",
      );
      // Pas d'invalidation du détail : elle referait un GET de la routine partie, soit un 404.
      client.removeQueries({ queryKey: routinesKeys.detail(id) });
    },
  });
}

/** Supprimer un dossier, avec « Annuler » ; ses routines passent « Sans dossier ». */
export function useSupprimerDossier() {
  return useSuppression<Liste>({
    cle: routinesKeys.liste(),
    retirer: (l, id) => ({
      dossiers: l.dossiers.filter((d) => d.id !== id),
      routines: l.routines.map((r) => (r.dossierId === id ? { ...r, dossierId: null } : r)),
    }),
    supprimer: async (id) => {
      await lire(
        () => api.dossiers[":id"].$delete({ param: { id } }, KEEPALIVE),
        "Le dossier n'a pas pu être supprimé.",
      );
    },
    // Le dossier d'une routine ouverte change avec lui.
    apres: [routinesKeys.all],
  });
}
