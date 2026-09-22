import type { ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { NavLaterale } from "./nav-lateral";

type Props = {
  liste: ReactNode;
  detail?: ReactNode;
};

export function AppShell({ liste, detail }: Props) {
  // react-resizable-panels 4 n'a plus de prop `autoSaveId` (API des versions 1/2) : la
  // persistance passe par ce hook, qui lit `localStorage` de façon SYNCHRONE au rendu
  // (via useSyncExternalStore) — donc bien avant le premier affichage.
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "better-lift-shell",
    storage: localStorage,
    panelIds: detail ? ["nav", "liste", "detail"] : ["nav", "liste"],
  });

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className="h-screen w-screen"
    >
      {/* Tailles en pourcentage : react-resizable-panels 4 interprète un nombre NU comme
          des pixels (API v1/v2 : c'était toujours un pourcentage) — sans le suffixe "%",
          nav se retrouverait contraint entre 12 px et 26 px. */}
      <ResizablePanel id="nav" defaultSize="16%" minSize="12%" maxSize="26%">
        <NavLaterale />
      </ResizablePanel>

      <ResizableHandle className="bg-(--line)" />

      <ResizablePanel id="liste" defaultSize={detail ? "56%" : "84%"} minSize="30%">
        {liste}
      </ResizablePanel>

      {detail ? (
        <>
          <ResizableHandle className="bg-(--line)" />
          <ResizablePanel id="detail" defaultSize="28%" minSize="20%" maxSize="44%">
            <aside aria-label="Détail" className="h-full bg-(--surface-1)">
              {detail}
            </aside>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  );
}
