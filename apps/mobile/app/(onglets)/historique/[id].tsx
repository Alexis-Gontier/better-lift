import { formaterCharge, formatJour, LIBELLE_RECORD } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BadgeRecord, formaterSerie } from "../../../components/ui/badge-record";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur } from "../../../components/ui/etats";
import { FUSEAU } from "../../../lib/fuseau";
import { optionsSeance } from "../../../lib/requetes";
import { dureeMin } from "../../../lib/temps";
import { creerStyles, espace, taille } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

export default function DetailSeance() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const seance = useQuery(optionsSeance(id));

  if (seance.isPending || seance.isError) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        {seance.isPending ? (
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
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour titre={s.nom} />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.sous}>
          {formatJour(s.debut, FUSEAU)} · {dureeMin(s)} min · {s.seriesFaites}{" "}
          {s.seriesFaites > 1 ? "séries" : "série"} · {formaterCharge(s.volumeKg, SYSTEME_UNITES)}
        </Text>
        {s.exercices.map((ex, iE) => (
          <View key={`${ex.slug}-${iE}`} style={styles.carte}>
            <View style={styles.titre}>
              {/* La fiche porte les records de l'exercice (D95). */}
              <Pressable
                onPress={() => router.push(`/exercices/${ex.slug}`)}
                accessibilityRole="link"
                hitSlop={6}
              >
                <Text style={styles.exercice}>{ex.nom}</Text>
              </Pressable>
              {/* La note prise en séance (D90). */}
              {ex.note ? <Text style={styles.note}>{ex.note}</Text> : null}
            </View>
            {ex.series.map((serie, i) => (
              <View
                key={`${ex.slug}-${iE}-${i}`}
                // Une série non faite reste visible — c'était prévu, pas fait —
                // mais s'efface derrière celles qui comptent.
                style={[styles.serie, !serie.faite && styles.nonFaite]}
              >
                <Text style={styles.numero}>{i + 1}</Text>
                <Text style={styles.valeur}>
                  {formaterSerie(serie.chargeKg, serie.reps)}
                  {serie.type === "ECHAUFFEMENT" ? (
                    <Text style={styles.echauffement}> échauffement</Text>
                  ) : null}
                </Text>
                {serie.records.length > 0 ? (
                  <BadgeRecord libelle={serie.records.map((r) => LIBELLE_RECORD[r]).join(" · ")} />
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ecran: { flex: 1, backgroundColor: couleurs.canevas },
  contenu: { padding: espace.l, gap: espace.m, paddingBottom: espace.xl * 2 },
  sous: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
    overflow: "hidden",
  },
  titre: {
    padding: espace.m,
    gap: espace.xs,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
  },
  exercice: { color: couleurs.encre, fontSize: taille.courant, fontWeight: "600" },
  note: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  serie: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: espace.s,
    paddingHorizontal: espace.m,
    paddingVertical: 10,
  },
  nonFaite: { opacity: 0.45 },
  numero: { width: 18, color: couleurs.encreAttenuee, fontSize: taille.petit },
  valeur: {
    flex: 1,
    color: couleurs.encreSecondaire,
    fontSize: taille.courant,
    fontVariant: ["tabular-nums"],
  },
  echauffement: { color: couleurs.encreAttenuee, fontSize: taille.petit },
}));
