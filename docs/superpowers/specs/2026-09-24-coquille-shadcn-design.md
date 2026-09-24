# Coquille web shadcn — conception

**Date** : 24 septembre 2026 · **Statut** : validée · **Surface** : web seulement.
Le mobile inspiré d'opengym est un chantier distinct, avec sa propre conception.

## But

Remplacer la navigation maison par la `Sidebar` de shadcn en variant `inset`, et passer les trois
écrans (exercices, routines, séances) aux composants shadcn au lieu des composants écrits à la main.
Le comportement ne change pas : mêmes routes, même contrat d'URL, mêmes données.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D69** | **`Sidebar variant="inset" collapsible="icon"`** remplace le panneau de navigation redimensionnable ; repli par `Cmd+B`, état persisté (cookie `sidebar_state` de shadcn) | Composant maintenu plutôt que du code maison ; le repli en icônes rend la place à la liste |
| **D70** | **Liste et détail restent redimensionnables** dans le `SidebarInset`, tailles persistées, détail dans l'URL (D19 inchangé) | La vue côte à côte est l'atelier d'analyse du web |
| **D71** | **La doctrine « le permanent est jointif » devient : seule la zone de contenu flotte, une fois.** L'`inset` lui donne marge, coins arrondis et ombre légère ; liste et détail restent jointifs entre eux (filet de 1 px) ; aucune autre surface permanente ne reçoit d'ombre | L'`inset` est un choix explicite de l'utilisateur ; on borne l'exception au lieu d'abandonner la règle |
| **D72** | **Les rôles `--sidebar-*` sont traduits dans `@theme inline`** : fond `--canvas`, texte `--ink-muted`, actif `--surface-3` + `--ink`, bordure `--line`, anneau `--accent`. Le lime ne marque jamais l'élément actif | Un rôle non déclaré n'émet aucune règle, en silence (piège du lot 1) ; l'actif est une surface, pas une action (D28) |
| **D73** | **Composants shadcn généralisés** : `ScrollArea`, `Skeleton`, `Badge`, `Card`, `Table`, `DropdownMenu`, `Avatar`, `Select`, `Tabs`, `Tooltip` | Demande de l'utilisateur : une bibliothèque, pas des variantes maison |

## La coquille

```
┌────────┐╭──────────────────────────────────╮
│ logo   ││ ☰ │ Exercices                     │  ← en-tête : SidebarTrigger + titre
│ 🔍 ⌘K  ││───────────────────┬──────────────│
│ Exerc. ││ liste             │ détail       │
│ Routin.││ (ScrollArea)      │ (ScrollArea) │
│ Séances││                   │              │
│ ◯ moi ▾││                   │              │
└────────┘╰──────────────────────────────────╯
```

- **En-tête de sidebar** : logo, bouton « Rechercher » qui ouvre la palette `Cmd+K`.
- **Contenu** : Séances, Routines, Exercices, icônes lucide, `isActive` d'après la route.
- **Pied** : `Avatar` (initiales) + `DropdownMenu` — e-mail, thème sombre/clair, déconnexion.
- `AppShell({ titre, liste, detail })` reste monté par chaque route ; seul `titre` s'ajoute.

## Les écrans

| Écran | Composants |
|---|---|
| Exercices | `ScrollArea` pour la liste ; filtre groupe en `Select` ; `Badge` du groupe ; `Skeleton` au chargement ; détail en `Tabs` (Infos · Records), records en `Card` + `Badge` en contour lime |
| Routines | `ScrollArea` ; éditeur : une `Card` par exercice, séries en `Table` ; dnd-kit conservé |
| Séances | `ScrollArea` ; détail : séries en `Table`, badges de record |
| Partout | `Tooltip` sur les boutons-icônes ; `EtatChargement` devient un `Skeleton` ; les quatre états `?etat=` restent atteignables |

## Hors champ

Responsive mobile du web (la sidebar shadcn l'offre en `Sheet`, sans travail dédié), nouveaux
écrans, toute donnée nouvelle.

## Vérification

`/verif` vert ; Playwright sur les trois écrans, dans les deux thèmes, sidebar dépliée et repliée,
et les quatre états de chaque écran ; contraste AA de l'élément actif et du texte de sidebar.

## Découpage

1. **PR 1 — coquille** : composants shadcn ajoutés, tokens, `AppShell`, sidebar, doctrine mise à
   jour (CLAUDE.md et conception principale).
2. **PR 2 — écrans** : exercices, routines, séances passés aux composants.
