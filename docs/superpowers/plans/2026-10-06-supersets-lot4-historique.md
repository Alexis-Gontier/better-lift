# Supersets, lot 4 — historique (web et mobile) : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. **Exécution inline.**

**Goal:** Une séance faite en superset se relit comme telle (D153) : même filet et même étiquette dans le relevé comparé du web et le détail d'une séance du mobile.

**Architecture:** L'API rend déjà `supersetGroupe` dans `GET /seances/:id` (lot 1) ; `groupes` (shared) découpe la liste. Lecture seule : l'étiquette n'ouvre rien. Fil, aperçu, export, stats : inchangés.

**Spec:** [`docs/superpowers/specs/2026-10-06-supersets-design.md`](../specs/2026-10-06-supersets-design.md) — D151, D153.

## Global Constraints

- Branche `feat/supersets-historique` depuis `main` (#101 fusionnée).
- Une séance antérieure (sans le champ) n'a aucun groupe : rien ne change pour elle.

### Task 1 : web — `apps/web/src/features/seances/detail-seance.tsx`

- [ ] `const blocs = groupes(seance.exercices);` ; dans la liste, le premier membre d'un groupe rend un `<div>` : étiquette texte `text-[11px] font-bold tracking-wider uppercase text-superset` « Superset A », puis les `<Exercice>` du groupe dans `flex flex-col gap-3 border-l-[3px] border-superset pl-3` ; les autres membres rendent `null` ; hors groupe, `<Exercice>` seul.
- [ ] À l'écran (Playwright, compte de contrôle) : poser un groupe sur une séance de démo **en base de dev** (`UPDATE "SeanceExercice"`), vérifier le relevé en sombre et en clair, puis remettre `NULL`.

### Task 2 : mobile — `apps/mobile/app/(onglets)/historique/[id].tsx`

- [ ] Envelopper chaque `<View style={styles.exercice}>` dans `RepereSuperset groupe={…} index={iE} ecart={espace.l}` (le `gap` du contenu), sans `onEtiquette`.
- [ ] Émulateur : même séance de démo groupée en base, détail ouvert, capture ; remettre `NULL`.

### Task 3 : documentation, `/verif`, PR

- [ ] `interface-web.md` (Séances : groupes dans le relevé), `mobile.md` (Détail d'une séance), `CLAUDE.md` (supersets terminés : la ligne d'état les range parmi l'acquis), spec D11 révisée déjà notée.
- [ ] PR `feat: supersets, lot 4 — historique (D153)`.
