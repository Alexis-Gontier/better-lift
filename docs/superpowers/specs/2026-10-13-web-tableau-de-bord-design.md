# Tableau de bord web, d'après les wireframes 2a — conception

> Date : 2026-10-13. Décisions D185–D191. Source : wireframes Claude Design « better-lift —
> wireframes du MVP », tour 2 (web en shadcn/ui, disposition **2a** recommandée).

## Point de départ

Le web a déjà l'essentiel de 2a (D132–D160) : Sidebar shadcn, palette ⌘K, Tableau de bord en
page d'arrivée avec période dans l'URL, tuiles comparées, objectif hebdomadaire (préférence
`objectifHebdo`), volume, muscles, records, calendrier de l'année. Ce chantier ne refait pas la
page : il reprend de 2a ce qui change ce qu'on lit, et laisse le reste.

**Repris** : comparaison au même moment, séries de travail et volume en tuiles, objectif réglé
depuis sa tuile, graphique sur douze semaines avec bascule volume / séries, muscles comparés à
une référence, records resserrés, dernières séances, palette qui ouvre les routines, navigation
dans le temps.

**Écarté de 2a, assumé** :
- Le calendrier du mois (`Calendar` shadcn) : le calendrier de l'année (D138) existe, se lit
  mieux et ne demande ni dépendance (`react-day-picker`) ni composant neuf. Il passe en bas de
  page, pleine largeur.
- La Sidebar repliable en icônes et les raccourcis de routines dans la barre : la palette les
  couvre (D191) ; la barre reste non repliable (D154).
- Le choix d'une date par `Popover` : ‹ › suffisent (D190).
- La phrase de synthèse de 2b.

## D185 — La période en cours se compare au même moment de la précédente

Aujourd'hui, la période en cours (partielle) se compare à la précédente **entière** : chaque
lundi, tout paraît en baisse. Désormais une séance de la période précédente ne compte que si
elle tombe au même rang de jour, ou avant : mardi soir se compare à mardi soir d'il y a une
période. Le grain est le jour civil, dans le fuseau. Une période passée (D190) se compare
entière à la précédente.

## D186 — Tuiles : Séances, Séries de travail, Volume, Objectif

- **Séries de travail** : les séries faites hors échauffement (la somme de `seriesComptees`),
  comme le volume (D5). Le champ `Totaux.series` change de sens ; seul le web le lit.
- **Volume** remplace **Durée** : la durée ne dit rien de la progression ; elle reste dans la
  liste des séances.
- **Objectif** : « 2 / 3 cette semaine », une barre, puis « tenu 7 des 11 dernières semaines »
  (`semainesTenues` sur les douze semaines du graphique). Le réglage se fait dans un `Dialog`
  ouvert depuis la tuile ; le Profil garde le sien.
- **Compte sans séance** : les tuiles restent en place avec « — », une seule carte d'accueil
  remplace le reste, avec « Créer une routine ».

## D187 — Le graphique couvre au moins douze semaines

`volumes` rend les `max(12, n)` dernières semaines, et plus seulement celles de la période :
une semaine seule faisait une barre. Chaque semaine porte `series` (de travail) et
`dansPeriode`. Les barres de la période sont en encre atténuée, les autres en filet (jamais la
couleur d'action). Une bascule **Volume · Séries** (`ToggleGroup`) change la mesure. En Année,
une barre par mois, comme avant.

## D188 — Les muscles se comparent à une référence

Chaque zone porte `reference` : la moyenne hebdomadaire de ses séries de travail sur les **huit
semaines** qui précèdent la période, multipliée par la longueur de la période, arrondie. Une
zone travaillée d'habitude et absente de la période apparaît, à zéro : c'est ce qu'on veut voir.
Huit semaines plutôt que huit périodes : en Année, huit ans n'auraient pas de sens.

## D189 — Records resserrés, dernières séances

- **Records de la période** : les quatre plus récents, en liste dans une carte étroite, chacun
  vers la fiche de l'exercice.
- **Dernières séances** : les cinq plus récentes, **indépendantes de la période**, en `Table`,
  chacune vers son détail. Requête à part (`["seances","liste"]`) : elle charge et échoue seule.
- Disposition (grille de 12) : tuiles 4 × 3 ; Volume 8 + Records 4 ; Muscles 7 + Dernières
  séances 5 ; Calendrier 12.

## D190 — Reculer dans le temps

‹ › à côté du sélecteur de période, avec l'intervalle affiché (« 12 – 18 oct. 2026 »).
`?decalage=n` dans l'URL (0 ou absent : la période en cours) ; changer de période le remet à 0 ;
› est désactivé à 0. L'API reçoit `decalage` et décale tout le calcul de `n × nbSemaines`
semaines ; les records sont bornés à la fin de la période. Le décalage est dans la clé de cache.

## D191 — La palette ouvre les routines

⌘K liste, en plus des pages, les routines (ouvrir l'éditeur) et une action « Nouvelle
routine ». Les exercices restent cherchés dans leur page : 1 300 entrées n'ont rien à faire dans
une liste chargée d'avance.

## Questions laissées ouvertes

- Période par défaut : reste **Mois** (D137). 2a proposait Semaine, ou la dernière choisie.
- Début de semaine : lundi, inchangé.
