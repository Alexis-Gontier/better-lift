import type { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SideNav } from "./side-nav";

/**
 * La barre latérale et le contenu, communs aux deux gabarits (D133). Montée par la route de
 * chaque écran, jamais par `__root.tsx` : seul le gabarit sait quels panneaux il pose dedans.
 * Plate (D154) : rien de permanent ne flotte, le contenu est posé sur le canevas.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    // 220 px (D136) : shadcn lit la largeur dans `--sidebar-width`.
    <SidebarProvider className="h-svh" style={{ "--sidebar-width": "220px" } as CSSProperties}>
      <SideNav />
      <SidebarInset className="min-h-0 overflow-hidden bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
