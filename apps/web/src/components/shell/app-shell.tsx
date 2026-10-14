import type { ReactNode } from "react";

/** Le conteneur commun aux deux gabarits, pleine hauteur (D200 : barre latérale retirée). */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">{children}</main>
  );
}
