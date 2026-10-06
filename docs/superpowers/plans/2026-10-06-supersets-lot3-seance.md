# Supersets, lot 3 — séance mobile : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Exécution inline (préférence de l'utilisateur).**

**Goal:** En séance, le superset se voit, se crée et se défait depuis le menu ⋯, et l'écran suit la logique déjà livrée dans `shared` (repos au bout du tour, D149 ; prochaine série tour par tour, D150).

**Architecture:** Aucune logique nouvelle : `validerSerie`, `prochaineSerie`, `lierExercices`, `delierExercice`, `defaireSuperset`, `deplacerExercice` (lot 1) et `roleRepos`, `peutLierAuSuivant`, `groupes` (lot 2) existent et sont testés. Ce lot branche l'écran : `RepereSuperset` (lot 2) autour des blocs, puce de repos selon `roleRepos`, menu ⋯ actif, lettre du groupe dans la réorganisation.

**Tech Stack:** React Native (Expo Go), `shared`.

**Spec:** [`docs/superpowers/specs/2026-10-06-supersets-design.md`](../specs/2026-10-06-supersets-design.md) — D149, D150, D151, D152.

## Global Constraints

- Branche `feat/supersets-seance` depuis `main` (#100 fusionnée). PR squash.
- Les blocs de séance sont pleine largeur, séparés par un filet, sans marge ni `gap` : `RepereSuperset` avec `marge` et `ecart` à 0.
- Menu ⋯ (D89, D152) : l'entrée inerte « Ajouter à un superset » devient « Superset avec le suivant » (inerte avec sa raison si `!peutLier`), plus « Retirer du superset » dans un groupe. L'étiquette ouvre « Défaire le superset ».
- Puce de repos : masquée si `roleRepos === "masque"` ; sur le dernier, « Après le groupe · 1 min 30 » (ou « Sans repos après le groupe »).
- Le brouillon sur disque porte `supersetGroupe` (lot 1) : rien à migrer, un vieux brouillon n'a aucun groupe.

---

### Task 1 : le bloc d'exercice

**Files:** Modify `apps/mobile/components/seance/carte-exercice.tsx`

- [ ] Nouvelles props : `repos: RoleRepos`, `peutLier: boolean`, `dansGroupe: boolean`, `onLier: () => void`, `onDelier: () => void`.
- [ ] Menu ⋯ : remplacer l'entrée inerte par

```ts
{
  libelle: "Superset avec le suivant",
  icone: Link2,
  ...(peutLier ? { onPress: onLier } : { inactive: dansGroupe ? "dans le groupe" : "dernier exercice" }),
},
...(dansGroupe ? [{ libelle: "Retirer du superset", icone: Unlink2, onPress: onDelier }] : []),
```

- [ ] Puce de repos : non rendue si `repos === "masque"` ; libellé `Après le groupe · ${libelleRepos(sec)}` / « Sans repos après le groupe » si `repos === "groupe"` ; `accessibilityLabel` aligné.

### Task 2 : l'écran de séance

**Files:** Modify `apps/mobile/app/seance.tsx`

- [ ] `const blocs = groupes(seance.exercices);` ; chaque bloc (la `View` à `onLayout`) enveloppe `CarteExercice` dans `RepereSuperset groupe={g} index={iE} onEtiquette={() => feuille({ titre: \`Superset ${g.lettre}\`, options: [{ libelle: "Défaire le superset", icone: Unlink2, onPress: () => modifier(defaireSuperset(seance, iE)) }] })}`. La `View` à `onLayout` reste à l'extérieur : les positions de défilement mesurent le bloc entier, étiquette comprise.
- [ ] Props de `CarteExercice` : `repos={roleRepos(seance.exercices, iE)}`, `peutLier={peutLierAuSuivant(seance.exercices, iE)}`, `dansGroupe={g !== null}`, `onLier={() => modifier(lierExercices(seance, iE))}`, `onDelier={() => modifier(delierExercice(seance, iE))}`.
- [ ] Rien d'autre : `validerSerie` et `prochaineSerie` portent déjà D149 et D150 ; `suivre` fait défiler vers la prochaine, donc vers l'exercice suivant du groupe.

### Task 3 : la réorganisation

**Files:** Modify `apps/mobile/app/reorganiser.tsx`

- [ ] Devant le nom de chaque ligne d'un groupe, une pastille texte de la lettre (`groupes(seance.exercices)`), couleur `superset`, police `taille.petit`, gras. Le glisser passe déjà par `deplacerExercice` (D148).

### Task 4 : vérification, documentation, PR

- [ ] `npx tsc --noEmit` (mobile), `/verif`.
- [ ] **Émulateur** (compte de contrôle) : lier les deux exercices de « Push mobile » dans l'éditeur, lancer la séance → étiquette et barre ; repos visible sur le dernier seulement ; cocher la 1ʳᵉ série du premier → pas de repos, la prochaine passe à la Traction ; cocher la Traction → repos de la Traction (« après le groupe ») ; ⋯ → « Retirer du superset » puis « Superset avec le suivant » ; étiquette → « Défaire ». **Abandonner la séance** (rien n'est envoyé), puis défaire le superset de la routine et enregistrer : la démo revient à son état.
- [ ] `mobile.md` (Séance : supersets branchés, l'entrée n'est plus inerte), `CLAUDE.md` (état). Commit, push, PR `feat: supersets, lot 3 — séance mobile (D149–D152)`.
