import { useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
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
import { useWidth } from "@/lib/use-width";
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
  /** Sous la liste, fixe et séparé d'un filet : les créations (Routines, D257). */
  footer?: ReactNode;
  /**
   * `panel` (défaut) : le panneau de détail défile d'un bloc, sa tête collée en haut.
   * `columns` : le panneau ne défile pas ; le détail découpe ses propres zones de défilement
   * sous une tête fixe (l'éditeur de routine et sa colonne de droite, D255).
   */
  detailScroll?: "panel" | "columns";
};

/**
 * Page liste | détail sur toute la surface sous l'en-tête (D234, D235). Montée par la route
 * parente : la liste reste en place d'un élément à l'autre, seul le détail change.
 */
export function ListDetailPage({
  title,
  tabs,
  actions,
  storageId,
  detail,
  children,
  footer,
  detailScroll = "panel",
}: Props) {
  const layout = useDefaultLayout({ id: `liste-detail-${storageId}`, storage: localStorage });
  // Un détail en colonnes (l'éditeur de routine) a besoin de plus de place : la liste cède.
  const listSize = detailScroll === "columns" ? 30 : 38;
  // Un autre élément repart du haut du panneau.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Arrivé par une adresse, l'élément ouvert peut être loin dans la liste : on le montre.
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.querySelector('[data-status="active"]')?.scrollIntoView({ block: "center" });
  }, []);

  // Trop étroit pour deux panneaux (D262) : un seul, la liste ou l'élément ouvert ; le fil
  // d'Ariane ramène à la liste.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const width = useWidth(box);
  const single = width !== null && width < NARROW;
  const open = useRouterState({ select: (s) => !s.matches.at(-1)?.routeId.endsWith("/") });

  const listPane = (
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
      {footer && <div className="flex shrink-0 gap-2 border-t px-6 py-3">{footer}</div>}
    </div>
  );
  const detailPane =
    detailScroll === "columns" ? (
      <div key={pathname} className="@container flex h-full flex-col gap-6 p-6 *:shrink-0">
        {detail}
      </div>
    ) : (
      <ScrollArea key={pathname} className="h-full [&_[data-slot=scroll-area-viewport]>div]:block!">
        <div className="@container flex min-h-[calc(100svh-3rem)] flex-col gap-6 p-6 pb-24 *:shrink-0">
          {detail}
        </div>
      </ScrollArea>
    );

  return (
    // La hauteur se pose sur un parent : le groupe impose `height: 100%` en style en ligne.
    <div ref={setBox} className="h-[calc(100svh-3rem)]">
      {single ? (
        open ? (
          detailPane
        ) : (
          listPane
        )
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={layout.defaultLayout}
          onLayoutChanged={layout.onLayoutChanged}
        >
          <ResizablePanel id="liste" defaultSize={`${listSize}%`} minSize="300px" maxSize="55%">
            {listPane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="detail" defaultSize={`${100 - listSize}%`} minSize="35%">
            {detailPane}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}

/** En dessous, liste et détail ne tiennent pas côte à côte (300 px + un détail lisible). */
const NARROW = 760;

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
