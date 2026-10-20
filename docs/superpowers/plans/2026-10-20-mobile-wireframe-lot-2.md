# Mobile wireframe — lot 2 (la séance) : plan

> Exécuté en ligne (superpowers:executing-plans). Spec :
> `docs/superpowers/specs/2026-10-20-mobile-wireframe-design.md`. Branche
> `feat/mobile-wireframe-seance`, empilée sur `feat/mobile-wireframe` (PR #130) : recibler sa PR
> sur `main` AVANT de fusionner #130.

## Choix de l'utilisateur (2026-10-20)

- **Saisie au clavier du système** : les cases kg / reps deviennent des `Input` (Reusables),
  `decimal-pad` pour la charge, `number-pad` pour les reps. Le pavé maison part
  (`components/seance/pave-numerique.tsx`, et dans `shared/pave.ts` ce qui n'a plus d'usage).
- **Repos en bandeau seul**, comme Hevy : décompte, −15 s / +15 s, Passer. L'horloge plein écran
  part (`components/seance/horloge-repos.tsx`).
- **Supersets gardés, plus simples** : logique inchangée (`shared/supersets.ts`), repère réduit à
  un filet gris et l'étiquette « Superset A » ; lier / délier restent dans le menu ⋯.

## Règles de saisie (reprennent D59, D109)

- Une case montre la valeur quand elle est **saisie** (`serie.saisi`) ou la série **faite** ;
  sinon elle est vide et la **cible s'affiche en indication** (`placeholder`). Taper remplace donc
  la cible, sans l'effacer d'abord.
- La valeur s'écrit à la sortie du champ (`onEndEditing`) et à « Suivant » : `lireCharge` /
  `lireReps` ; une saisie invalide n'est jamais écrite (bordure `destructive`, le texte reste).
  Un champ vidé sans frappe ne saisit rien.
- Charge → « Suivant » du clavier → reps de la même série → « OK » ferme le clavier.
- Cocher une série valide aussi la saisie en cours (le clavier se ferme d'abord : `Keyboard.dismiss`
  déclenche `onEndEditing` avant l'appui).

## Tâches

1. **Ligne de série** (`components/seance/ligne-serie.tsx`) en classes : étiquette (type de série
   par feuille), précédent (appui = recopier), deux `Input`, case ✓. États : faite (fond
   `bg-muted`, ✓ pleine), prochaine (liseré), à venir (cible en indication).
2. **Carte d'exercice** (`carte-exercice.tsx`) en classes : vignette, nom, ⋯ ; puces repos et
   note ; en-têtes de colonnes ; lignes ; « + Série ». Les feuilles (menu, repos, type) gardent
   `components/ui/feuille.tsx` jusqu'au lot 3.
3. **Bandeau de repos** (`bandeau-repos.tsx`) en classes, toujours affiché pendant un repos.
   **Repère superset** (`components/ui/repere-superset.tsx`) en classes.
4. **Écran de séance** (`app/seance.tsx`) : en-tête (replier, nom, « séries · durée · volume »,
   Terminer), barre de progression, liste, pied (Ajouter un exercice, Abandonner). Plus de pavé
   ni d'horloge ; le défilement vers la prochaine série après une coche reste.
5. **Choisir des exercices** et **Réorganiser** en classes.
6. Supprimer pavé, horloge et le code mort (Knip) ; `/verif` ; émulateur : saisir, cocher,
   repos ±15 / Passer, ajouter / remplacer / réorganiser, superset, sombre et clair ; D317 ;
   règles mobiles ; PR empilée.
