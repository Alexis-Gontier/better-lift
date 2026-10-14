import { Link, type LinkProps } from "@tanstack/react-router";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Context = {
  setTitle: (title: string | null) => void;
  slot: HTMLElement | null;
};

const HeaderContext = createContext<Context>({ setTitle: () => {}, slot: null });

/**
 * L'en-tête commun (D157) : 44 px, le fil d'Ariane à gauche — son premier élément est le `h1`
 * de la page —, les actions à droite. Posé par les deux gabarits, jamais par un écran.
 */
export function PageHeader({
  title,
  to,
  actions,
  children,
}: {
  title: string;
  /** La liste de la page : avec un détail ouvert, le titre y ramène. */
  to?: LinkProps["to"];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [detail, setTitle] = useState<string | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <HeaderContext.Provider value={{ setTitle, slot }}>
      <header className="flex h-11 shrink-0 items-center gap-3 border-b px-6">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <h1 className="text-sm font-semibold">
                {detail && to ? (
                  <BreadcrumbLink asChild>
                    <Link to={to} search={(s) => s}>
                      {title}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
                )}
              </h1>
            </BreadcrumbItem>
            {detail ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate font-semibold">{detail}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
        <div ref={setSlot} className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      </header>
      {children}
    </HeaderContext.Provider>
  );
}

/**
 * Le détail ouvert s'inscrit dans l'en-tête de sa page : son nom au bout du fil, ses actions
 * dans l'emplacement. Le titre passe par l'état (une chaîne, stable) ; les actions par un
 * portail, pour garder leurs gestionnaires dans le composant qui les possède.
 */
export function InHeader({ title, children }: { title: string; children?: ReactNode }) {
  const { setTitle, slot } = useContext(HeaderContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
  return slot && children ? createPortal(children, slot) : null;
}
