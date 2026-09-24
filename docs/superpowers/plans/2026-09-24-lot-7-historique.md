# Lot 7 — l'historique et les records : plan d'implémentation

> superpowers:executing-plans, exécution inline. Plan compact.

**Spec :** [`docs/superpowers/specs/2026-09-24-lot-7-historique-design.md`](../specs/2026-09-24-lot-7-historique-design.md)
**Contraintes :** celles des lots précédents (`CLAUDE.md` fait foi).

# PR 1 — historique et records (`feat/lot-7-historique`)

1. **`shared/records.ts`** (TDD) — § 3. Tests : échauffement et séries non faites ignorés ;
   charge max avec départage aux reps ; 1RM Epley (1 rep = charge) ; volume ; poids du corps →
   REPS seul ; `marquerRecords` : première séance marque tout ce qui compte, une égalité ne marque
   pas, deux séries successives dans la même séance (la seconde ne bat que si elle dépasse la
   première).
2. **Service et routes des séances** — lecture : `lister(userId, page)`, `lire(userId, id)` (avec
   records : historique antérieur des mêmes exercices, `debut <` celui de la séance),
   `precedentes(userId, slugs)`. Routes : `GET /seances`, `/seances/precedentes`, `/seances/:id`.
   Tests : 401, 404 sur la séance d'autrui, ordre des routes.
3. **Records d'un exercice** — `GET /exercices/:slug/records`, derrière session (le catalogue
   reste public : route montée à part, `routesRecords`).
4. **Web** — `lib/fuseau.ts` ; requêtes ; écran des séances branché (pagination « Afficher plus »
   comme le catalogue) ; `BadgeRecord` accepte un type ; fiche d'exercice : bloc des records ;
   suppression des factices ; test du fuseau (23 h 30 à Paris → 20 septembre).
5. **Vérification** — `/verif` ; Playwright avec le compte de contrôle, sur ses séances réelles ;
   PR.

# PR 2 — « la dernière fois » sur mobile (`feat/lot-7-derniere-fois`)

6. **`shared/seance.ts`** — `precedent` optionnel sur `ExerciceEnCours`,
   `avecPrecedents(s, parSlug)` (TDD). Non envoyé au serveur.
7. **Mobile** — au démarrage, `/seances/precedentes` puis `avecPrecedents` avant l'écriture du
   brouillon ; indication sous chaque série, appui = recopie. Émulateur, validation, PR ;
   `CLAUDE.md` et mémoire.
