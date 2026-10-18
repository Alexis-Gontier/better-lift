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
import { formatShortDay } from "@/lib/format";
import { mockSessions } from "@/mocks/sessions";
import { useCrumbLabels } from "./crumb-label";

type Params = { id?: string; slug?: string };

/**
 * Le libellé d'une page de détail est son nom (« Push A ») plutôt que « Détail ».
 * Lu dans les données factices ; il viendra de l'API au branchement.
 */
function detailLabel(routeId: string, params: Params, fallback: string): string {
  if (routeId.endsWith("/history/$id") && params.id) {
    const s = mockSessions.find((x) => x.id === params.id);
    return s ? `${s.routine} · ${formatShortDay(s.date)}` : fallback;
  }
  return fallback;
}

export function AppBreadcrumb() {
  const poses = useCrumbLabels();
  const crumbs = useMatches()
    .filter((m) => m.staticData.crumb)
    .map((m) => ({
      id: m.id,
      // Posé par la page elle-même quand elle lit l'API (`useCrumbLabel`).
      label:
        poses.get(m.id) ?? detailLabel(m.routeId, m.params as Params, m.staticData.crumb as string),
      pathname: m.pathname,
    }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
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
