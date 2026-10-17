import { useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { useProto } from "@/components/proto/use-proto";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Une ligne de liste est un `Link` vers son élément : le routeur pose `data-status="active"`
 * sur celle qui est ouverte. `search` garde l'état forcé, la variante et l'onglet d'une ligne
 * à l'autre ; la recherche n'entre pas dans la comparaison (D235).
 */
export const listLinkProps = {
  search: true,
  activeOptions: { includeSearch: false },
} as const;

/**
 * La marque de la ligne ouverte : un fond léger et un liseré d'encre à gauche. Le fond reste
 * clair pour que le texte atténué y garde 4,5:1 (D251) ; le liseré dit la sélection.
 */
export const selectedRowClass =
  "data-[status=active]:bg-muted/50 data-[status=active]:shadow-[inset_3px_0_0_var(--foreground)]";

type Props = {
  title: string;
  /** Onglets sous le titre de la liste. */
  tabs?: ReactNode;
  /** Actions à droite du titre ; l'action principale en dernier. */
  actions?: ReactNode;
  /** Clé de mémorisation de la largeur des panneaux. */
  storageId: string;
  /** Le panneau de droite : l'`<Outlet />` de la route, dont l'enfant est l'élément ouvert. */
  detail: ReactNode;
  /** La liste, ou l'état qui la remplace (chargement, vide, erreur). */
  children: ReactNode;
};

/**
 * Page liste | détail sur toute la surface sous l'en-tête (D234, D235). Montée par la route
 * parente : la liste reste en place d'un élément à l'autre, seul le détail change.
 */
export function ListDetailPage({ title, tabs, actions, storageId, detail, children }: Props) {
  const layout = useDefaultLayout({ id: `liste-detail-${storageId}`, storage: localStorage });
  // Un autre élément repart du haut du panneau.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Arrivé par une adresse, l'élément ouvert peut être loin dans la liste : on le montre.
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.querySelector('[data-status="active"]')?.scrollIntoView({ block: "center" });
  }, []);

  return (
    // La hauteur se pose sur un parent : le groupe impose `height: 100%` en style en ligne.
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
              <div ref={list} className="@container flex flex-col gap-4 px-6 pt-4 pb-6 *:shrink-0">
                {children}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="detail" defaultSize="62%" minSize="35%">
          <ScrollArea
            key={pathname}
            className="h-full [&_[data-slot=scroll-area-viewport]>div]:block!"
          >
            <div className="@container flex min-h-[calc(100svh-3rem)] flex-col gap-6 p-6 pb-24 *:shrink-0">
              {detail}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

type HeaderProps = {
  /** Le nom, ou le champ qui le modifie (variante C, D239). */
  title: ReactNode;
  /** Une ligne de texte, ou des contrôles (le dossier d'une routine, D250). */
  subtitle?: ReactNode;
  /** Actions à droite du titre ; l'action principale en dernier. */
  actions?: ReactNode;
  /** Onglets de l'élément ouvert (D236). */
  tabs?: ReactNode;
};

/**
 * La tête du panneau de détail : nom de l'élément, actions, puis ses onglets. Collée en haut
 * du panneau : Annuler / Enregistrer restent à portée sur une longue routine.
 */
export function DetailHeader({ title, subtitle, actions, tabs }: HeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 -mx-6 -mt-6 flex flex-col gap-3 border-b bg-background px-6 pt-6",
        !tabs && "pb-4",
      )}
    >
      <div className="flex min-h-9 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2
            className={cn(
              "font-medium text-2xl tracking-tight",
              // Un texte se coupe en « … » ; un champ garde son bord et son anneau de focus.
              typeof title === "string" && "truncate",
            )}
          >
            {title}
          </h2>
          {subtitle && <div className="text-muted-foreground text-sm">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="-ml-3 flex items-end gap-1">{tabs}</div>}
    </div>
  );
}

/** Le panneau quand rien n'est ouvert (`/routines`), ou quand l'élément est introuvable. */
export function DetailEmpty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}

/** Le panneau quand rien n'est ouvert ; sans aucun élément (`vide`), il n'y a rien à choisir. */
export function DetailPlaceholder({ title, description }: { title: string; description: string }) {
  const { state } = useProto();
  if (state === "vide") return null;
  return <DetailEmpty title={title} description={description} />;
}

/** Le panneau pendant le chargement : la tête, puis deux blocs. */
export function DetailSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </>
  );
}
