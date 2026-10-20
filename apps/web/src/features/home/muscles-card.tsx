import type { ChargeZone } from "@better-lift/shared";
import { BodyMap, TEINTE_CHARGE } from "@/components/body-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Les muscles de la période en carte de chaleur (D332) : plus la teinte est forte, plus la zone a
 * reçu de séries. Le survol d'une zone en donne le compte.
 */
export function MusclesCard({ charge }: { charge: readonly ChargeZone[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscles</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        {charge.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            Aucune séance sur la période.
          </p>
        ) : (
          <>
            <BodyMap charge={charge} />
            <div className="flex items-center gap-2 text-muted-foreground text-xs" aria-hidden>
              Moins
              <svg viewBox="0 0 54 12" className="h-3 w-13.5" aria-hidden>
                {TEINTE_CHARGE.map((classe, i) => (
                  <rect key={classe} x={i * 14} width="12" height="12" rx="2" className={classe} />
                ))}
              </svg>
              Plus
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
