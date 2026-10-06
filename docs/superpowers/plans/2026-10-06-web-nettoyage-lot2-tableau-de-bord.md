# Nettoyage du web — lot 2 : Tableau de bord — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** le Tableau de bord en cartes shadcn, période en `ToggleGroup`, volume en `Chart`.

**Spec :** [`2026-10-06-web-nettoyage-design.md`](../specs/2026-10-06-web-nettoyage-design.md) (D158, D159).

## Global Constraints

Celles du [lot 1](2026-10-06-web-nettoyage-lot1-coquille.md). Branche `feat/web-nettoyage-lot-2`,
partant de `main` une fois le lot 1 fusionné (sinon empilée sur `feat/web-nettoyage-lot-1`).

## Tâches

- [ ] **1. Composants shadcn** — `pnpm dlx shadcn@latest add toggle-group chart` depuis `apps/web` ;
  vérifier la version de Recharts (Context7) et sa compatibilité avec React 19.2.3 ; imports `cn`
  alignés sur les autres primitives. Pas de `--chart-*` : les séries prennent leurs couleurs
  dans les tokens existants par `ChartConfig`. Animations Recharts désactivées
  (`isAnimationActive={false}`, cf. `prefers-reduced-motion` de `globals.css`). Commit.
- [ ] **2. `Carte` → `Card`** — `features/tableau/carte.tsx` devient une fine enveloppe de `Card`
  (`CardHeader` + `CardTitle` en casse normale, `CardAction` pour le détail, `CardContent`) ; les
  appelants (`tuiles`, `calendrier`, `muscles`, `volume`, `records`) gardent leur API. Squelette de
  `_protege.index.tsx` : `rounded-xl`, `bg-(--surface-1)`. Commit.
- [ ] **3. Tuiles** — chiffre héros, `Badge` contour en `CardAction` pour l'écart (lime si hausse :
  `text-(--accent-ink) border-(--accent-line) bg-(--accent-wash)` ; neutre sinon), phrase de
  comparaison en `CardFooter`. Le texte vient de `ecart()` de `calculs.ts` ; si sa forme doit
  changer (sens séparé du texte), la changer en TDD dans `calculs.test.ts`. Commit.
- [ ] **4. Période** — `SelecteurPeriode` en `ToggleGroup type="single" variant="outline" size="sm"`
  (valeur vide ignorée : on ne désélectionne pas une période). Commit.
- [ ] **5. Volume** — `BarChart` dans `ChartContainer` sur `volumesAffiches()` (inchangée, testée) ;
  barre courante en `--ink-muted`, les autres en `--line-strong` (jamais lime, D137) ;
  `ChartTooltip` avec `formaterCharge`. Commit.
- [ ] **6. Vérifier, documenter, PR** — `/verif` ; Playwright sombre et clair, 1280 / 1920, les
  quatre états ; poids du bundle avant / après dans la PR ; `interface-web.md` (Tableau de bord) ;
  PR.
