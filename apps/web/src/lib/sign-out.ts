import { useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { loadSession } from "@/lib/auth-session";

/** La déconnexion, partagée par le menu du compte et la page Paramètres. */
export function useSignOut() {
  const navigate = useNavigate();
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    // Relire puis invalider, dans cet ordre : une deconnexion qui ne rafraichit
    // pas le contexte laisse l'ancienne session a l'ecran, et la garde continue
    // de laisser passer.
    await loadSession();
    await router.invalidate();
    await navigate({ to: "/login" });
  };
}
