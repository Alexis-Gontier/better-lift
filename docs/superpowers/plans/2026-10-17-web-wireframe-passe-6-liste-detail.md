# Passe 6 : liste | détail repensée, édition directe

Spec : `docs/superpowers/specs/2026-10-16-web-wireframe-design.md`, D235–D241.
Branche : `feat/web-wireframe`. Après chaque étape : biome, typecheck, `pnpm --filter web test`,
knip, capture Playwright des quatre états, puis un commit.

## Étape 1 — L'élément ouvert dans le chemin (D235, D236, D237)

- `components/list-detail.tsx` : `ListDetailPage` reçoit `detail: ReactNode` (l'`Outlet`) au
  lieu de `detail(id)` ; nouveaux `DetailHeader` (titre, sous-titre, actions, onglets) et
  `NoSelection` exporté. Retirer `SelectionContext`, `useSelection`, `SelectableRow`.
- Classe commune des lignes sélectionnées : `data-[status=active]:bg-muted` sur le `Link`
  (`activeOptions={{ includeSearch: false }}`), `search={(s) => s}` pour garder `etat`, `v`,
  `onglet`.
- Routes : `_app.{routines,exercises,history}.tsx` montent le gabarit et la liste selon `etat` ;
  `*.index.tsx` → `NoSelection` ; `$id` / `$slug` → `DetailHeader` + corps, avec chargement,
  erreur, introuvable (et `vide` = introuvable : il n'y a rien).
- Exercices : onglets Résumé · Historique · Records dans `DetailHeader` ; onglet de liste
  Catalogue · Mes exercices en état local, initialisé d'après l'exercice ouvert.
- Historique : la pagination par mois s'ouvre assez loin pour montrer la séance ouverte.
- Retirer `RoutineDetailCompact`, `ExerciseSummaryHero`, la route `/routines/$id_/edit` (et
  son cas dans le fil d'Ariane), l'entrée « Modifier » du clic droit. `/routines/new` garde
  l'ancien éditeur jusqu'à l'étape 3, mais rendu dans le panneau.

## Étape 2 — Modifier une routine : variantes A/B/C (D239)

- `features/routines/routine-draft.ts` : brouillon, `toDraft`, comparaison (« modifié ? »),
  testés.
- A : `RoutineEditor` dans le panneau, champs nus, barre de pied collante si modifié.
- B : `RoutineDetail` + bouton *Modifier* dans `DetailHeader` → l'éditeur ; Annuler / Terminer.
- C : `RoutineDetail` dont nom, charges, répétitions et repos sont des `InlineField` (clic →
  champ, quitter → enregistré, toast `sonner` avec *Annuler*) ; ajout d'exercice en bas, retrait
  et superset au menu ⋯.
- Sans API : l'enregistrement met à jour un état local au gabarit (la liste reflète le nom).

## Étape 3 — Créer par la liste (D238)

- `/routines/new` : ligne brouillon « Sans nom » en tête de liste, active ; panneau vide, focus
  sur le nom, dans la variante courante. Annuler → `/routines`.
- Bouton et palette « Nouvelle routine » mènent à `/routines/new`.

## Étape 4 — Corriger une séance : variantes A/B/C (D239)

- Mêmes trois façons sur `SessionDetailView` : charges, répétitions, note, durée.
- Supprimer reste au menu ⋯ de l'en-tête, avec `AlertDialog`.

## Étape 5 — Exercices : note et exercice personnalisé (D240)

- Note épinglée modifiable au clic, enregistrée en la quittant.
- `/exercises/new` : ligne brouillon dans « Mes exercices », formulaire nom, muscle, équipement.
- Fiche d'un exercice personnalisé : le même formulaire en tête, modifiable.
