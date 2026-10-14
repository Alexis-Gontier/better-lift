import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SideNav } from "./side-nav";

/** La barre latérale de shadcn et le contenu, communs aux deux gabarits. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-svh">
      <SideNav />
      <SidebarInset className="min-h-0 overflow-hidden">
        {/* L'en-tête de page, vide pour l'instant : aligné sur l'en-tête de la barre. */}
        <header className="h-16 shrink-0 border-b-2 border-border" />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
