---
paths:
  - "apps/web/**"
---

# Interface web

## Coquille (D69–D73, D81)

Conception : [`2026-09-24-coquille-shadcn-design.md`](../../docs/superpowers/specs/2026-09-24-coquille-shadcn-design.md).

- `Sidebar variant="inset" collapsible="none"` de shadcn — **ni bouton de repli ni en-tête**
  (demande de l'utilisateur). Non repliable, shadcn n'applique plus les marges de l'`inset` :
  elles sont recopiées sur le `SidebarInset` dans `AppShell`. Le titre reste en `sr-only`.
- Liste et détail redimensionnables dans le `SidebarInset`, tailles persistées.
- **Le détail ouvert vit dans le CHEMIN** : `/exercices/$slug`, `/seances/$id`, `/routines/$id`,
  `/routines/nouvelle`. Les paramètres de recherche ne portent que ce qui filtre (`q`, `groupe`)
  ou force un état (`etat`), et suivent d'un détail à l'autre (`search: (s) => s`).
- **`AppShell` est monté par la route de MISE EN PAGE de chaque écran, jamais par `__root.tsx`.**
  `_protege.exercices.tsx`, `_protege.seances.tsx`, `_protege.routines.tsx` montent la coquille
  et la liste ; le détail est une **route enfant** rendue par `<Outlet />`. La mise en page lit
  le paramètre de l'enfant par `useParams({ strict: false })` : la coquille change alors son jeu
  de panneaux — donc sa clé de persistance — selon qu'il y a un détail.
- `Resizable`, `Sidebar` et `Command` (palette `Cmd+K`) de shadcn. Composants shadcn plutôt que
  maison : `ScrollArea`, `Skeleton`, `Badge`, `Card`, `Table`, `Select`, `Tabs`, `Tooltip`.

## Écrans

- **Routines** en disposition `colonne` (`AppShell`) : cartes à gauche, routine ouverte
  **toujours modifiable** à droite. La barre Annuler/Enregistrer n'apparaît qu'une fois la copie
  différente de la version enregistrée (`empreinte`). Cartes d'exercice à la Hevy : image,
  « dernière fois » (`meilleureSerie`), pastille de repos, séries étiquetées É/1/2/3
  (`etiquettesSeries`).
- **Paramètres** (`/parametres`) : compte, thème (seul endroit où il se change), unités et fuseau.
- **Liste des exercices** : image fixe (JPG ~6 Ko) déduite de `gifUrl` par `imageDe` — aucune
  colonne ni migration. Le GIF reste réservé aux fiches.
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
- `--accent-ink` passe à `#5c7a14` en clair (sur blanc, `#a8cf45` tombe sous 2:1).
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
