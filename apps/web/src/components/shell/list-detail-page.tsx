import type { ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AppShell } from "./app-shell";

type Props = {
  title: string;
  /** La liste de la page : le titre du fil y ramène quand un détail est ouvert. */
  to: "/sessions" | "/routines" | "/exercises";
  list: ReactNode;
  detail?: ReactNode;
  /**
   * `column` : la liste devient une colonne étroite de sélection et le détail
   * l'espace de travail principal (routines). Par défaut, la liste domine.
   */
  /** `feed` : un fil à parcourir à gauche, un détail large à droite (séances, D140). */
  /** `catalog` : la grille d'exercices à gauche, la fiche à droite (D206). */
  layout?: "list" | "column" | "feed" | "catalog";
};

/** Tailles par disposition : chacune a sa clé de persistance, pour que régler
 * l'une ne dérègle pas l'autre. */
const SIZES = {
  list: { list: "62%", detail: "38%", listMin: "35%", detailMin: "25%", detailMax: "55%" },
  // Les routines en cartes (D216) : une colonne assez large pour une carte de 16rem.
  column: { list: "30%", detail: "70%", listMin: "20%", detailMin: "50%", detailMax: "80%" },
  feed: { list: "34%", detail: "66%", listMin: "24%", detailMin: "45%", detailMax: "76%" },
  catalog: { list: "36%", detail: "64%", listMin: "20%", detailMin: "40%", detailMax: "80%" },
} as const;

export function ListDetailPage({ list, detail, layout = "list" }: Props) {
  const t = SIZES[layout];
  // react-resizable-panels 4 n'a plus de prop `autoSaveId` (API des versions 1/2) : la
  // persistance passe par ce hook, qui lit `localStorage` de façon SYNCHRONE au rendu
  // (via useSyncExternalStore) — donc bien avant le premier affichage.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: layout === "list" ? "better-lift-content" : `better-lift-content-${layout}`,
    storage: localStorage,
    panelIds: detail ? ["list", "detail"] : ["list"],
  });

  return (
    <AppShell>
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          id="list"
          defaultSize={detail ? t.list : "100%"}
          minSize={t.listMin}
          maxSize={{ column: "50%", feed: "55%", catalog: "60%", list: undefined }[layout]}
        >
          {list}
        </ResizablePanel>

        {detail ? (
          <>
            <ResizableHandle className="bg-border" />
            <ResizablePanel
              id="detail"
              defaultSize={t.detail}
              minSize={t.detailMin}
              maxSize={t.detailMax}
            >
              <aside aria-label="Détail" className="h-full">
                {detail}
              </aside>
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
    </AppShell>
  );
}
