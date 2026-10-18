import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Une section de paramètres : un titre, une phrase, ses champs. L'enregistrement est celui de la page (D271). */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Une page de paramètres (D271) : son titre et, collé sous l'en-tête de l'app, l'état et les
 * actions de la page — un seul « Enregistrer » pour toutes ses sections, comme une routine.
 */
export function SettingsPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  /** `edit.actions(null)` d'un `useEditable` ; absent sur une page sans réglage à enregistrer. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-12 z-5 -mx-1 flex min-h-14 items-center justify-between gap-3 border-b bg-background px-1 py-2">
        <div className="flex min-w-0 flex-col">
          <h2 className="font-medium text-lg">{title}</h2>
          <p className="truncate text-muted-foreground text-sm">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
