import {
  aEnvoyer,
  apresReponse,
  classerReponse,
  type ElementFile,
  mettreEnFile,
  type SeanceEnCours,
  versEnvoi,
} from "@better-lift/shared";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { api } from "./api";
import { useNotificationRepos } from "./notification-repos";
import { brouillon, fileEnvoi } from "./stockage";

/**
 * La séance en cours et la file d'envoi, ADOSSÉES AU DISQUE (§ 8).
 *
 * L'état React n'est qu'un reflet : chaque modification est d'abord écrite sur
 * disque. Démarrer relit le disque au moment de l'appui ; l'écran de séance le
 * relit en s'affichant. Démarrer une routine et reprendre après un arrêt forcé
 * passent ainsi par le même chemin : le disque.
 */
type Contexte = {
  /** Faux tant que le disque n'a pas été lu : ne rien décider avant. */
  pret: boolean;
  seance: SeanceEnCours | null;
  file: ElementFile[];
  envoiEnCours: boolean;
  /** Relit le brouillon sur disque. */
  recharger: () => Promise<void>;
  modifier: (s: SeanceEnCours) => void;
  /** `false` si un brouillon existe déjà sur disque : on ne l'écrase JAMAIS. */
  demarrer: (s: SeanceEnCours) => Promise<boolean>;
  abandonner: () => Promise<void>;
  /** Brouillon → file → envoi. La séance quitte l'écran aussitôt (D10). */
  terminer: () => Promise<void>;
  synchroniser: () => Promise<void>;
  /** Une séance refusée revient en brouillon, si aucun n'est en cours. */
  reprendreRefusee: (id: string) => Promise<boolean>;
  supprimerRefusee: (id: string) => Promise<void>;
};

const SeanceContexte = createContext<Contexte | null>(null);

/** Poste une séance et classe la réponse. Aucune exception ne sort d'ici. */
async function envoyer(
  e: ElementFile,
): Promise<{ issue: "envoyee" } | { issue: "reessayer" } | { issue: "refusee"; message: string }> {
  try {
    const res = await api.seances.$post({ json: versEnvoi(e.seance, new Date(e.fin)) });
    const issue = classerReponse(res.status);
    if (issue !== "refusee") return { issue };
    const corps = (await res.json().catch(() => null)) as { erreur?: string } | null;
    return { issue, message: corps?.erreur ?? "La séance a été refusée par le serveur." };
  } catch {
    return { issue: "reessayer" };
  }
}

export function SeanceProvider({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [seance, setSeance] = useState<SeanceEnCours | null>(null);
  const [file, setFile] = useState<ElementFile[]>([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  // Un seul envoi à la fois : deux boucles concurrentes enverraient deux fois
  // (sans doublon grâce à l'idempotence, mais pour rien).
  const verrou = useRef(false);
  const client = useQueryClient();

  // Chaque changement d'état numérote une écriture. Une relecture du disque
  // partie AVANT un changement ne doit pas l'écraser en arrivant après : au
  // retour de la modale du catalogue, l'ajout d'exercices (instantané hors
  // ligne) précédait la relecture lancée par le retour à l'écran, qui
  // réaffichait l'ancienne séance — et la modification suivante l'aurait
  // réécrite sur le disque, ajout perdu.
  const ecritures = useRef(0);
  const poser = useCallback((s: SeanceEnCours | null) => {
    ecritures.current += 1;
    setSeance(s);
  }, []);

  const recharger = useCallback(async () => {
    const avant = ecritures.current;
    const lue = await brouillon.lire();
    if (ecritures.current === avant) setSeance(lue);
  }, []);

  const synchroniser = useCallback(async () => {
    if (verrou.current) return;
    verrou.current = true;
    setEnvoiEnCours(true);
    try {
      for (const e of aEnvoyer(await fileEnvoi.lire())) {
        const reponse = await envoyer(e);
        // On RELIT la file avant chaque écriture : elle a pu changer pendant
        // l'envoi (une autre séance terminée entre-temps).
        const apres = apresReponse(await fileEnvoi.lire(), e.seance.id, reponse);
        await fileEnvoi.ecrire(apres);
        setFile(apres);
        // Réseau coupé : inutile d'insister sur les suivantes, elles échoueraient aussi.
        if (reponse.issue === "reessayer") break;
      }
    } finally {
      verrou.current = false;
      setEnvoiEnCours(false);
      // Une séance arrivée au serveur change l'historique et peut-être des
      // records : leurs clés sont invalidées, sinon l'onglet Historique
      // resterait sur sa dernière lecture.
      void client.invalidateQueries({ queryKey: ["seances"] });
      void client.invalidateQueries({ queryKey: ["records"] });
    }
  }, [client]);

  // Au démarrage : relire le disque, puis retenter ce qui attend.
  useEffect(() => {
    (async () => {
      await recharger();
      setFile(await fileEnvoi.lire());
      setPret(true);
      void synchroniser();
    })();
  }, [synchroniser]);

  // D99 : retenter dès que le réseau revient, et à chaque retour au premier plan
  // — jusqu'ici, une séance terminée en salle attendait le prochain lancement.
  // `synchroniser` est verrouillée : deux déclencheurs simultanés n'envoient
  // qu'une fois.
  useEffect(() => {
    const finReseau = onlineManager.subscribe((enLigne) => {
      if (enLigne) void synchroniser();
    });
    const finPremierPlan = AppState.addEventListener("change", (etat) => {
      if (etat === "active") void synchroniser();
    });
    return () => {
      finReseau();
      finPremierPlan.remove();
    };
  }, [synchroniser]);

  // La fin du repos s'annonce aussi app fermée ou téléphone verrouillé.
  useNotificationRepos(seance);

  const modifier = useCallback((s: SeanceEnCours) => {
    poser(s);
    void brouillon.ecrire(s);
  }, []);

  const demarrer = useCallback(async (s: SeanceEnCours) => {
    // Vérifié au MOMENT de l'appui, sur le disque — jamais depuis un état
    // d'écran qui pourrait avoir vieilli.
    const existant = await brouillon.lire();
    if (existant) {
      poser(existant);
      return false;
    }
    await brouillon.ecrire(s);
    poser(s);
    return true;
  }, []);

  const abandonner = useCallback(async () => {
    await brouillon.effacer();
    poser(null);
  }, []);

  const terminer = useCallback(async () => {
    const s = await brouillon.lire();
    if (!s) return;
    // L'ordre compte : la séance entre dans la file AVANT que le brouillon ne
    // soit effacé. Un arrêt entre les deux laisse un doublon, jamais un trou —
    // et le doublon est sans danger, l'envoi étant idempotent.
    const f = mettreEnFile(await fileEnvoi.lire(), s, new Date().toISOString());
    await fileEnvoi.ecrire(f);
    await brouillon.effacer();
    setFile(f);
    poser(null);
    void synchroniser();
  }, [synchroniser]);

  const reprendreRefusee = useCallback(async (id: string) => {
    if (await brouillon.lire()) return false;
    const f = await fileEnvoi.lire();
    const e = f.find((x) => x.seance.id === id);
    if (!e) return false;
    await brouillon.ecrire(e.seance);
    const reste = f.filter((x) => x.seance.id !== id);
    await fileEnvoi.ecrire(reste);
    poser(e.seance);
    setFile(reste);
    return true;
  }, []);

  const supprimerRefusee = useCallback(async (id: string) => {
    const reste = (await fileEnvoi.lire()).filter((x) => x.seance.id !== id);
    await fileEnvoi.ecrire(reste);
    setFile(reste);
  }, []);

  return (
    <SeanceContexte.Provider
      value={{
        pret,
        seance,
        file,
        envoiEnCours,
        recharger,
        modifier,
        demarrer,
        abandonner,
        terminer,
        synchroniser,
        reprendreRefusee,
        supprimerRefusee,
      }}
    >
      {children}
    </SeanceContexte.Provider>
  );
}

export function useSeance(): Contexte {
  const c = useContext(SeanceContexte);
  if (!c) throw new Error("useSeance hors de SeanceProvider");
  return c;
}
