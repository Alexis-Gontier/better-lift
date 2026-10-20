# Page d'une routine et carte à deux actions — design (D321)

Document de chantier. Une fois fusionné : D321 dans `docs/decisions.md`, la section Navigation
de `.claude/rules/mobile.md` à jour, puis supprimer cette spec et son plan.

## Pourquoi

Comme Hevy : lancer une routine d'un appui, mais pouvoir aussi la regarder avant. D320 faisait
de toute la carte un bouton « lancer » ; la page d'une routine avait quitté le mobile (D316).

## Décisions

- **La carte** (onglet Routines) : à gauche le nom (et « À suivre »), dessous « 5 exercices ·
  muscles » ; puis la colonne durée / dernière fois ; à droite un **segment « Lancer »** de 80
  de large sur toute la hauteur de la carte, en **aplat foncé** (`bg-primary`, icône ▶ et
  « Lancer » en `text-primary-foreground`). Le segment lance la séance (`useDemarrer`) ; le reste
  de la carte ouvre la page de la routine. Pendant l'ouverture, le segment montre un indicateur.
- **La page** `app/routine/[id].tsx`, lecture seule, sur la pile racine (hors onglets) :
  - en-tête : retour, nom ; dessous « 5 exercices · ~30 min · Il y a 17 j » ;
  - bouton **« Lancer »** pleine largeur, 48, aplat foncé ;
  - la note de la routine, si elle existe ;
  - « Tout déplier » / « Tout replier » en tête de la liste des exercices ;
  - une carte par exercice, **repliée par défaut** (comme l'éditeur du web, D253) : chevron,
    vignette, nom, puis « Pectoraux · 1 É + 3 × 8 · 80 kg ». Ouverte : le muscle, un tableau
    Série / Charge / Reps (É pour l'échauffement, « — » sans cible), puis le repos (« Repos
    2 min », « Repos par défaut » sans repos propre, rien quand le superset le masque) ;
  - supersets : le filet gris et l'étiquette « Superset A » de la séance (`RepereSuperset`),
    sans action ;
  - quatre états : le détail vient de `optionsRoutine(id)` (en cache, préchargé hors ligne) ;
    hors ligne sans cache : « Hors ligne » ; erreur sans donnée : `Erreur` avec Réessayer.
- Pas de lien « Modifier sur le web » : en salle on ne modifie pas.
- **Partage** : le résumé des séries (`setsSummary` du web) devient `resumeSeries` dans
  `shared/liste-routines.ts`, sur des séries chiffrées ; le web y convertit son brouillon et
  garde « W » pour l'échauffement, le mobile passe « É ». Les charges passent par
  `formaterCharge` / `chargeEnTexte`.

## Structure

```
apps/mobile/app/routine/[id].tsx          la page
apps/mobile/app/_layout.tsx               Stack.Screen « routine/[id] »
apps/mobile/components/routine/carte-exercice-routine.tsx   un exercice repliable
apps/mobile/components/accueil/ligne-routine.tsx            la carte à deux actions
apps/mobile/components/seance/repere-superset.tsx           `onEtiquette` facultatif
packages/shared/src/liste-routines.ts     + resumeSeries (et tests)
apps/web/src/features/routines/routine-draft.ts   setsSummary → resumeSeries
```

## Vérification

`/verif` vert ; émulateur clair et sombre : la liste (segments foncés), la page repliée, un
exercice ouvert, un superset si la démo en a, « Lancer » depuis la page et depuis la carte,
retour vers l'onglet.
