import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";

/**
 * Coquille d'un bloc de réglages : un titre, une explication, des champs, une
 * action.
 *
 * Le pied est **séparé du contenu** et porte un fond légèrement teinté. Ce
 * n'est pas décoratif : sur une page de réglages, la question « est-ce que
 * c'est enregistré ? » se pose à chaque bloc, et une barre d'action visible
 * répond avant qu'on la pose. C'est aussi ce qui permet de faire cohabiter
 * plusieurs blocs enregistrables indépendamment sans qu'on cherche quel bouton
 * agit sur quoi.
 */
export function SettingsSection({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="gap-1 px-6 pt-6 pb-0">
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="px-6 py-6">{children}</CardContent>

      {footer && (
        <CardFooter className="justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
