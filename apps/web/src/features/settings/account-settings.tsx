import { useNavigate } from "@tanstack/react-router";
import { Laptop, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditable } from "@/components/editable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatShortDay } from "@/lib/format";
import { mockAccount } from "@/mocks/account";
import { addDays } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import { SettingsPage, SettingsSection } from "./settings-section";

/** Better Auth : 8 à 128 caractères par défaut (`minPasswordLength`, `maxPasswordLength`). */
const PASSWORD = { min: 8, max: 128 } as const;

/**
 * Une session telle que la rend `listSessions` de Better Auth : agent, IP, dates. Pas de ville :
 * il faudrait géolocaliser l'IP. L'appareil se lit dans l'agent ; le mobile passe par Expo.
 */
type AuthSession = { token: string; userAgent: string; createdAt: string; expiresAt: string };

const SESSIONS: AuthSession[] = [
  {
    token: "t1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/140",
    createdAt: addDays(TODAY, -2),
    expiresAt: addDays(TODAY, 5),
  },
  {
    token: "t2",
    userAgent: "better-lift/0.4 Expo Android",
    createdAt: addDays(TODAY, -6),
    expiresAt: addDays(TODAY, 1),
  },
  {
    token: "t3",
    userAgent: "Mozilla/5.0 (Macintosh) Firefox/141",
    createdAt: addDays(TODAY, -5),
    expiresAt: addDays(TODAY, 2),
  },
];
const CURRENT = "t1";

/** « Chrome sur Windows », « Application mobile (Android) » : l'appareil, lu dans l'agent. */
function deviceOf(ua: string): { label: string; mobile: boolean } {
  if (/Expo|better-lift/i.test(ua))
    return { label: `Application mobile${/Android/.test(ua) ? " (Android)" : ""}`, mobile: true };
  const browser = /Firefox/.test(ua)
    ? "Firefox"
    : /Edg/.test(ua)
      ? "Edge"
      : /Chrome/.test(ua)
        ? "Chrome"
        : "Navigateur";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac/.test(ua)
      ? "macOS"
      : /Linux/.test(ua)
        ? "Linux"
        : "";
  return { label: os ? `${browser} sur ${os}` : browser, mobile: false };
}

type Profile = { name: string };

/** Le profil enregistré, en mémoire : l'API le tiendra (`updateUser`). */
let savedProfile: Profile = { name: mockAccount.name };

/**
 * Le profil (D272) : le nom seul se modifie (`updateUser`). L'e-mail se lit : en changer demande
 * `changeEmail` et l'envoi d'e-mails, ni l'un ni l'autre en place.
 */
function ProfileSection({ draft, setDraft }: { draft: Profile; setDraft: (p: Profile) => void }) {
  return (
    <SettingsSection title="Profil" description="Le nom affiché dans l'application.">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Nom</FieldLabel>
            <Input
              id="name"
              maxLength={100}
              value={draft.name}
              onChange={(e) => setDraft({ name: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" type="email" value={mockAccount.email} readOnly disabled />
            <FieldDescription>
              Sert à se connecter. Le changer n'est pas encore possible.
            </FieldDescription>
          </Field>
        </div>
      </FieldGroup>
    </SettingsSection>
  );
}

/**
 * Le mot de passe (D272), par `changePassword` : l'actuel, le nouveau deux fois, et la
 * déconnexion des autres appareils (`revokeOtherSessions`), cochée par défaut.
 */
function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [revoke, setRevoke] = useState(true);
  const tooShort = next.length > 0 && next.length < PASSWORD.min;
  const mismatch = again.length > 0 && again !== next;
  const valid = current.length > 0 && next.length >= PASSWORD.min && again === next;
  return (
    <SettingsSection
      title="Mot de passe"
      description={`De ${PASSWORD.min} à ${PASSWORD.max} caractères.`}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current-password">Mot de passe actuel</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            className="sm:w-72"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={tooShort}>
            <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD.max}
              aria-invalid={tooShort}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            {tooShort && <FieldDescription>Au moins {PASSWORD.min} caractères.</FieldDescription>}
          </Field>
          <Field data-invalid={mismatch}>
            <FieldLabel htmlFor="again-password">Confirmer</FieldLabel>
            <Input
              id="again-password"
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD.max}
              aria-invalid={mismatch}
              value={again}
              onChange={(e) => setAgain(e.target.value)}
            />
            {mismatch && <FieldDescription>Les deux saisies diffèrent.</FieldDescription>}
          </Field>
        </div>
        <Field orientation="horizontal">
          <Checkbox
            id="revoke-others"
            checked={revoke}
            onCheckedChange={(on) => setRevoke(on === true)}
          />
          <FieldLabel htmlFor="revoke-others" className="font-normal">
            Déconnecter mes autres appareils
          </FieldLabel>
        </Field>
        <Button
          variant="outline"
          className="self-start"
          disabled={!valid}
          onClick={() => {
            setCurrent("");
            setNext("");
            setAgain("");
            toast.success(
              revoke ? "Mot de passe changé, autres appareils déconnectés" : "Mot de passe changé",
            );
          }}
        >
          Changer le mot de passe
        </Button>
      </FieldGroup>
    </SettingsSection>
  );
}

/**
 * Les sessions ouvertes (D272), par `listSessions` : l'appareil, l'ouverture et l'expiration.
 * Une se ferme par `revokeSession`, toutes les autres par `revokeOtherSessions`.
 */
function SessionsSection() {
  const [sessions, setSessions] = useState(SESSIONS);
  const others = sessions.filter((s) => s.token !== CURRENT);
  return (
    <SettingsSection
      title="Sessions ouvertes"
      description="Les appareils connectés à votre compte."
    >
      <div className="flex flex-col">
        {sessions.map((s, i) => {
          const device = deviceOf(s.userAgent);
          const Icon = device.mobile ? Smartphone : Laptop;
          return (
            <div key={s.token}>
              {i > 0 && <Separator className="my-3" />}
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm">
                    {device.label}
                    {s.token === CURRENT && <Badge variant="secondary">Cet appareil</Badge>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Ouverte le {formatShortDay(s.createdAt)} · expire le{" "}
                    {formatShortDay(s.expiresAt)}
                  </span>
                </div>
                {s.token !== CURRENT && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSessions((all) => all.filter((x) => x.token !== s.token))}
                  >
                    Déconnecter
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {others.length > 0 && (
          <>
            <Separator className="my-3" />
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setSessions((all) => all.filter((x) => x.token === CURRENT));
                toast.success("Autres appareils déconnectés");
              }}
            >
              Déconnecter tous les autres appareils
            </Button>
          </>
        )}
      </div>
    </SettingsSection>
  );
}

/**
 * Supprimer le compte (D272), par `deleteUser` : Better Auth le réserve à une option à activer
 * (`user.deleteUser.enabled`) et demande le mot de passe d'un compte à mot de passe.
 */
function DangerZone() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  return (
    <SettingsSection
      title="Zone de danger"
      description="Supprimer le compte efface vos routines, vos séances et vos pesées. C'est définitif."
    >
      <AlertDialog onOpenChange={() => setPassword("")}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Supprimer mon compte</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmez avec votre mot de passe. Exportez vos données avant si vous voulez les
              garder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            aria-label="Mot de passe"
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={password.length === 0}
              onClick={() => navigate({ to: "/login" })}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}

/** Compte (D271, D272) : le nom s'enregistre avec la page ; le reste agit seul. */
export function AccountSettings() {
  const edit = useEditable<Profile>({
    initial: () => savedProfile,
    isDirty: (d) => d.name.trim() !== savedProfile.name,
    count: (d) => Number(d.name.trim() !== savedProfile.name),
    blocker: (d) => (d.name.trim() === "" ? "Donnez votre nom" : null),
    onSave: (d) => {
      savedProfile = { name: d.name.trim() };
    },
    what: "votre profil",
    savedMessage: "Profil enregistré",
  });
  return (
    <SettingsPage
      title="Compte"
      description="Profil, mot de passe et appareils connectés."
      actions={edit.actions(null, { status: false })}
    >
      <ProfileSection draft={edit.draft} setDraft={(p) => edit.setDraft(p)} />
      <PasswordSection />
      <SessionsSection />
      <DangerZone />
      {edit.guard}
    </SettingsPage>
  );
}
