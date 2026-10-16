import { createContext, type ReactNode, useContext, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import type { Variant } from "@/components/proto/proto-search";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Selection = { selected: string | null; select: (id: string) => void };

const SelectionContext = createContext<Selection | null>(null);

/**
 * Dans une liste | détail (variantes B et C), un élément se sélectionne au lieu de naviguer.
 * Hors de ce cadre (variante A), la valeur est `null` : l'élément reste un lien vers sa page.
 */
export function useSelection(): Selection | null {
  return useContext(SelectionContext);
}

type Detail = { title: string; subtitle?: string; href: ReactNode; body: ReactNode };

type Props = {
  variant: Variant;
  /** Clé de mémorisation de la largeur des panneaux. */
  storageId: string;
  defaultSelected?: string | null;
  /** Le détail de l'élément sélectionné, ou `null` s'il est introuvable. */
  detail: (id: string) => Detail | null;
  children: ReactNode;
};

function DetailHeader({ detail }: { detail: Detail }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <h2 className="truncate font-medium text-xl">{detail.title}</h2>
        {detail.subtitle && <p className="text-muted-foreground text-sm">{detail.subtitle}</p>}
      </div>
      {detail.href}
    </div>
  );
}

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

function SplitView({
  storageId,
  selection,
  detail,
  children,
}: Omit<Props, "variant" | "defaultSelected"> & { selection: Selection }) {
  const layout = useDefaultLayout({ id: `liste-detail-${storageId}`, storage: localStorage });
  const current = selection.selected ? detail(selection.selected) : null;
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={layout.defaultLayout}
      onLayoutChanged={layout.onLayoutChanged}
      className="h-[calc(100svh-15rem)] min-h-[480px] rounded-xl border"
    >
      <ResizablePanel id="liste" defaultSize="38%" minSize="25%">
        <ScrollArea className="h-full">
          <div className="@container flex flex-col gap-4 p-4">{children}</div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="detail" defaultSize="62%" minSize="35%">
        <ScrollArea className="h-full">
          <div className="@container flex flex-col gap-4 p-4">
            {current ? (
              <>
                <DetailHeader detail={current} />
                {current.body}
              </>
            ) : (
              <NoSelection />
            )}
          </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function ListDetail({
  variant,
  storageId,
  defaultSelected = null,
  detail,
  children,
}: Props) {
  const [selected, setSelected] = useState<string | null>(variant === "b" ? defaultSelected : null);
  const selection = { selected, select: setSelected };

  if (variant === "a") return <>{children}</>;

  if (variant === "b")
    return (
      <SelectionContext.Provider value={selection}>
        <SplitView storageId={storageId} selection={selection} detail={detail}>
          {children}
        </SplitView>
      </SelectionContext.Provider>
    );

  const current = selected ? detail(selected) : null;
  return (
    <SelectionContext.Provider value={selection}>
      <div className="@container flex flex-col gap-4">{children}</div>
      <Sheet open={current !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          {current && (
            <>
              <SheetHeader className="border-b">
                <SheetTitle className="text-xl">{current.title}</SheetTitle>
                <SheetDescription>{current.subtitle}</SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <div className="@container flex flex-col gap-4 p-4">
                  <div className="flex justify-end">{current.href}</div>
                  {current.body}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
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

/** Une ligne de liste : lien vers sa page (variante A), ou sélection (variantes B et C). */
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
