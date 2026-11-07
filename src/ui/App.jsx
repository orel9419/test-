import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { creerPartie, jouerTour, apercuDecisions, previsionPolitique, conseils as calculerConseils, continuerPartie, cohabitationJoueur } from '../engine/index.js';
import { libelleTrimestre } from '../engine/calendrier.js';
import { MODES, normaliserMode } from '../model/parametres.js';
import { PAYS, contexte } from './donnees.js';
import { sauvegarderLocal, chargerLocal, effacerLocal, importerJSON, lirePreference, ecrirePreference } from './sauvegarde.js';
import { pct, nombre, md, definirDevise } from './format.js';
import Nombre from './composants/Nombre.jsx';
import Jauge from './composants/Jauge.jsx';
import Notifications from './composants/Notifications.jsx';
import Confettis from './composants/Confettis.jsx';
import Conseiller from './composants/Conseiller.jsx';
import VisiteGuidee from './composants/VisiteGuidee.jsx';
import ModaleSauvegarde from './composants/ModaleSauvegarde.jsx';
import Modale from './composants/Modale.jsx';
import Options from './composants/Options.jsx';
import APropos from './composants/APropos.jsx';
import { lireOptions, ecrireOptions, appliquerOptions, ONGLETS_AVANCES, codeDePartie, graineDepuisCode } from './options.js';
import { partager } from './partage.js';
import Accueil from './ecrans/Accueil.jsx';
import TableauDeBord from './ecrans/TableauDeBord.jsx';
import Budget from './ecrans/Budget.jsx';
import Fiscalite from './ecrans/Fiscalite.jsx';
import Reformes from './ecrans/Reformes.jsx';
import Parlement from './ecrans/Parlement.jsx';
import Entreprises from './ecrans/Entreprises.jsx';
import Opinion from './ecrans/Opinion.jsx';
import Diplomatie from './ecrans/Diplomatie.jsx';
import GrandsRendezVous from './ecrans/GrandsRendezVous.jsx';
import Evenements from './ecrans/Evenements.jsx';
import Menages from './ecrans/Menages.jsx';
import Journal from './ecrans/Journal.jsx';
import Sources from './ecrans/Sources.jsx';
import FinDePartie from './ecrans/FinDePartie.jsx';
import Objectifs from './ecrans/Objectifs.jsx';
import BilanTour from './ecrans/BilanTour.jsx';
import Classements from './ecrans/Classements.jsx';
import Communication from './ecrans/Communication.jsx';
import Armees from './ecrans/Armees.jsx';
import Dissuasion from './ecrans/Dissuasion.jsx';
import GroupeAeronaval from './ecrans/GroupeAeronaval.jsx';
import Securite from './ecrans/Securite.jsx';
import Express from './express/Express.jsx';
import Hangar from './composants/Hangar.jsx';
import Geopolitique from './ecrans/Geopolitique.jsx';
import ProduireEnFrance from './ecrans/ProduireEnFrance.jsx';
import FondsSouverain from './ecrans/FondsSouverain.jsx';
import Institutions from './ecrans/Institutions.jsx';

const ONGLETS = [
  { id: 'tableau', nom: 'Tableau de bord', court: 'Accueil', icone: '📊' },
  { id: 'reformes', nom: 'Réformes', court: 'Réformes', icone: '📜' },
  { id: 'budget', nom: 'Budget des ministères', court: 'Budget', icone: '🏛️' },
  { id: 'parlement', nom: 'Parlement', court: 'Parlement', icone: '🗳️' },
  { id: 'evenements', nom: 'Événements', court: 'Événements', icone: '⚡' },
  { id: 'fiscalite', nom: 'Impôts et dette', court: 'Impôts', icone: '💶' },
  { id: 'entreprises', nom: 'Entreprises et État stratège', court: 'Entreprises', icone: '🏭' },
  { id: 'opinion', nom: 'Opinion et élections', court: 'Opinion', icone: '📣' },
  { id: 'diplomatie', nom: 'Diplomatie', court: 'Monde', icone: '🌍' },
  { id: 'classements', nom: 'Classements', court: 'Rangs', icone: '🏆' },
  { id: 'rendezvous', nom: 'Grands rendez-vous', court: 'Sommets', icone: '🏅' },
  { id: 'menages', nom: 'Ménages', court: 'Ménages', icone: '👪' },
  { id: 'journal', nom: 'Journal', court: 'Journal', icone: '🗞️' },
  { id: 'sources', nom: 'Données et sources', court: 'Sources', icone: '🔎' },
  { id: 'communication', nom: 'Communication', court: 'Communication', icone: '🎤' },
  { id: 'armees', nom: 'Armées', court: 'Armées', icone: '🎖️' },
  { id: 'gan', nom: 'Groupe aéronaval', court: 'Groupe aéronaval', icone: '🚢' },
  { id: 'dissuasion', nom: 'Dissuasion', court: 'Dissuasion', icone: '⚓' },
  { id: 'securite', nom: 'Sécurité et justice', court: 'Sécurité', icone: '🛡️' },
  { id: 'geopolitique', nom: 'Géopolitique', court: 'Géopolitique', icone: '🗺️' },
  { id: 'relocalisation', nom: 'Produire en France', court: 'Produire', icone: '🇫🇷' },
  { id: 'fonds', nom: 'Fonds souverain', court: 'Fonds', icone: '💰' },
  { id: 'institutions', nom: 'Institutions', court: 'Institutions', icone: '⚖️' },
];

/** Sept rubriques, chacune avec ses sous-onglets : une navigation plus simple. */
const RUBRIQUES = [
  { id: 'accueil', nom: 'Tableau de bord', court: 'Accueil', icone: '📊', onglets: ['tableau'] },
  { id: 'gouverner', nom: 'Gouverner', court: 'Gouverner', icone: '📜', onglets: ['reformes', 'budget', 'fiscalite'] },
  { id: 'regalien', nom: 'Régalien', court: 'Régalien', icone: '🎖️', onglets: ['armees', 'gan', 'dissuasion', 'securite'] },
  { id: 'politique', nom: 'Politique et opinion', court: 'Opinion', icone: '📣', onglets: ['institutions', 'communication', 'opinion', 'parlement', 'evenements'] },
  { id: 'economie', nom: 'Économie', court: 'Économie', icone: '🏭', onglets: ['relocalisation', 'entreprises', 'fonds', 'menages'] },
  { id: 'monde', nom: 'Monde', court: 'Monde', icone: '🌍', onglets: ['geopolitique', 'diplomatie', 'classements', 'rendezvous'] },
  { id: 'journal', nom: 'Journal et sources', court: 'Journal', icone: '🗞️', onglets: ['journal', 'sources'] },
];
const rubriqueDe = (onglet) => RUBRIQUES.find((r) => r.onglets.includes(onglet)) ?? RUBRIQUES[0];

const DECISIONS_VIDES = { budget: {}, impots: {}, reformes: [], diplomatie: [], evenements: {}, entreprises: [], programmes: [], procedureBudget: 'auto', procedureReformes: 'vote', referendum: null, dissolution: false, questionConfiance: false, nominationPM: null, g7: null, g7Preparation: false, communication: null, defense: null, chantiers: [], gan: null, gan2: null, fondsAllocation: null, relocalisations: [], congres: false, cohabitation: null };

/** Décisions par défaut d'un tour : on conserve les curseurs et les taux en vigueur. */
function decisionsInitiales(partie) {
  if (!partie) return DECISIONS_VIDES;
  return {
    ...DECISIONS_VIDES,
    budget: Object.fromEntries(Object.entries(partie.budget).map(([id, l]) => [id, l.variationVolume ?? 0])),
    impots: Object.fromEntries(Object.entries(partie.impots).filter(([, c]) => c.taux !== null).map(([id, c]) => [id, c.taux])),
    partCourtTerme: partie.finances.partCourtTerme,
  };
}

/** Notifications à afficher après un tour : succès, élections, votes, entreprises, grands événements. */
function notificationsDuTour(avant, apres) {
  const n = [];
  const r = apres.resultatsTour ?? {};
  let fete = false;
  for (const s of r.succes ?? []) { n.push({ type: 'succes', icone: s.icone, titre: `Succès débloqué : ${s.nom}`, texte: s.description }); fete = true; }
  const nouvelles = (apres.elections?.historique ?? []).slice((avant.elections?.historique ?? []).length);
  for (const el of nouvelles) {
    n.push({ type: el.victoireCamp === false ? 'alerte' : 'election', titre: el.nom, texte: el.resume, duree: 9000 });
    if (el.victoireCamp) fete = true;
  }
  if (r.budget) n.push({ type: r.budget.adopte ? 'bon' : 'alerte', titre: r.budget.adopte ? 'Budget adopté' : 'Budget rejeté', texte: `${r.budget.pour} pour, ${r.budget.contre} contre${r.budget.senat !== null && r.budget.senat !== undefined ? ` ; Sénat : ${r.budget.senat} voix` : ''}${r.budget.procedure === '49.3' ? ' (49.3)' : ''}.` });
  for (const x of (r.reformes ?? []).filter((x) => !x.erreur && !x.censurePartielle)) n.push({ type: 'bon', titre: x.referendum ? 'Réforme adoptée par référendum' : 'Réforme adoptée', texte: x.id.replace(/_/g, ' ') });
  for (const c of (r.constitution ?? []).filter((x) => x.decision === 'totale' || x.decision === 'partielle')) n.push({ type: 'alerte', icone: '⚖️', titre: c.decision === 'totale' ? 'Réforme censurée' : 'Censure partielle', texte: c.texte, duree: 9000 });
  for (const d of (r.notation ?? []).filter((x) => x.action === 'degradation' || x.action === 'relevement')) n.push({ type: d.action === 'degradation' ? 'alerte' : 'succes', icone: d.action === 'degradation' ? '📉' : '📈', titre: d.action === 'degradation' ? 'Note dégradée' : 'Note relevée', texte: d.texte });
  if (r.referendum && !r.referendum.adopte) n.push({ type: 'alerte', titre: 'Référendum perdu', texte: `${r.referendum.nom} : ${nombre(100 - r.referendum.oui, 1)} % de non.` });
  for (const x of (r.entreprises ?? []).filter((x) => x.texte)) n.push({ type: 'entreprise', titre: 'Entreprises', texte: x.texte });
  for (const [id, g] of Object.entries(apres.grandsEvenements ?? {})) {
    if (g.reussite !== undefined && avant.grandsEvenements?.[id]?.reussite === undefined) {
      const coupe = id === 'cdm2038';
      n.push({ type: g.reussite ? 'succes' : 'alerte', icone: g.reussite ? (coupe ? '⚽' : '🥇') : '😬', titre: g.reussite ? (coupe ? 'Une Coupe du monde réussie !' : 'Des Jeux réussis !') : (coupe ? 'Une Coupe du monde ternie' : 'Des Jeux ternis'), texte: g.reussite ? 'Le pays rayonne : influence et fierté nationale en hausse.' : 'Incidents et polémiques : l\'image du pays en souffre.' });
      if (g.reussite) fete = true;
    }
  }
  return { liste: n, fete };
}

export default function App() {
  const [options, setOptions] = useState(lireOptions);
  // Mode Express : ouvert directement par un lien partagé (?express ou ?defi)
  const [express, setExpress] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.has('defi')) return { quotidien: true };
      if (q.has('express')) return { quotidien: false };
    } catch { /* pas de fenêtre */ }
    return null;
  });
  const [hangar, setHangar] = useState(false);
  const quitterExpress = useCallback(() => {
    setExpress(null);
    try { if (window.location.search) window.history.replaceState(null, '', window.location.pathname); } catch { /* sans historique */ }
  }, []);
  const [fenetre, setFenetre] = useState(null); // 'menu' | 'options' | 'apropos' | 'confirmer' | null
  const [partie, setPartie] = useState(null);
  const [decisions, setDecisions] = useState(DECISIONS_VIDES);
  const [onglet, setOnglet] = useState('tableau');
  // Dernier sous-onglet visité dans chaque rubrique (pour y revenir)
  const [dernierOnglet, setDernierOnglet] = useState({});
  useEffect(() => {
    setDernierOnglet((d) => ({ ...d, [rubriqueDe(onglet).id]: onglet }));
    try { window.scrollTo({ top: 0 }); } catch { /* environnement sans fenêtre */ }
  }, [onglet]);
  const [bilan, setBilan] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [prevision, setPrevision] = useState(null);
  const [message, setMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [fete, setFete] = useState(0);
  const [precedent, setPrecedent] = useState(null);
  const [visite, setVisite] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(null); // 'export' | 'import' | null
  const [quitter, setQuitter] = useState(false);
  const sauvegardeExistante = useMemo(() => chargerLocal(), []);
  const minuterie = useRef(null);
  const compteur = useRef(0);
  const attente = useRef([]);

  // Options : appliquées au document, mémorisées, et thème « comme l'appareil » suivi en direct
  useEffect(() => {
    appliquerOptions(options);
    ecrireOptions(options);
    if (options.theme !== 'auto') return undefined;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const suivre = () => appliquerOptions(options);
    mq?.addEventListener?.('change', suivre);
    return () => mq?.removeEventListener?.('change', suivre);
  }, [options]);

  // Monnaie de la partie (€ ou $) pour toutes les mises en forme
  useEffect(() => { definirDevise(partie?.statique.devise); }, [partie]);

  // Aperçu en temps réel des décisions (différé pour rester fluide)
  useEffect(() => {
    if (!partie || partie.termine) return undefined;
    clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => {
      try {
        setApercu(apercuDecisions(partie, { budget: decisions.budget, impots: decisions.impots, reformes: decisions.reformes, partCourtTerme: decisions.partCourtTerme }));
        setPrevision(previsionPolitique(partie, decisions));
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(minuterie.current);
  }, [partie, decisions]);

  const mode = partie ? MODES[normaliserMode(partie.mode)] : null;
  const conseils = useMemo(() => (partie && !partie.termine && mode?.conseiller ? calculerConseils(partie, prevision, decisions) : []), [partie, prevision, mode, decisions]);

  const notifier = useCallback((liste) => {
    setNotifications((n) => [...n, ...liste.map((x) => ({ ...x, id: ++compteur.current }))].slice(-6));
  }, []);
  const fermerNotification = useCallback((id) => setNotifications((n) => n.filter((x) => x.id !== id)), []);

  const demarrer = useCallback(({ pays, mode: m, calendrier, role, intensite, code }) => {
    const graine = graineDepuisCode(code) ?? Math.floor(Math.random() * 2 ** 31);
    const p = creerPartie({ pays, donnees: PAYS[pays].donnees, contexte, mode: m, graine, calendrier, role, intensite });
    try { window.scrollTo({ top: 0 }); } catch { /* environnement sans fenêtre */ }
    setPartie(p);
    setDecisions(decisionsInitiales(p));
    setOnglet('tableau');
    setPrecedent(null);
    sauvegarderLocal(p, decisionsInitiales(p));
    if (p.mode === 'facile' && !lirePreference('cdg:visite')) setVisite(true);
    notifier([{ type: 'info', icone: p.statique.drapeau, titre: `Vous prenez vos fonctions : ${p.statique.chefGouvernement.titre}`, texte: `${libelleTrimestre(p.trimestre)} · mode ${MODES[p.mode].nom}. ${p.evenements.enAttente.length ? `${p.evenements.enAttente.length} dossier(s) vous attendent déjà.` : ''}` }]);
  }, [notifier]);

  const reprendre = useCallback((s) => {
    setPartie(s.partie);
    setDecisions({ ...DECISIONS_VIDES, ...(s.decisions ?? decisionsInitiales(s.partie)) });
    setOnglet('tableau');
    setPrecedent(null);
  }, []);

  /** Événements encore sans réponse (le premier choix s'appliquerait par défaut). */
  const evenementsSansReponse = partie && !partie.termine ? partie.evenements.enAttente.filter((ev) => !decisions.evenements?.[ev.id]).length : 0;
  const demanderValidation = useCallback(() => {
    if (!partie || partie.termine) return;
    if (options.confirmer && evenementsSansReponse > 0) { setFenetre('confirmer'); return; }
    validerTourRef.current?.();
  }, [partie, options.confirmer, evenementsSansReponse]);
  const validerTourRef = useRef(null);

  const validerTour = useCallback(() => {
    if (!partie || partie.termine) return;
    const avant = partie;
    const apres = jouerTour(partie, decisions);
    const suivantes = decisionsInitiales(apres);
    if (MODES[normaliserMode(avant.mode)]?.annulerTour) setPrecedent({ partie: avant, decisions });
    setPartie(apres);
    setDecisions(suivantes);
    setBilan({ avant, apres });
    sauvegarderLocal(apres, suivantes);
    // Les notifications s'affichent à la fermeture du bilan, pour ne pas le masquer
    const { liste, fete: celebrer } = notificationsDuTour(avant, apres);
    attente.current = liste;
    if (celebrer || (apres.termine && apres.issue?.type !== 'defaite')) setFete((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [partie, decisions, notifier]);
  validerTourRef.current = validerTour;

  const annulerTour = useCallback(() => {
    if (!precedent) return;
    setPartie(precedent.partie);
    setDecisions(precedent.decisions);
    sauvegarderLocal(precedent.partie, precedent.decisions);
    setPrecedent(null);
    setBilan(null);
    attente.current = [];
    notifier([{ type: 'info', icone: '↩️', titre: 'Trimestre annulé', texte: 'Vous pouvez revoir vos décisions.' }]);
  }, [precedent, notifier]);

  // Raccourci clavier : Ctrl + Entrée (ou Cmd + Entrée) pour valider le trimestre
  useEffect(() => {
    const touche = (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter' && !bilan && !fenetre) { ev.preventDefault(); demanderValidation(); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [demanderValidation, bilan, fenetre]);

  const importer = useCallback(async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      reprendre(await importerJSON(f));
      setSauvegarde(null);
      setMessage('Partie importée.');
    } catch (err) {
      setMessage(err.message);
    }
    ev.target.value = '';
  }, [reprendre]);

  const majDecisions = useCallback((modif) => setDecisions((d) => ({ ...d, ...(typeof modif === 'function' ? modif(d) : modif) })), []);
  const fermerVisite = useCallback(() => { setVisite(false); ecrirePreference('cdg:visite', '1'); }, []);

  if (express) {
    return <Express key={express.quotidien ? 'defi' : 'libre'} quotidien={express.quotidien} onQuitter={quitterExpress} onChanger={(q) => setExpress({ quotidien: q })} />;
  }

  if (!partie) {
    return (
      <>
        <Accueil
          onDemarrer={demarrer}
          sauvegarde={sauvegardeExistante}
          onReprendre={() => reprendre(sauvegardeExistante)}
          onImporter={importer}
          onColler={() => setSauvegarde('import')}
          onOptions={() => setFenetre('options')}
          onExpress={(q) => setExpress({ quotidien: q })}
          onHangar={() => setHangar(true)}
          onAPropos={() => setFenetre('apropos')}
          message={message}
        />
        {fenetre === 'options' && <Options options={options} onChange={setOptions} onFermer={() => setFenetre(null)} />}
        {fenetre === 'apropos' && <APropos onFermer={() => setFenetre(null)} />}
        {hangar && <Hangar onFermer={() => setHangar(false)} />}
        <Notifications liste={notifications} onFermer={fermerNotification} />
        {sauvegarde && <ModaleSauvegarde mode="import" onCharger={(x) => { reprendre(x); setSauvegarde(null); setMessage(null); }} onImporterFichier={importer} onFermer={() => setSauvegarde(null)} />}
      </>
    );
  }

  const s = partie.statique;
  const f = partie.finances;
  const us = partie.pays === 'etatsUnis';
  const nbEvenements = partie.evenements.enAttente.length;
  const props = { partie, decisions, majDecisions, apercu, prevision };
  const trimestreBudget = us ? (partie.trimestre.t === 3 || partie.tour === 1) : partie.trimestre.t === 4;
  const nomOnglet = (o) => (o.id === 'parlement' ? (us ? 'Congrès' : partie.pays === 'allemagne' ? 'Bundestag et coalition' : 'Parlement') : o.nom);
  const nbActionsEntreprises = (decisions.entreprises?.length ?? 0) + (decisions.programmes?.length ?? 0);
  const rubrique = rubriqueDe(onglet);
  const essentielle = options.interface === 'essentielle';
  const reserveFrance = (id) => ['geopolitique', 'gan', 'relocalisation', 'institutions', 'fonds'].includes(id) && partie.pays !== 'france';
  const visible = (id) => !reserveFrance(id) && (!essentielle || !ONGLETS_AVANCES.includes(id) || id === onglet);
  const rubriques = RUBRIQUES.map((r) => ({ ...r, onglets: r.onglets.filter(visible) })).filter((r) => r.onglets.length > 0);
  const ongletsRubrique = rubriques.find((r) => r.id === rubrique.id)?.onglets ?? [onglet];
  /** Badge d'un sous-onglet : nombre de décisions en préparation, ou mention. */
  const badge = (id) => ({
    evenements: nbEvenements,
    reformes: decisions.reformes.length,
    rendezvous: decisions.chantiers?.length ?? 0,
    diplomatie: decisions.diplomatie.length + (decisions.g7?.priorites?.length ? 1 : 0),
    entreprises: nbActionsEntreprises,
    communication: decisions.communication ? 1 : 0,
    geopolitique: (decisions.gan ? 1 : 0) + (decisions.gan2 ? 1 : 0),
    gan: (decisions.gan ? 1 : 0) + (decisions.gan2 ? 1 : 0),
    institutions: (decisions.questionConfiance && partie.pays === 'france' ? 1 : 0) + (decisions.congres ? 1 : 0) + (decisions.cohabitation && decisions.cohabitation !== 'promulguer' ? 1 : 0),
    relocalisation: decisions.relocalisations?.length ?? 0,
    fonds: decisions.fondsAllocation ? 1 : 0,
    armees: decisions.defense ? Object.values(decisions.defense.programmes ?? {}).filter((o) => o !== 'nominal').length + Object.keys(decisions.defense.operations ?? {}).length + (decisions.defense.exports?.length ?? 0) + (decisions.defense.commandes?.length ?? 0) : 0,
    dissuasion: decisions.defense?.dissuasion ? 1 : 0,
    parlement: trimestreBudget ? 'budget' : null,
  }[id] ?? null);

  return (
    <div>
      <header className="entete">
        <span className="titre">{s.drapeau} {s.nom}</span>
        <span className="muet petit">
          {partie.termine ? (partie.horizon ? 'Partie terminée' : 'Mandat terminé') : `${libelleTrimestre(partie.trimestre)} · tour ${partie.tour}/${partie.nbTours}`} · {s.chefGouvernement.titre} · <span className={`etiquette mode-${partie.mode}`}>mode {mode.nom}</span>{partie.bacASable && <> <span className="etiquette">bac à sable</span></>}
        </span>
        <div className="progression-mandat" title={partie.horizon ? `Partie jusqu'en ${partie.horizon} : ${partie.tour} trimestre(s) sur ${partie.nbTours}` : `Mandat : ${partie.tour} trimestre(s) sur ${partie.nbTours}`}><Jauge valeur={(partie.tour - 1) / partie.nbTours} libelle={partie.horizon ? `Avancement jusqu'en ${partie.horizon}` : 'Avancement du mandat'} /></div>
        <div className="indicateurs" aria-label="Indicateurs clés">
          <div>Popularité<strong><Nombre valeur={partie.social.popularite} format={(v) => pct(v, 0)} favorableSiHausse /></strong></div>
          <div>Déficit<strong><Nombre valeur={f.deficitRatio} format={(v) => pct(v)} favorableSiHausse={false} /></strong></div>
          <div>Dette<strong><Nombre valeur={f.detteRatio} format={(v) => pct(v)} favorableSiHausse={false} /></strong></div>
          <div>Taux 10 ans<strong><Nombre valeur={f.taux10} format={(v) => pct(v, 2)} favorableSiHausse={false} /></strong></div>
          <div>Chômage<strong><Nombre valeur={partie.macro.chomage} format={(v) => pct(v)} favorableSiHausse={false} /></strong></div>
        </div>
        <div className="ligne actions-entete">
          <button type="button" className="bouton" onClick={() => setVisite(true)} title="Visite guidée" aria-label="Visite guidée">?</button>
          <button type="button" className="bouton" onClick={() => setFenetre('menu')} aria-haspopup="dialog">☰ Menu</button>
        </div>
      </header>

      {message && <div className="alerte bonne" style={{ margin: '0.6rem 1.2rem' }} role="status">{message} <button type="button" className="bouton petit" onClick={() => setMessage(null)}>OK</button></div>}

      {partie.termine ? (
        <FinDePartie partie={partie} codePartie={codeDePartie(partie.graine)} onNouvelle={() => { effacerLocal(); setPartie(null); }} onExporter={() => setSauvegarde('export')} onContinuer={partie.horizon ? () => setPartie(continuerPartie(partie)) : null} />
      ) : (
        <div className="mise-en-page">
          <nav className="navigation" aria-label="Rubriques">
            {rubriques.map((r) => {
              const active = rubrique.id === r.id;
              const evenementsIci = r.onglets.includes('evenements') && nbEvenements > 0;
              const compteur = r.onglets.reduce((n, id) => n + (typeof badge(id) === 'number' ? badge(id) : 0), 0);
              return (
                <button key={r.id} type="button" className={`onglet ${active ? 'actif' : ''}`} onClick={() => setOnglet(r.onglets.includes(dernierOnglet[r.id]) ? dernierOnglet[r.id] : r.onglets[0])} aria-current={active ? 'page' : undefined}>
                  <span className="onglet-contenu"><span className="onglet-icone" aria-hidden="true">{r.icone}</span><span className="nom-long">{r.nom}</span><span className="nom-court">{r.court}</span></span>
                  {evenementsIci && <span className="pastille pulse">{nbEvenements}</span>}
                  {!evenementsIci && compteur > 0 && <span className="etiquette">{compteur}</span>}
                </button>
              );
            })}
          </nav>
          <main key={onglet} className="apparition">
            {ongletsRubrique.length > 1 && (
              <div className="sous-onglets" role="tablist" aria-label={rubrique.nom}>
                {ongletsRubrique.map((id) => {
                  const o = ONGLETS.find((x) => x.id === id);
                  const b = badge(id);
                  return (
                    <button key={id} type="button" role="tab" aria-selected={onglet === id} className={`sous-onglet ${onglet === id ? 'actif' : ''}`} onClick={() => setOnglet(id)}>
                      <span aria-hidden="true">{o.icone}</span> {nomOnglet(o)}
                      {b !== null && b !== undefined && b !== 0 && <span className={id === 'evenements' ? 'pastille' : 'etiquette'}>{b}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {onglet === 'communication' && <Communication {...props} allerA={setOnglet} />}
            {onglet === 'armees' && <Armees {...props} allerA={setOnglet} />}
            {onglet === 'gan' && <GroupeAeronaval {...props} allerA={setOnglet} />}
            {onglet === 'dissuasion' && <Dissuasion {...props} allerA={setOnglet} />}
            {onglet === 'securite' && <Securite {...props} allerA={setOnglet} />}
            {cohabitationJoueur(partie) && ['budget', 'fiscalite', 'reformes', 'entreprises', 'relocalisation'].includes(onglet) && (
              <div className="alerte critique petit" style={{ marginBottom: '0.8rem' }}>
                <strong>Cohabitation :</strong> le Gouvernement détermine et conduit la politique de la nation (article 20). Le budget, les impôts et les réformes lui appartiennent : vos choix dans cet onglet ne s'appliquent pas. <button type="button" className="lien" onClick={() => setOnglet('institutions')}>Répondre à ses textes (onglet Institutions)</button>
              </div>
            )}
            {onglet === 'institutions' && <Institutions {...props} allerA={setOnglet} />}
            {onglet === 'geopolitique' && <Geopolitique {...props} allerA={setOnglet} />}
            {onglet === 'relocalisation' && <ProduireEnFrance {...props} />}
            {onglet === 'fonds' && <FondsSouverain {...props} allerA={setOnglet} />}
            {onglet === 'tableau' && <TableauDeBord {...props} allerA={setOnglet} conseils={conseils} />}
            {onglet === 'budget' && <Budget {...props} />}
            {onglet === 'fiscalite' && <Fiscalite {...props} />}
            {onglet === 'reformes' && <Reformes {...props} />}
            {onglet === 'parlement' && <Parlement {...props} />}
            {onglet === 'entreprises' && <Entreprises {...props} allerA={setOnglet} />}
            {onglet === 'opinion' && <Opinion {...props} />}
            {onglet === 'diplomatie' && <Diplomatie {...props} />}
            {onglet === 'classements' && <Classements partie={partie} />}
            {onglet === 'rendezvous' && <GrandsRendezVous {...props} allerA={setOnglet} />}
            {onglet === 'evenements' && <Evenements {...props} />}
            {onglet === 'menages' && <Menages {...props} />}
            {onglet === 'journal' && <Journal partie={partie} />}
            {onglet === 'sources' && <Sources partie={partie} />}
          </main>
          <aside className="colonne-droite">
            <div className="carte">
              <h3>Ce trimestre</h3>
              <ul className="petit" style={{ margin: '0 0 0.7rem', paddingLeft: '1.1rem' }}>
                <li>{decisions.reformes.length} réforme(s) proposée(s){decisions.referendum ? ' + 1 référendum' : ''}</li>
                <li>{decisions.diplomatie.length} action(s) diplomatique(s) · capital : {partie.international.capitalDiplomatique} point(s)</li>
                <li>{nbActionsEntreprises} décision(s) sur les entreprises</li>
                <li>{nbEvenements} événement(s) à trancher</li>
                {trimestreBudget && <li><strong>{us ? 'Vote des crédits fédéraux' : `Vote du budget ${partie.trimestre.annee + 1}`}</strong> ce trimestre</li>}
              </ul>
              {apercu && (
                <p className="petit muet">Effet estimé de vos décisions à un an : solde {apercu.unAn.soldeMd >= 0 ? '+' : '−'}{md(Math.abs(apercu.unAn.soldeMd), 1)}, croissance {apercu.unAn.croissance >= 0 ? '+' : '−'}{nombre(Math.abs(apercu.unAn.croissance), 2)} pt, popularité {apercu.unAn.popularite >= 0 ? '+' : '−'}{nombre(Math.abs(apercu.unAn.popularite), 1)} pt.</p>
              )}
              <button type="button" className="bouton principal grand bouton-valider" onClick={demanderValidation} title="Raccourci : Ctrl + Entrée">Valider le trimestre</button>
              {precedent && <button type="button" className="bouton" style={{ width: '100%', marginTop: '0.5rem' }} onClick={annulerTour}>↩ Annuler le dernier trimestre</button>}
            </div>
            {mode.conseiller && onglet !== 'tableau' && <Conseiller conseils={conseils} allerA={setOnglet} compact />}
            <Objectifs partie={partie} />
          </aside>
        </div>
      )}
      {!partie.termine && (
        <div className="barre-validation-mobile">
          <span className="petit">{libelleTrimestre(partie.trimestre)}{decisions.reformes.length ? ` · ${decisions.reformes.length} réforme(s)` : ''}{nbEvenements ? ` · ${nbEvenements} événement(s)` : ''}</span>
          <button type="button" className="bouton principal" onClick={demanderValidation}>Valider le trimestre</button>
        </div>
      )}
      {bilan && <BilanTour avant={bilan.avant} apres={bilan.apres} onFermer={() => { setBilan(null); notifier(attente.current); attente.current = []; }} onAnnuler={precedent ? annulerTour : null} />}
      {visite && !partie.termine && <VisiteGuidee onFermer={fermerVisite} allerA={setOnglet} />}
      {sauvegarde && <ModaleSauvegarde mode={sauvegarde} partie={partie} decisions={decisions} onCharger={(x) => { reprendre(x); setSauvegarde(null); setMessage('Partie chargée.'); }} onImporterFichier={importer} onFermer={() => setSauvegarde(null)} />}
      {fenetre === 'menu' && (
        <Modale titre="Menu" onFermer={() => setFenetre(null)} largeur={440}>
          <div className="menu-jeu">
            <button type="button" className="bouton principal" onClick={() => { setFenetre(null); setExpress({ quotidien: false }); }}>⚡ Mode Express (3 minutes)</button>
            <button type="button" className="bouton" onClick={() => { setFenetre(null); setExpress({ quotidien: true }); }}>📅 Défi du jour</button>
            <button type="button" className="bouton" onClick={() => { setFenetre(null); setSauvegarde('export'); }}>💾 Sauvegarder la partie</button>
            <button type="button" className="bouton" onClick={() => { setFenetre(null); setSauvegarde('import'); }}>📂 Charger une partie</button>
            <button type="button" className="bouton" onClick={() => setFenetre('options')}>⚙️ Options <span className="tres-petit muet">(interface {essentielle ? 'essentielle' : 'complète'}, thème, texte…)</span></button>
            <button type="button" className="bouton" onClick={() => setOptions((o) => ({ ...o, interface: essentielle ? 'complete' : 'essentielle' }))}>{essentielle ? '➕ Afficher toutes les rubriques' : '➖ Revenir à l\'interface essentielle'}</button>
            <button type="button" className="bouton" onClick={() => { setFenetre(null); setVisite(true); }}>❔ Visite guidée</button>
            <button type="button" className="bouton" onClick={async () => { const r = await partager({ titre: 'Chef de gouvernement', texte: 'Un jeu gratuit pour gouverner la France (ou l\'Allemagne, ou les États-Unis) avec des données réelles : budget, réformes, Parlement, opinion, marchés.' }); setMessage(r); setFenetre(null); }}>🔗 Partager le jeu</button>
            <button type="button" className="bouton" onClick={() => setFenetre('apropos')}>ℹ️ À propos, données et vie privée</button>
            <button type="button" className="bouton" onClick={() => { setFenetre(null); setQuitter(true); }}>🏠 Revenir à l'accueil</button>
          </div>
          <p className="tres-petit muet" style={{ margin: 0 }}>Code de cette partie : <strong>{codeDePartie(partie.graine)}</strong>. Partagez-le : avec les mêmes décisions, un ami vivra les mêmes événements.</p>
        </Modale>
      )}
      {fenetre === 'options' && <Options options={options} onChange={setOptions} onFermer={() => setFenetre(null)} />}
      {fenetre === 'apropos' && <APropos onFermer={() => setFenetre(null)} codePartie={codeDePartie(partie.graine)} />}
      {fenetre === 'confirmer' && (
        <Modale titre="Valider le trimestre ?" onFermer={() => setFenetre(null)} largeur={460}>
          <p className="petit" style={{ margin: 0 }}>{evenementsSansReponse} événement{evenementsSansReponse > 1 ? 's attendent' : ' attend'} encore votre décision. Sans réponse, le premier choix proposé s'appliquera.</p>
          <div className="ligne">
            <button type="button" className="bouton principal" onClick={() => { setFenetre(null); setOnglet('evenements'); }}>Voir les événements</button>
            <button type="button" className="bouton" onClick={() => { setFenetre(null); validerTour(); }}>Valider quand même</button>
          </div>
        </Modale>
      )}
      {quitter && (
        <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-quitter" onKeyDown={(ev) => ev.key === 'Escape' && setQuitter(false)}>
          <div className="modale pile entree-modale" style={{ maxWidth: 460 }}>
            <h2 id="titre-quitter">Revenir au menu ?</h2>
            <p className="petit">La partie reste enregistrée dans ce navigateur quand c'est possible. Pour la garder à coup sûr, sauvegardez-la d'abord (téléchargement ou copie du texte).</p>
            <div className="ligne">
              <button type="button" className="bouton principal" onClick={() => { setQuitter(false); setPartie(null); }}>Revenir au menu</button>
              <button type="button" className="bouton" onClick={() => { setQuitter(false); setSauvegarde('export'); }}>Sauvegarder d'abord</button>
              <button type="button" className="bouton" onClick={() => setQuitter(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
      <Notifications liste={notifications} onFermer={fermerNotification} />
      <Confettis declencheur={fete} />
    </div>
  );
}
