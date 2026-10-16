import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDay, formatMinutes } from "@/lib/format";
import { mockToday } from "@/mocks/planning";
import { TODAY } from "@/mocks/today";

export function TodayCard() {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="first-letter:uppercase">
          Aujourd'hui · {formatDay(TODAY)}
        </CardDescription>
        <CardTitle className="text-xl">{mockToday.routine}</CardTitle>
        <CardAction>
          <Button asChild>
            <Link to="/routines/$id" params={{ id: mockToday.routineId }}>
              Voir la routine
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
        <span>
          {mockToday.exercises} exercices · ~{formatMinutes(mockToday.minutes)}
        </span>
        {mockToday.muscles.map((m) => (
          <Badge key={m} variant="secondary">
            {m}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
