import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { creerPartie, jouerTour, apercuDecisions, previsionPolitique } from '../engine/index.js';
import { libelleTrimestre } from '../engine/calendrier.js';
import { PAYS, contexte } from './donnees.js';
import { sauvegarderLocal, chargerLocal, effacerLocal, exporterJSON, importerJSON } from './sauvegarde.js';
import { pct, nombre } from './format.js';
import Accueil from './ecrans/Accueil.jsx';
import TableauDeBord from './ecrans/TableauDeBord.jsx';
import Budget from './ecrans/Budget.jsx';
import Fiscalite from './ecrans/Fiscalite.jsx';
import Reformes from './ecrans/Reformes.jsx';
import Parlement from './ecrans/Parlement.jsx';
import Diplomatie from './ecrans/Diplomatie.jsx';
import Evenements from './ecrans/Evenements.jsx';
import Menages from './ecrans/Menages.jsx';
import Journal from './ecrans/Journal.jsx';
import Sources from './ecrans/Sources.jsx';
import FinDePartie from './ecrans/FinDePartie.jsx';
import Objectifs from './ecrans/Objectifs.jsx';
import BilanTour from './ecrans/BilanTour.jsx';

const ONGLETS = [
  { id: 'tableau', nom: 'Tableau de bord' },
  { id: 'budget', nom: 'Budget des ministères' },
  { id: 'fiscalite', nom: 'Impôts et dette' },
  { id: 'reformes', nom: 'Réformes' },
  { id: 'parlement', nom: 'Parlement' },
  { id: 'diplomatie', nom: 'Diplomatie' },
  { id: 'evenements', nom: 'Événements' },
  { id: 'menages', nom: 'Ménages' },
  { id: 'journal', nom: 'Journal' },
  { id: 'sources', nom: 'Données et sources' },
];

const DECISIONS_VIDES = { budget: {}, impots: {}, reformes: [], diplomatie: [], evenements: {}, procedureBudget: 'auto', procedureReformes: 'vote' };

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

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('cdg:theme') ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [partie, setPartie] = useState(null);
  const [decisions, setDecisions] = useState(DECISIONS_VIDES);
  const [onglet, setOnglet] = useState('tableau');
  const [bilan, setBilan] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [prevision, setPrevision] = useState(null);
  const [message, setMessage] = useState(null);
  const sauvegardeExistante = useMemo(() => chargerLocal(), []);
  const minuterie = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('cdg:theme', theme);
  }, [theme]);

  // Aperçu en temps réel des décisions (différé pour rester fluide)
  useEffect(() => {
    if (!partie || partie.termine) return;
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

  const demarrer = useCallback(({ pays, mode, calendrier }) => {
    const graine = Math.floor(Math.random() * 2 ** 31);
    const p = creerPartie({ pays, donnees: PAYS[pays].donnees, contexte, mode, graine, calendrier });
    setPartie(p);
    setDecisions(decisionsInitiales(p));
    setOnglet('tableau');
    sauvegarderLocal(p, decisionsInitiales(p));
  }, []);

  const reprendre = useCallback((s) => {
    setPartie(s.partie);
    setDecisions(s.decisions ?? decisionsInitiales(s.partie));
    setOnglet('tableau');
  }, []);

  const validerTour = useCallback(() => {
    const avant = partie;
    const apres = jouerTour(partie, decisions);
    const suivantes = decisionsInitiales(apres);
    setPartie(apres);
    setDecisions(suivantes);
    setBilan({ avant, apres });
    sauvegarderLocal(apres, suivantes);
    window.scrollTo({ top: 0 });
  }, [partie, decisions]);

  const importer = useCallback(async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      reprendre(await importerJSON(f));
      setMessage('Partie importée.');
    } catch (err) {
      setMessage(err.message);
    }
    ev.target.value = '';
  }, [reprendre]);

  const majDecisions = useCallback((modif) => setDecisions((d) => ({ ...d, ...(typeof modif === 'function' ? modif(d) : modif) })), []);

  if (!partie) {
    return (
      <Accueil
        onDemarrer={demarrer}
        sauvegarde={sauvegardeExistante}
        onReprendre={() => reprendre(sauvegardeExistante)}
        onImporter={importer}
        theme={theme}
        onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        message={message}
      />
    );
  }

  const s = partie.statique;
  const f = partie.finances;
  const nbEvenements = partie.evenements.enAttente.length;
  const props = { partie, decisions, majDecisions, apercu, prevision };

  return (
    <div>
      <header className="entete">
        <span className="titre">{s.drapeau} {s.nom}</span>
        <span className="muet petit">
          {partie.termine ? 'Mandat terminé' : `${libelleTrimestre(partie.trimestre)} · tour ${partie.tour}/${partie.nbTours}`} · {s.chefGouvernement.titre} · mode {partie.mode === 'bac_a_sable' ? 'bac à sable' : partie.mode === 'difficile' ? 'difficile' : 'réaliste'}
        </span>
        <div className="indicateurs" aria-label="Indicateurs clés">
          <div>Popularité<strong>{pct(partie.social.popularite, 0)}</strong></div>
          <div>Déficit<strong>{pct(f.deficitRatio)}</strong></div>
          <div>Dette<strong>{pct(f.detteRatio)}</strong></div>
          <div>Taux 10 ans<strong>{pct(f.taux10, 2)}</strong></div>
          <div>Chômage<strong>{pct(partie.macro.chomage)}</strong></div>
        </div>
        <div className="ligne">
          <button type="button" className="bouton" onClick={() => exporterJSON(partie, decisions)} title="Télécharger la partie au format JSON">Exporter</button>
          <label className="bouton" title="Charger une partie exportée">Importer<input type="file" accept="application/json" onChange={importer} hidden /></label>
          <button type="button" className="bouton" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-label="Changer de thème">{theme === 'dark' ? '☀︎' : '☾'}</button>
          <button type="button" className="bouton" onClick={() => { if (window.confirm('Quitter cette partie ? Elle reste sauvegardée sur cet appareil.')) setPartie(null); }}>Menu</button>
        </div>
      </header>

      {message && <div className="alerte bonne" style={{ margin: '0.6rem 1.2rem' }} role="status">{message} <button type="button" className="bouton petit" onClick={() => setMessage(null)}>OK</button></div>}

      {partie.termine ? (
        <FinDePartie partie={partie} onNouvelle={() => { effacerLocal(); setPartie(null); }} onExporter={() => exporterJSON(partie, decisions)} />
      ) : (
        <div className="mise-en-page">
          <nav className="navigation" aria-label="Sections">
            {ONGLETS.map((o) => (
              <button key={o.id} type="button" className={`onglet ${onglet === o.id ? 'actif' : ''}`} onClick={() => setOnglet(o.id)} aria-current={onglet === o.id ? 'page' : undefined}>
                <span>{o.nom}</span>
                {o.id === 'evenements' && nbEvenements > 0 && <span className="pastille">{nbEvenements}</span>}
                {o.id === 'reformes' && decisions.reformes.length > 0 && <span className="etiquette">{decisions.reformes.length}</span>}
                {o.id === 'diplomatie' && decisions.diplomatie.length > 0 && <span className="etiquette">{decisions.diplomatie.length}</span>}
              </button>
            ))}
          </nav>
          <main>
            {onglet === 'tableau' && <TableauDeBord {...props} allerA={setOnglet} />}
            {onglet === 'budget' && <Budget {...props} />}
            {onglet === 'fiscalite' && <Fiscalite {...props} />}
            {onglet === 'reformes' && <Reformes {...props} />}
            {onglet === 'parlement' && <Parlement {...props} />}
            {onglet === 'diplomatie' && <Diplomatie {...props} />}
            {onglet === 'evenements' && <Evenements {...props} />}
            {onglet === 'menages' && <Menages {...props} />}
            {onglet === 'journal' && <Journal partie={partie} />}
            {onglet === 'sources' && <Sources partie={partie} />}
          </main>
          <aside className="colonne-droite">
            <div className="carte">
              <h3>Ce trimestre</h3>
              <ul className="petit" style={{ margin: '0 0 0.7rem', paddingLeft: '1.1rem' }}>
                <li>{decisions.reformes.length} réforme(s) proposée(s)</li>
                <li>{decisions.diplomatie.length} action(s) diplomatique(s) · capital : {partie.international.capitalDiplomatique} point(s)</li>
                <li>{nbEvenements} événement(s) à trancher</li>
                {partie.trimestre.t === 4 && <li><strong>Vote du budget {partie.trimestre.annee + 1}</strong> ce trimestre</li>}
              </ul>
              {apercu && (
                <p className="petit muet">Effet estimé de vos décisions à un an : solde {apercu.unAn.soldeMd >= 0 ? '+' : '−'}{nombre(Math.abs(apercu.unAn.soldeMd), 1)} Md€, croissance {apercu.unAn.croissance >= 0 ? '+' : '−'}{nombre(Math.abs(apercu.unAn.croissance), 2)} pt, popularité {apercu.unAn.popularite >= 0 ? '+' : '−'}{nombre(Math.abs(apercu.unAn.popularite), 1)} pt.</p>
              )}
              <button type="button" className="bouton principal grand" onClick={validerTour}>Valider le trimestre</button>
            </div>
            <Objectifs partie={partie} />
          </aside>
        </div>
      )}
      {bilan && <BilanTour avant={bilan.avant} apres={bilan.apres} onFermer={() => setBilan(null)} />}
    </div>
  );
}
