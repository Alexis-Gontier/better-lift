"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Lien de la navigation principale, avec son état actif.
 *
 * `aria-current="page"` plutôt qu'une simple classe : la mise en évidence
 * visuelle ne dit rien à un lecteur d'écran, et « où suis-je » est précisément
 * la question à laquelle une navigation doit répondre.
 *
 * La correspondance se fait par préfixe pour que `/exercises/xyz` garde
 * l'onglet « Exercices » actif — une fiche appartient à sa section.
 */
export function NavLink({
  href,
  children,
}: {
  href: "/dashboard" | "/routines" | "/workouts" | "/exercises";
  children: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 transition ${
        active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
