import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCrumbLabels } from "./crumb-label";

/**
 * Le fil d'Ariane : une miette par route qui a un libellé. Une page de détail donne son nom
 * (« Push A » plutôt que « Détail ») par `useCrumbLabel`, une fois sa donnée lue.
 */
export function AppBreadcrumb() {
  const poses = useCrumbLabels();
  const crumbs = useMatches()
    .filter((m) => m.staticData.crumb)
    .map((m) => ({
      id: m.id,
      label: poses.get(m.id) ?? (m.staticData.crumb as string),
      pathname: m.pathname,
    }));

  return (
    // Sur une ligne : la dernière miette se tronque plutôt que de passer sous la recherche.
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className={i === crumbs.length - 1 ? "min-w-0" : "shrink-0"}>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={c.pathname}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
