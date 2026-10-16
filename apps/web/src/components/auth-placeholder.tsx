import { Link } from "@tanstack/react-router";
import { Zone } from "@/components/zone";
import type { FileRouteTypes } from "@/routeTree.gen";

type Props = {
  title: string;
  subtitle: string;
  fields: string;
  link?: { to: FileRouteTypes["to"]; label: string };
};

/** Squelette d'une page d'authentification : titre, formulaire, lien secondaire. */
export function AuthPlaceholder({ title, subtitle, fields, link }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-medium text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      <Zone title="Formulaire" hint={fields} className="h-56" />
      {link && (
        <Link
          to={link.to}
          className="text-center text-muted-foreground text-sm hover:text-foreground"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
