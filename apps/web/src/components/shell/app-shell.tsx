import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SideNav } from "./side-nav";

/** La barre latérale de shadcn et le contenu, communs aux deux gabarits. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-svh">
      <SideNav />
      <SidebarInset className="min-h-0 overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  );
}
