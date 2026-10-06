# Nettoyage du web — conception

**Date** : 6 octobre 2026 · **Statut** : validée (arbitrages du 6 octobre) · **Surface** : web seul.
Ni l'API, ni la base, ni `shared` ne changent.

**Source** : la séance de maquettes du 6 octobre (compagnon visuel, `.superpowers/brainstorm/`, non
versionné) : trois directions (console, produit, retouche), variante de barre latérale, pages
liste / détail. Inspiration : les consoles Cloudflare (Workers & Pages) et Firecrawl. Cette spec
consigne les choix ; elle **révise D71, D133 et D136** de la refonte
(`2026-10-06-web-refonte-design.md`) sans toucher à son plan ni à ses écrans.

## But

La refonte D132–D144 a posé le bon plan (Tableau de bord, Séances, Routines, Exercices, Profil),
mais l'habillage reste chargé : une zone de contenu qui flotte, des cartes en aplat gris à grands
rayons, des en-têtes en petites capitales, des titres masqués sur les pages liste / détail, des
composants faits maison là où shadcn en offre. On **nettoie** : une coquille de console plate, un
en-tête commun à toutes les pages, et les blocs shadcn plutôt que du maison.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D154** | **Coquille plate** : `Sidebar variant="sidebar" collapsible="none"` (au lieu de `inset`), pleine hauteur, filet `--line` à droite, fond `--canvas`. **Plus de zone flottante** : le contenu est posé sur `--canvas`, sans marge, coin ni ombre. Révise D71 : **rien de permanent ne flotte** ; flou, ombre et voile restent au passager (palette, menus, dialogues) | Choix de l'utilisateur (variante « sidebar » contre « floating ») ; l'allure console de Cloudflare, et D71 devient littérale |
| **D155** | **Navigation en groupes** (`SidebarGroup` + `SidebarGroupLabel`) : Tableau de bord seul en tête, puis **Entraînement** (Séances, Routines) et **Catalogue** (Exercices). La recherche (`Ctrl K`) prend la forme d'un **champ** en tête de barre, qui ouvre la palette. Toujours 220 px, toujours non repliable | Les groupes nomment ce que la barre range ; le champ dit qu'on peut chercher |
| **D156** | **Pied de barre `NavUser`** (bloc shadcn) : avatar, nom tiré de l'adresse, `⋯` → menu **Profil**, **Se déconnecter**. Le thème ne se change toujours que dans le Profil (D143) | Le motif shadcn ; la déconnexion à deux clics de partout, sans quitter la page |
| **D157** | **En-tête commun `EnTetePage`** : barre de 44 px, filet bas, posée par les deux gabarits. À gauche un `Breadcrumb` dont le premier élément est le `h1` de la page, lien vers la liste quand un détail est ouvert, suivi du nom du détail (« Séances / Push A ») ; à droite un emplacement d'actions (période, « Ouvrir la routine », `⋯`). **Les pages liste / détail perdent leur `h1` en `sr-only`** ; les actions du détail montent dans l'en-tête. Révise D133 | Toutes les pages se lisent de la même façon ; le fil nomme l'élément ouvert |
| **D158** | **Cartes shadcn** : toute carte est un `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`) sur `--surface-1`, filet `--line`, rayon `rounded-xl` (12 px). **Fin de l'aplat `--surface-2` et des petites capitales** : titres en casse normale, `--ink`, 14 px gras ; description en `--ink-subtle`. Les tendances (`↗ +3`) sont des `Badge` en **contour** (lime si hausse, neutre sinon). Révise D135 et les rayons de D136 (carte 16 → 12) | La carte se détache par son filet, pas par un gris ; la forme du contour reste celle du record |
| **D159** | **Davantage de shadcn** : ajout de `breadcrumb`, `toggle-group` (sélecteur de période), `chart` (Recharts) et `sidebar` en blocs. Le **volume par semaine** et la **courbe du 1RM** passent au `ChartContainer` ; leurs données restent calculées par les `calculs.ts` testés, seul le rendu change. Le relevé d'une séance et l'historique d'un exercice passent au `Table` shadcn | Demande de l'utilisateur ; des primitives éprouvées plutôt que du SVG maison. Coût accepté : ~100 Ko de Recharts |
| **D160** | **Liste / détail nettoyé** (disposition « fil » retenue contre la table de données) : liste et détail jointifs sous l'en-tête commun, toujours redimensionnables et persistés, ↑ / ↓ conservés. Un **champ de filtre** en tête de liste (Séances, Routines ; Exercices garde sa recherche). Entrée sélectionnée : fond `--surface-2` et liseré d'encre de 2 px à gauche, **jamais lime**. Le détail s'ouvre sur ses chiffres en **tuiles jointives** (une `Card`, cellules séparées par des filets) | Comparer une séance à la précédente se fait au clavier dans un fil ; une table pleine largeur l'aurait cassé |

## Ce qui ne bouge pas

Le plan et les écrans de D132–D144 ; le lime unique (aplat = action, contour = record) ; `--danger`
et `--superset` ; les valeurs des tokens alignées sur le mobile (D135) — **aucune valeur ne
change**, seul leur emploi change ; Archivo et `chiffre` ; les quatre états par `?etat=` ; les
pages 404 et erreur du routeur ; le thème clair, qui suit les mêmes tokens ; la logique de
l'éditeur de routine et des supersets.

## Découpage

Une PR par lot, le web reste utilisable entre deux lots.

1. **Coquille** — D154 à D157 ; `breadcrumb` ajouté ; `Card` restylé (D158) ;
   `interface-web.md` mis à jour.
2. **Tableau de bord** — `toggle-group` et `chart` ajoutés (D159) ; tuiles, calendrier, muscles, records en `Card` ; période en
   `ToggleGroup` ; volume en `Chart`.
3. **Séances** — D160 sur le fil et le relevé ; relevé en `Table`.
4. **Routines** — D160 sur la colonne ; éditeur restylé (cartes d'exercice en `Card`).
5. **Exercices** — D160 sur le catalogue ; fiche en `Card`, courbe du 1RM en `Chart`.
6. **Profil et connexion** — sections en `Card`, formulaire de connexion en `Card`.

## Tests

- Les tests existants restent verts ; aucune logique nouvelle hors du rendu. Si le passage à
  `Chart` demande une mise en forme des données, elle va dans le `calculs.ts` de l'écran, testée.
- Chaque écran garde ses quatre états par `?etat=`.
- Chaque lot est vérifié à l'écran (Playwright, compte de contrôle, sombre et clair, largeurs 1280
  et 1920) avant sa PR. Contraste AA vérifié sur les nouveaux emplois (filets, badges).

## Hors périmètre

- Une table de données (TanStack Table) pour les listes : écartée par D160.
- Une barre latérale repliable.
- Tout changement de valeur de token, donc tout impact sur le mobile.
- Le web sur téléphone.
