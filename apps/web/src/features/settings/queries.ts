import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ErreurApi } from "@/lib/api";
import { authClient, chargerSession } from "@/lib/auth";

const RACINE = ["compte"] as const;
const APPAREILS = [...RACINE, "appareils"] as const;

type Reponse<T> = { data: T | null; error: { message?: string; status: number } | null };

/**
 * La donnée, ou une `ErreurApi` : les appels de Better Auth ne lèvent pas, ils rendent
 * `{ data, error }`. Le message de Better Auth est en anglais : on garde le nôtre.
 */
async function sansErreur<T>(appel: Promise<Reponse<T>>, defaut: string): Promise<T> {
  let reponse: Reponse<T>;
  try {
    reponse = await appel;
  } catch {
    throw new ErreurApi("Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.", 0);
  }
  if (reponse.error || reponse.data === null) {
    throw new ErreurApi(defaut, reponse.error?.status ?? 500);
  }
  return reponse.data;
}

/** Les sessions ouvertes du compte (`listSessions`). */
export const appareilsQuery = () =>
  queryOptions({
    queryKey: APPAREILS,
    queryFn: () =>
      sansErreur(authClient.listSessions(), "Les appareils connectés n'ont pas pu être chargés."),
  });

/** Le nom (`updateUser`) ; la session le porte, d'où sa relecture. */
export function useRenommer() {
  const router = useRouter();
  return useMutation({
    mutationFn: (name: string) =>
      sansErreur(authClient.updateUser({ name }), "Le nom n'a pas pu être enregistré."),
    onSuccess: async () => {
      await chargerSession();
      await router.invalidate();
    },
  });
}

/** Le mot de passe (`changePassword`) ; les autres appareils peuvent être déconnectés. */
export function useChangerMotDePasse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (p: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions: boolean;
    }) =>
      sansErreur(
        authClient.changePassword(p),
        "Le mot de passe n'a pas pu être changé. Vérifiez le mot de passe actuel.",
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: APPAREILS }),
  });
}

/** Déconnecter un appareil (`revokeSession`). */
export function useDeconnecterAppareil() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      sansErreur(authClient.revokeSession({ token }), "L'appareil n'a pas pu être déconnecté."),
    onSuccess: () => client.invalidateQueries({ queryKey: APPAREILS }),
  });
}

/** Déconnecter tous les autres appareils (`revokeOtherSessions`). */
export function useDeconnecterLesAutres() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      sansErreur(
        authClient.revokeOtherSessions(),
        "Les autres appareils n'ont pas pu être déconnectés.",
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: APPAREILS }),
  });
}
