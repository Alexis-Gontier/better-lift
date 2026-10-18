import {
  type Brouillon,
  type RoutineDetail,
  type SeanceResume,
  versBrouillon,
  versSaisie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DetailColumns, DetailColumnsSkeleton } from "@/components/detail-columns";
import { useEditable } from "@/components/editable";
import { DetailEmpty, DetailHeader } from "@/components/list-detail";
import { useCrumbLabel } from "@/components/shell/crumb-label";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { ErreurApi } from "@/lib/api";
import { SYSTEME } from "@/lib/locale";
import { nomBrouillon } from "./ecran";
import { type InfoExercice, useInfosExercices } from "./infos";
import {
  precedentesQuery,
  routineQuery,
  routinesQuery,
  seancesRoutineQuery,
  useCreerRoutine,
  useEnregistrerRoutine,
  useSupprimerRoutine,
} from "./queries";
import { changeSummary, isDirty, saveBlocker } from "./routine-draft";
import { RoutineFields, RoutineNameInput } from "./routine-editor";
import { RoutineOverview } from "./routine-overview";

const echec = (e: unknown) => toast.error(e instanceof Error ? e.message : "L'action a échoué.");

/** Les muscles connus par le détail de la routine ; les exercices ajoutés se lisent à part. */
const infosDuDetail = (detail: RoutineDetail | undefined): ReadonlyMap<string, InfoExercice> =>
  new Map(
    (detail?.exercices ?? []).map((e) => [
      e.slug,
      { musclePrincipal: e.musclePrincipal, musclesSecondaires: e.musclesSecondaires },
    ]),
  );

/** Les slugs du brouillon, triés et sans doublon : la clé de « Dernière fois ». */
const slugsDe = (b: Brouillon) => [...new Set(b.exercices.map((e) => e.slug))].sort();

/** Le menu ⋯ de la routine : ce qui ne se modifie pas champ par champ. */
function RoutineMenu({
  id,
  saved,
  release,
}: {
  id: string;
  saved: Brouillon;
  release?: () => void;
}) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const creer = useCreerRoutine();
  const supprimer = useSupprimerRoutine();
  const nom = saved.nom.trim();

  function duplicate() {
    const copie = `${nom} (copie)`.slice(0, 120);
    creer.mutate(
      { ...versSaisie(saved, SYSTEME), nom: copie },
      {
        onSuccess: (nouvelle) => {
          release?.();
          navigate({ to: "/routines/$id", params: { id: nouvelle }, search: true });
          toast.success(`« ${copie} » créée`);
        },
        onError: echec,
      },
    );
  }

  function remove() {
    release?.();
    navigate({ to: "/routines", search: true });
    supprimer(id, `« ${nom} » supprimée`);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Actions de la routine">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled={creer.isPending} onSelect={duplicate}>
            Dupliquer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les séances déjà faites restent dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * La routine ouverte (D235) : ses requêtes et ses quatre états, puis l'éditeur. Une routine
 * d'autrui ou supprimée est introuvable (404).
 */
export function RoutinePane({ id }: { id: string }) {
  const force = useEtat();
  const routine = useQuery(routineQuery(id));
  const seances = useQuery(seancesRoutineQuery(id));
  const liste = useQuery(routinesQuery());

  if (routine.error instanceof ErreurApi && routine.error.statut === 404)
    return (
      <DetailEmpty
        title="Cette routine n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );
  const etat = etatAffiche(force, routine, false);
  if (etat === "erreur")
    return (
      <StateError
        title="La routine n'a pas pu se charger"
        reessayer={() => void routine.refetch()}
      />
    );
  if (etat === "chargement" || !routine.data) return <DetailColumnsSkeleton />;
  if (etat === "vide")
    return (
      <DetailEmpty
        title="Cette routine n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );
  return (
    <RoutineEditorPane
      key={id}
      detail={routine.data}
      seances={seances.data}
      dossiers={liste.data?.dossiers ?? []}
    />
  );
}

/**
 * La routine ouverte, toujours modifiable (D243, D250) : le détail EST l'éditeur ; le nom se
 * modifie dans la tête, le dossier et les chiffres dessous. Modifiée (D261), la tête montre
 * l'historique, le nombre de modifications, « Tout annuler » et « Enregistrer » ; les cartes
 * touchées portent « Modifié » ou « Nouveau », les chiffres leur écart.
 */
function RoutineEditorPane({
  detail,
  seances,
  dossiers,
}: {
  detail: RoutineDetail;
  seances?: SeanceResume[];
  dossiers: readonly { id: string; nom: string }[];
}) {
  // La version enregistrée : ses clés sont celles du brouillon, qui en part. Après un
  // enregistrement réussi, le brouillon devient la nouvelle référence.
  const [saved, setSaved] = useState(() => versBrouillon(detail, SYSTEME));
  const enregistrer = useEnregistrerRoutine(detail.id);
  const edit = useEditable<Brouillon>({
    initial: () => saved,
    isDirty: (d) => isDirty(d, saved),
    count: (d) => changeSummary(d, saved).count,
    blocker: saveBlocker,
    onSave: async (d) => {
      await enregistrer.mutateAsync(versSaisie(d, SYSTEME));
      setSaved(d);
    },
    what: "cette routine",
    savedMessage: "Routine enregistrée",
  });
  const { draft, setDraft } = edit;
  useCrumbLabel(saved.nom.trim() || undefined);
  const infos = useInfosExercices(
    draft.exercices.map((e) => e.slug),
    infosDuDetail(detail),
  );
  const precedentes = useQuery(precedentesQuery(slugsDe(draft))).data;

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} />}
        actions={edit.actions(<RoutineMenu id={detail.id} saved={saved} release={edit.release} />)}
      />
      <DetailColumns
        id="routine-editeur"
        main={
          <RoutineFields
            draft={draft}
            onChange={setDraft}
            changes={changeSummary(draft, saved)}
            infos={infos}
            precedentes={precedentes}
          />
        }
        aside={
          <RoutineOverview
            draft={draft}
            saved={edit.dirty ? saved : undefined}
            seances={seances}
            infos={infos}
            dossiers={dossiers}
            onChange={setDraft}
          />
        }
      />
      {edit.guard}
    </>
  );
}

/**
 * Création (D238) : le même éditeur, vide, le curseur dans le nom. Rien n'est créé avant
 * *Créer* : il faut un nom et au moins un exercice. `dossier` : « Nouvelle routine ici ».
 */
export function RoutinePaneNew({ dossier }: { dossier?: string }) {
  const navigate = useNavigate();
  const [vide] = useState<Brouillon>(() => ({
    ...versBrouillon(null, SYSTEME),
    dossierId: dossier ?? null,
  }));
  const [draft, setDraft] = useState<Brouillon>(vide);
  const creer = useCreerRoutine();
  const liste = useQuery(routinesQuery());
  const infos = useInfosExercices(
    draft.exercices.map((e) => e.slug),
    new Map(),
  );
  const precedentes = useQuery(precedentesQuery(slugsDe(draft))).data;
  const { guard, release } = useUnsavedGuard(isDirty(draft, vide), "cette routine");
  useEffect(() => nomBrouillon.set(draft.nom), [draft.nom]);
  useEffect(() => () => nomBrouillon.set(""), []);
  const blocker = saveBlocker(draft);

  function create() {
    creer.mutate(versSaisie(draft, SYSTEME), {
      onSuccess: (id) => {
        release();
        navigate({ to: "/routines/$id", params: { id }, search: true });
        toast.success(`« ${draft.nom.trim()} » créée`);
      },
      onError: echec,
    });
  }

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} autoFocus />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/routines", search: true })}
            >
              Annuler
            </Button>
            {blocker && (
              <span className="text-muted-foreground text-sm" id="routine-manque">
                {blocker}
              </span>
            )}
            <Button
              size="sm"
              disabled={blocker !== null || creer.isPending}
              aria-describedby="routine-manque"
              onClick={create}
            >
              {creer.isPending ? "Création…" : "Créer"}
            </Button>
          </>
        }
      />
      <DetailColumns
        id="routine-editeur"
        main={
          <RoutineFields
            draft={draft}
            onChange={setDraft}
            infos={infos}
            precedentes={precedentes}
          />
        }
        aside={
          <RoutineOverview
            draft={draft}
            infos={infos}
            dossiers={liste.data?.dossiers ?? []}
            onChange={setDraft}
          />
        }
      />
      {guard}
    </>
  );
}
