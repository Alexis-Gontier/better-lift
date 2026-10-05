import {
  bilanSeance,
  formaterCharge,
  formatJour,
  LIBELLE_RECORD,
  recordsBattus,
  resumeSemaine,
  secondesEcoulees,
} from "@better-lift/shared";
import { onlineManager, useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ArrowUp, CircleDashed, CloudOff } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appuyable } from "../components/ui/appuyable";
import { BadgeRecord, formaterSerie } from "../components/ui/badge-record";
import { FUSEAU } from "../lib/fuseau";
import { optionsRecords, optionsSeances } from "../lib/requetes";
import { useSeance } from "../lib/seance";
import { dureeMin, formaterDuree } from "../lib/temps";
import { CIBLE, creerStyles, espace, polices, rayon, taille, useCouleurs } from "../lib/theme";
import { SYSTEME_UNITES } from "../lib/unites";
import { vibrer } from "../lib/vibrations";

/**
 * La fin de séance, la récompense d'abord (D130) : les records battus (sinon la
 * régularité), le bilan comparé à la dernière séance de la même routine, une
 * note, puis l'enregistrement. Une séance sans série validée ne s'enregistre
 * pas — elle se reprend.
 */
export default function Fin() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const router = useRouter();
  const { seance, terminer, modifier } = useSeance();
  // La durée est figée à l'ouverture de cet écran : c'est l'heure de fin.
  const [fin] = useState(() => new Date());
  // Un second appui pendant l'enregistrement mettrait la séance deux fois en file.
  const [enregistrement, setEnregistrement] = useState(false);
  const slugs = seance ? [...new Set(seance.exercices.map((e) => e.slug))] : [];
  // Les records d'avant : en cache hors ligne pour les exercices des routines (D96).
  const records = useQueries({ queries: slugs.map((slug) => optionsRecords(slug)) });
  const historique = useInfiniteQuery(optionsSeances());
  if (!seance) return null;

  const { seriesFaites, volumeKg } = bilanSeance(seance);
  const reprendre = () => router.back();

  if (seriesFaites === 0) {
    return (
      <SafeAreaView style={styles.ecran}>
        <View style={styles.contenu}>
          <Text style={styles.titre} accessibilityRole="header">
            Pas encore de série.
          </Text>
          <Text style={styles.texte}>Valide au moins une série pour enregistrer.</Text>
        </View>
        <View style={styles.pied}>
          <Appuyable
            style={({ pressed }) => [styles.secondaire, pressed && styles.appuye]}
            onPress={reprendre}
            accessibilityRole="button"
          >
            <Text style={styles.secondaireTexte}>Reprendre la séance</Text>
          </Appuyable>
        </View>
      </SafeAreaView>
    );
  }

  // Ce qui reste à valider : terminer ne doit pas se faire par mégarde au milieu
  // d'une séance, comme Hevy qui le signale avant d'enregistrer.
  const toutes = seance.exercices.flatMap((e) => e.series);
  const nonValidees = toutes.filter((x) => !x.faite).length;
  // D5 : l'échauffement ne compte pas dans le volume — l'écran le dit, sans quoi
  // « 1 série · 0 kg » ressemble à une erreur.
  const echauffementFait = toutes.some((x) => x.faite && x.type === "ECHAUFFEMENT");

  const avant = Object.fromEntries(slugs.map((slug, i) => [slug, records[i]?.data]));
  const { battus, incomplet } = recordsBattus(seance, avant);
  const chargement = records.some((r) => r.isPending && r.fetchStatus === "fetching");
  // La régularité, faute de record : cette séance comprise.
  const deLaSemaine = historique.data
    ? resumeSemaine(
        [...historique.data.pages.flatMap((p) => p.seances), { debut: seance.debut, volumeKg }],
        fin,
        FUSEAU,
      ).seances
    : null;
  const horsLigne = !onlineManager.isOnline();
  // La dernière séance de la même routine, dans le fil déjà chargé (D130) ; une
  // séance vide n'a rien à quoi se comparer.
  const precedente = seance.routineId
    ? historique.data?.pages.flatMap((p) => p.seances).find((x) => x.routineId === seance.routineId)
    : undefined;
  const minutes = Math.round(secondesEcoulees(seance.debut, fin) / 60);

  const enregistrer = async () => {
    if (enregistrement) return;
    setEnregistrement(true);
    vibrer.valider();
    // Sur disque dans la file AVANT de quitter l'écran : l'envoi se fait
    // ensuite, et se retentera tant qu'il n'aura pas abouti.
    await terminer();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre} accessibilityRole="header">
          Bien joué.
        </Text>
        <Text style={styles.sous}>
          {seance.nom} · {formatJour(seance.debut, FUSEAU)}
        </Text>

        {chargement ? null : battus.length > 0 ? (
          <View>
            {/* La récompense d'abord (D130) : le moment où l'app peut dire « tu progresses ». */}
            <View style={styles.vedette}>
              <View style={styles.medaille}>
                <ArrowUp size={22} strokeWidth={2.6} color={couleurs.recordEncre} />
                <Text style={styles.medailleTexte}>{battus.length}</Text>
              </View>
              <Text style={styles.vedetteTitre} accessibilityRole="header">
                {battus.length === 1 ? "1 record battu" : `${battus.length} records battus`}
              </Text>
            </View>
            {battus.map((b, i) => (
              <View key={`${b.slug}-${i}`} style={styles.record}>
                <View style={styles.recordGauche}>
                  <Text style={styles.recordNom} numberOfLines={2}>
                    {b.nom}
                  </Text>
                  <BadgeRecord libelle={b.types.map((t) => LIBELLE_RECORD[t]).join(" · ")} />
                </View>
                <Text style={styles.recordValeur}>{formaterSerie(b.chargeKg, b.reps)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.texte}>
            Pas de record aujourd'hui. La régularité compte plus
            {deLaSemaine
              ? ` : c'est ta ${deLaSemaine}${deLaSemaine === 1 ? "ʳᵉ" : "ᵉ"} séance de la semaine.`
              : "."}
          </Text>
        )}
        {incomplet && !chargement ? (
          <Text style={styles.note}>
            Les records des autres exercices se calculeront à l'envoi, dans l'historique.
          </Text>
        ) : null}

        <View style={styles.chiffres}>
          <Chiffre
            valeur={formaterDuree(secondesEcoulees(seance.debut, fin))}
            libelle="Durée"
            ecart={precedente ? ecart(minutes - dureeMin(precedente), (n) => `${n} min`) : null}
          />
          <Chiffre
            valeur={String(seriesFaites)}
            libelle="Séries"
            ecart={precedente ? ecart(seriesFaites - precedente.seriesFaites, String) : null}
          />
          <Chiffre
            valeur={formaterCharge(volumeKg, SYSTEME_UNITES)}
            libelle="Volume"
            ecart={
              precedente
                ? ecart(volumeKg - precedente.volumeKg, (n) => formaterCharge(n, SYSTEME_UNITES))
                : null
            }
          />
        </View>
        {precedente ? (
          <Text style={styles.note}>
            Écarts avec la dernière {seance.nom}, le {formatJour(precedente.debut, FUSEAU)}.
          </Text>
        ) : null}
        {echauffementFait ? (
          <Text style={styles.note}>L'échauffement ne compte pas dans le volume.</Text>
        ) : null}

        <TextInput
          value={seance.note ?? ""}
          onChangeText={(note) => modifier({ ...seance, note })}
          placeholder="Ajouter une note sur la séance…"
          placeholderTextColor={couleurs.encreAttenuee}
          style={styles.saisieNote}
          multiline
          maxLength={1000}
          accessibilityLabel="Note de la séance"
        />
      </ScrollView>

      <View style={styles.pied}>
        {nonValidees > 0 ? (
          <View style={styles.encart} accessibilityRole="alert">
            <CircleDashed size={18} color={couleurs.encreSecondaire} />
            <Text style={styles.encartTexte}>
              {nonValidees === 1
                ? "1 série non validée : elle ne comptera pas."
                : `${nonValidees} séries non validées : elles ne compteront pas.`}
            </Text>
          </View>
        ) : null}
        {horsLigne ? <HorsLigne /> : null}
        <Appuyable
          style={({ pressed }) => [styles.aplat, (pressed || enregistrement) && styles.aplatAppuye]}
          accessibilityRole="button"
          accessibilityState={{ disabled: enregistrement, busy: enregistrement }}
          disabled={enregistrement}
          onPress={() => void enregistrer()}
        >
          <Text style={styles.aplatTexte}>
            {enregistrement ? "Enregistrement…" : "Enregistrer la séance"}
          </Text>
        </Appuyable>
        <Appuyable style={styles.tertiaire} onPress={reprendre} accessibilityRole="button">
          <Text style={styles.tertiaireTexte}>Reprendre la séance</Text>
        </Appuyable>
      </View>
    </SafeAreaView>
  );
}

/** Hors ligne, un fait et pas une alerte : la séance part seule au retour du réseau (D99). */
function HorsLigne() {
  const styles = useStyles();
  const couleurs = useCouleurs();
  return (
    <View style={styles.horsLigne}>
      <CloudOff size={18} color={couleurs.encreSecondaire} />
      <Text style={styles.horsLigneTexte}>
        Pas de réseau. La séance reste sur ton téléphone et partira seule au retour du réseau.
      </Text>
    </View>
  );
}

/** « ↗ +115 kg », « ↘ −1 », « = » : l'écart avec la dernière séance de la routine (D130). */
function ecart(delta: number, unite: (n: number) => string): string {
  const arrondi = Math.round(delta * 10) / 10;
  return arrondi === 0 ? "=" : `${arrondi > 0 ? "↗ +" : "↘ −"}${unite(Math.abs(arrondi))}`;
}

function Chiffre({
  valeur,
  libelle,
  ecart,
}: {
  valeur: string;
  libelle: string;
  ecart?: string | null;
}) {
  const styles = useStyles();
  return (
    <View style={styles.chiffre}>
      <Text style={styles.valeur}>{valeur}</Text>
      <Text style={styles.libelle}>{libelle}</Text>
      {ecart ? <Text style={styles.ecartChiffre}>{ecart}</Text> : null}
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  vedette: { alignItems: "center", gap: espace.s, marginBottom: espace.s },
  // Le record est un contour (D28) : lime en texte sur fond teinté.
  medaille: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: couleurs.recordLigne,
    backgroundColor: couleurs.recordFond,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  medailleTexte: { color: couleurs.recordEncre, fontSize: 26, fontWeight: "800" },
  vedetteTitre: { color: couleurs.encre, fontSize: taille.grand + 2, fontWeight: "800" },
  ecartChiffre: {
    color: couleurs.encreSecondaire,
    fontSize: taille.petit,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  saisieNote: {
    minHeight: 72,
    padding: espace.m,
    borderRadius: rayon.cellule,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface2,
    color: couleurs.encre,
    fontSize: taille.courant,
    textAlignVertical: "top",
  },
  ecran: { flex: 1, backgroundColor: couleurs.canevas, justifyContent: "space-between" },
  contenu: { padding: espace.xl, paddingTop: espace.xxl * 2, gap: espace.s },
  // Un seul usage de cette taille : la fin de séance (D103).
  titre: { color: couleurs.encre, fontSize: 52, lineHeight: 56, fontWeight: "800" },
  sous: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  texte: { color: couleurs.encreSecondaire, fontSize: taille.courant, marginTop: espace.l },
  note: { color: couleurs.encreTertiaire, fontSize: taille.petit, marginTop: espace.s },
  chiffres: {
    flexDirection: "row",
    gap: espace.xl,
    marginTop: espace.xl,
    paddingVertical: espace.l,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: couleurs.ligne,
  },
  chiffre: { gap: 2 },
  valeur: {
    color: couleurs.encre,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: polices.condense,
    fontVariant: ["tabular-nums"],
  },
  libelle: {
    color: couleurs.encreAttenuee,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  section: {
    color: couleurs.encreAttenuee,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: espace.xl,
    marginBottom: espace.s,
  },
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
  pied: { padding: espace.xl, gap: espace.s },
  // Un fait à savoir avant d'enregistrer, pas une alerte : même encart que le hors ligne.
  encart: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    padding: espace.m,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
  },
  encartTexte: { flex: 1, color: couleurs.encreSecondaire, fontSize: 14 },
  horsLigne: {
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    padding: espace.m,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: couleurs.ligneForte,
  },
  horsLigneTexte: { flex: 1, color: couleurs.encreSecondaire, fontSize: 14 },
  aplat: {
    minHeight: CIBLE + 8,
    borderRadius: rayon.bouton,
    backgroundColor: couleurs.action,
    alignItems: "center",
    justifyContent: "center",
  },
  aplatAppuye: { opacity: 0.85 },
  aplatTexte: { color: couleurs.surAction, fontSize: taille.courant + 1, fontWeight: "700" },
  tertiaire: { minHeight: CIBLE, alignItems: "center", justifyContent: "center" },
  tertiaireTexte: { color: couleurs.encreSecondaire, fontSize: taille.courant },
  secondaire: {
    minHeight: CIBLE + 8,
    borderRadius: rayon.bouton,
    borderWidth: 1,
    borderColor: couleurs.ligneForte,
    alignItems: "center",
    justifyContent: "center",
  },
  appuye: { backgroundColor: couleurs.surface2 },
  secondaireTexte: { color: couleurs.encre, fontSize: taille.courant + 1, fontWeight: "700" },
}));
