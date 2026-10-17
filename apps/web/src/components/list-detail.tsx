import { createContext, type ReactNode, useContext, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Selection = { selected: string | null; select: (id: string) => void };

const SelectionContext = createContext<Selection | null>(null);

/**
 * Dans une liste | détail, un élément se sélectionne au lieu de naviguer.
 * Hors de ce cadre, la valeur est `null` : l'élément reste un lien vers sa page.
 */
export function useSelection(): Selection | null {
  return useContext(SelectionContext);
}

type Detail = { title: string; subtitle?: string; href: ReactNode; body: ReactNode };

type Props = {
  title: string;
  /** Onglets sous le titre de la liste. */
  tabs?: ReactNode;
  /** Actions à droite du titre ; l'action principale en dernier. */
  actions?: ReactNode;
  /** Clé de mémorisation de la largeur des panneaux. */
  storageId: string;
  defaultSelected?: string | null;
  /** Le détail de l'élément sélectionné, ou `null` s'il est introuvable. */
  detail: (id: string) => Detail | null;
  /** La liste, ou l'état qui la remplace (chargement, vide, erreur). */
  children: ReactNode;
};

function NoSelection() {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyTitle>Rien de sélectionné</EmptyTitle>
        <EmptyDescription>Choisissez un élément dans la liste.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/**
 * Page liste | détail sur toute la surface sous l'en-tête (D234 : variante B retenue pour
 * Routines, Exercices et Historique). La liste porte le titre de la page ; le détail défile seul.
 */
export function ListDetailPage({
  title,
  tabs,
  actions,
  storageId,
  defaultSelected = null,
  detail,
  children,
}: Props) {
  const [selected, setSelected] = useState<string | null>(defaultSelected);
  const layout = useDefaultLayout({ id: `liste-detail-${storageId}`, storage: localStorage });
  const current = selected ? detail(selected) : null;

  return (
    <SelectionContext.Provider value={{ selected, select: setSelected }}>
      {/* La hauteur se pose sur un parent : le groupe impose `height: 100%` en style en ligne. */}
      <div className="h-[calc(100svh-3rem)]">
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={layout.defaultLayout}
          onLayoutChanged={layout.onLayoutChanged}
        >
          <ResizablePanel id="liste" defaultSize="38%" minSize="25%">
            <div className="flex h-full flex-col">
              <div className={cn("flex flex-col gap-3 px-6 pt-6", tabs ? "border-b" : "pb-2")}>
                <div className="flex min-h-9 items-center justify-between gap-3">
                  <h1 className="font-medium text-2xl tracking-tight">{title}</h1>
                  <div className="flex items-center gap-2">{actions}</div>
                </div>
                {tabs && <div className="-ml-3 flex items-end gap-1">{tabs}</div>}
              </div>
              <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
                <div className="@container flex flex-col gap-4 px-6 pt-4 pb-6 *:shrink-0">
                  {children}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="detail" defaultSize="62%" minSize="35%">
            <ScrollArea className="h-full [&_[data-slot=scroll-area-viewport]>div]:block!">
              <div className="@container flex min-h-[calc(100svh-3rem)] flex-col gap-6 p-6 *:shrink-0">
                {current ? (
                  <>
                    <div className="flex min-h-9 items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <h2 className="truncate font-medium text-2xl tracking-tight">
                          {current.title}
                        </h2>
                        {current.subtitle && (
                          <p className="text-muted-foreground text-sm">{current.subtitle}</p>
                        )}
                      </div>
                      {current.href}
                    </div>
                    {current.body}
                  </>
                ) : (
                  <NoSelection />
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SelectionContext.Provider>
  );
}

type RowProps = {
  id: string;
  className: string;
  children: ReactNode;
  /** Le lien vers la page de l'élément, rendu hors liste | détail. */
  renderLink: (className: string, children: ReactNode) => ReactNode;
};

/** Une ligne de liste : sélection dans une liste | détail, lien vers sa page ailleurs. */
export function SelectableRow({ id, className, children, renderLink }: RowProps) {
  const selection = useSelection();
  if (!selection) return renderLink(className, children);
  return (
    <button
      type="button"
      data-selected={selection.selected === id}
      onClick={() => selection.select(id)}
      className={cn(className, "w-full text-left data-[selected=true]:bg-muted")}
    >
      {children}
    </button>
  );
}
