# Wireframe web — passe 2 : squelette des pages — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à chaque page son squelette : le gabarit `Page` (D233) avec ses vrais onglets et ses vraies actions, et des zones titrées en pointillés qui disent ce qui viendra où.

**Architecture:** Deux briques partagées — `Zone` (cadre titré en pointillés) et `PageTabs` (onglets soulignés pilotés par `?onglet=` ou par des liens de route). Chaque page compose `Page` + `Zone` dans une grille. Pas de données factices dans cette passe (passe 3).

**Tech Stack:** React 19, TanStack Router, shadcn Radix Nova (`Button`, `Separator`), Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-10-16-web-wireframe-design.md` (§ 4 pages, § 6 passe 2, D223, D233)

## Global Constraints

- Code en anglais, textes en français ; pas de couleur en dur, rôles shadcn seulement.
- Une seule variante (A) par page dans cette passe ; les états `vide` / `chargement` / `erreur` viennent en passe 3.
- **Le détail des listes reste en suspens** (sur sa propre page, en panneau, ou en liste | détail) : en attendant, chaque détail garde sa route et son propre gabarit.
- Commits en Conventional Commits, en français, sujet en minuscule.

---

### Task 1: Briques partagées

**Files:**
- Modify: `src/components/proto/proto-search.ts` (+ test) — garder `onglet` (chaîne non vide)
- Create: `src/components/zone.tsx`, `src/components/page-tabs.tsx`

- [ ] **Step 1: Test — `parseProtoSearch` garde `onglet`**

```ts
it("garde l'onglet demandé", () => {
  expect(parseProtoSearch({ onglet: "mois" })).toEqual({ onglet: "mois" });
});
it("ignore un onglet vide", () => {
  expect(parseProtoSearch({ onglet: "" })).toEqual({});
});
```

- [ ] **Step 2: Implémenter** — `ProtoSearch` gagne `onglet?: string` ; `parseProtoSearch` le copie si c'est une chaîne non vide.

- [ ] **Step 3: `zone.tsx`**

```tsx
type Props = { title: string; hint?: string; className?: string };

/** Cadre du wireframe : une zone titrée qui dit ce qui viendra à cet endroit. */
export function Zone({ title, hint, className }: Props) {
  return (
    <div className={cn("flex min-h-24 flex-col gap-1 rounded-xl border border-dashed p-4", className)}>
      <span className="font-medium text-sm">{title}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
```

- [ ] **Step 4: `page-tabs.tsx`** — `PageTabs({ tabs: { value, label }[] })` rend des `Link` (`to="."`, `search: { onglet }`) soulignés quand actifs ; le premier onglet est actif par défaut. `RouteTabs({ tabs: { to, label }[] })` fait de même avec des routes (Paramètres). Hook `useTab(values)` renvoie l'onglet actif (valeur de l'URL si connue, sinon la première).

- [ ] **Step 5: Vérifier et commiter** — `pnpm --filter @better-lift/web test`, typecheck ; `feat(web): zones et onglets du squelette`.

### Task 2: Accueil, Planning, Progression, Corps

Zones (dans l'ordre, grille 3 colonnes `md:grid-cols-3`) :

| Page | Onglets | Actions | Zones |
|---|---|---|---|
| Accueil | — | — | Aujourd'hui (3 col) · Séances / Volume / Durée / Jours d'affilée (4 tuiles, rangée à part en `grid-cols-4`) · Volume par semaine (2 col) · Poids (1) · Régularité (3) · Objectifs (1) · Records récents (1) · Dernières séances (1) |
| Planning | Semaine · Mois | Répéter la semaine (contour), Planifier (aplat) | Navigation précédent / aujourd'hui / suivant (3, basse) · Calendrier (2, haute) · Routines à glisser (1, haute) |
| Progression | Graphiques · Records | Période (contour) | Graphiques : Volume par muscle · Fréquence par muscle · Durée des séances · Nombre de séances (2 × 2). Records : Filtre muscle (basse) · Tableau des records (haute) |
| Corps | Poids · Mensurations | Noter mon poids (aplat) | Poids : Courbe + moyenne 7 jours (haute) · Objectif (1) · Pesées (2). Mensurations : Bras · Taille · Cuisse · Poitrine (2 × 2) |

- [ ] Une route par page, `PagePlaceholder` remplacé ; vérifier au navigateur chaque onglet ; commit `feat(web): squelette de l'accueil, du planning, de la progression et du corps`.

### Task 3: Routines, Exercices, Historique (listes et détails)

| Page | Onglets | Actions | Zones |
|---|---|---|---|
| Routines | — | Nouvelle routine (aplat, lien) | Recherche (2, basse) · Filtres (1, basse) · Dossiers en pastilles (3, basse) · 6 cartes de routine |
| Routine (`$id`) | — | Planifier, Modifier (lien), Dupliquer (contour) | En-tête : durée, volume, muscles (3, basse) · 4 exercices (3 chacun) |
| Éditeur (`new`, `$id/edit`) | — | Annuler (contour), Enregistrer (aplat) | Nom et dossier (3, basse) · Exercices réordonnables (3, haute) · Ajouter un exercice (3, basse) |
| Exercices | Catalogue · Mes exercices | Exercice personnalisé (aplat) | Recherche (2) · Filtres + Tri (1) · Muscles en pastilles (3) · 9 lignes d'exercice |
| Exercice (`$slug`) | Résumé · Historique · Records | Note (contour) | Résumé : Courbe 1RM (2) · Silhouette (1) · Note épinglée (1) · Tableau % 1RM (2). Historique : Séances (3, haute). Records : Records (3) |
| Historique | — | — | Recherche (2) · Routines en pastilles (1) · « Octobre 2026 » : 3 séances · « Septembre 2026 » : 3 séances |
| Séance (`$id`) | — | Supprimer (contour) | Résumé : durée, volume, records (3) · Écart avec la précédente (3) · 4 exercices (3) |

- [ ] Routes mises à jour ; commit `feat(web): squelette des routines, exercices et historique`.

### Task 4: Paramètres et auth

- [ ] `_app.settings.tsx` monte `Page` (titre « Paramètres ») avec `RouteTabs` (Compte, Préférences, Entraînement, Données) et l'`Outlet` ; chaque sous-page rend ses sections en zones :
  Compte : Profil · Sécurité · Sessions ouvertes · Zone de danger. Préférences : Unités · Formats · Premier jour · Apparence. Entraînement : Repos · Charges et disques · Formule du 1RM · RPE / RIR. Données : Import Hevy · Export · Supprimer les données.
- [ ] Auth : `AuthPlaceholder` (titre, sous-titre, zone formulaire, lien secondaire) pour les 4 pages.
- [ ] `PagePlaceholder` supprimé s'il ne sert plus ; `/verif` ; captures ; commit.
