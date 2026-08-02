import Link from "next/link";

import { NavLink } from "@/features/navigation/nav-link";

/**
 * Layout de la zone authentifiée. La sidebar de la doc 05 viendra avec les
 * écrans qu'elle a à porter — statistiques et réglages manquent encore ; à
 * quatre destinations, une barre de liens suffit et une colonne latérale ne
 * serait qu'un décor.
 *
 * Aucune vérification de session ici : c'est `proxy.ts` qui écarte les
 * visiteurs anonymes en amont, et l'API qui fait autorité en aval.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          better-lift
        </Link>

        <nav aria-label="Navigation principale" className="flex gap-1 text-sm">
          <NavLink href="/dashboard">Tableau de bord</NavLink>
          <NavLink href="/routines">Routines</NavLink>
          <NavLink href="/workouts">Historique</NavLink>
          <NavLink href="/exercises">Exercices</NavLink>
        </nav>
      </header>
      {children}
    </div>
  );
}
