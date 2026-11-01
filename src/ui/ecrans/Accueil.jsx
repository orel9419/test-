import React, { useState } from 'react';
import { PAYS, PAYS_A_VENIR } from '../donnees.js';
import { MODES } from '../../model/parametres.js';
import { pct } from '../format.js';

/** Écran d'accueil : choix du pays, du mode et du calendrier. */
export default function Accueil({ onDemarrer, sauvegarde, onReprendre, onImporter, theme, onTheme, message }) {
  const [pays, setPays] = useState('france');
  const [mode, setMode] = useState('intermediaire');
  const [calendrier, setCalendrier] = useState('reel');
  const d = PAYS[pays].donnees;
  return (
    <div className="accueil pile">
      <div className="ligne espace">
        <div>
          <h1>🏛️ Chef de gouvernement</h1>
          <p className="muet">Gouvernez un pays réel à partir de sa situation au {new Date(d.meta.derniere_mise_a_jour).toLocaleDateString('fr-FR')} : budget, dette, réformes, Parlement, Europe et diplomatie.</p>
        </div>
        <button type="button" className="bouton" onClick={onTheme} aria-label="Changer de thème">{theme === 'dark' ? '☀︎ Thème clair' : '☾ Thème sombre'}</button>
      </div>

      {message && <div className="alerte" role="status">{message}</div>}
      {sauvegarde && (
        <div className="carte ligne espace">
          <span>Partie en cours : {PAYS[sauvegarde.partie.pays]?.donnees.meta.nom}, tour {sauvegarde.partie.tour} (sauvegardée le {new Date(sauvegarde.date).toLocaleString('fr-FR')}).</span>
          <button type="button" className="bouton principal" onClick={onReprendre}>Reprendre</button>
        </div>
      )}

      <h2>1. Choisissez un pays</h2>
      <div className="choix-pays">
        {Object.entries(PAYS).map(([id, p]) => {
          const m = p.donnees.macro, fp = p.donnees.finances_publiques;
          return (
            <button type="button" key={id} className={`carte carte-pays ${pays === id ? 'choisie' : ''}`} onClick={() => setPays(id)} aria-pressed={pays === id}>
              <div className="ligne"><span className="drapeau">{p.donnees.meta.drapeau}</span><strong style={{ fontSize: '1.15rem' }}>{p.donnees.meta.nom}</strong></div>
              <p className="petit muet">{p.regimeLibelle} · {p.role} · mandat de {p.mandat}</p>
              {id === 'etatsUnis'
                ? <p className="petit">Dette fédérale détenue par le public {pct(fp.dette_detenue_public.valeur / m.pib_nominal.valeur * 100, 0)} du PIB · déficit fédéral {pct(fp.deficit_md.valeur / m.pib_nominal.valeur * 100)} · chômage {pct(m.chomage.valeur)}</p>
                : <p className="petit">Dette {pct(fp.dette_pct_pib.valeur)} du PIB · déficit {pct(fp.deficit_pct_pib.valeur)} (2025) · chômage {pct(m.chomage_bit?.valeur ?? m.chomage_national_ba?.valeur)}{m.chomage_bit?.valeur ? '' : ' (définition nationale)'}</p>}
              <p className="petit muet">{p.donnees.politique.dossiers_chauds.slice(0, 2).join(' · ')}</p>
            </button>
          );
        })}
      </div>
      <p className="petit muet">Bientôt : {PAYS_A_VENIR.map((p) => `${p.drapeau} ${p.nom}`).join(' · ')}</p>

      <h2>2. Mode de jeu</h2>
      <div className="choix-pays">
        {Object.entries(MODES).map(([id, m]) => (
          <button type="button" key={id} className={`carte carte-pays mode-${id} ${mode === id ? 'choisie' : ''}`} onClick={() => setMode(id)} aria-pressed={mode === id}>
            <div className="ligne"><span className="drapeau" aria-hidden="true">{{ facile: '🌱', intermediaire: '⚖️', expert: '🔥' }[id]}</span><strong style={{ fontSize: '1.1rem' }}>{m.nom}</strong></div>
            <p className="petit muet">{m.description}</p>
            <ul className="tres-petit" style={{ margin: 0, paddingLeft: '1rem' }}>
              <li>Conseiller : {m.conseiller ? 'oui' : 'non'}</li>
              <li>Défaites : {m.defaitesActives ? 'actives' : 'désactivées'}</li>
              <li>Prévisions de vote : {m.previsionsExactes ? 'exactes' : 'incertaines'}</li>
              <li>Événements simultanés : {m.maxEvenements} au plus</li>
            </ul>
          </button>
        ))}
      </div>

      <h2>3. Calendrier</h2>
      <div className="choix-pays">
        <button type="button" className={`carte carte-pays ${calendrier === 'reel' ? 'choisie' : ''}`} onClick={() => setCalendrier('reel')} aria-pressed={calendrier === 'reel'}>
          <strong>Calendrier réel</strong>
          <p className="petit muet">{pays === 'france' ? 'La présidentielle a lieu en avril 2027 (3ᵉ tour). Si votre camp la perd, la partie s\'arrête.' : pays === 'etatsUnis' ? 'Mi-mandat le 3 novembre 2026, présidentielle le 7 novembre 2028 : le président sortant ne peut pas se représenter, le scrutin juge votre bilan.' : 'Les élections fédérales ont lieu au début de 2029.'}</p>
        </button>
        <button type="button" className={`carte carte-pays ${calendrier === 'mandat_complet' ? 'choisie' : ''}`} onClick={() => setCalendrier('mandat_complet')} aria-pressed={calendrier === 'mandat_complet'}>
          <strong>Mandat complet</strong>
          <p className="petit muet">On suppose que votre camp conserve le pouvoir : l'élection est jugée en fin de mandat sur votre bilan.</p>
        </button>
      </div>

      <div className="ligne">
        <button type="button" className="bouton principal" style={{ padding: '0.8rem 1.6rem', fontSize: '1.05rem' }} onClick={() => onDemarrer({ pays, mode, calendrier })}>Prendre ses fonctions</button>
        <label className="bouton">Importer une partie (JSON)<input type="file" accept="application/json" onChange={onImporter} hidden /></label>
      </div>

      <div className="carte petit muet">
        <strong>Comment jouer.</strong> Un tour = un trimestre. À chaque tour, répartissez le budget entre les ministères, fixez les impôts, proposez des réformes (avec leurs compensations), pilotez les participations de l'État et les fleurons, agissez à l'international, préparez les grands rendez-vous et tranchez les événements, puis validez (Ctrl + Entrée). Les données de départ sont sourcées (onglet « Données et sources ») ; les paramètres du modèle sont des hypothèses documentées.
      </div>
    </div>
  );
}
