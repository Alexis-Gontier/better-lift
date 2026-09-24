import type { ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavLaterale } from "./nav-lateral";

type Props = {
  titre: string;
  liste: ReactNode;
  detail?: ReactNode;
  /**
   * `colonne` : la liste devient une colonne étroite de sélection et le détail
   * l'espace de travail principal (routines). Par défaut, la liste domine.
   */
  disposition?: "liste" | "colonne";
};

/** Tailles par disposition : chacune a sa clé de persistance, pour que régler
 * l'une ne dérègle pas l'autre. */
const TAILLES = {
  liste: { liste: "62%", detail: "38%", listeMin: "35%", detailMin: "25%", detailMax: "55%" },
  colonne: { liste: "24%", detail: "76%", listeMin: "16%", detailMin: "50%", detailMax: "84%" },
} as const;

export function AppShell({ titre, liste, detail, disposition = "liste" }: Props) {
  const t = TAILLES[disposition];
  // react-resizable-panels 4 n'a plus de prop `autoSaveId` (API des versions 1/2) : la
  // persistance passe par ce hook, qui lit `localStorage` de façon SYNCHRONE au rendu
  // (via useSyncExternalStore) — donc bien avant le premier affichage.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: disposition === "colonne" ? "better-lift-contenu-colonne" : "better-lift-contenu",
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
          <ResizablePanel
            id="liste"
            defaultSize={detail ? t.liste : "100%"}
            minSize={t.listeMin}
            maxSize={disposition === "colonne" ? "35%" : undefined}
          >
            {liste}
          </ResizablePanel>

          {detail ? (
            <>
              <ResizableHandle className="bg-(--line)" />
              <ResizablePanel
                id="detail"
                defaultSize={t.detail}
                minSize={t.detailMin}
                maxSize={t.detailMax}
              >
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
