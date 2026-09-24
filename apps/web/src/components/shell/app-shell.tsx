import type { ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavLaterale } from "./nav-lateral";

type Props = {
  titre: string;
  liste: ReactNode;
  detail?: ReactNode;
};

export function AppShell({ titre, liste, detail }: Props) {
  // react-resizable-panels 4 n'a plus de prop `autoSaveId` (API des versions 1/2) : la
  // persistance passe par ce hook, qui lit `localStorage` de façon SYNCHRONE au rendu
  // (via useSyncExternalStore) — donc bien avant le premier affichage.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "better-lift-contenu",
    storage: localStorage,
    panelIds: detail ? ["liste", "detail"] : ["liste"],
  });

  return (
    <SidebarProvider className="h-svh">
      <NavLaterale />

      {/* La seule surface permanente qui flotte (D71) : liste et détail restent
          jointifs entre eux, séparés par le filet de 1 px. La barre n'est pas
          repliable : shadcn n'applique alors plus les marges de l'`inset`, d'où
          leur recopie ici. Pas d'en-tête visible — le titre reste pour les
          lecteurs d'écran. */}
      <SidebarInset className="m-2 ml-0 min-h-0 overflow-hidden rounded-xl bg-(--surface-1) shadow-sm">
        <h1 className="sr-only">{titre}</h1>

        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
          className="min-h-0 flex-1"
        >
          <ResizablePanel id="liste" defaultSize={detail ? "62%" : "100%"} minSize="35%">
            {liste}
          </ResizablePanel>

          {detail ? (
            <>
              <ResizableHandle className="bg-(--line)" />
              <ResizablePanel id="detail" defaultSize="38%" minSize="25%" maxSize="55%">
                <aside aria-label="Détail" className="h-full bg-(--surface-1)">
                  {detail}
                </aside>
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}
