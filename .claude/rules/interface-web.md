---
paths:
  - "apps/web/**"
---

# Interface web

## Coquille (D69–D73, D81)

Conception : [`2026-09-24-coquille-shadcn-design.md`](../../docs/superpowers/specs/2026-09-24-coquille-shadcn-design.md),
refondue par [`2026-10-06-web-refonte-design.md`](../../docs/superpowers/specs/2026-10-06-web-refonte-design.md) (D132–D144).

- **Le web est le poste d'analyse (D132)** : on y regarde et on y prépare ; aucune entrée ne
  lance une séance.

- `Sidebar variant="inset" collapsible="none"` de shadcn — **ni bouton de repli ni en-tête**
  (demande de l'utilisateur). Non repliable, shadcn n'applique plus les marges de l'`inset` :
  elles sont recopiées sur le `SidebarInset` dans `Coquille`. Barre de 220 px (D136) :
  Tableau de bord, Séances, Routines, Exercices ; Profil en pied.
- Liste et détail redimensionnables dans le `SidebarInset`, tailles persistées.
- **Le détail ouvert vit dans le CHEMIN** : `/exercices/$slug`, `/seances/$id`, `/routines/$id`,
  `/routines/nouvelle`. Les paramètres de recherche ne portent que ce qui filtre (`q`, `groupe`)
  ou force un état (`etat`), et suivent d'un détail à l'autre (`search: (s) => s`).
- **Le gabarit est monté par la route de chaque écran, jamais par `__root.tsx`** :
  `PageListeDetail` (liste / détail, titre en `sr-only`) ou `PageTableau` (titre visible,
  `largeur` `pleine` ou `lecture`). Les deux posent `Coquille` (barre latérale + zone flottante).
  `_protege.exercices.tsx`, `_protege.seances.tsx`, `_protege.routines.tsx` montent le gabarit
  et la liste ; le détail est une **route enfant** rendue par `<Outlet />`. La mise en page lit
  le paramètre de l'enfant par `useParams({ strict: false })` : la coquille change alors son jeu
  de panneaux — donc sa clé de persistance — selon qu'il y a un détail.
- `Resizable`, `Sidebar` et `Command` (palette `Cmd+K`) de shadcn. Composants shadcn plutôt que
  maison : `ScrollArea`, `Skeleton`, `Badge`, `Card`, `Table`, `Select`, `Tabs`, `Tooltip`.

## Écrans

- **Routines** en disposition `colonne` (`PageListeDetail`) : cartes à gauche, routine ouverte
  **toujours modifiable** à droite. La barre Annuler/Enregistrer n'apparaît qu'une fois la copie
  différente de la version enregistrée (`empreinte`). Cartes d'exercice à la Hevy : image,
  « dernière fois » (`meilleureSerie`), pastille de repos, séries étiquetées É/1/2/3
  (`etiquettesSeries`). La colonne se **réordonne** à la poignée (souris ou clavier :
  Espace, flèches, Espace) par `useOrdonnerRoutines`, mutation OPTIMISTE sur
  `["routines","liste"]` (D142) : c'est l'ordre que suit « À suivre » sur le mobile.
- **`/` est le Tableau de bord**, protégé (D134) : `features/tableau/`, période dans l'URL
  (`?periode=`, défaut `mois`). Deux lectures de `/stats/periode` (la période, et `annee` pour le
  calendrier qui montre toujours 12 mois, D138) ; le calcul propre au web est dans `calculs.ts`
  (testé). Carte du corps : `corps-svg.ts`, GÉNÉRÉ depuis `react-native-body-highlighter` (MIT),
  à ne pas modifier à la main. `--cal-0` s'écarte du mobile (posé sur `--surface-2`). **Profil** (`/profil`, ex-`/parametres`, D143) :
  bilan de toujours, objectif hebdo et repos par défaut (SUR LE COMPTE, `["preferences"]`, la
  clé des tuiles du Tableau de bord), thème (appareil, seul endroit où il se change), unités et
  fuseau (affichés), export CSV par un simple lien, déconnexion.
- **Séances** en disposition `fil` (liste 34 % / détail 66 %, sa propre clé de persistance) :
  fil groupé par mois (`grouperParMois`, fuseau), ↑ / ↓ d'une séance à l'autre ; détail = relevé
  comparé (`ecartSerie` face à `precedentes`, toutes les séries), menu « ⋯ » → Supprimer, qui
  RETIRE le détail puis invalide `["seances"]`, `["stats"]`, `["records"]`.
- **`ScrollArea` de Radix** : son contenu est un `display: table` qui s'élargit au lieu de couper.
  Une liste à `truncate` doit forcer `[&_[data-slot=scroll-area-viewport]>div]:block!`.
- **Exercices** en disposition `fil` : catalogue à gauche, **fiche en une page** (D141) — GIF,
  1RM estimé et sa courbe SVG (`courbe` de `calculs.ts`, testée ; dernier point en lime s'il
  est record), records, historique (`["seances","historique",slug]`, invalidé par la
  suppression d'une séance), consignes.
- **`BadgeRecord`** (`features/exercices/badge-record.tsx`) est la SEULE pastille record du web :
  ne jamais recopier ses classes.
- **Liste des exercices** : image fixe (JPG ~6 Ko) déduite de `gifUrl` par `imageDe` — aucune
  colonne ni migration. Le GIF reste réservé aux fiches.
- **Adresse inconnue et route qui plante** : `defaultNotFoundComponent` et
  `defaultErrorComponent` du routeur (`main.tsx`), dans `components/etats/pages-routeur.tsx`. Ni
  coquille ni requête : ils tiennent quand c'est elles qui tombent. La 404 prend la page,
  l'erreur ne remplace que la route fautive (la coquille reste). Une 404 se voit à toute
  adresse inconnue.
- **Les quatre états par l'URL** : `?etat=chargement|erreur|vide`, derrière
  `import.meta.env.DEV`. `vide` vide le jeu de données plutôt que de substituer un composant.

## Élévation et thème

- **Le permanent est jointif, le passager flotte** (D71). Seule la zone de contenu
  (`SidebarInset`) flotte : marge, coins arrondis, ombre légère. Liste et détail sont jointifs,
  séparés par un filet de 1 px. Flou, ombre portée et voile sont réservés au momentané (palette,
  menus, dialogues). Si ça flotte, ça se ferme — hormis cette zone.
- Rôles `--sidebar-*` et `card` traduits dans `@theme inline` (D72). L'élément actif de la
  navigation est `--surface-3`, jamais le lime. La variante `dark:` suit `data-theme`, pas la
  préférence du système (`@custom-variant` dans `globals.css`).
- Sombre par défaut, clair accessible. Hiérarchie par échelle de surfaces et quatre niveaux
  d'encre. Contraste AA : 4,5:1, ou 3:1 dès 24 px.
- **Les primitives shadcn parlent leur propre vocabulaire**, traduit dans `@theme inline`.
  Un rôle non déclaré n'émet aucune règle, en silence. L'aplat est `bg-primary` /
  `text-primary-foreground`. `accent` désigne chez shadcn la **surface de survol** et pointe vers
  `--surface-3` : ne jamais rendre `bg-accent` au lime, chaque survol deviendrait un aplat.
- **Les valeurs des tokens suivent `apps/mobile/lib/theme.ts`** (D135) : en changer une, c'est
  changer les deux. Police **Archivo** (`@fontsource-variable/archivo/wdth.css`), chiffres héros
  par l'utilitaire `chiffre` (`font-stretch: 72%`). Calendrier `--cal-0..4`, vignettes
  `--image-bg` (blanc dans les deux thèmes).
- `--accent-ink` passe à `#4d6a12` en clair (sur blanc, `#a8cf45` tombe sous 2:1).
  `--danger` = `#a83e39` : encre à 5,65:1, aplat détaché du fond à 3,24:1 — plus foncé, le
  bouton disparaît.

## Pièges

- **Serveur de dev laissé tournant** : le greffon de routes réécrit `routeTree.gen.ts`, et
  `core.autocrlf=true` le rend « modifié » sans différence, ce qui bloque un `git pull` ou un
  changement de branche avec un `git diff` vide. Arrêter le serveur avant de fusionner, et
  vérifier que le port 3000 est libre (`TaskStop` ne tue pas toujours le Vite enfant).
- `SYSTEME_UNITES` (`src/lib/unites.ts`) et le fuseau (`src/lib/fuseau.ts`, Europe/Paris) sont
  fixés à un seul endroit chacun, tant qu'aucun profil n'existe.
- Logo : `src/components/logo.tsx`, source vectorielle `public/favicon.svg`.
- Le lien `/` de la barre latérale porte `exact` : sans lui, il reste actif sur toutes les pages.
- Biome lit aussi `.superpowers/` (maquettes non versionnées) : ses erreurs y sont sans effet
  sur la CI, ignorer celles qui en viennent.
