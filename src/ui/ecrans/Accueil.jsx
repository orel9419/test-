import React, { useState } from 'react';
import { PAYS, PAYS_A_VENIR } from '../donnees.js';
import { MODES } from '../../model/parametres.js';
import { pct } from '../format.js';

/** Écran d'accueil : choix du pays, du mode et du calendrier. */
export default function Accueil({ onDemarrer, sauvegarde, onReprendre, onImporter, theme, onTheme, message }) {
  const [pays, setPays] = useState('france');
  const [mode, setMode] = useState('realiste');
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
              <p className="petit">Dette {pct(fp.dette_pct_pib.valeur)} du PIB · déficit {pct(fp.deficit_pct_pib.valeur)} (2025) · chômage {pct(m.chomage_bit?.valeur ?? m.chomage_national_ba?.valeur)}{m.chomage_bit?.valeur ? '' : ' (définition nationale)'}</p>
              <p className="petit muet">{p.donnees.politique.dossiers_chauds.slice(0, 2).join(' · ')}</p>
            </button>
          );
        })}
      </div>
      <p className="petit muet">Bientôt : {PAYS_A_VENIR.map((p) => `${p.drapeau} ${p.nom}`).join(' · ')}</p>

      <h2>2. Mode de jeu</h2>
      <div className="choix-pays">
        {Object.entries(MODES).map(([id, m]) => (
          <button type="button" key={id} className={`carte carte-pays ${mode === id ? 'choisie' : ''}`} onClick={() => setMode(id)} aria-pressed={mode === id}>
            <strong>{m.nom}</strong>
            <p className="petit muet">{m.description}</p>
          </button>
        ))}
      </div>

      <h2>3. Calendrier</h2>
      <div className="choix-pays">
        <button type="button" className={`carte carte-pays ${calendrier === 'reel' ? 'choisie' : ''}`} onClick={() => setCalendrier('reel')} aria-pressed={calendrier === 'reel'}>
          <strong>Calendrier réel</strong>
          <p className="petit muet">{pays === 'france' ? 'La présidentielle a lieu en avril 2027 (3ᵉ tour). Si votre camp la perd, la partie s\'arrête.' : 'Les élections fédérales ont lieu au début de 2029.'}</p>
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
        <strong>Comment jouer.</strong> Un tour = un trimestre. À chaque tour, répartissez le budget entre les ministères, fixez les impôts, proposez des réformes (avec leurs compensations), agissez à l'international et tranchez les événements, puis validez. Les données de départ sont sourcées (onglet « Données et sources ») ; les paramètres du modèle sont des hypothèses documentées.
      </div>
    </div>
  );
}
