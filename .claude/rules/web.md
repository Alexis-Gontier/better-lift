---
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

# Web — Next.js 16

- App Router, **Turbopack par défaut** : ne pas produire de configuration webpack.
- La protection des routes passe par **`proxy.ts`**, pas `middleware.ts` : en Next 16 le fichier est renommé et l'export nommé s'appelle `proxy`. Le build échoue si les deux fichiers coexistent. `proxy` tourne en runtime Node, jamais en edge.
- Server Components par défaut. `"use client"` réservé à l'interactif : éditeur de routines, formulaires, graphiques, recherche instantanée.
- **Jamais d'import Prisma ici**, même dans un Server Component. Tout passe par `packages/api-client`.
- Tailwind **4** (config CSS-first) + shadcn/ui, base **`radix`**, preset **`vega`** (doc 09 D24).
- **Les primitives shadcn ne s'écrivent pas à la main** : `npx shadcn@latest add <composant> -c apps/web`. Elles atterrissent dans `packages/ui/src/components`, s'importent en `@better-lift/ui/components/<nom>`, et `cn` vient de `@better-lift/ui/lib/utils`. Les hooks qu'elles tirent vont dans `packages/ui/src/hooks` (`@better-lift/ui/hooks/<nom>`). Vérifier la liste déjà installée avant d'ajouter ou d'importer.
- Installées à ce jour : `alert`, `avatar`, `badge`, `button`, `card`, `dropdown-menu`, `empty`, `field`, `input`, `input-group`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `spinner`, `table`, `textarea`, `toggle`, `toggle-group`, `tooltip` — plus le hook `use-mobile`.
- Le CLI **prompte** sur chaque fichier déjà présent. Répondre non par défaut : réécrire `button.tsx` en tirant une nouvelle primitive écraserait silencieusement des ajustements. `--overwrite` est un choix, pas un raccourci.
- **Trois primitives s'écartent du registre** et portent un commentaire `ÉCART ASSUMÉ` : `input.tsx` et `input-group.tsx` (variante `size`, `h-full` sur le contrôle), et `select.tsx` (ouverture en `popper` / `align="start"` au lieu d'`item-aligned` centré). Un `--overwrite` dessus efface l'écart **sans erreur de compilation** — `size` reste un attribut légal sur `<input>`, `item-aligned` une position légale. Relire ces trois fichiers après toute réinstallation d'`input`, `input-group`, `field` ou `select`. Détail en doc 09 D24.
- **Une dimension partagée par plusieurs écrans se remonte en variante dans `packages/ui`, pas en `className`.** Une hauteur de champ décrit une densité ; passée en classe locale, deux écrans divergent sans que rien ne le signale. Le `className` reste bon pour le ponctuel (`w-full`, marges, placement).
- **Le vocabulaire de couleurs est celui de shadcn** : `background`, `foreground`, `card`, `primary`, `muted-foreground`, `border`, `destructive`. Les anciens `surface`/`ink`/`danger` n'existent plus. Piège : `accent` désigne la **surface de survol**, pas la couleur d'action — celle-ci est `primary`.
- `globals.css` vit dans `packages/ui/src/styles/`. Y toucher aux tokens, jamais créer une autre feuille. Toute nouvelle racine de sources doit y être déclarée en `@source`, sinon ses classes ne sont pas générées.
- Composants métier dans `apps/web/src/features/<domaine>` ; `packages/ui` ne contient que des primitives génériques.
- **`src/app/` ne contient que des routes et des fichiers de convention Next** (`layout`, `page`, `loading`, `error`, `not-found`, …). Tout le reste vit à côté : `src/features/`, `src/providers/`, `src/lib/`.
- Les providers globaux vivent dans `src/providers/`, **un fichier par provider**, assemblés par `src/providers/index.tsx`. Ce fichier d'assemblage n'est pas `"use client"` : chaque provider porte sa propre directive, ce qui garde la frontière serveur/client le plus bas possible.
- `unauthorized()` / `forbidden()` exigent `experimental.authInterrupts` dans `next.config.ts`. Attention : pour une ressource d'autrui, c'est **`notFound()`**, pas `forbidden()` (règle non négociable n°8).
- TanStack Query 5 pour l'état serveur côté client. `dnd-kit` pour le glisser-déposer, Recharts pour les graphiques.

## Affichage

- Les charges passent par `<Weight value={kg} />`, qui lit la préférence d'unité depuis le contexte. **Aucun composant n'appelle une conversion à la main.**
- `Intl.NumberFormat` / `Intl.DateTimeFormat` avec la locale du **profil**, pas celle du navigateur.
- Thème sombre par défaut (usage en salle), clair disponible.

## Formulaires

- Validation au `blur`, erreur levée à la frappe suivante, et **rien sur un champ resté vide** : le premier champ a l'autofocus, donc un simple clic ailleurs déclenche un `blur` sur du vide. Revalidation complète à l'envoi (le `blur` du dernier champ n'a pas lieu quand on soumet à la touche Entrée) — c'est là que les champs manquants sont signalés.
- `noValidate` sur le `<form>` : la bulle native n'est ni stylable, ni traduite selon le profil, ni lue partout. Garder `type` et `autoComplete`, qui pilotent le clavier mobile et l'autofill.
- Erreur **sous le champ** quand un champ est en cause ; bandeau en haut seulement quand aucun ne l'est. Toujours `aria-invalid` sur l'input **et** un message texte : la couleur seule ne suffit pas.
- Cible tactile 44 px minimum sur les écrans remplis au doigt, 8 px entre deux cibles voisines.
- Ne jamais faire disparaître le libellé d'un bouton pendant l'attente : `Spinner` + `disabled` + `aria-busy`, le texte reste.

## Qualité obligatoire

Chaque écran traite les états **chargement / erreur / vide**. L'état vide du dashboard n'est pas une variante décorative : c'est le premier écran que voit un inscrit, il doit guider vers « créer une routine ».

Accessibilité WCAG 2.1 AA : alternative clavier au glisser-déposer (`dnd-kit` la fournit, il faut la câbler), graphiques accompagnés d'un équivalent textuel.

Libellés en fr **et** en en.

Détail des écrans : `docs/05-app-web.md`.
