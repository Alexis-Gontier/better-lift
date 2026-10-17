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
import { exerciseBySlug } from "@/mocks/exercises";
import { routineById } from "@/mocks/routines";
import { mockSessions } from "@/mocks/sessions";

type Params = { id?: string; slug?: string };

/**
 * Le libellé d'une page de détail est son nom (« Push A ») plutôt que « Détail ».
 * Lu dans les données factices ; il viendra de l'API au branchement.
 */
function detailLabel(routeId: string, params: Params, fallback: string): string {
  if (routeId.endsWith("/routines/$id") && params.id)
    return routineById(params.id)?.name ?? fallback;
  if (routeId.endsWith("/exercises/$slug") && params.slug)
    return exerciseBySlug(params.slug)?.name ?? fallback;
  if (routeId.endsWith("/history/$id") && params.id) {
    const s = mockSessions.find((x) => x.id === params.id);
    return s ? `${s.routine} · ${formatShortDay(s.date)}` : fallback;
  }
  return fallback;
}

export function AppBreadcrumb() {
  const crumbs = useMatches()
    .filter((m) => m.staticData.crumb)
    .flatMap((m) => {
      const params = m.params as Params;
      const crumb = {
        id: m.id,
        label: detailLabel(m.routeId, params, m.staticData.crumb as string),
        pathname: m.pathname,
      };
      // L'édition est détachée du détail (`$id_`) : on remet la routine entre les deux.
      if (m.routeId.endsWith("/routines/$id_/edit") && params.id) {
        const routine = routineById(params.id);
        if (routine)
          return [
            { id: `${m.id}-routine`, label: routine.name, pathname: `/routines/${params.id}` },
            crumb,
          ];
      }
      return [crumb];
    });

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
