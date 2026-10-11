import {
  formaterCharge,
  LIBELLE_RECORD,
  LIBELLE_ZONE,
  type Periode,
  type RecordRecent,
  type StatsPeriode,
  type Totaux,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarteMuscles } from "../../components/routines/carte-muscles";
import { Calendrier } from "../../components/stats/calendrier";
import { TesExercices } from "../../components/stats/tes-exercices";
import { Appuyable } from "../../components/ui/appuyable";
import { BadgeRecord, formaterSerie } from "../../components/ui/badge-record";
import { Chargement, Erreur, Vide } from "../../components/ui/etats";
import { Section } from "../../components/ui/section";
import { Segments } from "../../components/ui/segments";
import { Tuile } from "../../components/ui/tuile";
import { FUSEAU } from "../../lib/fuseau";
import { optionsPreferences, optionsStatsPeriode } from "../../lib/requetes";
import { affiche, CIBLE, creerStyles, espace, rayon, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";

const CALCUL = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: FUSEAU,
});

const PERIODES = [
  { valeur: "semaine", libelle: "Semaine" },
  { valeur: "mois", libelle: "Mois" },
  { valeur: "trimestre", libelle: "3 mois" },
  { valeur: "annee", libelle: "Année" },
] as const;

/** Ce que couvre la période, dit tel quel : des semaines glissantes, pas des mois civils. */
const ETENDUE: Record<Periode, string> = {
  semaine: "Cette semaine, comparée à la précédente",
  mois: "4 dernières semaines, comparées aux 4 d'avant",
  trimestre: "13 dernières semaines, comparées aux 13 d'avant",
  annee: "52 dernières semaines, comparées aux 52 d'avant",
};

/**
 * Progrès (D173, remplace les Stats) : une période pilote la page, en trois
 * blocs — la régularité (calendrier, D126), les records, tes exercices et leur
 * 1RM. Le reste (chiffres comparés, muscles, volume) se déplie sous « Détail de
 * la période » : sept blocs sans priorité, c'était trop. Calculé par l'API.
 */
export default function Progres() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const [periode, setPeriode] = useState<Periode>("mois");
  const [detail, setDetail] = useState(false);
  const stats = useQuery(optionsStatsPeriode(periode));
  const objectif = useQuery(optionsPreferences()).data?.objectifHebdo ?? null;

  const etat =
    stats.isPending && stats.fetchStatus === "paused" ? (
      <Vide titre="Hors ligne" message="Les stats se calculeront au retour du réseau." />
    ) : stats.isPending ? (
      <Chargement />
    ) : stats.isError && !stats.data ? (
      <Erreur message="Les stats n'ont pas pu se calculer." onReessayer={() => stats.refetch()} />
    ) : stats.data.nbSeances < 2 ? (
      <Vide
        titre="Encore un peu de patience."
        message="Les courbes apparaissent après deux séances. Tes records, dès la première."
      />
    ) : null;

  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <View style={styles.entete}>
        <Text style={styles.titre} accessibilityRole="header">
          Progrès
        </Text>
        <Segments options={PERIODES} valeur={periode} onChange={setPeriode} />
        <Text style={styles.etendue}>{ETENDUE[periode]}</Text>
      </View>
      {etat ??
        (stats.data ? (
          <ScrollView
            contentContainerStyle={styles.contenu}
            refreshControl={
              <RefreshControl
                refreshing={stats.isRefetching}
                onRefresh={() => stats.refetch()}
                tintColor={couleurs.encreTertiaire}
              />
            }
          >
            <View style={styles.carte}>
              <Calendrier stats={stats.data} objectif={objectif} />
            </View>
            <Records records={stats.data.records} />
            <TesExercices periode={periode} />
            <Appuyable
              onPress={() => setDetail(!detail)}
              style={styles.deplier}
              accessibilityRole="button"
              accessibilityState={{ expanded: detail }}
            >
              <Text style={styles.deplierTexte}>Détail de la période</Text>
              {detail ? (
                <ChevronDown size={20} color={couleurs.encreTertiaire} />
              ) : (
                <ChevronRight size={20} color={couleurs.encreTertiaire} />
              )}
            </Appuyable>
            {detail ? (
              <>
                <Chiffres totaux={stats.data.totaux} precedents={stats.data.precedents} />
                <Muscles stats={stats.data} />
                <Volume stats={stats.data} />
              </>
            ) : null}
            {/* Hors ligne, l'écran montre la dernière lecture : sa date le dit (D112). */}
            <Text style={styles.legende}>Calculées le {CALCUL.format(stats.dataUpdatedAt)}</Text>
          </ScrollView>
        ) : null)}
    </SafeAreaView>
  );
}

/** « ↗ +4 », « ↘ −12 % », « = » : l'écart avec la période d'avant. */
function ecart(valeur: number, avant: number, enPourcent: boolean): string {
  if (valeur === avant) return "= période d'avant";
  if (avant === 0) return "rien avant";
  const d = valeur - avant;
  const texte = enPourcent ? `${Math.round((Math.abs(d) / avant) * 100)} %` : String(Math.abs(d));
  return `${d > 0 ? "↗ +" : "↘ −"}${texte}`;
}

function Chiffres({ totaux, precedents }: { totaux: Totaux; precedents: Totaux }) {
  const styles = useStyles();
  const heures = Math.floor(totaux.dureeMin / 60);
  const duree =
    heures > 0
      ? `${heures} h ${String(totaux.dureeMin % 60).padStart(2, "0")}`
      : `${totaux.dureeMin} min`;
  return (
    <View style={[styles.carte, styles.chiffres]}>
      <Tuile
        libelle="Séances"
        valeur={String(totaux.seances)}
        detail={ecart(totaux.seances, precedents.seances, false)}
      />
      <Tuile
        libelle="Séries"
        valeur={String(totaux.series)}
        detail={ecart(totaux.series, precedents.series, true)}
      />
      <Tuile
        libelle="Durée"
        valeur={duree}
        detail={ecart(totaux.dureeMin, precedents.dureeMin, true)}
      />
    </View>
  );
}

/** La carte du corps, puis les séries par zone en barres : comparer se lit mieux en longueur. */
function Muscles({ stats }: { stats: StatsPeriode }) {
  const styles = useStyles();
  if (stats.muscles.length === 0) return null;
  const max = Math.max(1, ...stats.zones.map((z) => z.series));
  return (
    <>
      {/* La carte du corps a son propre cadre : elle ne s'emboîte pas dans une autre. */}
      <CarteMuscles exercices={stats.muscles} titre="Muscles travaillés" />
      <View style={[styles.carte, styles.zones]}>
        <Section titre="Séries par muscle" />
        {stats.zones.slice(0, 6).map((z) => (
          <View
            key={z.zone}
            style={styles.zone}
            accessible
            accessibilityLabel={`${LIBELLE_ZONE[z.zone]} : ${z.series} séries`}
          >
            <Text style={styles.zoneNom} numberOfLines={1}>
              {LIBELLE_ZONE[z.zone]}
            </Text>
            <View style={styles.piste}>
              <View style={[styles.remplie, { width: `${(z.series / max) * 100}%` }]} />
            </View>
            <Text style={styles.zoneValeur}>{z.series}</Text>
          </View>
        ))}
        <Text style={styles.legende}>Séries faites, échauffement exclu</Text>
      </View>
    </>
  );
}

/** Le volume de la période, puis une barre par semaine : la semaine en cours en encre. */
function Volume({ stats }: { stats: StatsPeriode }) {
  const styles = useStyles();
  const total = stats.volumes.reduce((n, v) => n + v.volumeKg, 0);
  const max = Math.max(1, ...stats.volumes.map((v) => v.volumeKg));
  return (
    <View style={styles.carte}>
      <Section titre="Volume" />
      <Text style={styles.volume}>{formaterCharge(total, SYSTEME_UNITES)}</Text>
      {/* Une seule semaine : son total suffit, une barre seule ne compare rien. */}
      {stats.volumes.length > 1 ? (
        <View
          style={[styles.barres, { gap: stats.volumes.length > 13 ? 1 : espace.xs }]}
          accessible
          accessibilityLabel={`Volume par semaine : ${stats.volumes
            .map((v) => formaterCharge(v.volumeKg, SYSTEME_UNITES))
            .join(", ")}`}
        >
          {stats.volumes.map((v, i) => (
            <View key={v.lundi} style={styles.colonne}>
              <View
                style={[
                  styles.barre,
                  i === stats.volumes.length - 1 && styles.barreEnCours,
                  // Une semaine vide garde un trait : l'absence se voit.
                  { height: `${Math.max(3, (v.volumeKg / max) * 100)}%` },
                ]}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Les trois derniers records ; les autres se déplient. */
function Records({ records }: { records: RecordRecent[] }) {
  const styles = useStyles();
  const [tous, setTous] = useState(false);
  const visibles = tous ? records : records.slice(0, 3);
  return (
    <View style={styles.carte}>
      <Section titre={`Records · ${records.length}`} />
      {records.length === 0 ? (
        <Text style={styles.legende}>Aucun record sur la période.</Text>
      ) : (
        visibles.map((r) => (
          <View key={`${r.slug}-${r.date}`} style={styles.record}>
            <View style={styles.recordGauche}>
              <Text style={styles.recordNom} numberOfLines={2}>
                {r.nom}
              </Text>
              <BadgeRecord libelle={r.types.map((t) => LIBELLE_RECORD[t]).join(" · ")} />
            </View>
            <Text style={styles.recordValeur}>{formaterSerie(r.chargeKg, r.reps)}</Text>
          </View>
        ))
      )}
      {records.length > 3 ? (
        <Appuyable onPress={() => setTous(!tous)} style={styles.plus} accessibilityRole="button">
          <Text style={styles.plusTexte}>
            {tous ? "Moins de records" : `Tous les records (${records.length})`}
          </Text>
        </Appuyable>
      ) : null}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  deplier: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: espace.l,
    borderRadius: rayon.carte,
    backgroundColor: couleurs.surface1,
  },
  deplierTexte: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  plus: { minHeight: CIBLE, justifyContent: "center" },
  plusTexte: { color: couleurs.encre, fontSize: taille.petit + 1, fontWeight: "600" },
  entete: {
    paddingHorizontal: espace.l,
    paddingTop: espace.l,
    paddingBottom: espace.m,
    gap: espace.m,
  },
  titre: { ...affiche, color: couleurs.encre, fontSize: taille.titre },
  etendue: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  contenu: { paddingHorizontal: espace.l, paddingBottom: espace.xxl, gap: espace.m },
  carte: {
    gap: espace.s,
    padding: espace.l,
    borderRadius: rayon.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  chiffres: { flexDirection: "row", gap: espace.m },
  zones: { gap: espace.s },
  zone: { flexDirection: "row", alignItems: "center", gap: espace.s },
  zoneNom: { width: 96, color: couleurs.encreSecondaire, fontSize: taille.petit },
  piste: { flex: 1, height: 8, borderRadius: 4, backgroundColor: couleurs.surface2 },
  remplie: { height: 8, borderRadius: 4, backgroundColor: couleurs.encreSecondaire },
  zoneValeur: {
    width: 28,
    textAlign: "right",
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    fontVariant: ["tabular-nums"],
  },
  volume: {
    ...affiche,
    color: couleurs.encre,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
  },
  barres: { height: 96, flexDirection: "row", alignItems: "flex-end" },
  colonne: { flex: 1, height: "100%", justifyContent: "flex-end" },
  barre: { borderRadius: 3, backgroundColor: couleurs.surface3 },
  barreEnCours: { backgroundColor: couleurs.encre },
  legende: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  record: {
    minHeight: CIBLE + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  recordGauche: { flex: 1, gap: espace.xs, paddingVertical: espace.s },
  recordNom: { color: couleurs.encre, fontSize: 15, fontWeight: "600" },
  recordValeur: {
    color: couleurs.encre,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
}));
