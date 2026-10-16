import { Check } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  title: string;
  description?: string;
  /** Sans `onSave`, la section n'a pas de pied (ses actions sont dans son contenu). */
  onSave?: () => void;
  dirty?: boolean;
  children: ReactNode;
};

/** Une section de paramètres : enregistrable seule, dès qu'elle diffère de l'enregistré. */
export function SettingsSection({ title, description, onSave, dirty = false, children }: Props) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {onSave && (
        <CardFooter className="justify-end gap-3 border-t">
          {saved && (
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Check className="size-4" /> Enregistré
            </span>
          )}
          <Button
            disabled={!dirty}
            onClick={() => {
              onSave();
              setSaved(true);
            }}
          >
            Enregistrer
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/** Un brouillon comparé à sa version enregistrée : `dirty` dit s'il y a quelque chose à enregistrer. */
export function useDraft<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  return {
    draft,
    setDraft,
    dirty: JSON.stringify(draft) !== JSON.stringify(saved),
    save: () => setSaved(draft),
  };
}
