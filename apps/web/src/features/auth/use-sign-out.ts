"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { signOut } from "@/lib/auth-client";

/**
 * Déconnexion complète : session, cache, puis navigation.
 *
 * Les trois étapes vont ensemble et c'est pourquoi elles vivent ici plutôt que
 * dans les composants qui les déclenchent.
 *
 *   - `signOut()` détruit la session côté API ;
 *   - `clear()` jette le cache TanStack, qui **survit** à la déconnexion : sans
 *     lui, l'écran continuerait d'afficher les données de l'utilisateur
 *     précédent jusqu'à la prochaine requête ;
 *   - `push("/login")` sort de la zone protégée. Rester sur place
 *     déclencherait de toute façon la redirection de `proxy.ts` à la
 *     navigation suivante, mais après avoir montré une coquille vide.
 *
 * `clear()` et non `invalidateQueries()` : invalider **rafraîchit** les données
 * de la personne qui vient de partir, ce qui est exactement l'inverse du but.
 * `clear()` les jette, donc rien ne peut réapparaître à l'écran entre la
 * déconnexion et la redirection.
 *
 * Ni l'un ni l'autre n'empêche une dernière requête : tant qu'un composant
 * observant une requête est monté, vider le cache le laisse sans données et il
 * redemande aussitôt — d'où le 401 visible en console sur `GET /v1/me` au
 * moment de la déconnexion. C'est sans conséquence, la redirection suit, et
 * l'unique observateur concerné est le panneau de contrôle V0 du tableau de
 * bord, qui partira avec le vrai tableau de bord.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(async () => {
    await signOut();
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);
}
