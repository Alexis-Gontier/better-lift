import { type ReactNode, useState } from "react";
import { toast } from "sonner";
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
 * Un réglage enregistré dès qu'on le change (D273) : pas de brouillon, pas d'« Enregistrer »,
 * un toast le confirme. `save` est l'écriture (l'API au branchement).
 */
export function useSetting<T>(saved: () => T, save: (value: T) => void) {
  const [value, setValue] = useState(saved);
  const set = (next: T) => {
    setValue(next);
    save(next);
    toast.success("Réglage enregistré", { id: "reglage-enregistre" });
  };
  return [value, set] as const;
}

/** Une page de paramètres (D271, D273) : son titre et sa phrase ; ses réglages s'enregistrent seuls. */
export function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col border-b pb-3">
        <h2 className="font-medium text-lg">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
}
