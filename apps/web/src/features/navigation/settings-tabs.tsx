"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@better-lift/ui/lib/utils";

import { isNavItemActive } from "./active";
import { SETTINGS_TABS } from "./nav-items";

/**
 * Onglets des réglages (doc 05 : profil · préférences · compte).
 *
 * Des liens et non un `Tabs` de Radix : chaque section est une route à part
 * entière, donc partageable, marquable et navigable avec le bouton retour. Un
 * composant d'onglets ne ferait que déplacer cet état hors de l'URL.
 *
 * Le trait actif est doublé d'un `aria-current` — la couleur seule ne dit rien
 * à un lecteur d'écran, et le contraste de teinte ne suffit pas non plus à qui
 * distingue mal les couleurs.
 */
export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections des réglages" className="-mb-px flex gap-1 overflow-x-auto">
      {SETTINGS_TABS.map(({ href, label }) => {
        const active = isNavItemActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              "rounded-t-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
