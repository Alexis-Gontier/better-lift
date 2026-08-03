import { TooltipProvider } from "@better-lift/ui/components/tooltip";

import { I18nProvider } from "./i18n-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Point d'assemblage des providers globaux. Un fichier par provider à côté,
 * pour que chacun garde sa configuration et ses raisons ; ici, seul l'ordre
 * d'imbrication se lit.
 *
 * Ce composant n'est **pas** `"use client"` : chaque provider porte sa propre
 * directive. La frontière serveur/client reste ainsi le plus bas possible et
 * `children` continue d'arriver ici déjà rendu côté serveur.
 *
 * L'ordre va du plus large au plus étroit — document, données, interaction —
 * mais aucun des trois ne dépend des autres : le déplacer ne casserait rien.
 *
 * `TooltipProvider` est global et non optionnel : notre `tooltip.tsx` n'en
 * embarque pas, donc tout `<Tooltip>` monté sans lui lève à l'exécution. C'est
 * ce qui rend `<SidebarMenuButton tooltip="…" />` utilisable, la sidebar
 * repliée n'affichant plus que des icônes.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {/*
          `I18nProvider` est **sous** `QueryProvider` et non au-dessus : la
          langue vient du profil, qu'il lit dans le cache de TanStack Query.
          L'inverse lèverait « No QueryClient set » au montage.
        */}
        <I18nProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
