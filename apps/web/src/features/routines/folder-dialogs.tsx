"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import {
  useCreateRoutineFolder,
  useDeleteRoutineFolder,
  useUpdateRoutineFolder,
} from "@better-lift/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@better-lift/ui/components/alert-dialog";
import { Button } from "@better-lift/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@better-lift/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@better-lift/ui/components/field";
import { Input } from "@better-lift/ui/components/input";
import { Spinner } from "@better-lift/ui/components/spinner";
import { type RoutineFolder } from "@better-lift/validators";

import { apiClient } from "@/lib/api";

/**
 * Création, renommage et suppression d'un dossier de routines.
 *
 * ## Pourquoi des dialogues, alors que le reste de l'app confirme en place
 *
 * La doc 05 défend la confirmation **en deux temps, dans la page** pour
 * l'archivage d'un exercice ou la suppression d'une routine : le geste est
 * fréquent, son effet est local, et une modale à chaque fois serait un péage.
 *
 * Un dossier ne relève pas du même cas. Il vit dans une colonne étroite, où un
 * formulaire dépliant pousse toute la liste vers le bas — on perd de vue ce
 * qu'on était en train de faire pour saisir un nom. Et sa suppression touche
 * ce qu'il contient : les routines remontent à la racine, ce qui demande une
 * phrase, pas un bouton rouge de plus dans une ligne de 240 px.
 *
 * D'où `AlertDialog` pour la suppression — un dialogue qui prend le focus et
 * dont on ne sort pas par un clic à côté (Radix le refuse pour cette variante)
 * — et `Dialog` pour les deux saisies.
 */

/** Le nom d'un dossier est borné par le contrat (`VarChar(120)`, doc 03). */
const MAX_LENGTH = 120;

/**
 * Formulaire de nom, partagé par la création et le renommage.
 *
 * Les deux posent la même question et valident la même chose : les séparer
 * aurait garanti qu'un jour l'un accepte un nom vide que l'autre refuse.
 */
function FolderNameDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValue = "",
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  initialValue?: string;
  pending: boolean;
  error: string | null;
  onSubmit: (name: string) => void;
}) {
  const fieldId = useId();
  const [name, setName] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  /*
    Le dialogue reste monté entre deux ouvertures : sans cette remise à zéro,
    un renommage abandonné réapparaîtrait tel quel à la réouverture, et une
    création rouvrirait sur le nom qu'on vient de créer.
  */
  useEffect(() => {
    if (open) {
      setName(initialValue);
      setTouched(false);
    }
  }, [open, initialValue]);

  const trimmed = name.trim();
  // Muet tant qu'on n'a pas essayé d'envoyer : reprocher un champ vide à
  // quelqu'un qui vient d'ouvrir le dialogue n'aide personne (doc 05).
  const emptyError = touched && trimmed === "" ? "Le nom est requis." : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);

            if (trimmed) {
              onSubmit(trimmed);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <Field className="my-4">
            <FieldLabel htmlFor={`${fieldId}-name`}>Nom du dossier</FieldLabel>
            <Input
              id={`${fieldId}-name`}
              // Le dialogue vient de s'ouvrir sur un geste volontaire : y
              // placer le curseur en est la suite, pas un vol de focus.
              autoFocus
              value={name}
              maxLength={MAX_LENGTH}
              aria-invalid={emptyError !== null || error !== null}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Push Pull Legs"
            />
            {/* L'erreur du serveur passe avant : elle est plus précise. */}
            {(error ?? emptyError) && <FieldError>{error ?? emptyError}</FieldError>}
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateFolderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateRoutineFolder(apiClient);

  return (
    <FolderNameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau dossier"
      description="Un dossier range vos routines. Il ne change rien à ce qu’elles contiennent."
      submitLabel="Créer"
      pending={create.isPending}
      error={create.error?.message ?? null}
      onSubmit={(name) =>
        create.mutate(
          { name },
          {
            onSuccess: (folder) => {
              onOpenChange(false);
              // Un dossier neuf est vide : il apparaît en bas de colonne sans
              // rien dedans, ce qui se remarque mal. Le toast le nomme.
              toast.success(`Dossier « ${folder.name} » créé.`);
            },
          },
        )
      }
    />
  );
}

export function RenameFolderDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: RoutineFolder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateRoutineFolder(apiClient);

  return (
    <FolderNameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Renommer le dossier"
      description="Les routines qu’il contient ne bougent pas."
      submitLabel="Renommer"
      initialValue={folder.name}
      pending={update.isPending}
      error={update.error?.message ?? null}
      onSubmit={(name) =>
        update.mutate(
          { id: folder.id, input: { name } },
          {
            onSuccess: (renamed) => {
              onOpenChange(false);
              toast.success(`Dossier renommé en « ${renamed.name} ».`);
            },
          },
        )
      }
    />
  );
}

export function DeleteFolderDialog({
  folder,
  routineCount,
  open,
  onOpenChange,
}: {
  folder: RoutineFolder;
  routineCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const remove = useDeleteRoutineFolder(apiClient);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {folder.name} » ?</AlertDialogTitle>
          {/*
            La conséquence réelle, et rien d'autre : ce qui inquiète devant ce
            bouton, c'est de perdre les routines. Elles ne partent pas — le
            dire ici évite d'avoir à le découvrir après coup.
          */}
          {/*
            L'accord se fait sur trois mots à la fois — article, nom, verbe —
            d'où deux phrases entières plutôt qu'une phrase à trous. Une
            interpolation par mot avait produit « Les 1 routine remonte ».
          */}
          <AlertDialogDescription>
            {routineCount === 0 &&
              "Ce dossier est vide. Il n’y a rien d’autre à perdre que le dossier lui-même."}
            {routineCount === 1 &&
              "La routine qu’il contient remonte à la racine. Elle n’est pas supprimée."}
            {routineCount > 1 &&
              `Les ${routineCount} routines qu’il contient remontent à la racine. Aucune n’est supprimée.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          {/*
            `onSelect` prévient la fermeture automatique : sans ça, le dialogue
            disparaît au clic et l'échec éventuel de la requête n'a plus
            d'endroit où s'afficher.
          */}
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            aria-busy={remove.isPending}
            onClick={(event) => {
              event.preventDefault();
              remove.mutate(folder.id, {
                onSuccess: () => {
                  onOpenChange(false);
                  toast.success(
                    routineCount === 0
                      ? `Dossier « ${folder.name} » supprimé.`
                      : `Dossier « ${folder.name} » supprimé. Ses routines sont à la racine.`,
                  );
                },
              });
            }}
          >
            {remove.isPending && <Spinner data-icon="inline-start" />}
            Supprimer le dossier
          </AlertDialogAction>
        </AlertDialogFooter>

        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            {remove.error.message}
          </p>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
