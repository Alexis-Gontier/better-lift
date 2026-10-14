import { formaterCharge, PREFERENCES_DEFAUT } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { displayName, initials } from "@/components/shell/account-name";
import { PageLayout } from "@/components/shell/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  preferencesOptions,
  summaryOptions,
  useWritePreferences,
} from "@/features/profile/queries";
import { URL_API } from "@/lib/config";
import { useSignOut } from "@/lib/sign-out";
import { TIME_ZONE } from "@/lib/time-zone";
import { UNIT_SYSTEM } from "@/lib/units";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

// Les mêmes choix que le mobile (D91, D128). `Select` veut des chaînes : « aucun » vaut null.
const NONE = "aucun";
const GOALS = [1, 2, 3, 4, 5, 6, 7] as const;
const REST = [30, 45, 60, 90, 120, 150, 180, 240, 300] as const;

/** « 45 s », « 1 min », « 1 min 30 ». */
function restLabel(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, "0")}`;
}

const MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/** Le Profil (D143) : le bilan, l'entraînement (sur le compte), les mesures, les données, le compte. */
function Profile() {
  const email = Route.useRouteContext().auth.session?.user.email ?? "—";
  const signOut = useSignOut();
  const summary = useQuery(summaryOptions());
  const preferences = useQuery(preferencesOptions());
  const write = useWritePreferences();
  const prefs = preferences.data ?? PREFERENCES_DEFAUT;

  return (
    <PageLayout title="Profil" width="lecture">
      {/* Le bilan de toujours (D128). */}
      <Card className="flex-row items-center gap-4 px-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-muted text-lg font-extrabold">
          {initials(email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{displayName(email)}</p>
          <p className="text-[13px] text-foreground">
            {summary.data?.depuis
              ? `Depuis ${MONTH_YEAR.format(new Date(summary.data.depuis))}`
              : summary.isPending
                ? "…"
                : "Pas encore de séance"}
          </p>
        </div>
        <Figure label="séances">{summary.data ? summary.data.nbSeances : "—"}</Figure>
        <Figure label="soulevés">
          {summary.data ? formaterCharge(summary.data.volumeKg, UNIT_SYSTEM) : "—"}
        </Figure>
      </Card>

      <Section title="Entraînement" description="Sur ton compte : le téléphone les suit aussi.">
        <Row label="Objectif hebdomadaire" detail="Le nombre de séances visé chaque semaine.">
          <Choice
            label="Objectif hebdomadaire"
            value={prefs.objectifHebdo === null ? NONE : String(prefs.objectifHebdo)}
            onChange={(v) =>
              write.mutate({ ...prefs, objectifHebdo: v === NONE ? null : Number(v) })
            }
            options={[
              { value: NONE, label: "Aucun" },
              ...GOALS.map((n) => ({
                value: String(n),
                label: `${n} séance${n > 1 ? "s" : ""} / sem.`,
              })),
            ]}
          />
        </Row>
        <Row label="Repos par défaut" detail="Pour les exercices sans repos propre.">
          <Choice
            label="Repos par défaut"
            value={prefs.reposDefautSec === null ? NONE : String(prefs.reposDefautSec)}
            onChange={(v) =>
              write.mutate({ ...prefs, reposDefautSec: v === NONE ? null : Number(v) })
            }
            options={[
              { value: NONE, label: "Aucun" },
              ...REST.map((s) => ({ value: String(s), label: restLabel(s) })),
            ]}
          />
        </Row>
        {write.isError ? (
          <p role="alert" className="pt-3 text-sm text-destructive-ink">
            {write.error.message}
          </p>
        ) : null}
      </Section>

      {/* Ni l'unité ni le fuseau ne se règlent encore : fixés en un seul endroit
          chacun (D52, D66). On les montre pour qu'aucun chiffre ne surprenne. */}
      <Section title="Mesures">
        <Row label="Unités">{UNIT_SYSTEM === "metric" ? "Kilogrammes (kg)" : "Livres (lb)"}</Row>
        <Row label="Fuseau horaire">{TIME_ZONE}</Row>
      </Section>

      <Section title="Données">
        <Row label="Exporter mes séances" detail="Toutes les séries, en CSV.">
          {/* Une navigation simple : le cookie de session part avec, et l'API répond
              en pièce jointe (`Content-Disposition`). */}
          <Button variant="outline" asChild>
            <a href={`${URL_API}/export/seances.csv`}>
              <Download aria-hidden="true" />
              Télécharger
            </a>
          </Button>
        </Row>
      </Section>

      <Section title="Compte">
        <Row label="Adresse e-mail">{email}</Row>
        <Row label="Rechercher, aller à une page">
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">Ctrl K</kbd>
        </Row>
        <div className="pt-3">
          <Button variant="outline" onClick={signOut} className="text-destructive-ink">
            <LogOut aria-hidden="true" />
            Se déconnecter
          </Button>
        </div>
      </Section>
    </PageLayout>
  );
}

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-right">
      <p className="chiffre text-[28px]">{children}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    // Une `Card` par section (D158), ses lignes séparées par des filets.
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col divide-y">{children}</CardContent>
    </Card>
  );
}

function Row({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm last:pb-0">
      <div>
        <p>{label}</p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <div className="shrink-0 text-foreground">{children}</div>
    </div>
  );
}

function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
