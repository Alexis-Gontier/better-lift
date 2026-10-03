import type { LucideIcon } from "lucide-react-native";
import { Check } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { creerStyles, espace, taille, useCouleurs } from "../../lib/theme";

export type OptionFeuille = {
  libelle: string;
  icone?: LucideIcon;
  /** Le danger a sa couleur (D36) — jamais l'action ni le record. */
  danger?: boolean;
  /** Visible mais inerte, avec sa raison (« bientôt »). */
  inactive?: string;
  /** L'option en vigueur, cochée à droite. */
  choisie?: boolean;
  onPress?: () => void;
};

/**
 * Une feuille qui monte du bas (D89), à la Hevy : les actions rares d'un
 * élément, sous le pouce. Elle se ferme AVANT d'exécuter l'option : une
 * confirmation ouverte par l'option ne s'empile pas sur la feuille.
 */
export function Feuille({
  visible,
  titre,
  options,
  onFermer,
}: {
  visible: boolean;
  titre?: string;
  options: OptionFeuille[];
  onFermer: () => void;
}) {
  const styles = useStyles();
  const couleurs = useCouleurs();
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFermer}
    >
      <Pressable style={styles.voile} onPress={onFermer} accessibilityLabel="Fermer" />
      <View style={[styles.feuille, { paddingBottom: bottom + espace.s }]}>
        <View style={styles.poignee} />
        {titre ? (
          <Text style={styles.titre} numberOfLines={1}>
            {titre}
          </Text>
        ) : null}
        {options.map((o) => {
          const Icone = o.icone;
          const couleur = o.inactive
            ? couleurs.encreAttenuee
            : o.danger
              ? couleurs.dangerEncre
              : couleurs.encre;
          return (
            <Pressable
              key={o.libelle}
              disabled={Boolean(o.inactive)}
              onPress={() => {
                onFermer();
                o.onPress?.();
              }}
              style={({ pressed }) => [styles.option, pressed && styles.appuyee]}
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(o.inactive), selected: o.choisie }}
            >
              {Icone ? <Icone size={20} color={couleur} /> : null}
              <Text style={[styles.libelle, { color: couleur }]}>{o.libelle}</Text>
              {o.inactive ? <Text style={styles.indication}>{o.inactive}</Text> : null}
              {o.choisie ? <Check size={18} color={couleurs.encre} strokeWidth={2.6} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const useStyles = creerStyles((couleurs) => ({
  voile: { flex: 1, backgroundColor: couleurs.voile },
  feuille: {
    backgroundColor: couleurs.surface2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: espace.s,
    paddingTop: espace.s,
  },
  poignee: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligneForte,
    marginBottom: espace.s,
  },
  titre: {
    color: couleurs.encreTertiaire,
    fontSize: taille.petit,
    paddingHorizontal: espace.m,
    paddingVertical: espace.s,
  },
  option: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: espace.m,
    paddingHorizontal: espace.m,
    borderRadius: 10,
  },
  appuyee: { backgroundColor: couleurs.surface3 },
  libelle: { flex: 1, fontSize: taille.courant },
  indication: { color: couleurs.encreAttenuee, fontSize: taille.petit },
}));
