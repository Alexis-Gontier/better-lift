# Notification de repos (notify-kit) — design

Chantier : `feat/notif-repos`. Décision à écrire : **D338**. Épreuve validée sur téléphone le
2026-10-23 (branche jetable `essai/notify-kit`, jamais fusionnée).

## But

Pendant un repos, une notification Android tenue au premier plan montre le compte à rebours,
une barre qui se vide, la série qui suit, et trois boutons : −15 s, +15 s, Passer. Les boutons
agissent sur la séance même app fermée. À la fin, « Repos terminé » sonne si l'app n'est pas au
premier plan. `react-native-notify-kit` remplace `expo-notifications`, retiré du projet.

## Comportement

- **Affichée tant qu'un repos court**, app ouverte ou non (comme Hevy). Elle dérive de l'état :
  `repos.fin` change → elle s'affiche, se met à jour ou disparaît. Un seul identifiant.
- **Contenu** :
  - Titre : « Repos · {exercice de la prochaine série} ».
  - Texte : « Ensuite : série {n}/{N} · {charge} × {reps} ». La charge et les reps sont celles
    de la série (saisie ou cible de la routine) ; à défaut, son précédent s'il a été fait ; à
    défaut, rien après « série n/N ». Charge par `formaterCharge` dans l'unité du compte.
  - Plus aucune série à faire : « Toutes les séries sont faites ».
  - Chrono à rebours natif (`showChronometer`, `timestamp = repos.fin`), barre
    `max = duree, current = restant` (elle se vide) ; sans `duree` (ancien brouillon), pas de barre.
  - Icône `notification_icon` (`assets/notification-icon.png`, logo recadré), couleur #171717.
- **Boutons** : −15 s et +15 s appellent `ajusterRepos`, Passer appelle `arreterRepos`.
- **Toucher la notification** ouvre l'app ; la reprise (D336) l'amène sur la séance.
- **Fin du repos** : le service remplace la notification de repos par « Repos terminé · C'est
  reparti : série suivante. », sauf app au premier plan (l'écran vibre déjà). Deux canaux, avec
  et sans vibration : le réglage « Vibrations » (D113) choisit. Le service n'écrit rien.
- **Disparaît** sur Passer, à la fin de la séance, à l'abandon ; un nouveau repos la remplace.
- **Permission** demandée au premier repos lancé, comme aujourd'hui.
- **Expo Go** : notify-kit absent, le module ne se charge qu'hors Expo Go ; rien ne s'affiche.
- **iOS** : hors champ (pas de service au premier plan) ; le module ne fait rien sous iOS.

## Découpage

- `packages/shared/src/notif-repos.ts` — pur, testé :
  `contenuNotifRepos(s, maintenant, systeme)` →
  `{ titre, texte, fin, duree, restant } | null` (`null` sans repos). S'appuie sur
  `prochaineSerie`, `reposRestant`, `formaterCharge`.
- `apps/mobile/lib/notification-repos.ts` — réécrit avec notify-kit :
  - `useNotificationRepos(seance)` : affiche, met à jour ou retire selon l'état ;
  - le service au premier plan (une boucle d'une seconde qui relit le brouillon, redessine,
    déclenche la fin) ;
  - `surEvenement(evenement)` : le traitement des boutons.
- `apps/mobile/index.ts` — nouveau point d'entrée (`"main": "index.ts"`) : enregistre le
  service et `onBackgroundEvent` / `onForegroundEvent`, puis `expo-router/entry`.
- `apps/mobile/lib/seance.tsx` — expose `appliquer(f)` au module de notification
  (enregistrement à la montée, retrait au démontage).

## Écritures du brouillon

- **App vivante** (premier plan ou arrière-plan, même moteur JS) : le bouton passe par la
  fonction `appliquer(f)` déclarée par `SeanceProvider`, qui applique `f` à la séance courante
  puis écrit, comme le bandeau. Un seul écrivain : pas de course.
- **App tuée** : aucune fonction déclarée ; le bouton lit le brouillon sur disque, applique `f`,
  réécrit, met la notification à jour. L'app relit le brouillon au démarrage.

## Nettoyage

- Retirer `expo-notifications` : dépendance, plugin de `app.json`, ancien code.
- Ajouter le plugin `react-native-notify-kit` (service `specialUse`, sous-type « Minuteur de
  repos entre deux séries de musculation ») et l'icône dédiée.
- `app.json` → 0.3.0 : nouveau runtime, l'APK doit être réinstallé (pas d'`eas update`).

## Tests

- Vitest : `contenuNotifRepos` (sans repos, repos en cours, série avec saisie / cible /
  précédent / rien, dernière série faite, superset, livres, sans `duree`).
- Vitest : `surEvenement` avec notify-kit et le stockage simulés — −15 s, +15 s, Passer, app
  vivante (passe par `appliquer`) et app tuée (passe par le disque), événement sans repos.
- Émulateur, APK `preview` : chrono, barre, texte, boutons app ouverte et tuée, fin écran
  verrouillé, réglage Vibrations, icône.

## Documentation

- D338 dans `docs/decisions.md` ; section « Fin du repos » de `.claude/rules/mobile.md`.
- Après fusion : supprimer cette spec et le plan.
