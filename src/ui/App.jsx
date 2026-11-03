import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { creerPartie, jouerTour, apercuDecisions, previsionPolitique, conseils as calculerConseils, continuerPartie } from '../engine/index.js';
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
];

/** Six rubriques, chacune avec ses sous-onglets : une navigation plus simple. */
const RUBRIQUES = [
  { id: 'accueil', nom: 'Tableau de bord', court: 'Accueil', icone: '📊', onglets: ['tableau'] },
  { id: 'gouverner', nom: 'Gouverner', court: 'Gouverner', icone: '📜', onglets: ['reformes', 'budget', 'fiscalite'] },
  { id: 'politique', nom: 'Politique et opinion', court: 'Opinion', icone: '📣', onglets: ['communication', 'opinion', 'parlement', 'evenements'] },
  { id: 'economie', nom: 'Économie', court: 'Économie', icone: '🏭', onglets: ['entreprises', 'menages'] },
  { id: 'monde', nom: 'Monde', court: 'Monde', icone: '🌍', onglets: ['diplomatie', 'classements', 'rendezvous'] },
  { id: 'journal', nom: 'Journal et sources', court: 'Journal', icone: '🗞️', onglets: ['journal', 'sources'] },
];
const rubriqueDe = (onglet) => RUBRIQUES.find((r) => r.onglets.includes(onglet)) ?? RUBRIQUES[0];

const DECISIONS_VIDES = { budget: {}, impots: {}, reformes: [], diplomatie: [], evenements: {}, entreprises: [], programmes: [], procedureBudget: 'auto', procedureReformes: 'vote', referendum: null, dissolution: false, questionConfiance: false, nominationPM: null, g7: null, g7Preparation: false, communication: null };

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
  for (const x of (r.reformes ?? []).filter((x) => !x.erreur)) n.push({ type: 'bon', titre: x.referendum ? 'Réforme adoptée par référendum' : 'Réforme adoptée', texte: x.id.replace(/_/g, ' ') });
  if (r.referendum && !r.referendum.adopte) n.push({ type: 'alerte', titre: 'Référendum perdu', texte: `${r.referendum.nom} : ${nombre(100 - r.referendum.oui, 1)} % de non.` });
  for (const x of (r.entreprises ?? []).filter((x) => x.texte)) n.push({ type: 'entreprise', titre: 'Entreprises', texte: x.texte });
  for (const [id, g] of Object.entries(apres.grandsEvenements ?? {})) {
    if (g.reussite !== undefined && avant.grandsEvenements?.[id]?.reussite === undefined) {
      n.push({ type: g.reussite ? 'succes' : 'alerte', icone: g.reussite ? '🥇' : '😬', titre: g.reussite ? 'Des Jeux réussis !' : 'Des Jeux ternis', texte: g.reussite ? 'Le pays rayonne : influence et fierté nationale en hausse.' : 'Incidents et polémiques : l\'image du pays en souffre.' });
      if (g.reussite) fete = true;
    }
  }
  return { liste: n, fete };
}

export default function App() {
  const [theme, setTheme] = useState(() => lirePreference('cdg:theme') ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    ecrirePreference('cdg:theme', theme);
  }, [theme]);

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
  const conseils = useMemo(() => (partie && !partie.termine && mode?.conseiller ? calculerConseils(partie, prevision) : []), [partie, prevision, mode]);

  const notifier = useCallback((liste) => {
    setNotifications((n) => [...n, ...liste.map((x) => ({ ...x, id: ++compteur.current }))].slice(-6));
  }, []);
  const fermerNotification = useCallback((id) => setNotifications((n) => n.filter((x) => x.id !== id)), []);

  const demarrer = useCallback(({ pays, mode: m, calendrier, role, intensite }) => {
    const graine = Math.floor(Math.random() * 2 ** 31);
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
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter' && !bilan) { ev.preventDefault(); validerTour(); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [validerTour, bilan]);

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

  if (!partie) {
    return (
      <>
        <Accueil
          onDemarrer={demarrer}
          sauvegarde={sauvegardeExistante}
          onReprendre={() => reprendre(sauvegardeExistante)}
          onImporter={importer}
          onColler={() => setSauvegarde('import')}
          theme={theme}
          onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          message={message}
        />
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
  /** Badge d'un sous-onglet : nombre de décisions en préparation, ou mention. */
  const badge = (id) => ({
    evenements: nbEvenements,
    reformes: decisions.reformes.length,
    diplomatie: decisions.diplomatie.length + (decisions.g7?.priorites?.length ? 1 : 0),
    entreprises: nbActionsEntreprises,
    communication: decisions.communication ? 1 : 0,
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
        <div className="ligne">
          <button type="button" className="bouton" onClick={() => setSauvegarde('export')} title="Télécharger ou copier la partie (JSON)">Sauvegarder</button>
          <button type="button" className="bouton" onClick={() => setSauvegarde('import')} title="Charger une partie (fichier ou texte)">Charger</button>
          <button type="button" className="bouton" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-label="Changer de thème">{theme === 'dark' ? '☀︎' : '☾'}</button>
          <button type="button" className="bouton" onClick={() => setVisite(true)} title="Visite guidée">?</button>
          <button type="button" className="bouton" onClick={() => setQuitter(true)}>Menu</button>
        </div>
      </header>

      {message && <div className="alerte bonne" style={{ margin: '0.6rem 1.2rem' }} role="status">{message} <button type="button" className="bouton petit" onClick={() => setMessage(null)}>OK</button></div>}

      {partie.termine ? (
        <FinDePartie partie={partie} onNouvelle={() => { effacerLocal(); setPartie(null); }} onExporter={() => setSauvegarde('export')} onContinuer={partie.horizon ? () => setPartie(continuerPartie(partie)) : null} />
      ) : (
        <div className="mise-en-page">
          <nav className="navigation" aria-label="Rubriques">
            {RUBRIQUES.map((r) => {
              const active = rubrique.id === r.id;
              const evenementsIci = r.onglets.includes('evenements') && nbEvenements > 0;
              const compteur = r.onglets.reduce((n, id) => n + (typeof badge(id) === 'number' ? badge(id) : 0), 0);
              return (
                <button key={r.id} type="button" className={`onglet ${active ? 'actif' : ''}`} onClick={() => setOnglet(dernierOnglet[r.id] ?? r.onglets[0])} aria-current={active ? 'page' : undefined}>
                  <span className="onglet-contenu"><span className="onglet-icone" aria-hidden="true">{r.icone}</span><span className="nom-long">{r.nom}</span><span className="nom-court">{r.court}</span></span>
                  {evenementsIci && <span className="pastille pulse">{nbEvenements}</span>}
                  {!evenementsIci && compteur > 0 && <span className="etiquette">{compteur}</span>}
                </button>
              );
            })}
          </nav>
          <main key={onglet} className="apparition">
            {rubrique.onglets.length > 1 && (
              <div className="sous-onglets" role="tablist" aria-label={rubrique.nom}>
                {rubrique.onglets.map((id) => {
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
            {onglet === 'tableau' && <TableauDeBord {...props} allerA={setOnglet} conseils={conseils} />}
            {onglet === 'budget' && <Budget {...props} />}
            {onglet === 'fiscalite' && <Fiscalite {...props} />}
            {onglet === 'reformes' && <Reformes {...props} />}
            {onglet === 'parlement' && <Parlement {...props} />}
            {onglet === 'entreprises' && <Entreprises {...props} allerA={setOnglet} />}
            {onglet === 'opinion' && <Opinion {...props} />}
            {onglet === 'diplomatie' && <Diplomatie {...props} />}
            {onglet === 'classements' && <Classements partie={partie} />}
            {onglet === 'rendezvous' && <GrandsRendezVous partie={partie} allerA={setOnglet} />}
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
              <button type="button" className="bouton principal grand bouton-valider" onClick={validerTour} title="Raccourci : Ctrl + Entrée">Valider le trimestre</button>
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
          <button type="button" className="bouton principal" onClick={validerTour}>Valider le trimestre</button>
        </div>
      )}
      {bilan && <BilanTour avant={bilan.avant} apres={bilan.apres} onFermer={() => { setBilan(null); notifier(attente.current); attente.current = []; }} onAnnuler={precedent ? annulerTour : null} />}
      {visite && !partie.termine && <VisiteGuidee onFermer={fermerVisite} allerA={setOnglet} />}
      {sauvegarde && <ModaleSauvegarde mode={sauvegarde} partie={partie} decisions={decisions} onCharger={(x) => { reprendre(x); setSauvegarde(null); setMessage('Partie chargée.'); }} onImporterFichier={importer} onFermer={() => setSauvegarde(null)} />}
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
