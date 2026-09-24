import {
  type ExerciceDetail,
  formaterCharge,
  formatJour,
  LIBELLE_GROUPE,
  LIBELLE_RECORD,
  type RecordExercice,
} from "@better-lift/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoutonFermer } from "@/features/routines/bouton-fermer";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { AnimationExercice } from "./animation-exercice";
import { BadgeRecord, formaterSerie } from "./badge-record";

export function DetailExercice({
  exercice,
  records,
  onFermer,
}: {
  exercice: ExerciceDetail;
  /** `undefined` : en chargement ; `null` : en échec. */
  records: RecordExercice[] | null | undefined;
  onFermer: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-2.5 border-b border-(--line) px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{exercice.nom}</h2>
          <p className="mt-0.5 text-xs text-(--ink-faint)">{exercice.nomAnglais}</p>
          <p className="mt-1 text-xs text-(--ink-subtle)">
            {LIBELLE_GROUPE[exercice.groupe]} · {exercice.equipement}
          </p>
        </div>
        <BoutonFermer onFermer={onFermer} />
      </div>

      <Tabs defaultValue="infos" className="min-h-0 flex-1 gap-0">
        <TabsList variant="line" className="mx-5 mt-2">
          <TabsTrigger
            value="infos"
            className="flex-none text-(--ink-subtle) data-[state=active]:text-(--ink)"
          >
            Infos
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="flex-none text-(--ink-subtle) data-[state=active]:text-(--ink)"
          >
            Records{records && records.length > 0 ? ` · ${records.length}` : ""}
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="infos" className="flex flex-col gap-4 px-5 py-4">
            <AnimationExercice
              key={exercice.gif ?? exercice.slug}
              gif={exercice.gif}
              nom={exercice.nom}
            />

            {/* L'aplat face au contour, visibles en même temps : c'est exactement le
                cas à éprouver pour D28. */}
            <Button size="lg" className="w-full font-semibold">
              Démarrer la séance
            </Button>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">
                Muscles
              </p>
              <p className="text-sm text-(--ink)">
                {exercice.cible}
                {exercice.secondaires.length > 0 ? (
                  <span className="text-(--ink-faint)"> · {exercice.secondaires.join(", ")}</span>
                ) : null}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">
                Exécution
              </p>
              <ol className="flex flex-col gap-2">
                {exercice.instructions.map((etape, i) => (
                  <li key={etape} className="flex gap-2.5 text-sm leading-relaxed text-(--ink)">
                    <span className="shrink-0 font-mono text-xs text-(--ink-faint)">{i + 1}</span>
                    <span>{etape}</span>
                  </li>
                ))}
              </ol>
            </div>
          </TabsContent>
          <TabsContent value="records" className="px-5 py-4">
            {records === undefined ? (
              <p className="text-sm text-(--ink-faint)">Chargement…</p>
            ) : records === null ? (
              <p className="text-sm text-(--ink-faint)">Les records n'ont pas pu être chargés.</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-(--ink-faint)">
                Aucun record pour l'instant — il apparaîtra après ta première séance.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {records.map((r) => (
                  <li key={r.type}>
                    <Card className="gap-0 py-0 shadow-none bg-(--surface-2)">
                      <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                        <span className="w-24 shrink-0 text-(--ink-subtle)">
                          {LIBELLE_RECORD[r.type]}
                        </span>
                        <span className="flex-1">
                          {/* Le record est un CONTOUR (D28) : lime en texte sur fond teinté. */}
                          <BadgeRecord
                            libelle={
                              // 1RM et volume sont des valeurs DÉRIVÉES : on montre aussi
                              // la série qui les a donnés.
                              r.type === "UN_RM" || r.type === "VOLUME"
                                ? `${formaterCharge(r.valeur, SYSTEME_UNITES)} (${formaterSerie(r.chargeKg, r.reps)})`
                                : formaterSerie(r.chargeKg, r.reps)
                            }
                          />
                        </span>
                        <span className="shrink-0 text-[11.5px] text-(--ink-faint)">
                          {formatJour(r.date, FUSEAU)}
                        </span>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
