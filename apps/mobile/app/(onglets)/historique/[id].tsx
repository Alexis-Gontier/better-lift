import {
  ABREGE_TYPE_SERIE,
  type Ecart,
  ecartSerie,
  formaterCharge,
  formatJour,
  LIBELLE_RECORD,
  type TypeSerie,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Ellipsis, RotateCcw, Trash2 } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appuyable } from "../../../components/ui/appuyable";
import { BadgeRecord, formaterSerie } from "../../../components/ui/badge-record";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur, Vide } from "../../../components/ui/etats";
import { Vignette } from "../../../components/ui/vignette";
import { useConfirmer, useFeuille } from "../../../lib/confirmation";
import { useDemarrer } from "../../../lib/demarrer";
import { FUSEAU } from "../../../lib/fuseau";
import { optionsSeance, useSupprimerSeance } from "../../../lib/requetes";
import { useSeance } from "../../../lib/seance";
import { dureeMin } from "../../../lib/temps";
import { CIBLE, creerStyles, espace, taille, useCouleurs } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

/** Comme en séance (D92) : les normales se numérotent entre elles, les autres portent leur lettre. */
function etiquettes(series: readonly { type: TypeSerie }[]): string[] {
  let n = 0;
  return series.map((s) => (s.type === "NORMALE" ? String(++n) : ABREGE_TYPE_SERIE[s.type]));
}

/** « +2,5 kg », « −1 rep », « = » : ce qui a changé depuis la fois précédente (D123). */
function texteEcart(e: Ecart): string {
  if (e.genre === "egal") return "=";
  const signe = (n: number) => (n > 0 ? "+" : "−");
  if (e.genre === "charge") {
    return `${signe(e.deltaKg)}${formaterCharge(Math.abs(e.deltaKg), SYSTEME_UNITES)}`;
  }
  return `${signe(e.delta)}${Math.abs(e.delta)} rep${Math.abs(e.delta) > 1 ? "s" : ""}`;
}

/**
 * Une séance passée, comme une page du carnet : chaque exercice, ses séries
 * dans l'ordre, et le badge des records qu'elles ont battus à ce moment-là
 * (D64), et l'écart de chacune avec la même série de la fois précédente (D123).
 * « ⋯ » : refaire la routine, supprimer la séance. L'historique n'est pas gardé
 * sur le téléphone (D96) : hors ligne, la page attend le réseau.
 */
export default function DetailSeance() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const seance = useQuery(optionsSeance(id));
  const feuille = useFeuille();
  const confirmer = useConfirmer();
  const supprimer = useSupprimerSeance();
  const { routine: refaire } = useDemarrer();
  const { seance: enCours } = useSeance();

  if (!seance.data) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {seance.isPending && seance.fetchStatus === "paused" ? (
          <Vide titre="Hors ligne" message="Cette séance s'affichera au retour du réseau." />
        ) : seance.isPending ? (
          <Chargement />
        ) : (
          <Erreur
            message="Cette séance n'a pas pu être chargée."
            onReessayer={() => seance.refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const s = seance.data;
  const libelles = s.exercices.map((ex) => etiquettes(ex.series));
  const menu = () =>
    feuille({
      titre: s.nom,
      options: [
        // Refaire relance la routine d'origine ; pas pendant une séance (§ 8).
        ...(s.routineId && !enCours
          ? [
              {
                libelle: "Refaire cette routine",
                icone: RotateCcw,
                onPress: () => void refaire(s.routineId as string),
              },
            ]
          : []),
        {
          libelle: "Supprimer la séance",
          icone: Trash2,
          danger: true,
          onPress: () =>
            confirmer({
              titre: "Supprimer la séance ?",
              message: "Elle disparaîtra de l'historique, des stats et des records.",
              action: "Supprimer la séance",
              icone: Trash2,
              onConfirmer: () => supprimer.mutate(s.id, { onSuccess: () => router.back() }),
            }),
        },
      ],
    });
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour
        titre=""
        action={
          <Appuyable
            onPress={menu}
            style={styles.menu}
            accessibilityRole="button"
            accessibilityLabel="Options de la séance"
          >
            <Ellipsis size={22} color={couleurs.encreSecondaire} />
          </Appuyable>
        }
      />
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.tete}>
          <Text style={styles.nom}>{s.nom}</Text>
          <Text style={styles.date}>{formatJour(s.debut, FUSEAU)}</Text>
        </View>
        <View style={styles.bilan}>
          <Chiffre valeur={`${dureeMin(s)} min`} libelle="durée" />
          <Chiffre valeur={formaterCharge(s.volumeKg, SYSTEME_UNITES)} libelle="volume" />
          <Chiffre
            valeur={String(s.seriesFaites)}
            libelle={s.seriesFaites > 1 ? "séries" : "série"}
          />
        </View>

        {s.exercices.map((ex, iE) => (
          <View key={`${ex.slug}-${iE}`} style={styles.exercice}>
            {/* La fiche porte les records de l'exercice (D95). */}
            <Appuyable
              onPress={() => router.push(`/exercices/${ex.slug}`)}
              style={styles.titreExercice}
              accessibilityRole="link"
              accessibilityHint="Ouvre la fiche de l'exercice"
            >
              <Vignette image={ex.image} taille={40} />
              <Text style={styles.nomExercice} numberOfLines={2}>
                {ex.nom}
              </Text>
              <ChevronRight size={20} color={couleurs.encreTertiaire} />
            </Appuyable>
            {/* La note prise en séance (D90). */}
            {ex.note ? <Text style={styles.note}>{ex.note}</Text> : null}
            {ex.series.map((serie, i) => (
              <View
                key={`${ex.slug}-${iE}-${i}`}
                // Une série non faite reste visible — c'était prévu, pas fait —
                // mais s'efface derrière celles qui comptent.
                style={[styles.serie, !serie.faite && styles.nonFaite]}
              >
                <Text style={styles.numero}>{libelles[iE]?.[i]}</Text>
                <Text style={styles.valeur}>{formaterSerie(serie.chargeKg, serie.reps)}</Text>
                {serie.records.length > 0 ? (
                  <BadgeRecord libelle={serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")} />
                ) : null}
                <Ecarte ecart={ecartSerie(serie, ex.precedentes[i])} />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Ecarte({ ecart }: { ecart: Ecart | null }) {
  const styles = useStyles();
  return ecart ? <Text style={styles.ecart}>{texteEcart(ecart)}</Text> : null;
}

function Chiffre({ valeur, libelle }: { valeur: string; libelle: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chiffre}>
      <Text style={styles.chiffreValeur}>{valeur}</Text>
      <Text style={styles.chiffreLibelle}>{libelle}</Text>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { padding: espace.l, gap: espace.l, paddingBottom: espace.xxl * 2 },
  tete: { gap: espace.xs },
  nom: { color: couleurs.encre, fontSize: 30, lineHeight: 34, fontWeight: "700" },
  date: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  bilan: {
    flexDirection: "row",
    paddingVertical: espace.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: couleurs.ligne,
  },
  chiffre: { flex: 1, gap: 2 },
  chiffreValeur: {
    color: couleurs.encre,
    fontSize: taille.grand,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chiffreLibelle: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  exercice: { gap: 2 },
  titreExercice: {
    minHeight: CIBLE,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.s,
  },
  nomExercice: { flex: 1, color: couleurs.encre, fontSize: 17, fontWeight: "700" },
  note: { color: couleurs.encreTertiaire, fontSize: taille.petit + 1, marginBottom: espace.xs },
  serie: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: espace.m,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  nonFaite: { opacity: 0.45 },
  ecart: {
    minWidth: 56,
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  menu: { width: CIBLE, height: CIBLE, alignItems: "center", justifyContent: "center" },
  numero: {
    width: 20,
    color: couleurs.encreAttenuee,
    fontSize: taille.petit,
    fontWeight: "600",
    textAlign: "center",
  },
  valeur: {
    flex: 1,
    color: couleurs.encre,
    fontSize: taille.courant,
    fontVariant: ["tabular-nums"],
  },
}));
