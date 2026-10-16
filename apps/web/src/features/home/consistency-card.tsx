import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from "@/components/kibo-ui/contribution-graph";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockSessions } from "@/mocks/sessions";
import { dailyActivity } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

const LABELS = {
  months: [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ],
  weekdays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  totalCount: "{{count}} séances sur l'année",
  legend: { less: "Moins", more: "Plus" },
};

export function ConsistencyCard() {
  const data = dailyActivity(mockSessions, TODAY, 364);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Régularité</CardTitle>
        <CardDescription>
          Une case par jour, plus foncée quand le volume est plus haut
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ContributionGraph
          data={data}
          labels={LABELS}
          weekStart={1}
          blockSize={13}
          blockMargin={3}
          fontSize={12}
          className="mx-auto"
        >
          <ContributionGraphCalendar>
            {({ activity, dayIndex, weekIndex }) => (
              <ContributionGraphBlock
                activity={activity}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
              />
            )}
          </ContributionGraphCalendar>
          <ContributionGraphFooter className="text-xs">
            <ContributionGraphTotalCount />
            <ContributionGraphLegend />
          </ContributionGraphFooter>
        </ContributionGraph>
      </CardContent>
    </Card>
  );
}
