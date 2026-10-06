import type { ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Coquille } from "./coquille";

type Props = {
  titre: string;
  liste: ReactNode;
  detail?: ReactNode;
  /**
   * `colonne` : la liste devient une colonne étroite de sélection et le détail
   * l'espace de travail principal (routines). Par défaut, la liste domine.
   */
  /** `fil` : un fil à parcourir à gauche, un détail large à droite (séances, D140). */
  disposition?: "liste" | "colonne" | "fil";
};

/** Tailles par disposition : chacune a sa clé de persistance, pour que régler
 * l'une ne dérègle pas l'autre. */
const TAILLES = {
  liste: { liste: "62%", detail: "38%", listeMin: "35%", detailMin: "25%", detailMax: "55%" },
  colonne: { liste: "24%", detail: "76%", listeMin: "16%", detailMin: "50%", detailMax: "84%" },
  fil: { liste: "34%", detail: "66%", listeMin: "24%", detailMin: "45%", detailMax: "76%" },
} as const;

export function PageListeDetail({ titre, liste, detail, disposition = "liste" }: Props) {
  const t = TAILLES[disposition];
  // react-resizable-panels 4 n'a plus de prop `autoSaveId` (API des versions 1/2) : la
  // persistance passe par ce hook, qui lit `localStorage` de façon SYNCHRONE au rendu
  // (via useSyncExternalStore) — donc bien avant le premier affichage.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: disposition === "liste" ? "better-lift-contenu" : `better-lift-contenu-${disposition}`,
    storage: localStorage,
    panelIds: detail ? ["liste", "detail"] : ["liste"],
  });

  return (
    <Coquille>
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
          maxSize={{ colonne: "35%", fil: "55%", liste: undefined }[disposition]}
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
    </Coquille>
  );
}
