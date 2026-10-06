import { formaterCharge, PREFERENCES_DEFAUT } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, LogOut, Moon, Sun } from "lucide-react";
import { type ReactNode, useState } from "react";
import { PageTableau } from "@/components/shell/page-tableau";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { optionsBilan, useEcrirePreferences } from "@/features/profil/requetes";
import { optionsPreferences } from "@/features/tableau/requetes";
import { URL_API } from "@/lib/config";
import { useDeconnexion } from "@/lib/deconnexion";
import { FUSEAU } from "@/lib/fuseau";
import { appliquerTheme, type Theme, themeInitial } from "@/lib/theme";
import { SYSTEME_UNITES } from "@/lib/unites";

export const Route = createFileRoute("/_protege/profil")({ component: Profil });

const THEMES: { valeur: Theme; libelle: string; icone: typeof Sun }[] = [
  { valeur: "dark", libelle: "Sombre", icone: Moon },
  { valeur: "light", libelle: "Clair", icone: Sun },
];

// Les mêmes choix que le mobile (D91, D128). `Select` veut des chaînes : « aucun » vaut null.
const AUCUN = "aucun";
const OBJECTIFS = [1, 2, 3, 4, 5, 6, 7] as const;
const REPOS = [30, 45, 60, 90, 120, 150, 180, 240, 300] as const;

/** « 45 s », « 1 min », « 1 min 30 ». */
function libelleRepos(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, "0")}`;
}

const MOIS_ANNEE = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: FUSEAU,
});

/** Le Profil (D143) : le bilan, l'entraînement (sur le compte), l'appareil, les données, le compte. */
function Profil() {
  const email = Route.useRouteContext().auth.session?.user.email ?? "—";
  const [theme, setTheme] = useState<Theme>(() => themeInitial());
  const seDeconnecter = useDeconnexion();
  const bilan = useQuery(optionsBilan());
  const preferences = useQuery(optionsPreferences());
  const ecrire = useEcrirePreferences();
  const prefs = preferences.data ?? PREFERENCES_DEFAUT;

  const choisirTheme = (t: Theme) => {
    appliquerTheme(t);
    setTheme(t);
  };

  return (
    <PageTableau titre="Profil" largeur="lecture">
      {/* Le bilan de toujours (D128). */}
      <section className="flex items-center gap-4 rounded-2xl bg-(--surface-2) p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-(--surface-3) text-lg font-extrabold">
          {email.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{email}</p>
          <p className="text-[13px] text-(--ink-muted)">
            {bilan.data?.depuis
              ? `Depuis ${MOIS_ANNEE.format(new Date(bilan.data.depuis))}`
              : bilan.isPending
                ? "…"
                : "Pas encore de séance"}
          </p>
        </div>
        <Chiffre libelle="séances">{bilan.data ? bilan.data.nbSeances : "—"}</Chiffre>
        <Chiffre libelle="soulevés">
          {bilan.data ? formaterCharge(bilan.data.volumeKg, SYSTEME_UNITES) : "—"}
        </Chiffre>
      </section>

      <Section titre="Entraînement" description="Sur ton compte : le téléphone les suit aussi.">
        <Ligne libelle="Objectif hebdomadaire" detail="Les semaines tenues, au Tableau de bord.">
          <Choix
            libelle="Objectif hebdomadaire"
            valeur={prefs.objectifHebdo === null ? AUCUN : String(prefs.objectifHebdo)}
            onChange={(v) =>
              ecrire.mutate({ ...prefs, objectifHebdo: v === AUCUN ? null : Number(v) })
            }
            options={[
              { valeur: AUCUN, libelle: "Aucun" },
              ...OBJECTIFS.map((n) => ({
                valeur: String(n),
                libelle: `${n} séance${n > 1 ? "s" : ""} / sem.`,
              })),
            ]}
          />
        </Ligne>
        <Ligne libelle="Repos par défaut" detail="Pour les exercices sans repos propre.">
          <Choix
            libelle="Repos par défaut"
            valeur={prefs.reposDefautSec === null ? AUCUN : String(prefs.reposDefautSec)}
            onChange={(v) =>
              ecrire.mutate({ ...prefs, reposDefautSec: v === AUCUN ? null : Number(v) })
            }
            options={[
              { valeur: AUCUN, libelle: "Aucun" },
              ...REPOS.map((s) => ({ valeur: String(s), libelle: libelleRepos(s) })),
            ]}
          />
        </Ligne>
        {ecrire.isError ? (
          <p role="alert" className="text-sm text-destructive-ink">
            {ecrire.error.message}
          </p>
        ) : null}
      </Section>

      <Section
        titre="Apparence"
        description="Le thème de cet appareil, retenu d'une visite à l'autre."
      >
        {/* Deux boutons à état plutôt qu'un interrupteur : on lit le choix courant. */}
        <fieldset className="flex gap-2">
          <legend className="sr-only">Thème</legend>
          {THEMES.map(({ valeur, libelle, icone: Icone }) => (
            <Button
              key={valeur}
              variant={theme === valeur ? "secondary" : "outline"}
              aria-pressed={theme === valeur}
              onClick={() => choisirTheme(valeur)}
            >
              <Icone aria-hidden="true" />
              {libelle}
            </Button>
          ))}
        </fieldset>
      </Section>

      {/* Ni l'unité ni le fuseau ne se règlent encore : fixés en un seul endroit
          chacun (D52, D66). On les montre pour qu'aucun chiffre ne surprenne. */}
      <Section titre="Mesures">
        <Ligne libelle="Unités">
          {SYSTEME_UNITES === "metric" ? "Kilogrammes (kg)" : "Livres (lb)"}
        </Ligne>
        <Ligne libelle="Fuseau horaire">{FUSEAU}</Ligne>
      </Section>

      <Section titre="Données">
        <Ligne libelle="Exporter mes séances" detail="Toutes les séries, en CSV.">
          {/* Une navigation simple : le cookie de session part avec, et l'API répond
              en pièce jointe (`Content-Disposition`). */}
          <Button variant="outline" asChild>
            <a href={`${URL_API}/export/seances.csv`}>
              <Download aria-hidden="true" />
              Télécharger
            </a>
          </Button>
        </Ligne>
      </Section>

      <Section titre="Compte">
        <Ligne libelle="Adresse e-mail">{email}</Ligne>
        <Ligne libelle="Rechercher, aller à une page">
          <kbd className="rounded border border-(--line) px-1.5 py-0.5 text-xs">Ctrl K</kbd>
        </Ligne>
        <div className="pt-1">
          <Button variant="outline" onClick={seDeconnecter} className="text-destructive-ink">
            <LogOut aria-hidden="true" />
            Se déconnecter
          </Button>
        </div>
      </Section>
    </PageTableau>
  );
}

function Chiffre({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="text-right">
      <p className="chiffre text-[28px]">{children}</p>
      <p className="text-xs text-(--ink-subtle)">{libelle}</p>
    </div>
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
    <section className="flex flex-col gap-3 rounded-2xl bg-(--surface-2) p-5">
      <header>
        <h2 className="text-[11px] font-bold tracking-[0.09em] text-(--ink-subtle) uppercase">
          {titre}
        </h2>
        {description ? <p className="mt-1 text-[13px] text-(--ink-muted)">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Ligne({
  libelle,
  detail,
  children,
}: {
  libelle: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div>
        <p>{libelle}</p>
        {detail ? <p className="text-xs text-(--ink-subtle)">{detail}</p> : null}
      </div>
      <div className="shrink-0 text-(--ink-muted)">{children}</div>
    </div>
  );
}

function Choix({
  libelle,
  valeur,
  onChange,
  options,
}: {
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  options: { valeur: string; libelle: string }[];
}) {
  return (
    <Select value={valeur} onValueChange={onChange}>
      <SelectTrigger aria-label={libelle} className="w-44 rounded-[10px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.valeur} value={o.valeur}>
            {o.libelle}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
