# Web : wireframe de zéro

Date : 2026-10-16 · Branche : `feat/web-wireframe` (depuis `main`)

## 1. Intention

On remet l'application web à zéro pour repenser **quelles pages** elle porte et **ce qu'il y a
dedans**, avant tout travail de style. Le résultat est un wireframe **cliquable**, en gris, construit
avec de vrais composants shadcn et des **données factices**. L'API n'est pas branchée.

Le style (couleurs, police, densité) sera décidé ensuite, étape par étape. Cette spec ne le fixe pas.

**Révise** D132 (le web devient « analyse + préparation + planification »), D196–D198 (pages
d'auth, Accueil vide), D216–D220 (contenu des écrans de la refonte) et laisse en suspens D193–D195
et D199 (style), qui seront repris après validation du wireframe.

## 2. Décisions

- **D221 — Remise à zéro du web.** On garde le socle : Vite, React 19, TanStack Router,
  Tailwind, `components.json`. On supprime tout le reste de `apps/web/src` (routes, features,
  shell, états, auth, composants `ui/`) et on réinstalle les composants shadcn à neuf, au fil du
  besoin, thème neutre par défaut.
- **D222 — Front seul.** Aucun appel à l'API, aucun `@better-lift/api-client`. Les données vivent
  dans `src/mocks/`, typées, et sont lues par de petits hooks (`useMock…`) qu'on remplacera plus
  tard par des requêtes TanStack Query. La connexion est simulée.
- **D223 — Variantes et états pilotés par l'URL.** Chaque page propose 2 à 3 variantes de mise
  en page (`?v=a|b|c`) et ses quatre états (`?etat=nominal|vide|chargement|erreur`). Une
  **barre de prototypage** flottante, repliable, permet de basculer les deux. Elle disparaîtra au
  branchement de l'API.
- **D224 — Web = analyse, préparation, planification.** Pas de séance en direct sur le web : elle
  reste sur le mobile.
- **D225 — Planning remplace Programmes.** On planifie une routine sur un jour ; on peut répéter
  une semaine. Pas de moteur de cycles, pas de « prochaine séance » déduite.
- **D226 — Records = onglet de Progression**, pas une page.
- **D227 — Objectifs** sur un exercice (charge ou 1RM estimé) ou sur le poids de corps.
- **D228 — Composants hors shadcn validés** : Kibo UI *Contribution Graph*, ReUI *Stepper*,
  *Sortable* et *Number Field*, `react-body-highlighter` (silhouette des muscles). Tout autre
  composant externe se fait valider avant installation (recherche sur shoogle.dev).
- **D229 — Pas de logo pour l'instant.** Ni icône de site ni favicon : le nom « better-lift » en
  texte en tête de sidebar, masqué quand elle est repliée. L'identité viendra avec le style.
- **D230 — Direction d'interface : la bibliothèque de voix d'ElevenLabs.** Sidebar plate (nom en
  texte, entrées à icône, Paramètres en pied), header bas (fil d'Ariane, recherche étroite
  « Rechercher partout… », boutons-icônes en contour, avatar), contenu **centré** (`max-w-6xl`)
  sous un grand titre, onglets soulignés, barre de recherche large + Filtres + Tri, filtres en
  pastilles, sections titrées (« Voix tendance › ») en grilles ou carrousels.

## 3. Coquille

```
┌──────────┬───────────────────────────────────────────────────────────┐
│ ▣ Logo   │ [≡] Routines › Push A   [ 🔍 Rechercher…  Ctrl K ]  ◐ ⌨ ☺ │
│──────────│───────────────────────────────────────────────────────────│
│ ⌂ Accueil│                                                           │
│ ENTRAÎN. │                    contenu de la page                     │
│ ▦ Planning                                                           │
│ ☰ Routines                                                           │
│ ◎ Exercices                                                          │
│ ⟲ Historique                                                         │
│ ANALYSE  │                                                           │
│ ↗ Progression                                                        │
│ ⚖ Corps  │                                                           │
│──────────│                                                           │
│ ☺ Compte▾│                                                           │
└──────────┴───────────────────────────────────────────────────────────┘
```

- **Sidebar** shadcn, `collapsible="icon"` (bloc `sidebar-07` + header collant de `sidebar-16`).
  Repliée, chaque icône porte un tooltip. Tête : le nom en texte (D229). Pied : Paramètres
  (D230). Le compte (Paramètres, Raccourcis, Déconnexion) est sur l'avatar du header. État
  replié mémorisé (cookie du composant).
- **Header** collant :
  - gauche : `SidebarTrigger`, séparateur, `Breadcrumb` ;
  - centre : faux champ « Rechercher… » + `Kbd` Ctrl K, qui ouvre un `CommandDialog` ;
  - droite : thème clair/sombre, raccourcis clavier (ouvre une fenêtre), menu du compte (avatar).
- **Palette de commandes** : groupes *Aller à* (toutes les pages), *Routines*, *Exercices*,
  *Séances* (recherche dans les mocks), *Actions* (Nouvelle routine, Planifier, Noter mon poids,
  Importer depuis Hevy).
- **Raccourcis** : Ctrl K (palette), Ctrl B (sidebar), `G` puis lettre pour naviguer (`G A`
  Accueil, `G P` Planning, `G R` Routines, `G E` Exercices, `G H` Historique, `G G` Progression,
  `G C` Corps, `G S` Paramètres), `N` nouvelle routine sur Routines, `?` liste des raccourcis.
- **Motif liste | détail** : `ResizablePanelGroup` horizontal, liste à gauche (min 20 %, défaut
  30 %), détail à droite, poignée visible. Taille mémorisée par page. Utilisé par Routines,
  Exercices et Historique.
- **Transverse** : `sonner` pour les confirmations, `ContextMenu` (clic droit) sur les lignes de
  liste, `Skeleton` pour le chargement, `Empty` pour les états vides, `AlertDialog` pour toute
  suppression.

## 4. Pages

### 4.1 Auth (hors coquille)

- **Connexion** `/login` — e-mail, mot de passe, lien « Mot de passe oublié », lien inscription.
- **Inscription** `/register` — nom, e-mail, mot de passe.
- **Mot de passe oublié** `/forgot-password` — e-mail, puis écran « e-mail envoyé ».
- **Nouveau mot de passe** `/reset-password` — deux champs ; lien expiré = état erreur.
L'onboarding est reporté : il viendra quand l'inscription sera branchée.

Variantes : formulaire centré seul (a), deux colonnes formulaire + panneau illustré (b).

### 4.2 Accueil `/`

- **Aujourd'hui** : la routine planifiée pour le jour (lien vers elle), ou « Repos », ou
  « Rien de planifié » avec bouton *Planifier*.
- **Semaine** : 4 chiffres clés (séances, volume, durée, jours d'affilée), chacun comparé à la
  semaine précédente.
- **Volume par semaine** sur 12 semaines (graphique en barres).
- **Régularité** : Contribution Graph sur l'année.
- **Objectifs** : barres d'avancement (ex. 92,5 / 100 kg au développé couché).
- **Poids** : valeur actuelle, tendance 7 jours, mini-courbe.
- **Dernières séances** (5) et **records récents** (30 jours).

Variantes : grille de cartes façon tableau de bord (a), colonne principale + colonne latérale
étroite (b).

### 4.3 Planning `/planning`

- Calendrier **semaine** ou **mois** (`ToggleGroup`), navigation précédent / aujourd'hui / suivant.
- Jours passés : séances **faites** (plein). Jours à venir : routines **planifiées** (contour).
  Planifiée et non faite : **manquée**.
- Planifier : glisser une routine depuis un panneau latéral sur un jour, ou clic sur un jour →
  `Popover` avec la liste des routines.
- **Répéter la semaine** : copie la semaine affichée sur N semaines (`Dialog`).
- Clic sur une séance faite → Historique ; sur une planifiée → la routine.

Variantes : semaine en colonnes de jours (a), mois en grille (b), agenda en liste (c).

### 4.4 Routines `/routines`, `/routines/$id`

- **Liste** : recherche, **dossiers** repliables, ligne = nom, nombre d'exercices, dernière fois
  faite ; bouton *Nouvelle routine*.
- **Détail** : en-tête (nom, dossier, durée et volume estimés, badges des muscles ciblés),
  exercices avec séries cibles (charge × répétitions, repos), supersets groupés, dernière
  exécution ; actions *Modifier*, *Planifier*, *Dupliquer*, *Supprimer*.
- **Éditeur** `/routines/new`, `/routines/$id/edit` (pleine largeur, hors liste | détail) : nom,
  dossier, exercices en `Sortable`, ajout par une recherche d'exercices, séries en
  `Number Field`, regroupement en superset, notes.

Variantes du détail : liste d'exercices en cartes (a), tableau compact (b).

### 4.5 Exercices `/exercises`, `/exercises/$slug`

- **Liste** : recherche, filtres muscle et équipement, ligne = nom, muscle principal, dernière
  fois ; bouton *Exercice personnalisé*.
- **Détail** en onglets :
  - **Résumé** : silhouette des muscles (principal / secondaires), note personnelle épinglée,
    courbe du 1RM estimé et de la meilleure charge (avec objectif en pointillés), tableau des %
    du 1RM (50 → 100 %) ;
  - **Historique** : chaque séance où il apparaît, avec ses séries ;
  - **Records** : meilleure charge, meilleur 1RM estimé, meilleur volume, meilleur par nombre
    de répétitions.

Variantes du Résumé : courbe en haut, silhouette à droite (a) ; silhouette en haut, chiffres
clés en ligne (b).

### 4.6 Historique `/history`, `/history/$id`

- **Liste** : séances groupées par mois ; ligne = date, routine, durée, volume, nombre de
  records ; filtres par routine et par exercice.
- **Détail** : exercices et séries, badges de record, notes, durée, et **écart avec la séance
  précédente** de la même routine (volume ±, records).

Variantes de la liste : lignes denses (a), cartes (b).

### 4.7 Progression `/progress`

Sélecteur de période (4 semaines, 3 mois, 1 an, tout, ou plage personnalisée). Deux onglets :

- **Graphiques** : volume par groupe musculaire (barres et silhouette colorée), fréquence par
  muscle (séances par semaine), durée et nombre de séances dans le temps.
- **Records** : tableau triable (exercice, type, valeur, date) filtrable par muscle.

Variantes de Graphiques : grille 2 × 2 (a), un grand graphique + sélecteur de métrique (b).

### 4.8 Corps `/body`

- **Poids** : courbe avec moyenne mobile 7 jours, objectif en pointillés, saisie rapide de la
  pesée du jour, tableau des pesées.
- **Mensurations** (onglet) : tours (bras, taille, cuisse…), une courbe par mesure.

Variantes : courbe pleine largeur + tableau dessous (a), tableau à gauche + courbe à droite (b).

### 4.9 Paramètres `/settings/*`

Page avec sa propre navigation secondaire à gauche, façon Linear :

- **Compte** `/settings/account` : profil (nom, e-mail, fuseau), sécurité (mot de passe,
  sessions ouvertes), **zone de danger** (supprimer le compte).
- **Préférences** `/settings/preferences` : unités, format de date, premier jour de la semaine,
  apparence.
- **Entraînement** `/settings/training` : repos par défaut, incrément de charge, poids de la
  barre, disques disponibles, formule du 1RM (Epley / Brzycki), RPE / RIR activé.
- **Données** `/settings/data` : import Hevy en `Stepper` (fichier CSV → correspondance des
  exercices → aperçu → import simulé), export CSV / JSON, supprimer toutes les données.

Une seule variante : c'est un écran de formulaire.

### 4.10 Système

- **404** : message, lien vers l'Accueil.
- **Erreur générale** : `errorComponent` du routeur, bouton *Réessayer*.
- **Raccourcis** : `Dialog` listant les raccourcis avec `Kbd`.

## 5. Structure du code

```
apps/web/src/
  main.tsx, routeTree.gen.ts, styles/globals.css
  routes/                 une route par page (TanStack Router, fichiers plats)
  components/ui/          shadcn et registres validés (D228)
  components/shell/       sidebar, header, palette, raccourcis, liste-détail
  components/proto/       barre de prototypage, lecture de ?v= et ?etat=
  components/states/      squelettes, vide, erreur réutilisables
  features/<page>/        composants propres à une page, une variante par fichier
  mocks/                  données factices typées + hooks useMock…
```

- Code et adresses en anglais, textes en français.
- Chaque page lit `v` et `etat` via `validateSearch` du routeur ; la barre de prototypage les
  écrit. Une variante = un composant (`home-variant-a.tsx`…), choisi par la route.
- Les mocks couvrent un compte réaliste : ~25 routines en 4 dossiers, ~60 exercices, ~120
  séances sur 8 mois, 90 pesées, quelques objectifs, un planning sur 4 semaines.

## 6. Ordre : du général au spécifique

On construit par passes successives, chaque passe validée à l'écran avant la suivante :

1. **Socle** : remise à zéro, coquille (sidebar, header, palette, raccourcis), barre de
   prototypage, toutes les routes présentes avec un simple titre.
2. **Squelette des pages** : chaque page reçoit ses zones (cadres titrés, liste | détail en
   place), une seule variante, données factices minimales.
3. **Contenu** : vrais composants dans chaque zone, mocks complets, quatre états.
4. **Variantes** : les variantes B et C, page par page.
5. **Détails** : éditeur de routine, import Hevy, interactions (glisser-déposer, menus
   contextuels).

Le catalogue n'est pas figé : à chaque passe, on peut chercher d'autres composants (shoogle.dev,
recherches web, applications de référence comme Hevy, Strong ou Liftosaur). Chaque nouveau
composant externe est présenté et validé avant installation (D228).

## 7. Vérification

- `pnpm --filter @better-lift/web typecheck` et `build` passent ; Biome et Knip propres.
- Chaque page, chaque variante et chaque état est atteignable par l'URL et vérifié par une
  capture (Playwright).
- Pas de test unitaire sur le wireframe : il n'y a pas de logique métier. Les rares calculs
  (moyenne mobile, % du 1RM) vivent dans `mocks/` et seront remplacés par ceux de `shared`.

## 8. Hors périmètre

Style définitif, branchement de l'API, séance en direct, mobile, moteur de programmes,
onboarding.
