import { courbeUnRm, formaterCharge, type HistoriqueExercice } from "@better-lift/shared";
import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { creerStyles, espace, taille, useCouleurs } from "../../lib/theme";
import { SYSTEME_UNITES } from "../../lib/unites";
import { Section } from "../ui/section";

const HAUTEUR = 96;

/**
 * La progression d'un exercice (D124) : le dernier 1RM estimé, son écart avec
 * le premier point, et la courbe séance par séance. Le dernier point est en
 * lime quand il est le plus haut : c'est un record (D28).
 */
export function Progression({ seances }: { seances: HistoriqueExercice }) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const [largeur, setLargeur] = useState(0);
  const points = courbeUnRm(seances);
  const dernier = points.at(-1);
  if (!dernier) return null;

  const premier = points[0]?.valeur ?? dernier.valeur;
  const ecart = Math.round((dernier.valeur - premier) * 10) / 10;
  const min = Math.min(...points.map((p) => p.valeur));
  const max = Math.max(...points.map((p) => p.valeur));
  const etendue = Math.max(1, max - min);
  const marge = 6;
  const xy = points.map((p, i) => ({
    x:
      points.length === 1 ? largeur / 2 : marge + (i / (points.length - 1)) * (largeur - 2 * marge),
    y: marge + (1 - (p.valeur - min) / etendue) * (HAUTEUR - 2 * marge),
  }));
  const fin = xy.at(-1);
  const record = dernier.valeur === max && points.length > 1;

  return (
    <View style={styles.bloc}>
      <Section titre="1RM estimé" />
      <View style={styles.ligne}>
        <Text style={styles.valeur}>{formaterCharge(dernier.valeur, SYSTEME_UNITES)}</Text>
        {points.length > 1 ? (
          <Text style={styles.ecart}>
            {ecart === 0
              ? "stable"
              : `${ecart > 0 ? "↗ +" : "↘ −"}${formaterCharge(Math.abs(ecart), SYSTEME_UNITES)}`}{" "}
            en {points.length} séances
          </Text>
        ) : null}
      </View>
      <View
        style={{ height: HAUTEUR }}
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`Courbe du 1RM estimé sur ${points.length} séances, de ${formaterCharge(premier, SYSTEME_UNITES)} à ${formaterCharge(dernier.valeur, SYSTEME_UNITES)}`}
      >
        {largeur > 0 ? (
          <Svg width={largeur} height={HAUTEUR}>
            <Polyline
              points={xy.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={couleurs.encreSecondaire}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {fin ? (
              <Circle
                cx={fin.x}
                cy={fin.y}
                r={4.5}
                fill={record ? couleurs.recordEncre : couleurs.encre}
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  bloc: { gap: espace.s },
  ligne: { flexDirection: "row", alignItems: "baseline", gap: espace.s, flexWrap: "wrap" },
  valeur: {
    color: couleurs.encre,
    fontSize: 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  ecart: { color: couleurs.encreSecondaire, fontSize: taille.petit + 1 },
}));
