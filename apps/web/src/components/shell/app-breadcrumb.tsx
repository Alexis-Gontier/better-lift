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
import { useExercises } from "@/mocks/exercise-store";
import { exerciseBySlug } from "@/mocks/exercises";
import { useRoutines } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { mockSessions } from "@/mocks/sessions";

type Params = { id?: string; slug?: string };

/**
 * Le libellé d'une page de détail est son nom (« Push A ») plutôt que « Détail ».
 * Lu dans les données factices ; il viendra de l'API au branchement.
 */
function detailLabel(
  routeId: string,
  params: Params,
  fallback: string,
  routines: MockRoutine[],
): string {
  if (routeId.endsWith("/routines/$id") && params.id)
    return routines.find((r) => r.id === params.id)?.name ?? fallback;
  if (routeId.endsWith("/exercises/$slug") && params.slug)
    return exerciseBySlug(params.slug)?.name ?? fallback;
  if (routeId.endsWith("/history/$id") && params.id) {
    const s = mockSessions.find((x) => x.id === params.id);
    return s ? `${s.routine} · ${formatShortDay(s.date)}` : fallback;
  }
  return fallback;
}

export function AppBreadcrumb() {
  // Lue dans le magasin : une routine renommée change aussitôt de libellé.
  const routines = useRoutines();
  // Abonné aux exercices : un exercice personnalisé renommé change aussi de libellé.
  useExercises();
  const crumbs = useMatches()
    .filter((m) => m.staticData.crumb)
    .map((m) => ({
      id: m.id,
      label: detailLabel(m.routeId, m.params as Params, m.staticData.crumb as string, routines),
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
