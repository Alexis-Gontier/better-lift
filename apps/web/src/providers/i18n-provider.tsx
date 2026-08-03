"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";

import { type Locale } from "@better-lift/validators";

import { useProfileTimezone } from "@/features/account/use-profile-timezone";
import { MESSAGES } from "@/i18n/messages";
import { resolveLocale } from "@/i18n/resolve-locale";
import { useOptionalProfileLocale } from "@/i18n/use-app-locale";

/**
 * Langue de l'interface (doc 09, D29).
 *
 * ## Pourquoi la résolution est côté client
 *
 * La langue vient du **profil**, servi par l'API, et non de l'URL : il n'y a
 * donc pas de segment `[locale]` et rien à lire dans la requête. La déduire
 * côté serveur imposerait de lire `Accept-Language` ou un cookie, ce qui rend
 * **toutes** les pages dynamiques — y compris la page d'accueil marketing, qui
 * est aujourd'hui statique.
 *
 * ## Le premier rendu est toujours dans la langue par défaut
 *
 * Et c'est délibéré : le serveur ne connaît pas la langue du navigateur, donc
 * résoudre dès le premier rendu client produirait une différence avec le HTML
 * envoyé — l'avertissement d'hydratation de React, et un arbre remonté. On
 * rend donc en français, puis on bascule après le montage.
 *
 * Le coût est visible : un profil anglophone voit un instant de français au
 * chargement. On l'accepte tant que le français est la langue de l'immense
 * majorité des comptes ; le jour où ce ne sera plus vrai, un cookie écrit à la
 * connexion permettra de résoudre côté serveur, au prix du rendu dynamique.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const profile = useOptionalProfileLocale();
  const timeZone = useProfileTimezone();
  const [preferred, setPreferred] = useState<readonly string[]>([]);

  // Lu après le montage : `navigator` n'existe pas au rendu serveur, et s'en
  // servir au premier rendu client désynchroniserait l'hydratation.
  useEffect(() => {
    setPreferred(navigator.languages ?? [navigator.language]);
  }, []);

  const locale: Locale = resolveLocale(profile, preferred);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      /*
        Le fuseau vient du profil, comme partout ailleurs (doc 05) : sans lui,
        `next-intl` formaterait les dates dans celui du serveur, et une séance
        du samedi soir s'afficherait un dimanche.
      */
      timeZone={timeZone}
      /* `now` figé côté serveur produirait un écart d'hydratation sur les
         formats relatifs ; on laisse `next-intl` prendre l'heure du client. */
      onError={(error) => {
        // Une clé manquante ne doit pas faire tomber un écran : elle s'affiche
        // telle quelle et se voit en développement.
        if (process.env.NODE_ENV !== "production") {
          console.error(error);
        }
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
