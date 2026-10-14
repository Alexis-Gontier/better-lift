import { formaterCharge, type SeanceFil } from "@better-lift/shared";
import { cn } from "cn";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecordBadge } from "@/features/exercises/record-badge";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";
import { durationText, groupByMonth } from "./calculations";

type Props = {
  /** Les séances chargées, déjà filtrées. */
  sessions: SeanceFil[];
  /** Combien de séances sont chargées, avant filtre. */
  loadedCount: number;
  total: number;
  filter: string;
  onFilter: (text: string) => void;
  hasMore: boolean;
  loadMore: boolean;
  onMore: () => void;
  selectedId?: string;
  onSelect: (id: string) => void;
};

/** La durée en minutes, arrondie : on lit « 62 min », pas « 61,7 ». */
export const durationMin = (s: Pick<SeanceFil, "debut" | "fin">) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60000);

const DAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

/** Le fil des séances (D140) : groupé par mois, chaque entrée se relit sans l'ouvrir. */
export function SessionList({
  sessions,
  loadedCount,
  total,
  filter,
  onFilter,
  hasMore,
  loadMore,
  onMore,
  selectedId,
  onSelect,
}: Props) {
  return (
    <section aria-label="Séances" className="flex h-full flex-col">
      {/* Le titre est dans l'en-tête commun (D157) ; ici, le filtre et le total (D160). */}
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            placeholder="Filtrer…"
            aria-label="Filtrer les séances"
            className="h-8 pl-8"
          />
        </div>
        <Badge variant="outline" title={`${total} ${total > 1 ? "séances" : "séance"}`}>
          {total}
        </Badge>
      </header>

      {sessions.length === 0 && filter.trim() ? (
        <EmptyState
          title="Aucun résultat"
          message="Aucune séance chargée ne correspond à ce filtre."
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Aucune séance"
          message="Ton historique se remplira au fil de tes entraînements, sur ton téléphone."
        />
      ) : (
        // Radix enveloppe le contenu dans un `display: table` qui s'élargit au lieu de
        // couper : sans ce `block`, les aperçus débordent sans points de suspension.
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          {groupByMonth(sessions, TIME_ZONE).map((g) => (
            <div key={g.cle}>
              <h3 className="border-b px-4 pt-4 pb-1.5 text-xs font-medium text-muted-foreground">
                {g.libelle}
              </h3>
              <ul className="flex flex-col">
                {g.seances.map((s) => (
                  <li key={s.id}>
                    <Entry
                      session={s}
                      active={s.id === selectedId}
                      onClick={() => onSelect(s.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {hasMore ? (
            <div className="px-4 py-4">
              <Button
                variant="outline"
                onClick={onMore}
                disabled={loadMore}
                className="w-full text-muted-foreground"
              >
                {loadMore ? "Chargement…" : `Afficher plus — ${loadedCount} sur ${total}`}
              </Button>
            </div>
          ) : null}
        </ScrollArea>
      )}
    </section>
  );
}

function Entry({
  session: s,
  active,
  onClick,
}: {
  session: SeanceFil;
  active: boolean;
  onClick: () => void;
}) {
  const rest = s.nbExercices - s.apercu.length;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      // La séance ouverte reste visible au défilement par le clavier (↑ ↓).
      ref={(el) => {
        if (active) el?.scrollIntoView({ block: "nearest" });
      }}
      className={cn(
        "flex w-full flex-col gap-0.5 border-b px-4 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        // La sélection est une surface et un liseré d'encre, jamais le bleu d'action (D160).
        active
          ? "bg-muted shadow-[inset_2px_0_0_var(--foreground)]"
          : "hover:bg-secondary-background",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate font-bold">{s.nom}</span>
        {s.nbRecords > 0 ? (
          <span title={`${s.nbRecords} ${s.nbRecords > 1 ? "records" : "record"}`}>
            <RecordBadge label={String(s.nbRecords)} />
          </span>
        ) : null}
      </span>
      <span className="text-[12.5px] text-foreground">
        {/* Le jour dans le fuseau de l'utilisateur, jamais en UTC (D66). */}
        {DAY.format(new Date(s.debut))} · {durationText(durationMin(s))} ·{" "}
        {formaterCharge(s.volumeKg, UNIT_SYSTEM)} · {s.seriesFaites}{" "}
        {s.seriesFaites > 1 ? "séries" : "série"}
      </span>
      {s.apercu.length > 0 ? (
        <span className="truncate text-[12.5px] text-muted-foreground">
          {s.apercu.map((e) => e.nom).join(", ")}
          {rest > 0 ? ` + ${rest}` : ""}
        </span>
      ) : null}
    </button>
  );
}
