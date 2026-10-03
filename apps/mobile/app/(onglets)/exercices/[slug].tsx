import {
  ATTRIBUTION_MEDIAS,
  formaterCharge,
  formatJour,
  LIBELLE_GROUPE,
  LIBELLE_RECORD,
} from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BadgeRecord, formaterSerie } from "../../../components/ui/badge-record";
import { EnteteRetour } from "../../../components/ui/entete-retour";
import { Chargement, Erreur } from "../../../components/ui/etats";
import { FUSEAU } from "../../../lib/fuseau";
import { optionsExercice, optionsRecords } from "../../../lib/requetes";
import { creerStyles, espace, taille } from "../../../lib/theme";
import { SYSTEME_UNITES } from "../../../lib/unites";

export default function FicheExercice() {
  const styles = useStyles();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const exercice = useQuery(optionsExercice(slug));
  const records = useQuery(optionsRecords(slug));

  if (exercice.isPending) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        <Chargement />
      </SafeAreaView>
    );
  }
  if (exercice.isError) {
    return (
      <SafeAreaView style={styles.ecran} edges={["top"]}>
        <EnteteRetour titre="" />
        <Erreur
          message="Cet exercice n'a pas pu être chargé."
          onReessayer={() => exercice.refetch()}
        />
      </SafeAreaView>
    );
  }

  const ex = exercice.data;
  return (
    <SafeAreaView style={styles.ecran} edges={["top"]}>
      <EnteteRetour titre={ex.nom} />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.sous}>
          {ex.nomAnglais} · {LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}
        </Text>

        {/* Le GIF est affiché depuis le dépôt du dataset, jamais copié (D46). */}
        {ex.gif ? (
          <View style={styles.media}>
            <Image
              source={{ uri: ex.gif }}
              style={styles.gif}
              contentFit="contain"
              cachePolicy="disk"
              accessibilityLabel={`Animation de l'exercice : ${ex.nom}`}
            />
            <Text style={styles.attribution}>{ATTRIBUTION_MEDIAS}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>Records</Text>
        {records.isPending ? (
          <Text style={styles.pale}>Chargement…</Text>
        ) : records.isError ? (
          <Text style={styles.pale}>Les records n'ont pas pu être chargés.</Text>
        ) : records.data.length === 0 ? (
          <Text style={styles.pale}>Aucun record pour l'instant.</Text>
        ) : (
          <View style={styles.carte}>
            {records.data.map((r, i) => (
              <View key={r.type} style={[styles.record, i > 0 && styles.separe]}>
                <Text style={styles.recordType}>{LIBELLE_RECORD[r.type]}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <BadgeRecord
                    libelle={
                      r.type === "UN_RM" || r.type === "VOLUME"
                        ? formaterCharge(r.valeur, SYSTEME_UNITES)
                        : formaterSerie(r.chargeKg, r.reps)
                    }
                  />
                  <Text style={styles.pale}>
                    {r.type === "UN_RM" || r.type === "VOLUME"
                      ? `${formaterSerie(r.chargeKg, r.reps)} · `
                      : ""}
                    {formatJour(r.date, FUSEAU)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.section}>Muscles</Text>
        <Text style={styles.texte}>
          {ex.cible}
          {ex.secondaires.length > 0 ? (
            <Text style={styles.pale}> · {ex.secondaires.join(", ")}</Text>
          ) : null}
        </Text>

        <Text style={styles.section}>Exécution</Text>
        {ex.instructions.map((etape, i) => (
          <View key={etape} style={styles.etape}>
            <Text style={styles.numero}>{i + 1}</Text>
            <Text style={[styles.texte, { flex: 1 }]}>{etape}</Text>
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
  // Fond blanc : les GIF du dataset sont dessinés sur blanc.
  media: { alignItems: "center", gap: espace.xs },
  gif: { width: 240, height: 240, borderRadius: 12, backgroundColor: "#ffffff" },
  attribution: { color: couleurs.encreAttenuee, fontSize: 11 },
  section: {
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    textTransform: "uppercase",
    marginTop: espace.s,
  },
  texte: { color: couleurs.encre, fontSize: taille.courant, lineHeight: 22 },
  pale: { color: couleurs.encreTertiaire, fontSize: taille.petit },
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface1,
  },
  record: { flexDirection: "row", alignItems: "center", gap: espace.m, padding: espace.m },
  separe: { borderTopWidth: 1, borderTopColor: couleurs.ligne },
  recordType: { width: 88, color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
  etape: { flexDirection: "row", gap: espace.s },
  numero: { width: 18, color: couleurs.encreAttenuee, fontSize: taille.petit, paddingTop: 3 },
}));
