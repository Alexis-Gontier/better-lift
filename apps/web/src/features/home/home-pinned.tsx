import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePins } from "@/mocks/pins";
import { insightOf, useRecordEvents } from "../records/insights";
import { RecordRow } from "../records/record-row";
import { LiftCard } from "./lift-card";

/** Variante A (D277) : les épinglés en grille, les derniers records en colonne étroite. */
export function HomePinned() {
  const { slugs, isDefault } = usePins();
  const lifts = slugs.flatMap((s) => insightOf(s) ?? []);
  const events = useRecordEvents().slice(0, 8);
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-medium text-lg">Épinglés</h2>
          {isDefault && (
            <span className="text-muted-foreground text-xs">
              Vos exercices les plus faits ; la punaise choisit les vôtres
            </span>
          )}
        </div>
        <div className="grid gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
          {lifts.map((i) => (
            <LiftCard key={i.slug} insight={i} />
          ))}
        </div>
      </section>
      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Derniers records</CardTitle>
            <CardDescription>Un clic ouvre la séance</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/records">Tous</Link>
          </Button>
        </CardHeader>
        {events.map((e) => (
          <RecordRow key={e.id} event={e} />
        ))}
      </Card>
    </div>
  );
}
