import type { ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavLaterale } from "./nav-lateral";

type Props = {
  titre: string;
  liste: ReactNode;
  detail?: ReactNode;
};

/**
 * La sidebar shadcn écrit son état replié dans un cookie mais ne le relit pas :
 * c'est au rendu serveur de le faire, et ce SPA n'en a pas. Lu ici, de façon
 * synchrone, pour que la coquille naisse déjà dans le bon état.
 */
function sidebarOuverte() {
  return !document.cookie.split("; ").includes("sidebar_state=false");
}

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
    <SidebarProvider defaultOpen={sidebarOuverte()} className="h-svh">
      <NavLaterale />

      {/* La seule surface permanente qui flotte (D71) : liste et détail restent
          jointifs entre eux, séparés par le filet de 1 px. */}
      <SidebarInset className="min-h-0 overflow-hidden bg-(--surface-1)">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-(--line) px-3">
          <SidebarTrigger className="-ml-1" aria-label="Replier la navigation (Ctrl B)" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium">{titre}</h1>
        </header>

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
