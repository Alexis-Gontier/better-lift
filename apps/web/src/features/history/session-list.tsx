import { normaliserRecherche, parMois, type SeanceFil } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, History, ListChecks, Search, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { DragScroll } from "@/components/drag-scroll";
import { listCardClass, listLinkProps } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatKg, formatMinutes, formatMonth, formatWeekdayDay, plural } from "@/lib/format";
import { FUSEAU, jourCivil } from "@/lib/locale";
import { seancesQuery } from "./queries";
import { DeleteSessionDialog, type SeanceASupprimer } from "./session-pane";

const TOUTES = "toutes";

const minutesDe = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

/** Sans casse ni accents, sur le nom de la séance et ses premiers exercices. */
function correspond(s: SeanceFil, saisie: string): boolean {
  const q = normaliserRecherche(saisie);
  if (!q) return true;
  return [s.nom, ...s.apercu.map((e) => e.nom)].some((n) => normaliserRecherche(n).includes(q));
}

/**
 * L'historique (D263) : les séances, la plus récente d'abord, groupées par mois civil, lues page
 * par page ; une recherche et un filtre par routine sur ce qui est chargé. Quatre états (D303).
 */
export function SessionList() {
  const force = useEtat();
  const navigate = useNavigate();
  const requete = useInfiniteQuery(seancesQuery());
  const [deleting, setDeleting] = useState<SeanceASupprimer | null>(null);
  const [query, setQuery] = useState("");
  const [routine, setRoutine] = useState(TOUTES);

  const seances = requete.data?.pages.flatMap((p) => p.seances) ?? [];
  const etat = etatAffiche(force, requete, seances.length === 0);
  if (etat === "chargement") return <SessionListSkeleton />;
  if (etat === "erreur")
    return (
      <StateError
        title="L'historique n'a pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );
  if (etat === "vide") return <SessionListEmpty />;

  /** Le clic droit sur une séance. */
  const actions = (s: SeanceFil): RowAction[] => [
    ...(s.routineId
      ? [
          {
            label: "Voir la routine",
            icon: ListChecks,
            onSelect: () =>
              s.routineId && navigate({ to: "/routines/$id", params: { id: s.routineId } }),
          },
        ]
      : []),
    {
      label: "Supprimer",
      icon: Trash2,
      onSelect: () => setDeleting(s),
      destructive: true,
      separated: true,
    },
  ];

  const noms = [...new Set(seances.map((s) => s.nom))].sort((a, b) => a.localeCompare(b, "fr"));
  const groupes = parMois(
    seances.filter((s) => (routine === TOUTES || s.nom === routine) && correspond(s, query)),
    FUSEAU,
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupInput
            placeholder="Rechercher une séance…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <DragScroll>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={2}
            value={routine}
            onValueChange={(v) => setRoutine(v || TOUTES)}
            className="w-max"
          >
            <ToggleGroupItem value={TOUTES}>Toutes les routines</ToggleGroupItem>
            {noms.map((n) => (
              <ToggleGroupItem key={n} value={n}>
                {n}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </DragScroll>
      </div>

      {groupes.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucune séance ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot ou une autre routine.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {groupes.map((g) => {
        const volume = g.seances.reduce((n, s) => n + s.volumeKg, 0);
        return (
          <section key={g.mois} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium first-letter:uppercase">{formatMonth(g.mois)}</h2>
              <span className="text-muted-foreground text-xs tabular-nums">
                {plural(g.seances.length, "séance")} · {formatKg(Math.round(volume))}
              </span>
            </div>
            {/* Une carte par séance, séparées (D258, comme les routines). */}
            <div className="flex flex-col gap-2">
              {g.seances.map((s) => (
                <Card key={s.id} size="sm" className={listCardClass}>
                  <RowMenu actions={actions(s)}>
                    <Link
                      to="/history/$id"
                      params={{ id: s.id }}
                      {...listLinkProps}
                      className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        {/* Les records à droite du nom : à droite des chiffres, le badge
                            décalait le volume d'une carte à l'autre. */}
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">{s.nom}</span>
                          {s.nbRecords > 0 && (
                            <Badge
                              variant="outline"
                              className="shrink-0"
                              aria-label={plural(s.nbRecords, "record")}
                            >
                              <Trophy data-icon="inline-start" />
                              {s.nbRecords}
                            </Badge>
                          )}
                        </span>
                        <span className="truncate text-muted-foreground text-xs first-letter:uppercase">
                          {formatWeekdayDay(jourCivil(s.debut))} · {formatMinutes(minutesDe(s))}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm tabular-nums">
                        {formatKg(Math.round(s.volumeKg))}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </RowMenu>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {requete.hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={requete.isFetchingNextPage}
          onClick={() => void requete.fetchNextPage()}
        >
          {requete.isFetchingNextPage ? "Chargement…" : "Afficher les séances précédentes"}
        </Button>
      )}

      <DeleteSessionDialog session={deleting} onOpenChange={() => setDeleting(null)} />
    </>
  );
}

/** La liste pendant le chargement : recherche, filtres, puis deux mois et leurs cartes. */
function SessionListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <div className="flex gap-2">
        {/* Les puces de filtre : « Toutes les routines », puis une par routine. */}
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
      {[4, 3].map((count, m) => (
        <div key={m} className="flex flex-col gap-2">
          <Skeleton className="my-1 h-5 w-36 rounded" />
          {Array.from({ length: count }, (_, i) => (
            <Skeleton key={i} className="h-15.5 rounded-xl" />
          ))}
        </div>
      ))}
    </>
  );
}

/** Aucune séance : la liste le dit d'une ligne, le panneau de droite explique (D260). */
function SessionListEmpty() {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
      Aucune séance pour l'instant.
    </p>
  );
}

/** Le panneau de droite sans aucune séance : d'où elles viennent. */
export function SessionsOnboarding() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <History />
        </EmptyMedia>
        <EmptyTitle>Pas encore de séance</EmptyTitle>
        <EmptyDescription>
          Les séances se font sur le téléphone ; elles arrivent ici dès la première, comparées à la
          précédente de la même routine.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
