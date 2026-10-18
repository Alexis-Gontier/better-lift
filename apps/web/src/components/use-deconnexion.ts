import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { authClient, chargerSession } from "@/lib/auth";

/** La déconnexion, partagée par le menu du compte et la page Compte (D301). */
export function useDeconnexion() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    await authClient.signOut();
    // Relire puis invalider, dans cet ordre : sinon l'ancienne session reste au contexte et
    // la garde laisse passer. Vider le cache : le compte suivant ne verrait pas ces données.
    await chargerSession();
    queryClient.clear();
    await router.invalidate();
    await navigate({ to: "/login" });
  };
}
