"use client";

import Link from "next/link";

import { useMe } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";

import { useSignOut } from "@/features/auth/use-sign-out";
import { apiClient } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

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
  const session = useSession();
  const me = useMe(apiClient);
  const signOut = useSignOut();

  if (session.isPending) {
    return <p className="text-sm text-muted-foreground">Lecture de la session…</p>;
  }

  if (!session.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Aucune session.</p>
        <Button asChild size="sm">
          <Link href="/login">Se connecter</Link>
        </Button>
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

      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        Se déconnecter
      </Button>
    </div>
  );
}
