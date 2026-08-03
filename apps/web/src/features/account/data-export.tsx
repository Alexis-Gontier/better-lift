"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { ApiClientError, useExportMyData } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import { Spinner } from "@better-lift/ui/components/spinner";
import { type DataExport } from "@better-lift/validators";

import { SettingsSection } from "./settings-section";
import { FormAlert } from "@/features/auth/form-parts";
import { apiClient } from "@/lib/api";

/**
 * Même nom de fichier que le `Content-Disposition` de l'API — lequel ne sert à
 * rien ici : la réponse est lue en JavaScript, pas suivie par le navigateur,
 * donc c'est à nous de nommer le fichier. Les deux sont gardés alignés pour que
 * `curl -OJ` et le bouton produisent le même fichier.
 */
function fileName(data: DataExport): string {
  return `better-lift-export-${data.exportedAt.slice(0, 10)}.json`;
}

/**
 * Déclenche le téléchargement du document déjà en mémoire.
 *
 * `JSON.stringify` indenté : l'export est fait pour être lu, ouvert dans un
 * éditeur, éventuellement relu dans trois ans. Les quelques octets gagnés à le
 * sérialiser sur une ligne ne valent pas ça.
 */
function download(data: DataExport): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName(data);
  anchor.click();

  /*
    Révoquer dans le même tour de boucle annule le téléchargement sur certains
    navigateurs, qui n'ont pas encore lu le blob quand l'URL disparaît. Un tour
    de plus suffit, et sans révocation le blob resterait en mémoire jusqu'à la
    fermeture de l'onglet — un export complet, ce n'est pas rien.
  */
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Export RGPD (doc 04, § Compte — D18, D27).
 *
 * Une **mutation** alors que rien n'est modifié : l'export se déclenche par un
 * clic, se télécharge, et n'a aucune raison d'être resservi. En faire une
 * requête mise en cache immobiliserait l'historique entier en mémoire pour une
 * valeur que personne ne relira.
 */
export function DataExportSection() {
  const exportData = useExportMyData(apiClient);
  const [done, setDone] = useState<string | null>(null);

  const run = () => {
    setDone(null);

    exportData.mutate(undefined, {
      onSuccess: (data) => {
        download(data);
        setDone(fileName(data));
      },
    });
  };

  const expired = exportData.error instanceof ApiClientError && exportData.error.status === 401;

  return (
    <SettingsSection
      title="Export de vos données"
      description="Tout ce que nous stockons de vous, dans un fichier JSON : profil, séances, routines, records et exercices personnalisés."
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            aria-live="polite"
            className="min-w-0 flex-1 text-sm text-muted-foreground"
          >
            {done ? `Téléchargé : ${done}` : ""}
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={exportData.isPending}
            aria-busy={exportData.isPending}
            onClick={run}
          >
            {exportData.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <DownloadIcon data-icon="inline-start" />
            )}
            Exporter au format JSON
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-muted-foreground">
        {/*
          Dire ce que le fichier contient **et** ce qu'il ne contient pas : sans
          cette seconde phrase, l'absence du catalogue commun passerait pour un
          export incomplet.
        */}
        <p>
          Le fichier est autoportant : chaque exercice y est nommé, pas seulement identifié, et les
          charges y restent en kilogrammes quel que soit votre système d’unités. Seul le catalogue
          commun en est absent — il n’appartient à personne.
        </p>

        <p>
          Le document est construit à la demande et ne part pas par e-mail : il arrive directement
          dans vos téléchargements.
        </p>

        {exportData.isError && (
          <FormAlert>
            {expired
              ? "Votre session a pris fin. Reconnectez-vous, puis relancez l’export."
              : "L’export n’a pas abouti. Réessayez dans un instant."}
          </FormAlert>
        )}
      </div>
    </SettingsSection>
  );
}
