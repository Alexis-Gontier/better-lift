import type { ReactNode } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Une carte du Tableau de bord (D158) : la `Card` shadcn, titre en casse normale, détail à droite. */
export function Carte({
  titre,
  detail,
  className,
  children,
}: {
  titre: string;
  detail?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
        {detail ? <CardAction className="text-xs text-(--ink-muted)">{detail}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}
