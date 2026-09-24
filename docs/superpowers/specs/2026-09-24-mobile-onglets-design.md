# Mobile à onglets, inspiré d'opengym — conception

**Date** : 24 septembre 2026 · **Statut** : validée · **Surface** : mobile (Expo Go).

## But

Sortir le mobile de son écran unique : quatre onglets, l'historique et le catalogue consultables
sur le téléphone, et une séance plus guidée — GIF, écran allumé, repos lisible de loin.
Inspiration : opengym (onglets, séance guidée) ; ni heatmap ni graphiques dans ce chantier.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D74** | **Quatre onglets** : Accueil · Historique · Exercices · Profil (`Tabs` d'Expo Router, groupe `(onglets)`) | Chaque besoin a sa place ; la déconnexion quitte l'accueil |
| **D75** | **`seance` et `fin` restent hors des onglets**, en plein écran | En salle, rien ne doit distraire ni faire quitter la séance d'un appui |
| **D76** | **L'onglet actif est en encre pleine, jamais en lime** | Une position n'est pas une action (D28) |
| **D77** | **L'historique arrive sur le mobile** — D68 est levée | Revoir sa dernière séance se fait au téléphone, en salle |
| **D78** | **La séance reste une liste** ; chaque carte a une vignette GIF qui s'agrandit à l'appui | On garde la vue d'ensemble de Hevy, on gagne la démonstration d'opengym |
| **D79** | **Écran allumé pendant la séance** (`expo-keep-awake`) ; **repos en grand bandeau**, −15 s / +15 s / Passer | Le téléphone posé sur le banc ne doit ni s'éteindre ni obliger à plisser les yeux |
| **D80** | **Dépendances d'Expo Go seulement** : `expo-image` (GIF), `expo-keep-awake`, `@expo/vector-icons` | Le mobile tourne dans Expo Go (D55) |

## Arborescence

```
app/
  _layout.tsx            Stack racine (session, séance)
  connexion.tsx
  seance.tsx, fin.tsx    plein écran, hors onglets
  (onglets)/
    _layout.tsx          Tabs + garde de session
    index.tsx            Accueil : séance en cours, file, séance vide, routines
    historique/          index (liste) · [id] (détail + records)
    exercices/           index (recherche) · [slug] (GIF, muscles, exécution, records)
    profil.tsx           e-mail, envois en attente, déconnexion, version
```

## États

Chaque écran porte chargement, erreur avec « Réessayer », vide et nominal.

## Découpage

1. **PR 1** — onglets, Accueil allégé, Profil, onglet Exercices.
2. **PR 2** — onglet Historique et détail avec records.
3. **PR 3** — séance guidée : vignettes GIF, écran allumé, repos agrandi.

Vérification sur émulateur dans Expo Go ; nouvel APK EAS à la fin.
