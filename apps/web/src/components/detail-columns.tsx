import { type ReactNode, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidth } from "@/hooks/use-width";

/** Défilement du contenu d'une `ScrollArea` : il s'étire en largeur au lieu de couper sinon. */
const scrollBlock =
  "h-full [&_[data-slot=scroll-area-viewport]]:overscroll-contain [&_[data-slot=scroll-area-viewport]>div]:block!";

/**
 * Sous la tête fixe d'un détail, deux panneaux redimensionnables qui défilent chacun dans sa
 * `ScrollArea` (D255) : le contenu principal, et à droite les chiffres et les réglages. La
 * largeur est mémorisée par `id`. Trop étroit (moins de 720 px), la colonne de droite passe
 * dessous, dans un seul défilement. Le détail se monte avec `detailScroll="columns"`.
 */
export function DetailColumns({
  id,
  main,
  aside,
}: {
  id: string;
  main: ReactNode;
  aside: ReactNode;
}) {
  const layout = useDefaultLayout({ id, storage: localStorage });
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const width = useWidth(box);
  const stacked = width !== null && width < 720;
  return (
    // Le bloc porte la hauteur : le groupe impose `height: 100%` en style en ligne.
    <div ref={setBox} className="-mx-6 -mt-6 -mb-6 min-h-0 flex-1">
      {stacked ? (
        <ScrollArea className={scrollBlock}>
          <div className="flex min-w-0 flex-col gap-3 px-6 pt-6 *:shrink-0">{main}</div>
          <aside className="@container flex flex-col gap-4 px-6 pt-6 pb-24 *:shrink-0">
            {aside}
          </aside>
        </ScrollArea>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={layout.defaultLayout}
          onLayoutChanged={layout.onLayoutChanged}
        >
          {/* 480 px : un tableau de séries tient encore, sa colonne de comparaison effacée. */}
          <ResizablePanel id="principal" defaultSize="74%" minSize="480px">
            <ScrollArea className={scrollBlock}>
              <div className="flex min-w-0 flex-col gap-3 px-6 pt-6 pb-24 *:shrink-0">{main}</div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="apercu" defaultSize="26%" minSize="220px" maxSize="50%">
            <ScrollArea className={scrollBlock}>
              <aside className="@container flex flex-col gap-4 px-6 pt-6 pb-24 *:shrink-0">
                {aside}
              </aside>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}

/** Un détail en colonnes pendant le chargement : le nom, les cartes et la colonne de droite. */
export function DetailColumnsSkeleton() {
  return (
    <>
      <div className="-mx-6 -mt-6 flex items-center justify-between border-b px-6 pt-6 pb-4">
        <Skeleton className="h-11 w-48 rounded-lg" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden @3xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24 rounded" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <div className="hidden flex-col gap-2 @3xl:flex">
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="mt-2 h-40 rounded-xl" />
        </div>
      </div>
    </>
  );
}
