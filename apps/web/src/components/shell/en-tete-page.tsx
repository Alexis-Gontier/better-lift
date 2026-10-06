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

type Contexte = {
  inscrire: (titre: string | null) => void;
  emplacement: HTMLElement | null;
};

const ContexteEnTete = createContext<Contexte>({ inscrire: () => {}, emplacement: null });

/**
 * L'en-tête commun (D157) : 44 px, le fil d'Ariane à gauche — son premier élément est le `h1`
 * de la page —, les actions à droite. Posé par les deux gabarits, jamais par un écran.
 */
export function EnTetePage({
  titre,
  vers,
  actions,
  children,
}: {
  titre: string;
  /** La liste de la page : avec un détail ouvert, le titre y ramène. */
  vers?: LinkProps["to"];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [detail, inscrire] = useState<string | null>(null);
  const [emplacement, setEmplacement] = useState<HTMLElement | null>(null);

  return (
    <ContexteEnTete.Provider value={{ inscrire, emplacement }}>
      <header className="flex h-11 shrink-0 items-center gap-3 border-b px-6">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <h1 className="text-sm font-semibold">
                {detail && vers ? (
                  <BreadcrumbLink asChild>
                    <Link to={vers} search={(s) => s}>
                      {titre}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-semibold">{titre}</BreadcrumbPage>
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
        <div ref={setEmplacement} className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      </header>
      {children}
    </ContexteEnTete.Provider>
  );
}

/**
 * Le détail ouvert s'inscrit dans l'en-tête de sa page : son nom au bout du fil, ses actions
 * dans l'emplacement. Le titre passe par l'état (une chaîne, stable) ; les actions par un
 * portail, pour garder leurs gestionnaires dans le composant qui les possède.
 */
export function DansEnTete({ titre, children }: { titre: string; children?: ReactNode }) {
  const { inscrire, emplacement } = useContext(ContexteEnTete);
  useEffect(() => {
    inscrire(titre);
    return () => inscrire(null);
  }, [titre, inscrire]);
  return emplacement && children ? createPortal(children, emplacement) : null;
}
