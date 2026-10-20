import { BodyMap } from "@/components/body-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Les muscles travaillés sur la période (D330) : la silhouette seule, comme sur le mobile. */
export function MusclesCard({
  principaux,
  secondaires,
}: {
  principaux: string[];
  secondaires: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscles</CardTitle>
        <CardDescription>Travaillés sur la période</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        {principaux.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            Aucune séance sur la période.
          </p>
        ) : (
          <BodyMap primary={principaux} secondary={secondaires} />
        )}
      </CardContent>
    </Card>
  );
}
