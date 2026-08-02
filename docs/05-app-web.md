# 05 — Application web

Next.js 16, App Router, Turbopack. Le web est **l'atelier** : préparation des routines, lecture des statistiques, gestion du compte.

## Arborescence des routes

```
app/
├── (marketing)/
│   ├── page.tsx                    # landing
│   ├── pricing/                    # V2
│   └── legal/{cgu,confidentialite}/
├── (auth)/
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── reset-password/
└── (app)/                          # layout authentifié : sidebar + topbar
    ├── dashboard/
    ├── routines/
    │   ├── page.tsx                # liste + dossiers
    │   ├── new/
    │   └── [id]/
    │       ├── page.tsx            # aperçu
    │       └── edit/
    ├── workouts/
    │   ├── page.tsx                # historique (liste + calendrier)
    │   └── [id]/
    ├── exercises/
    │   ├── page.tsx                # catalogue
    │   ├── new/                    # créer un exercice personnalisé
    │   └── [id]/
    │       ├── page.tsx            # fiche + historique + records
    │       └── edit/               # exercices personnalisés uniquement
    ├── stats/
    └── settings/
        ├── profile/
        ├── preferences/
        └── account/
```

Le `proxy.ts` Next protège `(app)/*` : session absente → redirection vers `/login?next=<chemin>`. En Next 16 le fichier s'appelle `proxy.ts`, plus `middleware.ts`, et l'export nommé est `proxy` (voir [doc 10](10-versions.md)).

**Ce n'est pas une frontière de sécurité**, et il ne faut pas le lire comme telle. Il constate la *présence* d'un cookie de session pour éviter d'afficher une coquille vide à un visiteur anonyme ; il ne vérifie ni signature ni expiration, ce qui imposerait un aller-retour vers l'API à chaque navigation pour une garantie que l'API redonne de toute façon. L'autorisation réelle est côté API, et nulle part ailleurs. Un cookie forgé n'obtient qu'un écran qui se remplira d'erreurs 401.

Deux détails qui ont coûté du temps et sont détaillés en [doc 10](10-versions.md) : les chemins du `matcher` s'écrivent en toutes lettres (un groupe `(app)` n'apparaît jamais dans une URL), et le cookie change de nom en HTTPS (`__Secure-`).

Le paramètre `next` est **filtré avant redirection** (`safeNextPath`) : il vient de l'URL, donc de n'importe qui, et un `/login?next=https://exemple.test` ferait de l'écran de connexion un tremplin de redirection ouverte.

## Dashboard

C'est l'écran d'accueil de la zone connectée. Il doit répondre en un coup d'œil à : **est-ce que je suis régulier, est-ce que je progresse, qu'est-ce que je fais aujourd'hui ?**

```
┌──────────────────────────────────────────────────────────────┐
│  Bonjour Alex          [Semaine ▾]        [Démarrer séance]  │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│ Séances      │ Volume total │ Temps        │ Records         │
│ 4  ▲ +1      │ 22,4 t  ▲ 8% │ 4 h 12  ▬    │ 2  ▲            │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│  Volume par semaine (12 semaines)          [barres]          │
├────────────────────────────────┬─────────────────────────────┤
│  Répartition musculaire (30 j) │  Séances récentes           │
│  [barres horizontales]         │  · Push A — hier — 1 h 12   │
│                                │  · Legs  — mar. — 58 min    │
├────────────────────────────────┼─────────────────────────────┤
│  Régularité (heatmap 12 sem.)  │  Records récents            │
└────────────────────────────────┴─────────────────────────────┘
```

**Cartes KPI.** Chaque valeur est accompagnée de sa variation par rapport à la période précédente — un chiffre isolé n'informe pas. Données issues de `GET /v1/stats/summary` (`previousPeriod` inclus, un seul appel).

**Volume par semaine.** Barres, 12 dernières semaines. C'est le graphique le plus utile pour repérer une déload involontaire ou une dérive.

**Répartition musculaire.** Nombre de séries par partie du corps sur 30 jours, en barres horizontales triées. Un radar est plus joli mais nettement moins lisible pour comparer des valeurs — on privilégie la lecture.

**Régularité.** Heatmap type contributions GitHub sur 12 semaines. Signal comportemental fort, coût d'implémentation faible.

**État vide.** Un nouvel utilisateur voit un dashboard sans données : prévoir explicitement une variante « premiers pas » (créer une routine → démarrer une séance) plutôt que des cartes à zéro. C'est souvent oublié et c'est le tout premier écran que voit un inscrit.

**Chargement.** Server Component pour la coquille, `<Suspense>` par bloc avec squelettes. Les blocs ne se bloquent pas mutuellement.

## Éditeur de routines

L'écran le plus important du web, et celui qui justifie l'existence de l'app web. Cible : construire une routine de 6 exercices en moins de deux minutes.

```
┌───────────────────────────────────────────────────────────────┐
│  ← Routines    [Push A________]   Dossier: [PPL ▾]  [Enreg.] │
├────────────────────────────────────────┬──────────────────────┤
│  ⠿ Développé couché barre       [⋯]    │  Ajouter un exercice │
│    Repos 3:00 · Notes                  │  ┌────────────────┐  │
│    ┌──────┬────────┬──────┬─────┐      │  │ 🔍 recherche   │  │
│    │ Éch. │  40 kg │ 10   │ [×] │      │  └────────────────┘  │
│    │  1   │ 100 kg │  5   │ [×] │      │  [Pecs][Dos][Jamb.]  │
│    │  2   │ 100 kg │  5   │ [×] │      │  ─────────────────   │
│    └──────┴────────┴──────┴─────┘      │  ▸ Développé couché  │
│    + Ajouter une série                 │  ▸ Développé incliné │
│                                        │  ▸ Écarté poulie     │
│  ⠿ Développé militaire          [⋯]    │  ▸ …                 │
│    …                                   │                      │
│                                        │                      │
│  + Ajouter un exercice                 │                      │
└────────────────────────────────────────┴──────────────────────┘
```

### Comportements attendus

- **Glisser-déposer** sur les exercices et sur les séries, via `dnd-kit`. Poignée dédiée (`⠿`) : rendre toute la ligne draggable rend la sélection de texte impossible.
- **Ajout en un clic** depuis le panneau latéral, qui reste ouvert — on ajoute rarement un seul exercice.
- **Duplication de série** : la plupart des séries d'un exercice sont identiques. Un bouton « dupliquer la dernière » économise l'essentiel des saisies.
- **Menu `⋯` par exercice** : remplacer l'exercice, créer un superset avec le suivant, ajouter des notes, régler le repos, supprimer.
- **Brouillon local.** L'état de l'éditeur vit dans un store client (Zustand ou `useReducer`). Rien n'est envoyé avant l'enregistrement, qui fait un unique `PUT /v1/routines/:id`.
- **Protection contre la perte.** `beforeunload` si le brouillon est modifié, plus une sauvegarde automatique en `localStorage` restaurée au retour.
- **Raccourcis clavier** : `⌘S` enregistrer, `⌘K` ouvrir la recherche d'exercices, `Échap` fermer le panneau.
- **Accessibilité.** `dnd-kit` fournit une alternative clavier au glisser-déposer : la câbler, ne pas la laisser par défaut sans annonce.

## Autres écrans

### Routines (liste)
Dossiers repliables, cartes de routine affichant le nom, le nombre d'exercices, la date de dernière exécution. Actions : démarrer, modifier, dupliquer, déplacer, supprimer. Glisser-déposer entre dossiers.

### Historique
Deux vues commutables : liste antéchronologique paginée, et calendrier mensuel avec pastilles. Filtres par routine et par période.

### Détail d'une séance
Résumé (durée, volume, séries, records), puis les exercices avec leurs séries. Les records sont mis en évidence. Modification possible d'une séance passée (erreur de saisie) et suppression.

### Catalogue d'exercices
Grille avec vignettes, recherche instantanée (debounce 250 ms), filtres persistés dans l'URL — un filtre doit être partageable et survivre à un rechargement.

Le catalogue commun et les exercices personnalisés y sont **mêlés**, un sélecteur d'origine (tous / catalogue / les miens) permettant de n'en garder qu'un. La provenance est écrite sur chaque carte : sans elle, un exercice personnalisé et son homonyme du catalogue seraient indiscernables.

**« Les miens » sans résultat n'est pas un échec de recherche** : c'est le seul moment où l'on sait que rien n'a été créé. L'état vide propose alors de créer, il ne conseille pas d'élargir les filtres.

### Exercice personnalisé
Un formulaire unique sert la création et la modification — deux composants finiraient par valider différemment. Il valide avec **le schéma de l'API** (`packages/validators`), jamais avec des règles réécrites : sinon l'utilisateur découvre la vraie contrainte en recevant un 422.

Un exercice du catalogue ouvert en modification est refusé **avant la saisie**, et non à l'enregistrement : le `GET` réussit puisqu'il est visible de tous, un formulaire pré-rempli s'afficherait donc sans problème apparent pour échouer en 403 une fois rempli.

L'archivage demande une confirmation en place, en deux temps, plutôt qu'une `confirm()` : bloquante, non stylable, et supprimée par certains navigateurs dans les iframes.

### Fiche exercice
GIF d'animation, muscles primaires et secondaires, instructions numérotées dans la langue de l'utilisateur, courbe de progression, records, dernières séries réalisées. Mention d'attribution du média obligatoire (voir doc 08).

### Statistiques
Version approfondie du dashboard : sélecteur de période, progression par exercice, comparaison de périodes, records par exercice. V2 pour l'essentiel.

### Réglages
Profil (nom, pseudo, avatar, bio) · Préférences (unités, langue, repos par défaut, visibilité) · Compte (mot de passe, sessions actives, export, suppression).

## Détails d'implémentation

**Server / Client Components.** Server par défaut. Passent en client : l'éditeur de routines, les graphiques, la recherche instantanée, les formulaires. La liste des routines et l'historique se rendent côté serveur avec hydratation TanStack Query pour la pagination.

**Affichage des unités.** Un composant `<Weight value={kg} />` lit la préférence utilisateur depuis le contexte et formate. Aucun composant n'appelle une conversion à la main — sinon un écran finira en kg pendant que le voisin est en lb.

**Formatage localisé.** `Intl.NumberFormat` et `Intl.DateTimeFormat` avec la locale du profil, pas celle du navigateur : un utilisateur qui a choisi le français sur un navigateur anglais s'attend à du français partout.

**Thème.** Sombre par défaut (usage en salle, et convention du secteur), clair disponible, respect de `prefers-color-scheme` au premier chargement.

**Graphiques.** Recharts. Toujours accompagnés d'une table de données accessible en lecteur d'écran, ou d'un `aria-label` décrivant la tendance.

**Peut-on remplir une séance sur le web ?** Oui, dès la V1 (D7), en réutilisant l'API. Ce n'est pas le parcours principal mais le coût est faible et ça débloque deux cas réels : la correction d'une séance mal saisie, et l'utilisateur qui note son entraînement depuis un ordinateur.
