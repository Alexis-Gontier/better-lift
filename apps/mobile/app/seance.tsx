import {
  ajouterExercice,
  ajouterSerie,
  ajusterRepos,
  ajusterSurPave,
  arreterRepos,
  avecPrecedents,
  bilanSeance,
  type ChampPave,
  chargeEnTexte,
  defaireSuperset,
  delierExercice,
  effacerSurPave,
  formaterCharge,
  formatHeure,
  groupes,
  lierExercices,
  lireCharge,
  lireReps,
  marquerReposSignale,
  modifierNote,
  modifierReposExercice,
  modifierSerie,
  peutLierAuSuivant,
  prochaineSerie,
  remplacerExercice,
  reposRestant,
  retirerExercice,
  retirerSerie,
  roleRepos,
  type SeanceEnCours,
  secondesEcoulees,
  toucherPave,
  validerSerie,
} from "@better-lift/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useKeepAwake } from "expo-keep-awake";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronDown, Plus, Trash2, Unlink2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BandeauRepos } from "../components/seance/bandeau-repos";
import { CarteExercice, etiquettes } from "../components/seance/carte-exercice";
import { PaveNumerique } from "../components/seance/pave-numerique";
import { Appuyable } from "../components/ui/appuyable";
import { RepereSuperset } from "../components/ui/repere-superset";
import { attendreChoix } from "../lib/choix-exercices";
import { useConfirmer, useFeuille } from "../lib/confirmation";
import { FUSEAU } from "../lib/fuseau";
import { chargerPrecedents, optionsPreferences } from "../lib/requetes";
import { useSeance } from "../lib/seance";
import { formaterDuree, useMaintenant } from "../lib/temps";
import { CIBLE, creerStyles, espace, polices, rayon, taille, useCouleurs } from "../lib/theme";
import { SYSTEME_UNITES } from "../lib/unites";
import { vibrer } from "../lib/vibrations";

// Le brouillon est sur le disque : un plantage de l'écran ne perd rien.
export { EcranErreurSeance as ErrorBoundary } from "../components/ui/ecran-erreur";

/** La hauteur d'une ligne de série, et la place que prend le bandeau de repos en bas. */
const HAUTEUR_LIGNE = 52;
const RESERVE_BANDEAU = 140;

/** La case en cours de saisie au pavé (D109) : l'écran tient le texte tapé. */
type Edition = { iE: number; iS: number; champ: ChampPave; texte: string; neuf: boolean };

/** Le texte tapé, lu en valeur ; `NaN` signale une saisie à corriger. */
function valeurDe(e: Edition): number | null {
  return e.champ === "charge" ? lireCharge(e.texte, SYSTEME_UNITES) : lireReps(e.texte);
}

/**
 * La saisie écrite dans la séance — inchangée si elle est invalide, ou si
 * aucune touche n'a été frappée : ouvrir puis fermer le pavé ne fait pas d'une
 * cible une valeur saisie.
 */
function appliquer(s: SeanceEnCours, e: Edition): SeanceEnCours {
  if (e.neuf) return s;
  const v = valeurDe(e);
  if (Number.isNaN(v)) return s;
  return modifierSerie(s, e.iE, e.iS, e.champ === "charge" ? { chargeKg: v } : { reps: v });
}

function Chiffre({ libelle, valeur }: { libelle: string; valeur: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chiffre}>
      <Text style={styles.chiffreLibelle}>{libelle}</Text>
      <Text style={styles.chiffreValeur}>{valeur}</Text>
    </View>
  );
}

export default function Seance() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const client = useQueryClient();
  const { pret, seance, modifier, abandonner: effacerSeance, recharger } = useSeance();
  const maintenant = useMaintenant();
  const [edition, setEdition] = useState<Edition | null>(null);
  const defilement = useRef<ScrollView>(null);
  // Les positions des blocs et de leurs lignes, pour amener la ligne saisie
  // au-dessus du pavé.
  const positions = useRef<{ blocs: number[]; lignes: Record<string, number> }>({
    blocs: [],
    lignes: {},
  });
  const { height: hauteurEcran } = useWindowDimensions();
  // Le repos du compte, pour l'exercice qui n'a pas le sien (D128) ; en cache hors ligne.
  const reposDefaut = useQuery(optionsPreferences()).data?.reposDefautSec ?? null;
  // Où en est le défilement, et la hauteur visible : de quoi savoir si la
  // prochaine série est à l'écran après une coche.
  const defilementY = useRef(0);
  const hauteurVue = useRef(0);
  const confirmer = useConfirmer();
  const feuille = useFeuille();
  // L'écran reste allumé tant que la séance est affichée (D79) : le téléphone
  // posé sur le banc ne doit pas se verrouiller entre deux séries.
  useKeepAwake();

  // Les choix de la modale reviennent APRÈS une attente (les précédents) : ils
  // s'appliquent à la séance du moment, pas à celle de l'ouverture.
  const courante = useRef<SeanceEnCours | null>(seance);
  courante.current = seance;

  // L'écran RELIT le disque à chaque affichage (§ 8) : c'est le même chemin
  // après un démarrage, une reprise, ou un arrêt forcé de l'application.
  useFocusEffect(
    useCallback(() => {
      void recharger();
    }, [recharger]),
  );

  const repos = seance ? reposRestant(seance, maintenant) : null;

  // La fin du repos vibre UNE fois : `signale` est écrit dans le brouillon, donc
  // un redémarrage ne refait pas vibrer un repos déjà annoncé.
  useEffect(() => {
    if (seance?.repos && !seance.repos.signale && repos === 0) {
      vibrer.finRepos();
      modifier(marquerReposSignale(seance));
    }
  }, [repos, seance, modifier]);

  // Le retour d'Android ferme d'abord le pavé, comme une feuille, en gardant la
  // saisie : sans lui, il quittait la séance et perdait la valeur tapée.
  // `fermerPave` se lit au moment du retour, jamais figé à l'abonnement.
  const fermerPave = useRef<() => void>(() => {});
  const paveOuvert = edition !== null;
  useEffect(() => {
    if (!paveOuvert) return;
    const abonnement = BackHandler.addEventListener("hardwareBackPress", () => {
      fermerPave.current();
      return true;
    });
    return () => abonnement.remove();
  }, [paveOuvert]);

  if (!pret) return <SafeAreaView style={styles.ecran} />;

  if (!seance) {
    return (
      <SafeAreaView style={[styles.ecran, styles.centre]}>
        <Text style={styles.pale}>Aucune séance en cours.</Text>
        <Appuyable onPress={() => router.replace("/")} style={styles.secondaire}>
          <Text style={styles.secondaireTexte}>Retour</Text>
        </Appuyable>
      </SafeAreaView>
    );
  }

  const abandonner = () =>
    confirmer({
      titre: "Abandonner la séance ?",
      message: "Rien ne sera enregistré.",
      action: "Abandonner la séance",
      icone: Trash2,
      annuler: "Continuer la séance",
      onConfirmer: async () => {
        await effacerSeance();
        router.replace("/");
      },
    });

  // D93 : ajouter et remplacer passent par la modale du catalogue.
  const ajouter = () => {
    attendreChoix(async (choix) => {
      const precedents = await chargerPrecedents(
        client,
        choix.map((c) => c.slug),
      );
      const s = courante.current;
      if (!s) return;
      const avec = choix.reduce((acc, c) => ajouterExercice(acc, c.slug, c.nom), s);
      modifier(avecPrecedents(avec, precedents));
    });
    router.push("/choisir-exercices");
  };

  const remplacer = (iE: number) => {
    attendreChoix(async ([c]) => {
      if (!c) return;
      const precedents = await chargerPrecedents(client, [c.slug]);
      const s = courante.current;
      if (!s) return;
      modifier(avecPrecedents(remplacerExercice(s, iE, c.slug, c.nom), precedents));
    });
    router.push("/choisir-exercices?mode=remplacer");
  };

  // --- Le pavé (D109) ----------------------------------------------------------
  const ouvrir = (iE: number, iS: number, champ: ChampPave) => {
    const s = edition ? appliquer(seance, edition) : seance;
    if (edition) modifier(s);
    const serie = s.exercices[iE]?.series[iS];
    if (!serie) return;
    const valeur = champ === "charge" ? serie.chargeKg : serie.reps;
    setEdition({
      iE,
      iS,
      champ,
      texte:
        valeur === null
          ? ""
          : champ === "charge"
            ? chargeEnTexte(valeur, SYSTEME_UNITES)
            : String(valeur),
      // La première touche remplace la valeur affichée.
      neuf: true,
    });
    // La ligne passe dans le quart haut de l'écran : le pavé occupe le bas.
    const y = (positions.current.blocs[iE] ?? 0) + (positions.current.lignes[`${iE}-${iS}`] ?? 0);
    defilement.current?.scrollTo({ y: Math.max(0, y - hauteurEcran * 0.25), animated: true });
  };
  const fermer = () => {
    if (edition) modifier(appliquer(seance, edition));
    setEdition(null);
  };
  fermerPave.current = fermer;
  const suivant = () => {
    if (!edition) return;
    modifier(appliquer(seance, edition));
    const serie = seance.exercices[edition.iE]?.series[edition.iS];
    setEdition({
      ...edition,
      champ: "reps",
      texte: serie?.reps == null ? "" : String(serie.reps),
      neuf: true,
    });
  };
  const validerDepuisPave = () => {
    if (!edition) return;
    const s = appliquer(seance, edition);
    const deja = s.exercices[edition.iE]?.series[edition.iS]?.faite;
    if (!deja) vibrer.valider();
    const apres = deja ? s : validerSerie(s, edition.iE, edition.iS, new Date(), reposDefaut);
    modifier(apres);
    setEdition(null);
    if (!deja) suivre(apres);
  };

  // Après une coche, la prochaine série reste sous les yeux : si elle est hors
  // de l'écran ou sous le bandeau de repos qui vient de s'ouvrir, on y défile.
  // Sinon, rien ne bouge — un écran qui saute à chaque coche se perd.
  const suivre = (s: SeanceEnCours) => {
    const p = prochaineSerie(s);
    if (!p) return;
    const y =
      (positions.current.blocs[p.iE] ?? 0) + (positions.current.lignes[`${p.iE}-${p.iS}`] ?? 0);
    const haut = defilementY.current;
    const bas = haut + hauteurVue.current - RESERVE_BANDEAU;
    if (y >= haut && y + HAUTEUR_LIGNE <= bas) return;
    defilement.current?.scrollTo({ y: Math.max(0, y - hauteurVue.current * 0.3), animated: true });
  };

  const bilan = bilanSeance(seance);
  const totalSeries = seance.exercices.reduce((n, e) => n + e.series.length, 0);
  const vide = seance.exercices.length === 0;
  const prochaine = prochaineSerie(seance);
  const blocs = groupes(seance.exercices);
  // Replier la séance (D108) : retour aux onglets, où le bandeau la garde à un
  // geste (D107). Ouverte sans historique (reprise de l'app), on y va directement.
  const replier = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView style={styles.ecran}>
      <View style={styles.entete}>
        <View style={styles.titreLigne}>
          <Appuyable
            onPress={replier}
            hitSlop={8}
            style={styles.replier}
            accessibilityRole="button"
            accessibilityLabel="Replier la séance"
          >
            <ChevronDown size={24} color={couleurs.encreSecondaire} />
          </Appuyable>
          <View style={styles.titre}>
            <Text style={styles.nom} numberOfLines={1} accessibilityRole="header">
              {seance.nom}
            </Text>
            <Text style={styles.sous}>Démarrée à {formatHeure(seance.debut, FUSEAU)}</Text>
          </View>
          {/* Secondaire (D105) : terminer n'est pas l'action courante d'une séance. */}
          <Appuyable
            onPress={() => router.push("/fin")}
            hitSlop={4}
            style={({ pressed }) => [styles.terminer, pressed && styles.appuye]}
            accessibilityRole="button"
          >
            <Text style={styles.terminerTexte}>Terminer</Text>
          </Appuyable>
        </View>
        <View style={styles.chiffres}>
          {/* Le libellé porte la valeur : seul, « Durée » la remplaçait à la lecture. */}
          <Text
            style={styles.chrono}
            accessibilityLabel={`Durée ${formaterDuree(secondesEcoulees(seance.debut, maintenant))}`}
          >
            {formaterDuree(secondesEcoulees(seance.debut, maintenant))}
          </Text>
          <Chiffre libelle="Volume" valeur={formaterCharge(bilan.volumeKg, SYSTEME_UNITES)} />
          {/* La progression, pas un simple compte : « 3 / 16 ». */}
          <Chiffre libelle="Séries" valeur={`${bilan.seriesFaites} / ${totalSeries}`} />
        </View>
      </View>

      {/* De la marge en bas : le bandeau de repos ne doit jamais cacher la dernière série. */}
      <ScrollView
        ref={defilement}
        // Assez de place sous la dernière série pour la remonter au-dessus du pavé.
        contentContainerStyle={{ paddingBottom: edition ? hauteurEcran * 0.6 : 200 }}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          defilementY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        onLayout={(e) => {
          hauteurVue.current = e.nativeEvent.layout.height;
        }}
      >
        {seance.exercices.length === 0 ? (
          <Text style={styles.vide}>Ajoute un premier exercice pour commencer.</Text>
        ) : null}
        {seance.exercices.map((e, iE) => {
          const g = blocs.find((b) => b.debut <= iE && iE <= b.fin) ?? null;
          return (
            <View
              key={`${e.slug}-${iE}`}
              onLayout={(ev) => {
                positions.current.blocs[iE] = ev.nativeEvent.layout.y;
              }}
            >
              <RepereSuperset
                groupe={g}
                index={iE}
                onEtiquette={() =>
                  feuille({
                    titre: `Superset ${g?.lettre ?? ""}`,
                    options: [
                      {
                        libelle: "Défaire le superset",
                        icone: Unlink2,
                        onPress: () => modifier(defaireSuperset(seance, iE)),
                      },
                    ],
                  })
                }
              >
                <CarteExercice
                  repos={roleRepos(seance.exercices, iE)}
                  peutLier={peutLierAuSuivant(seance.exercices, iE)}
                  dernier={iE === seance.exercices.length - 1}
                  dansGroupe={g !== null}
                  onLier={() => modifier(lierExercices(seance, iE))}
                  onDelier={() => modifier(delierExercice(seance, iE))}
                  exercice={e}
                  edition={
                    edition?.iE === iE
                      ? {
                          iS: edition.iS,
                          champ: edition.champ,
                          texte: edition.texte,
                          invalide: Number.isNaN(valeurDe(edition)),
                        }
                      : null
                  }
                  onEditer={(iS, champ) => ouvrir(iE, iS, champ)}
                  onPositionLigne={(iS, y) => {
                    positions.current.lignes[`${iE}-${iS}`] = y;
                  }}
                  prochaine={prochaine?.iE === iE ? prochaine.iS : null}
                  onModifierSerie={(iS, patch) => modifier(modifierSerie(seance, iE, iS, patch))}
                  onValiderSerie={(iS) => {
                    const deja = seance.exercices[iE]?.series[iS]?.faite;
                    const apres = validerSerie(seance, iE, iS, new Date(), reposDefaut);
                    modifier(apres);
                    if (!deja) suivre(apres);
                  }}
                  onAjouterSerie={() => modifier(ajouterSerie(seance, iE))}
                  onRetirerSerie={(iS) => modifier(retirerSerie(seance, iE, iS))}
                  onNote={(note) => modifier(modifierNote(seance, iE, note))}
                  onRepos={(sec) => modifier(modifierReposExercice(seance, iE, sec))}
                  onReorganiser={() => router.push("/reorganiser")}
                  onRemplacer={() => remplacer(iE)}
                  onRetirer={() => modifier(retirerExercice(seance, iE))}
                />
              </RepereSuperset>
            </View>
          );
        })}
        <View style={styles.pied}>
          {/* Sans exercice, il n'y a pas de ✓ : ajouter devient l'aplat de l'écran (D105). */}
          <Appuyable
            onPress={ajouter}
            style={[styles.ajouter, vide && styles.ajouterAplat]}
            accessibilityRole="button"
          >
            <Plus size={18} color={vide ? couleurs.surAction : couleurs.encre} strokeWidth={2.4} />
            <Text style={[styles.ajouterTexte, vide && styles.ajouterTexteAplat]}>
              Ajouter un exercice
            </Text>
          </Appuyable>
          <Appuyable onPress={abandonner} style={styles.abandon} accessibilityRole="button">
            <Text style={styles.abandonTexte}>Abandonner la séance</Text>
          </Appuyable>
        </View>
      </ScrollView>

      {edition ? (
        <PaveNumerique
          champ={edition.champ}
          serie={
            etiquettes(seance.exercices[edition.iE]?.series ?? [])[edition.iS] ??
            String(edition.iS + 1)
          }
          texte={edition.texte}
          invalide={Number.isNaN(valeurDe(edition))}
          onTouche={(t) =>
            setEdition({ ...edition, texte: toucherPave(edition.texte, t, edition), neuf: false })
          }
          onEffacer={() =>
            setEdition({
              ...edition,
              texte: effacerSurPave(edition.neuf ? "" : edition.texte),
              neuf: false,
            })
          }
          onAjuster={(pas) =>
            setEdition({ ...edition, texte: ajusterSurPave(edition.texte, pas), neuf: false })
          }
          onSuivant={suivant}
          onValider={validerDepuisPave}
          onFermer={fermer}
        />
      ) : repos !== null ? (
        <BandeauRepos
          restant={repos}
          onPasser={() => modifier(arreterRepos(seance))}
          onAjuster={(delta) => {
            vibrer.selection();
            modifier(ajusterRepos(seance, delta, new Date()));
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  centre: { alignItems: "center", justifyContent: "center", gap: espace.l },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.courant },
  entete: {
    paddingHorizontal: espace.l,
    paddingTop: espace.s,
    paddingBottom: espace.m,
    gap: espace.s,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  titreLigne: { flexDirection: "row", alignItems: "center", gap: espace.s },
  replier: {
    width: 40,
    height: 40,
    marginLeft: -espace.s,
    alignItems: "center",
    justifyContent: "center",
  },
  titre: { flex: 1 },
  nom: { color: couleurs.encre, fontSize: taille.grand, fontWeight: "700" },
  sous: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  terminer: {
    minHeight: 40,
    paddingHorizontal: espace.l,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    justifyContent: "center",
  },
  appuye: { backgroundColor: couleurs.surface2 },
  terminerTexte: { color: couleurs.encre, fontSize: 15, fontWeight: "700" },
  chiffres: { flexDirection: "row", alignItems: "flex-end", gap: espace.xl },
  // Le chiffre héros de l'écran (D103) : lisible téléphone posé sur le banc.
  chrono: {
    color: couleurs.encre,
    fontSize: taille.chrono,
    lineHeight: taille.chrono,
    fontFamily: polices.condense,
    fontVariant: ["tabular-nums"],
  },
  chiffre: { gap: 1, paddingBottom: 4 },
  chiffreLibelle: {
    color: couleurs.encreAttenuee,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chiffreValeur: {
    color: couleurs.encre,
    fontSize: taille.valeur,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  vide: {
    color: couleurs.encreTertiaire,
    fontSize: taille.courant,
    textAlign: "center",
    paddingVertical: espace.xl,
  },
  pied: { padding: espace.m, gap: espace.s },
  ajouter: {
    minHeight: CIBLE,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.surface3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espace.s,
  },
  ajouterTexte: { color: couleurs.encre, fontSize: 15, fontWeight: "600" },
  ajouterAplat: { minHeight: CIBLE + 8, backgroundColor: couleurs.action },
  ajouterTexteAplat: { color: couleurs.surAction, fontWeight: "700" },
  secondaire: {
    minHeight: CIBLE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espace.l,
  },
  secondaireTexte: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  abandon: { minHeight: CIBLE, alignItems: "center", justifyContent: "center" },
  abandonTexte: { color: couleurs.dangerEncre, fontSize: 15 },
}));
