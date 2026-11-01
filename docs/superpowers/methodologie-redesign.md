# Méthodologie du redesign (web et mobile) avec OpenPencil

Document de chantier (2026-11-01). À supprimer une fois le chantier fusionné, ses décisions
reportées dans `docs/decisions.md` (à partir de **D349**).

## Le point de départ, qui change tout

Le wireframe gris a été construit pour que la direction artistique ne touche que des valeurs
(`apps/mobile/global.css` : « on ne changera que ces valeurs » ; web : `@theme inline` de
`styles/globals.css`). C'est un **levier**, pas une limite : le redesign reste ouvert à tout —
nouvelles compositions, nouveaux parcours, nouvelles fonctionnalités. Il a trois chantiers, de
coûts différents, qui avancent en parallèle :

1. **La direction artistique** — couleurs par rôle, police, rayons, densité, profondeur. Quelques
   fichiers, aucun écran à réécrire.
2. **La recomposition d'écrans** — hiérarchie, disposition, navigation, nouveaux composants.
   Aucun écran n'est sacré : un écran peut fusionner, disparaître ou changer d'onglet.
3. **Les fonctionnalités nouvelles** — ce que l'app ne fait pas encore. Elles se dessinent dans
   le même `.fig` et avec la même direction, **avant** d'être codées.

L'ordre de livraison reste (1) puis (2) et (3) écran par écran : la direction posée d'abord
évite de redessiner deux fois les nouveaux écrans. Mais l'exploration de (2) et (3) commence dès
l'étape 2, et une feature peut renverser une direction (ex. un écran de progression riche pèse
sur le choix de la police des chiffres).

Rappel : `conception.md` dit que la DA vient **après l'épreuve du jalon** (un mois sans Hevy).
Ses retours sont la meilleure source de (2) et (3) : les noter d'abord.

## Ce qui ne bouge pas (contraintes du brief)

Tirées du registre ; elles vont telles quelles dans le brief.

- Une couleur pour l'action et le record, distinguées par la **forme** : action en aplat, record
  en contour (D28). Le danger a la sienne et ne porte rien d'autre (D36).
- Les types de série W ambre, F rose, D bleu sont la seule couleur porteuse de sens du web (D231
  et suivantes) ; un chiffre se distingue par sa taille, pas sa couleur.
- Un token par rôle, deux valeurs (sombre / clair), jamais de couleur en dur.
- Mobile : cible de 48, taille de texte du système suivie (sauf éléments denses de la séance),
  une main, entre deux séries, en sueur, lumière de salle. Web : grand écran, clavier.
- Stack : Reusables + Uniwind (mobile), shadcn Nova (web). La DA s'exprime **dans** ces systèmes,
  pas à côté (D228 : tout composant externe se fait valider).
- Le mobile d'une page qui a son pendant web se transpose du web.
- Déjà essayé et abandonné avec D316 : « Underground orange » + Barlow / Barlow Condensed
  (D161–D165). C'est une direction candidate gratuite, à remettre en lice plutôt qu'à oublier.

## L'outil : ce qu'OpenPencil fait bien, et ses limites ici

[OpenPencil](https://github.com/open-pencil/open-pencil) (MIT, l'alternative à Figma, pas
l'homonyme de ZSeven-W) : fichiers `.fig`, MCP déjà branché (`mcp__open-pencil__*`).

- **L'application de bureau doit être ouverte avec un document chargé**, sinon chaque appel
  échoue. Sous Windows, le MCP passe par TCP (port 7600).
- Dessin par **JSX** (`render`) en auto-layout, **variables** à modes (sombre / clair) liées aux
  calques (`bind_variable`), **composants à variantes**, et un outillage d'audit : `lint`,
  `analyze_colors`, `analyze_typography`, `analyze_spacing`, `analyze_clusters`, `diff_visual`,
  `export_image`.
- Les **polices doivent être installées sur la machine** avant de dessiner (sinon « unloaded
  font » et des mesures fausses).
- Son guide de génération de code (`get_codegen_prompt`) vise React DOM + Tailwind : utile au
  web, **inutile au mobile**. On ne génère pas le code depuis le dessin : on transpose à la main
  dans Reusables / shadcn, en reprenant les valeurs exactes.
- **Constaté le 2026-11-01 (OpenPencil 0.16)** : `export_image` répond « No visible nodes to
  export » sur tous les calques, même en appelant la CLI sur le fichier enregistré. On vérifie
  donc à l'œil dans l'app. Les images ne passent pas par le contexte de l'agent :
  `openpencil tool call set_image_fill --args-file …` depuis un script, l'app restant ouverte.
  `find_nodes` cherche une sous-chaîne : filtrer sur le nom exact.
- **Source de vérité** : pendant l'exploration, le `.fig` ; une fois une valeur validée, les
  fichiers CSS du dépôt. Le `.fig` les reflète (mêmes noms de rôles), il ne les commande pas.
  Proposition : `design/better-lift.fig` commité, une page par étape ci-dessous.

## Le déroulé, en sept étapes

Chaque étape s'arrête sur un **choix de l'utilisateur** ; rien n'avance sans.

### 1. Inventaire de l'existant

Captures de tous les écrans, dans leurs quatre états et les deux thèmes : web par
`CAPTURES=… pnpm --filter @better-lift/web e2e captures`, mobile par l'émulateur (argent).
Importées dans la page « 0 · Existant » du `.fig`, rangées par parcours (préparer, séance, fin,
relire). On y annote ce qui gêne, avec les retours de l'épreuve.

**Fait le 2026-11-01** : `design/existant/` (web : 17 pages × 2 thèmes, dont états vide,
chargement et erreur ; mobile : 10 écrans en clair, séance et fin comprises), posées dans
`design/better-lift.fig`. Premiers retours : tout plaît sauf **les records** (page web Records,
bloc Records de la page d'exercice mobile), et le **web** mérite d'être retravaillé. Épreuve
non finie, quelques séances faites. Le mobile sombre reste à capturer si besoin (thème = tokens).

### 2. Le brief (`docs/superpowers/brief-design.md`)

Une page, au format d'un [DESIGN.md](https://stitch.withgoogle.com/docs/design-md/specification) :
pour qui, où, la seule chose que chaque surface doit réussir, les contraintes ci-dessus, **trois
mots** de caractère (ex. « outil, sec, lisible à 1 m »), des références **hors fitness** (cadrans,
instruments, signalétique…) et une liste d'**anti-références** : dégradés violets, cartes dans
des cartes, ombres partout, verre dépoli, crème + terracotta, icônes décoratives, emojis.
C'est ce texte qui évite le rendu générique, pas l'outil.

### 3. Le carnet des pistes : recompositions et fonctionnalités

Page « 0 bis · Pistes » du `.fig` et une liste dans `docs/superpowers/pistes-redesign.md`. On y
verse tout, sans filtrer d'abord :

- les retours de l'épreuve et les annotations de l'inventaire ;
- les écarts déjà relevés sur Hevy, Strong, Flexify, Ironvellum et wger (audit du 2026-10-24) ;
- la liste « Hors périmètre pour l'instant » de `conception.md` (calcul des disques, mensurations,
  méthodes de progression, import Hevy…) : chacune se repose la question ;
- les idées neuves (les tiennes, et des propositions de l'agent à partir du brief).

Puis un **tri en une ligne par piste** : quel moment de la séance ou de la préparation elle
améliore, ce qu'elle coûte (écran, API, base, natif), si elle tient dans « deux ou trois comptes,
pas un SaaS ». Trois paniers : **dans ce redesign**, **plus tard**, **non**. Les « dans ce
redesign » sont dessinées comme les autres écrans (étape 6) ; chacune passe par la skill
`superpowers:brainstorming` avant son code et devient une décision. Une feature qui réclame un
nouvel onglet ou une nouvelle navigation remonte aux étapes 4–5, pas seulement à l'écran.

### 4. Trois directions, sur trois écrans témoins

Pas toute l'app : trois écrans qui couvrent les cas difficiles, dont **un écran de nouvelle
fonctionnalité** si une piste retenue en apporte un exigeant.

- **Mobile · séance en cours** (densité, chiffres, une main — le plus dur) ;
- **Mobile · Routines** (liste, action principale) ;
- **Web · Accueil** (tableau de bord, graphiques, grand écran).

Les directions peuvent aussi proposer une **autre structure** (navigation, ordre des blocs, ce
qui monte en premier) : c'est le bon moment pour comparer, avant que le système se fige.

Trois directions **franchement différentes** (dont D161 remise à jour), chacune dans les deux
thèmes, posées côte à côte sur la page « 1 · Directions ». Chaque direction = une collection de
variables + une police + rayons et densité, **les mêmes maquettes** n'en changeant que les
valeurs (c'est le test que la DA tient dans les tokens). On choisit, ou on croise.

### 5. Le système

Page « 2 · Système » : la direction retenue réduite à ses tokens (les rôles exacts de
`global.css` et `globals.css`, plus ceux qui manquent : record, séries W/F/D), une échelle de
texte, et les composants qui portent le caractère : bouton (aplat / contour / danger), carte,
ligne de série, badge de type, onglets, champ de charge. `lint` + `analyze_*` doivent être
propres ; contraste WCAG AA vérifié dans les deux thèmes.

**Livraison 1** (une PR) : les nouvelles valeurs dans les deux fichiers CSS + la police.
Captures avant / après de tous les écrans. Décisions D349+ (révise D316, D231).

### 6. Recomposer les écrans et dessiner les fonctionnalités

Les écrans que la livraison 1 laisse insatisfaisants, et les pistes retenues à l'étape 3. Par
écran : maquette avec du **contenu réel et difficile** (noms d'exercice longs, « 82,5 kg »,
12 séries, thème clair en plein soleil), ses quatre états, validation, puis une branche `feat/…`
et une PR par écran, parcours ou fonctionnalité. Une feature se dessine en **parcours** (écran
d'entrée, étapes, retour), pas en écran isolé. Ordre conseillé : séance → fin → Routines → web
Accueil → features retenues → le reste par transposition.

### 7. Vérifier contre la maquette

Capture de l'écran codé importée à côté de la maquette validée (ou `diff_visual`) ; les écarts
se corrigent dans le code, pas dans la maquette. Puis `/verif`.

## Prompts à coller

Une session par étape. Les skills à appeler : `impeccable` (forme le brief, critique),
`design-taste-frontend` (règles anti-générique, écrans d'application), `ui-ux-pro-max`
(palettes et couples de polices à comparer).

**Étape 2 — brief**

> Lis `docs/superpowers/methodologie-redesign.md`, `docs/conception.md`, les décisions D28, D36,
> D161–D165, D231, D316 et les retours de l'épreuve que je te donne ci-dessous. Avec la skill
> `impeccable`, pose-moi les questions qui manquent (une à la fois), puis écris
> `docs/superpowers/brief-design.md` au format DESIGN.md : public, contexte d'usage par surface,
> trois mots de caractère, contraintes non négociables, références hors fitness, anti-références.
> Pas de valeur de couleur ni de police à ce stade.

**Étape 3 — pistes**

> Lis le brief, `docs/conception.md` (dont « Hors périmètre »), l'inventaire annoté et les
> retours d'épreuve ci-dessous. Écris `docs/superpowers/pistes-redesign.md` : toutes les pistes
> de recomposition et de fonctionnalité, les miennes et une dizaine de propositions à toi tirées
> du brief et des apps concurrentes (Hevy, Strong, Flexify, Ironvellum, wger), chacune en une
> ligne : moment amélioré, coût (écran / API / base / natif), compatibilité avec « pas un
> SaaS ». Propose un tri en trois paniers (ce redesign / plus tard / non) que je corrige. Ne
> tranche rien à ma place.

**Étape 4 — directions** (OpenPencil ouvert sur `design/better-lift.fig`)

> Lis le brief et appelle `get_codegen_prompt` pour la syntaxe JSX d'OpenPencil. Propose trois
> directions artistiques franchement distinctes (dont une mise à jour d'« Underground orange »,
> D161), chacune en une phrase et en valeurs : palette par rôle (noms exacts de
> `apps/mobile/global.css`), police installée localement, rayons, densité. Je valide la liste
> avant que tu dessines. Ensuite, pour chacune : une collection de variables à deux modes, et les
> trois écrans témoins (séance mobile 412×915, Routines mobile, Accueil web 1440×900) dessinés
> avec `render`, couleurs **uniquement** par `designVar`, contenu réel. Exporte chaque écran en
> image, critique-les toi-même contre le brief et les anti-références, corrige, puis montre-moi
> les neuf images côte à côte. N'enregistre rien dans le dépôt.

**Étape 5 — système et livraison 1**

> Direction retenue : <…>. Dans la page « 2 · Système », réduis-la à ses tokens et à ses
> composants (liste de la méthodologie), passe `lint` et `analyze_colors/typography/spacing`,
> vérifie les contrastes AA. Puis, sur une branche `feat/direction-artistique`, reporte les
> valeurs dans `apps/mobile/global.css` et `apps/web/src/styles/globals.css`, la police sur les
> deux surfaces, écris D349+, et fais les captures avant / après de tous les écrans. `/verif`,
> PR ouverte, pas de fusion.

**Étape 6 — un écran ou une fonctionnalité**

> Écran ou fonctionnalité : <…>. Pour une fonctionnalité, passe d'abord par
> `superpowers:brainstorming` et dessine le parcours entier. Relis le brief, le système et les captures actuelles. Liste d'abord ce qui ne va
> pas (hiérarchie, densité, action principale, une main), propose deux compositions dans le
> `.fig` avec contenu difficile et ses quatre états, puis j'en choisis une. Ensuite seulement le
> code, valeurs reprises exactement de la maquette, comparaison côte à côte avant la PR.

## Sources

- [OpenPencil](https://github.com/open-pencil/open-pencil), [serveur MCP](https://openpencil.dev/programmable/mcp-server),
  [skill agent](https://github.com/open-pencil/open-pencil/blob/master/skills/open-pencil/SKILL.md)
- [Spécification DESIGN.md](https://www.dsebastien.net/design-md-specification/) (Google Labs, alpha)
- [Système de tokens d'abord pour agents](https://www.mindstudio.ai/blog/design-token-system-ai-agents-brand-visuals),
  [Agentic design system](https://josefrichter.design/blog/agentic-design-system)
- Anti-générique : [avoid-ai-design](https://github.com/funboy322/avoid-ai-design),
  [Escaping AI slop](https://www.candede.com/articles/escaping-ai-slop-in-web-design/),
  [Why my AI-generated UI looked generic](https://alexlavaee.me/blog/lessons-learned-designing-with-ai/)
- UX de salle : [HUD une main d'un logger open source](https://github.com/vvojtisek/workout-logger/pull/151),
  [analyse de Setgraph](https://screensdesign.com/showcase/setgraph-workout-training-log)
