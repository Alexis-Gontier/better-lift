import { useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { chargerSession } from "@/lib/auth-session";

/** La déconnexion, partagée par le menu du compte et la page Paramètres. */
export function useDeconnexion() {
  const navigate = useNavigate();
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    // Relire puis invalider, dans cet ordre : une deconnexion qui ne rafraichit
    // pas le contexte laisse l'ancienne session a l'ecran, et la garde continue
    // de laisser passer.
    await chargerSession();
    await router.invalidate();
    await navigate({ to: "/connexion" });
  };
}
