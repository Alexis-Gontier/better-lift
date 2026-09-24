# better-lift — Lot 4 : le catalogue français

**Date :** 23 septembre 2026 — **révisée le 24 septembre 2026** (§ 0)
**Portée :** noms français, semis, API du catalogue, extraction de `packages/api-client`,
branchement des écrans du lot 2, animations des exercices.
**Critère de sortie :** n'importe quel exercice se retrouve, en français comme en anglais, et sans
accents à la saisie.

Ce document complète la conception principale
[`2026-09-22-better-lift-redemarrage-design.md`](2026-09-22-better-lift-redemarrage-design.md),
dont la section 7 pose le cadre, et poursuit le registre des décisions à partir de **D37**.

---

## 0. Pourquoi cette révision

La première version de ce lot montait une **chaîne de fabrication** des noms français : un
glossaire de locutions, un moteur de substitution, un fichier de corrections, un fichier généré,
et deux tests pour tenir l'ensemble. L'exploration l'avait encore alourdie — l'anglais est à tête
finale, le français à tête initiale, et « Dumbbell Bench Press » donnait « haltères développé
couché » avant qu'une règle de suffixe ne vienne s'y greffer.

La revue du 24 septembre, faite à la lumière d'[opengym](https://github.com/alexpcosta/opengym) —
qui part du même dataset —, a ramené le chantier à sa taille : **un nom français est une donnée,
pas le produit d'un moteur.** On l'ajoute comme une entrée de plus, à côté du nom anglais qu'on
garde. Opengym, de son côté, ne traduit pas les noms du tout ; on va un cran plus loin, sans la
machinerie.

Décisions abandonnées : **D37** (glossaire et traductions générées) et **D38** (couverture du
glossaire comme test). Elles sont remplacées par **D44** et **D45**.

---

## 1. L'état de départ, vérifié

La branche Neon `dev` porte le schéma mais **zéro exercice** : le semis part de rien.

Le dataset ([hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset),
cloné dans `Desktop/dev/exercises-dataset`, commit `7455efa`) contient 1 324 entrées :

- **1 318 noms distincts.** Six paires sont identiques en tout sauf l'id et le média ; on garde
  l'id le plus petit. Le `slug` est `@unique`, donc sans déduplication le semis échoue.
- **Cinq noms abîmés** : quatre `sled 45в° leg press` (le `°` relu en cp1251) et un
  `dumbbell rear delt row_shoulder`. Réparés à l'extraction.
- **`instruction_steps.fr`** : présent pour toutes les entrées, **déjà au tutoiement**.
- **`gif_url`** : un **chemin relatif** dans le dataset (`videos/0001-2gPfomN.gif`), pas une URL.

| Surface | Volume | Traitement |
|---|---|---|
| Noms d'exercices | 1 318 | **`noms-fr.json`**, une entrée par id (§ 3) |
| Équipements | 28 | Libellés écrits à la main dans `shared` |
| Muscles secondaires | 40 | Idem |
| Muscles cibles | 19 | Idem |
| Parties du corps | 10 | Enum anglaise, libellé français dans `shared` (D41) |

## 2. Les décisions de ce lot

| | Décision | Pourquoi |
|---|---|---|
| ~~D37~~ | ~~Glossaire versionné + `traductions.json` généré~~ | **Abandonnée le 24 septembre** : une machine à produire 1 318 chaînes qu'on relit de toute façon une par une |
| ~~D38~~ | ~~La couverture du glossaire est un test~~ | **Abandonnée** avec D37 |
| **D39** | **Colonne `nomRecherche` normalisée**, remplie au semis | « developpe couche » doit trouver « Développé couché » |
| **D40** | **`normaliserRecherche` vit dans `shared`** et sert des deux côtés | Si l'écriture et la lecture normalisent différemment, rien ne se trouve |
| **D41** | **`bodyPart` reste une enum anglaise** ; le libellé français vient de `shared` | Une clé de données n'est pas un affichage |
| **D42** | **`packages/api-client` est extrait ici** | C'est le lot où deux surfaces consomment les mêmes routes |
| **D43** | **Deux PR sous un même lot** : fabriquer le catalogue, puis le servir | Mêler 1 318 lignes de français à du TypeScript rend les deux illisibles |
| **D44** | **Le nom anglais reste, le français s'ajoute** : `name` (anglais du dataset) et `nomFr`. L'interface affiche `nomFr` ; **la recherche porte sur les deux** | En salle on parle moitié anglais : « bench press » et « developpe couche » doivent mener au même endroit. Et un nom français maladroit reste retrouvable par son nom d'origine |
| **D45** | **`noms-fr.json` est une donnée écrite, pas un fichier généré** : id → nom français, commité, relu en diff. Un seul test : chaque id de la source y a une entrée non vide | Corriger un nom, c'est modifier une ligne. Aucune règle à tordre, aucun moteur à relancer |
| **D46** | **Les animations sont affichées dès ce lot, depuis le dépôt du dataset**, avec l'attribution « © Gym visual — https://gymvisual.com/ » | Voir § 6 — choix assumé pour une application privée |

---

## 3. Les noms français

Dans `packages/db/catalogue/` :

```
source.json       extrait vendorisé du dataset, 1 318 entrées. Généré une fois, commité.
noms-fr.json      id du dataset -> nom français. ÉCRIT, commité.
```

**Il n'y a pas de script de traduction.** `noms-fr.json` est rédigé une fois — par lots, relu en
diff — puis vit comme n'importe quel fichier de données. Une correction est une ligne modifiée et
un semis relancé (l'`upsert` le rend rejouable).

**Le registre : le français d'usage.** Les anglicismes réellement employés en salle sont
conservés, parce que ce sont eux qu'on tape. `curl` reste `curl`, `squat` reste `squat`,
`pushdown` reste `pushdown`. L'équipement se place **en suffixe**, comme on le dit en français :

| Nom d'origine (`name`) | `nomFr` |
|---|---|
| Dumbbell Bench Press | Développé couché aux haltères |
| Barbell Deadlift | Soulevé de terre à la barre |
| Cable Triceps Pushdown | Pushdown triceps à la poulie |
| Lever Leg Extension | Leg extension à la machine |
| Assisted Pull-up | Traction assistée |

**Un seul test** tient le fichier : chaque id de `source.json` a une entrée, non vide, et
`noms-fr.json` ne porte aucun id inconnu. Un nom manquant fait échouer la CI ; un nom *maladroit*
se corrige à l'usage — et reste trouvable entre-temps par son nom anglais (D44).

## 4. Le schéma

`Exercise` gagne deux colonnes :

```prisma
name         String  // nom ANGLAIS du dataset, conservé pour la recherche
nomFr        String  // nom français, affiché
nomRecherche String  // normaliserRecherche(nomFr + " " + name). Rempli au semis.
@@index([nomRecherche])
```

**Aucune extension PostgreSQL n'est requise** — pas de `unaccent` à activer sur chaque branche
Neon, et un comportement identique en local, en CI et sur Neon. La recherche est un `contains` ;
sur 1 318 lignes, le parcours est instantané et l'index n'est qu'une assurance.

`bodyPart` **reste l'enum anglaise** (`CHEST`, `BACK`, `UPPER_LEGS`…) : elle sert aux filtres, aux
index et aux URL. Le français vient d'une table `Record<Groupe, string>` dans `shared` —
TypeScript refuse de compiler si une valeur n'a pas de libellé.

`equipment`, `target` et `secondary` stockent **le français** : ce sont des étiquettes
d'affichage, sans usage de recherche qui justifierait de garder l'anglais.

`gifUrl` stocke l'**URL complète**, figée sur un commit du dataset (§ 6).

## 5. La recherche

```ts
// packages/shared/src/recherche.ts
export function normaliserRecherche(s: string): string;
```

Dépouille les diacritiques (`NFD` puis retrait de `\p{Diacritic}`), met en minuscules, détoure.

**La même fonction sert à l'écriture et à la lecture.** Le semis la passe sur `nomFr + " " + name`
pour remplir `nomRecherche` ; la requête la passe sur la saisie avant de comparer. Elle vit dans
`shared` et nulle part ailleurs, et elle est écrite en TDD : accents, casse, espaces autour,
apostrophes, idempotence.

## 6. Les animations

Le dataset fournit un GIF 180×180 par exercice. **Ils ne sont pas sous MIT** : ils appartiennent à
Gym visual et sont redistribués par l'auteur du dataset avec une permission écrite qui ne nous est
pas transmise (« cloning this repo is not a license »).

**Choix assumé le 24 septembre** : better-lift est une application privée à trois comptes, sans
public ni monétisation. On affiche donc les animations comme opengym, **sans rien héberger** :

- le semis compose l'URL `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efa…/videos/…gif`,
  **figée sur un commit** pour qu'un renommage en amont ne casse rien ;
- **aucun fichier média n'entre dans le dépôt** ;
- la fiche affiche l'animation en 180×180 au plus, avec la mention **« © Gym visual —
  https://gymvisual.com/ »** sous le visuel ;
- si le chargement échoue, la fiche retombe sur l'affichage sans visuel qui existe déjà.

Si l'application devait un jour s'ouvrir, cette décision serait la première à reprendre.

## 7. L'API et le branchement

Deux routes, `services/` portant la logique et ne connaissant jamais le contexte Hono :

- **liste** — recherche (`q`), filtres (`groupe`, `equipement`), pagination. La recherche compare
  `nomRecherche` à la saisie normalisée.
- **détail par slug** — le slug est stable et lisible, et c'est lui qui vit dans l'URL du web.
  Il dérive du **nom anglais**, qui ne bouge pas quand on corrige un nom français.

**`packages/api-client` est extrait ici** (D42) : le client RPC quitte `apps/web/src/lib/api.ts`
pour le paquet, et les deux surfaces l'importent.

Les écrans du lot 2 troquent `EXERCICES` factice contre `useQuery`. Les quatre états restent
atteignables par `?etat=` et **cessent d'être des simulations**. La fiche affiche `nomFr` en titre
et `name` en sous-titre discret — c'est aussi ce qui explique à l'utilisateur pourquoi « bench »
a trouvé « Développé couché ».

**Le piège des clés de cache** : toute donnée présente dans la clé de lecture doit l'être dans la
clé d'écriture. Une recherche ou un filtre absent de la clé fait afficher les résultats précédents.

## 8. La coupe en deux PR

| PR | Contenu | Se relit en lisant |
|---|---|---|
| **1** | `normaliserRecherche`, vocabulaires, extrait vendorisé, `noms-fr.json`, migration, semis | du français |
| **2** | Contrat, service, routes, `api-client`, branchement des écrans, animations | du TypeScript |

`normaliserRecherche` est en PR 1 : le semis en a besoin pour remplir `nomRecherche`.

## 9. Tests

**En TDD :**

- `normaliserRecherche` — accents, casse, espaces, apostrophes, idempotence.
- Les libellés des vocabulaires fixes — exhaustivité tenue par le typage pour `bodyPart`, par un
  test pour les trois autres.

**Tests de données** (fichiers, jamais la base — la CI n'en a pas) : invariants de `source.json`
(compte, unicité, propreté) et complétude de `noms-fr.json`.

**Côté API :** une recherche sans accents trouve l'exercice accentué, et une recherche en anglais
le trouve aussi. C'est le critère de sortie réduit à deux assertions.

**Vérifié en exécutant :** les écrans branchés, leurs quatre états devenus réels, la recherche
tapée à la main, et une animation qui s'affiche avec son attribution.

## 10. Pièges connus de ce lot

- **Le semis doit être rejouable** : `upsert` sur le slug, jamais `create`.
- **Les 1 318 lignes en une transaction** sont lentes sur Neon depuis Francfort : semer par lots.
- **La branche Neon visée** : `dev`, jamais `production`. Le `.env` n'est pas lisible par
  l'agent — vérifier l'endpoint par l'API Neon avant toute migration.
- **Turborepo filtre l'environnement** : toute variable nouvelle se déclare dans `turbo.json`.
- **`noms-fr.json` ne se reformate pas** : Biome l'ignore, comme `source.json`, pour que son diff
  ne montre que des noms.

## 11. Hors périmètre

- **L'hébergement des médias** — on pointe vers l'amont (§ 6).
- **La recherche floue** — la normalisation des accents couvre le cas fréquent.
- **Les exercices personnalisés** — hors du premier jalon.
- **Les routines et les séances côté serveur** — lots 5 et 6.
