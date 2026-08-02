"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMe } from "@better-lift/api-client";

import { apiClient } from "@/lib/api";
import { signOut, useSession } from "@/lib/auth-client";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="truncate font-mono text-sm">{value}</dd>
    </div>
  );
}

/**
 * Preuve du risque que la doc 09 demandait de lever.
 *
 * Deux lectures indépendantes de la même session :
 *   - `useSession()` interroge Better Auth directement ;
 *   - `useMe()` passe par `GET /v1/me`, une route applicative protégée.
 *
 * La seconde est celle qui compte : elle prouve que le cookie posé par l'API
 * sur `:3001` revient bien depuis le web sur `:3000`, et qu'une route métier
 * peut s'y fier.
 */
export function SessionPanel() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const session = useSession();
  const me = useMe(apiClient);

  if (session.isPending) {
    return <p className="text-sm text-muted-foreground">Lecture de la session…</p>;
  }

  if (!session.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Aucune session.</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <dl className="divide-y divide-border">
        <Row label="Session (client)" value={session.data.user.email} />
        <Row
          label="Session (via l’API)"
          value={me.isPending ? "…" : (me.data?.email ?? `échec : ${me.error?.message ?? ""}`)}
        />
        <Row label="E-mail vérifié" value={session.data.user.emailVerified ? "oui" : "non"} />
      </dl>

      <button
        type="button"
        onClick={() =>
          void signOut().then(async () => {
            // Le cache TanStack survit à la déconnexion : sans invalidation,
            // l'écran continuerait d'afficher l'utilisateur précédent.
            await queryClient.invalidateQueries();
            // Cette page est protégée : rester dessus déclencherait de toute
            // façon la redirection de `proxy.ts` à la navigation suivante.
            router.push("/login");
          })
        }
        className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-card"
      >
        Se déconnecter
      </button>
    </div>
  );
}
