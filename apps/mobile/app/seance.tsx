import {
  ajouterExercice,
  ajouterSerie,
  ajusterRepos,
  arreterRepos,
  avecPrecedents,
  defaireSuperset,
  delierExercice,
  groupes,
  lierExercices,
  marquerReposSignale,
  modifierNote,
  modifierReposExercice,
  modifierSerie,
  partReposRestante,
  peutLierAuSuivant,
  prochaineSerie,
  remplacerExercice,
  reposRestant,
  retirerExercice,
  retirerSerie,
  roleRepos,
  type SeanceEnCours,
  validerSerie,
} from "@better-lift/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useKeepAwake } from "expo-keep-awake";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus, Trash2, Unlink2 } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { BandeauRepos } from "@/components/seance/bandeau-repos";
import { CarteExercice } from "@/components/seance/carte-exercice";
import { EnTeteSeance } from "@/components/seance/en-tete-seance";
import { RepereSuperset } from "@/components/seance/repere-superset";
import { Button } from "@/components/ui/button";
import { Ecran } from "@/components/ui/ecran";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { attendreChoix } from "@/lib/choix-exercices";
import { useConfirmer, useFeuille } from "@/lib/confirmation";
import { chargerPrecedents, optionsPreferences } from "@/lib/requetes";
import { useSeance } from "@/lib/seance";
import { useMaintenant } from "@/lib/temps";
import { vibrer } from "@/lib/vibrations";

// Le brouillon est sur le disque : un plantage de l'écran ne perd rien.
export { EcranErreurSeance as ErrorBoundary } from "@/components/ui/ecran-erreur";

/** La hauteur d'une ligne de série, et la place que prend le bandeau de repos en bas. */
const HAUTEUR_LIGNE = 52;
const RESERVE_BANDEAU = 110;

export default function Seance() {
  const router = useRouter();
  const client = useQueryClient();
  const { pret, seance, modifier, abandonner: effacerSeance, recharger } = useSeance();
  const maintenant = useMaintenant();
  const defilement = useRef<ScrollView>(null);
  // Les positions des blocs et de leurs lignes, pour suivre la prochaine série.
  const positions = useRef<{ blocs: number[]; lignes: Record<string, number> }>({
    blocs: [],
    lignes: {},
  });
  // Le repos du compte, pour l'exercice qui n'a pas le sien (D128) ; en cache hors ligne.
  const reposDefaut = useQuery(optionsPreferences()).data?.reposDefautSec ?? null;
  // Où en est le défilement, et la hauteur visible : de quoi savoir si la
  // prochaine série est à l'écran après une coche.
  const defilementY = useRef(0);
  const hauteurVue = useRef(0);
  // L'écran s'ouvre sur la prochaine série (D336), une fois, dès qu'elle est mesurée.
  const arrive = useRef(false);
  const confirmer = useConfirmer();
  const feuille = useFeuille();
  // L'écran reste allumé tant que la séance est affichée (D79) : le téléphone
  // posé sur le banc ne doit pas se verrouiller entre deux séries.
  useKeepAwake();

  // Toute écriture part de la séance DU MOMENT, pas de celle du dernier rendu :
  // la fin d'une saisie (clavier fermé) et la coche qui l'a fermé arrivent dans
  // la même frame, et la seconde écraserait la première. Les choix de la modale
  // reviennent aussi après une attente (les précédents).
  const courante = useRef<SeanceEnCours | null>(seance);
  courante.current = seance;
  const changer = (f: (s: SeanceEnCours) => SeanceEnCours) => {
    const s = courante.current;
    if (!s) return;
    const apres = f(s);
    courante.current = apres;
    modifier(apres);
    return apres;
  };

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

  if (!pret) return <Ecran className="flex-1 bg-background" />;

  if (!seance) {
    return (
      <Ecran className="flex-1 items-center justify-center gap-4 bg-background">
        <Text className="text-muted-foreground">Aucune séance en cours.</Text>
        <Button variant="outline" onPress={() => router.replace("/")}>
          <Text>Retour</Text>
        </Button>
      </Ecran>
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
      changer((s) =>
        avecPrecedents(
          choix.reduce((acc, c) => ajouterExercice(acc, c.slug, c.nom), s),
          precedents,
        ),
      );
    });
    router.push("/choisir-exercices");
  };

  const remplacer = (iE: number) => {
    attendreChoix(async ([c]) => {
      if (!c) return;
      const precedents = await chargerPrecedents(client, [c.slug]);
      changer((s) => avecPrecedents(remplacerExercice(s, iE, c.slug, c.nom), precedents));
    });
    router.push("/choisir-exercices?mode=remplacer");
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

  // À l'ouverture, l'écran se place sur la prochaine série (D336) : la séance
  // reprise depuis l'accueil ou au démarrage ne repart pas du premier exercice.
  // Appelé à chaque mesure, il attend la position du bloc ET de la ligne.
  const arriver = () => {
    if (arrive.current) return;
    const p = prochaineSerie(seance);
    if (!p) {
      arrive.current = true;
      return;
    }
    const bloc = positions.current.blocs[p.iE];
    const ligne = positions.current.lignes[`${p.iE}-${p.iS}`];
    if (bloc === undefined || ligne === undefined || !hauteurVue.current) return;
    arrive.current = true;
    defilement.current?.scrollTo({
      y: Math.max(0, bloc + ligne - hauteurVue.current * 0.3),
      animated: false,
    });
  };

  const vide = seance.exercices.length === 0;
  const prochaine = prochaineSerie(seance);
  const blocs = groupes(seance.exercices);
  // Replier la séance (D108) : retour à l'accueil, où le bandeau la garde à un
  // geste (D107). Ouverte sans historique (reprise de l'app), on y va directement.
  const replier = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <Ecran className="flex-1 bg-background">
      <EnTeteSeance
        seance={seance}
        maintenant={maintenant}
        onReplier={replier}
        onTerminer={() => router.push("/fin")}
      />

      <ScrollView
        ref={defilement}
        // De la marge en bas : le bandeau de repos ne cache jamais la dernière série.
        contentContainerClassName="px-3 pt-3 pb-48"
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          defilementY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        onLayout={(e) => {
          hauteurVue.current = e.nativeEvent.layout.height;
          arriver();
        }}
      >
        {vide ? (
          <Text className="py-6 text-center text-muted-foreground">
            Ajoute un premier exercice pour commencer.
          </Text>
        ) : null}
        {seance.exercices.map((e, iE) => {
          const g = blocs.find((b) => b.debut <= iE && iE <= b.fin) ?? null;
          return (
            <View
              key={`${e.slug}-${iE}`}
              onLayout={(ev) => {
                positions.current.blocs[iE] = ev.nativeEvent.layout.y;
                arriver();
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
                        onPress: () => changer((s) => defaireSuperset(s, iE)),
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
                  onLier={() => changer((s) => lierExercices(s, iE))}
                  onDelier={() => changer((s) => delierExercice(s, iE))}
                  exercice={e}
                  onPositionLigne={(iS, y) => {
                    positions.current.lignes[`${iE}-${iS}`] = y;
                    arriver();
                  }}
                  prochaine={prochaine?.iE === iE ? prochaine.iS : null}
                  onModifierSerie={(iS, patch) => changer((s) => modifierSerie(s, iE, iS, patch))}
                  onValiderSerie={(iS) => {
                    const deja = courante.current?.exercices[iE]?.series[iS]?.faite;
                    const apres = changer((s) => validerSerie(s, iE, iS, new Date(), reposDefaut));
                    if (apres && !deja) suivre(apres);
                  }}
                  onAjouterSerie={() => changer((s) => ajouterSerie(s, iE))}
                  onRetirerSerie={(iS) => changer((s) => retirerSerie(s, iE, iS))}
                  onNote={(note) => changer((s) => modifierNote(s, iE, note))}
                  onRepos={(sec) => changer((s) => modifierReposExercice(s, iE, sec))}
                  onReorganiser={() => router.push("/reorganiser")}
                  onOuvrir={() =>
                    router.push({ pathname: "/exercice/[slug]", params: { slug: e.slug } })
                  }
                  onRemplacer={() => remplacer(iE)}
                  onRetirer={() => changer((s) => retirerExercice(s, iE))}
                />
              </RepereSuperset>
            </View>
          );
        })}
        <View className="gap-2">
          {/* Sans exercice, il n'y a pas de ✓ : ajouter devient l'action pleine (D105). */}
          <Button variant={vide ? "default" : "secondary"} className="h-12" onPress={ajouter}>
            <Icon
              as={Plus}
              className={vide ? "size-5 text-primary-foreground" : "size-5 text-foreground"}
            />
            <Text>Ajouter un exercice</Text>
          </Button>
          {/* Visible sans crier (D335) : un contour à la couleur du danger, la
              confirmation derrière. */}
          <Button variant="outline" className="h-12 border-destructive" onPress={abandonner}>
            <Icon as={Trash2} className="size-4 text-destructive" />
            <Text className="text-destructive">Abandonner la séance</Text>
          </Button>
        </View>
      </ScrollView>

      {repos !== null ? (
        <BandeauRepos
          restant={repos}
          part={partReposRestante(seance, maintenant)}
          onPasser={() => changer(arreterRepos)}
          onAjuster={(delta) => {
            vibrer.selection();
            changer((s) => ajusterRepos(s, delta, new Date()));
          }}
        />
      ) : null}
    </Ecran>
  );
}
