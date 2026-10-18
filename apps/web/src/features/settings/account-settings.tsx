import { useQuery } from "@tanstack/react-query";
import { Laptop, Smartphone } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { StateError } from "@/components/states/state-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeconnexion } from "@/components/use-deconnexion";
import { auth } from "@/lib/auth";
import { formatShortDay } from "@/lib/format";
import { jourCivil } from "@/lib/locale";
import { appareilDe } from "./appareil";
import {
  appareilsQuery,
  useChangerMotDePasse,
  useDeconnecterAppareil,
  useDeconnecterLesAutres,
  useRenommer,
} from "./queries";
import { SettingsPage, SettingsSection } from "./settings-section";

/** Better Auth : 8 à 128 caractères par défaut (`minPasswordLength`, `maxPasswordLength`). */
const PASSWORD = { min: 8, max: 128 } as const;

const echec = (e: unknown) => toast.error(e instanceof Error ? e.message : "L'action a échoué.");

/** Une date de Better Auth (objet ou chaîne), au format court, dans le fuseau du web. */
const jour = (d: Date | string) => formatShortDay(jourCivil(d));

/**
 * Le profil (D272, D273) : le nom seul se modifie (`updateUser`), enregistré en quittant le champ ;
 * vide, il reprend sa valeur. L'e-mail se lit : en changer demande `changeEmail` et l'envoi
 * d'e-mails, ni l'un ni l'autre en place.
 */
function ProfileSection() {
  // La garde de `_app` assure qu'une session est là.
  const user = auth.session?.user;
  const [enregistre, setEnregistre] = useState(user?.name ?? "");
  const [name, setName] = useState(enregistre);
  const renommer = useRenommer();
  const commit = () => {
    const next = name.trim();
    if (next === "" || next === enregistre) {
      setName(enregistre);
      return;
    }
    renommer.mutate(next, {
      onSuccess: () => {
        setEnregistre(next);
        setName(next);
        toast.success("Réglage enregistré", { id: "reglage-enregistre" });
      },
      onError: (e) => {
        setName(enregistre);
        echec(e);
      },
    });
  };
  return (
    <SettingsSection title="Profil" description="Le nom affiché dans l'application.">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Nom</FieldLabel>
            <Input
              id="name"
              maxLength={100}
              value={name}
              disabled={renommer.isPending}
              onChange={(e) => setName(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" type="email" value={user?.email ?? ""} readOnly disabled />
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
  const changer = useChangerMotDePasse();
  const tooShort = next.length > 0 && next.length < PASSWORD.min;
  const mismatch = again.length > 0 && again !== next;
  const valid = current.length > 0 && next.length >= PASSWORD.min && again === next;
  const envoyer = () =>
    changer.mutate(
      { currentPassword: current, newPassword: next, revokeOtherSessions: revoke },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setAgain("");
          toast.success(
            revoke ? "Mot de passe changé, autres appareils déconnectés" : "Mot de passe changé",
          );
        },
        onError: echec,
      },
    );
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
          disabled={!valid || changer.isPending}
          onClick={envoyer}
        >
          {changer.isPending ? "Changement…" : "Changer le mot de passe"}
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
  const requete = useQuery(appareilsQuery());
  const deconnecter = useDeconnecterAppareil();
  const deconnecterAutres = useDeconnecterLesAutres();
  const courante = auth.session?.session.token;

  let contenu: ReactNode;
  if (requete.isPending) {
    contenu = (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  } else if (requete.isError) {
    contenu = (
      <StateError
        title="Les appareils n'ont pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );
  } else {
    // L'appareil courant en tête, puis le plus récent d'abord.
    const rang = (s: { token: string; createdAt: Date | string }) =>
      s.token === courante ? Number.POSITIVE_INFINITY : new Date(s.createdAt).getTime();
    const sessions = [...requete.data].sort((a, b) => rang(b) - rang(a));
    const autres = sessions.filter((s) => s.token !== courante);
    contenu = (
      <div className="flex flex-col">
        {sessions.map((s, i) => {
          const appareil = appareilDe(s.userAgent);
          const Icon = appareil.mobile ? Smartphone : Laptop;
          return (
            <div key={s.token}>
              {i > 0 && <Separator className="my-3" />}
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm">
                    {appareil.label}
                    {s.token === courante && <Badge variant="secondary">Cet appareil</Badge>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Ouverte le {jour(s.createdAt)} · expire le {jour(s.expiresAt)}
                  </span>
                </div>
                {s.token !== courante && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deconnecter.isPending}
                    onClick={() => deconnecter.mutate(s.token, { onError: echec })}
                  >
                    Déconnecter
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {autres.length > 0 && (
          <>
            <Separator className="my-3" />
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              disabled={deconnecterAutres.isPending}
              onClick={() =>
                deconnecterAutres.mutate(undefined, {
                  onSuccess: () => toast.success("Autres appareils déconnectés"),
                  onError: echec,
                })
              }
            >
              Déconnecter tous les autres appareils
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <SettingsSection
      title="Sessions ouvertes"
      description="Les appareils connectés à votre compte."
    >
      {contenu}
    </SettingsSection>
  );
}

/** Quitter la session de cet appareil (D301). */
function SignOutSection() {
  const deconnecter = useDeconnexion();
  return (
    <SettingsSection title="Déconnexion" description="Quitter votre compte sur cet appareil.">
      <Button variant="outline" onClick={() => void deconnecter()}>
        Se déconnecter
      </Button>
    </SettingsSection>
  );
}

/**
 * Compte (D271–D273) : chaque action agit seule ; le nom s'enregistre en quittant le champ. La
 * suppression du compte n'est pas activée côté API (`deleteUser`) : elle a quitté l'écran (D294).
 */
export function AccountSettings() {
  return (
    <SettingsPage title="Compte" description="Profil, mot de passe et appareils connectés.">
      <ProfileSection />
      <PasswordSection />
      <SessionsSection />
      <SignOutSection />
    </SettingsPage>
  );
}
