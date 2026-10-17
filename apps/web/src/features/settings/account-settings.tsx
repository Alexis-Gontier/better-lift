import { useNavigate } from "@tanstack/react-router";
import { Laptop, Smartphone } from "lucide-react";
import { useState } from "react";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { mockAccount } from "@/mocks/account";
import { SettingsSection, useDraft } from "./settings-section";

const TIMEZONES = ["Europe/Paris", "Europe/Brussels", "Europe/Zurich", "America/Montreal"];

const SESSIONS = [
  {
    id: "1",
    device: "Chrome sur Windows",
    place: "Paris",
    last: "Maintenant",
    current: true,
    icon: Laptop,
  },
  {
    id: "2",
    device: "better-lift sur Android",
    place: "Paris",
    last: "Il y a 2 h",
    current: false,
    icon: Smartphone,
  },
  {
    id: "3",
    device: "Firefox sur macOS",
    place: "Lyon",
    last: "Il y a 12 j",
    current: false,
    icon: Laptop,
  },
];

function Profile() {
  const { draft, setDraft, dirty, save } = useDraft(mockAccount);
  return (
    <SettingsSection
      title="Profil"
      description="Votre nom et votre fuseau horaire."
      dirty={dirty}
      onSave={save}
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Nom</FieldLabel>
            <Input
              id="name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="timezone">Fuseau horaire</FieldLabel>
          <Select
            value={draft.timezone}
            onValueChange={(timezone) => setDraft({ ...draft, timezone })}
          >
            <SelectTrigger id="timezone" className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>Les séances sont rangées par jour dans ce fuseau.</FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}

function Security() {
  const { draft, setDraft, save } = useDraft({ current: "", next: "" });
  const valid = draft.current.length > 0 && draft.next.length >= 8;
  return (
    <SettingsSection
      title="Mot de passe"
      description="Au moins 8 caractères."
      dirty={valid}
      onSave={() => {
        save();
        setDraft({ current: "", next: "" });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="current-password">Mot de passe actuel</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={draft.current}
            onChange={(e) => setDraft({ ...draft, current: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={draft.next}
            onChange={(e) => setDraft({ ...draft, next: e.target.value })}
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

function Sessions() {
  const [sessions, setSessions] = useState(SESSIONS);
  return (
    <SettingsSection
      title="Sessions ouvertes"
      description="Les appareils connectés à votre compte."
    >
      <div className="flex flex-col">
        {sessions.map((s, i) => (
          <div key={s.id}>
            {i > 0 && <Separator className="my-3" />}
            <div className="flex items-center gap-3">
              <s.icon className="size-5 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 text-sm">
                  {s.device}
                  {s.current && <Badge variant="secondary">Cet appareil</Badge>}
                </span>
                <span className="text-muted-foreground text-xs">
                  {s.place} · {s.last}
                </span>
              </div>
              {!s.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessions((all) => all.filter((x) => x.id !== s.id))}
                >
                  Déconnecter
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

function DangerZone() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  return (
    <SettingsSection
      title="Zone de danger"
      description="Supprimer le compte efface vos routines, vos séances et vos pesées. C'est définitif."
    >
      <AlertDialog onOpenChange={() => setConfirm("")}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Supprimer mon compte</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tapez SUPPRIMER pour confirmer. Exportez vos données avant si vous voulez les garder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Confirmation"
            placeholder="SUPPRIMER"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirm !== "SUPPRIMER"}
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

export function AccountSettings() {
  return (
    <>
      <Profile />
      <Security />
      <Sessions />
      <DangerZone />
    </>
  );
}
