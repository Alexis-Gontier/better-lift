import type { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavLaterale } from "./nav-lateral";

/**
 * La barre latérale fixe et la zone de contenu, communes aux deux gabarits (D133).
 * Montée par la route de chaque écran, jamais par `__root.tsx` : seul le gabarit
 * sait quels panneaux il pose dedans.
 */
export function Coquille({ children }: { children: ReactNode }) {
  return (
    // 220 px (D136) : shadcn lit la largeur dans `--sidebar-width`.
    <SidebarProvider className="h-svh" style={{ "--sidebar-width": "220px" } as CSSProperties}>
      <NavLaterale />

      {/* La seule surface permanente qui flotte (D71). La barre n'est pas
          repliable : shadcn n'applique alors plus les marges de l'`inset`, d'où
          leur recopie ici. */}
      <SidebarInset className="m-2 ml-0 min-h-0 overflow-hidden rounded-2xl bg-(--surface-1) shadow-sm">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
