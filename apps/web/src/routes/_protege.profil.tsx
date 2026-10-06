import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { type ReactNode, useState } from "react";
import { PageTableau } from "@/components/shell/page-tableau";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeconnexion } from "@/lib/deconnexion";
import { FUSEAU } from "@/lib/fuseau";
import { appliquerTheme, type Theme, themeInitial } from "@/lib/theme";
import { SYSTEME_UNITES } from "@/lib/unites";

export const Route = createFileRoute("/_protege/profil")({ component: Profil });

const THEMES: { valeur: Theme; libelle: string; icone: typeof Sun }[] = [
  { valeur: "dark", libelle: "Sombre", icone: Moon },
  { valeur: "light", libelle: "Clair", icone: Sun },
];

function Profil() {
  const email = Route.useRouteContext().auth.session?.user.email ?? "—";
  const [theme, setTheme] = useState<Theme>(() => themeInitial());
  const seDeconnecter = useDeconnexion();

  const choisir = (t: Theme) => {
    appliquerTheme(t);
    setTheme(t);
  };

  return (
    <PageTableau titre="Profil" largeur="lecture">
      <Section titre="Compte" description="Le compte connecté sur cet appareil.">
        <Ligne libelle="Adresse e-mail">{email}</Ligne>
        <div className="pt-2">
          <Button variant="outline" onClick={seDeconnecter} className="text-destructive-ink">
            <LogOut aria-hidden="true" />
            Se déconnecter
          </Button>
        </div>
      </Section>

      <Section
        titre="Apparence"
        description="Le thème de cet appareil, retenu d'une visite à l'autre."
      >
        {/* Deux boutons à état plutôt qu'un interrupteur : on lit le choix
                  courant, pas seulement sa négation. */}
        <fieldset className="flex gap-2">
          <legend className="sr-only">Thème</legend>
          {THEMES.map(({ valeur, libelle, icone: Icone }) => (
            <Button
              key={valeur}
              variant={theme === valeur ? "secondary" : "outline"}
              aria-pressed={theme === valeur}
              onClick={() => choisir(valeur)}
            >
              <Icone aria-hidden="true" />
              {libelle}
            </Button>
          ))}
        </fieldset>
      </Section>

      {/* Ni l'unité ni le fuseau ne se règlent encore : ils sont fixés en un
                seul endroit chacun (D52, D66) en attendant un profil. On les
                montre pour qu'aucun chiffre ne surprenne. */}
      <Section
        titre="Mesures"
        description="Fixées pour l'instant ; réglables quand un profil existera."
      >
        <Ligne libelle="Unités">
          {SYSTEME_UNITES === "metric" ? "Kilogrammes (kg)" : "Livres (lb)"}
        </Ligne>
        <Ligne libelle="Fuseau horaire">{FUSEAU}</Ligne>
      </Section>

      <Section titre="Raccourcis clavier">
        <Ligne libelle="Aller à une page">
          <kbd className="rounded border border-(--line) px-1.5 py-0.5 font-mono text-xs">
            Ctrl K
          </kbd>
        </Ligne>
      </Section>
    </PageTableau>
  );
}

function Section({
  titre,
  description,
  children,
}: {
  titre: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-4 bg-(--surface-2) shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{titre}</CardTitle>
        {description ? (
          <CardDescription className="text-(--ink-subtle)">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-(--ink-subtle)">{libelle}</span>
      <span className="text-(--ink)">{children}</span>
    </div>
  );
}
