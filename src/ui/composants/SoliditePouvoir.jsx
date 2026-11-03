import React from 'react';
import Info from './Info.jsx';
import { soliditePouvoir } from '../../engine/index.js';
import { nombre, pct } from '../format.js';

/**
 * Carte d'accueil « Solidité du pouvoir » : score de synthèse, popularité,
 * prochaine élection décisive, menace parlementaire, et raccourcis pour agir.
 */
export default function SoliditePouvoir({ partie, allerA }) {
  const s = soliditePouvoir(partie);
  const e = s.election;
  return (
    <div className={`carte hero-pouvoir ${s.classe}`}>
      <div className="hero-score">
        <span className="tres-petit">Solidité du pouvoir <Info texte="Indicateur de jeu qui combine votre popularité, votre marge à la prochaine élection décisive et la menace au Parlement (censure en France, coalition en Allemagne, Congrès aux États-Unis)." /></span>
        <span className="hero-valeur chiffres">{s.score}<span className="tres-petit">/100</span></span>
        <span className="hero-etat"><span aria-hidden="true">{s.icone}</span> {s.libelle}</span>
      </div>
      <div className="hero-blocs">
        <div>
          <span className="tres-petit muet">Popularité</span>
          <strong className="chiffres">{pct(s.popularite, 0)}</strong>
          <span className={`tres-petit ${s.variation > 0.05 ? 'positif' : s.variation < -0.05 ? 'negatif' : 'muet'}`}>{s.variation > 0.05 ? '▲' : s.variation < -0.05 ? '▼' : '='} {nombre(Math.abs(s.variation), 1)} pt ce trimestre</span>
        </div>
        {e && (
          <div>
            <span className="tres-petit muet">{e.nom}{e.dans > 0 ? ` dans ${e.dans} trimestre${e.dans > 1 ? 's' : ''}` : ' ce trimestre'}</span>
            <strong className={`chiffres ${e.marge >= 0 ? 'positif' : 'negatif'}`}>{pct(e.projection, 1)}</strong>
            <span className="tres-petit muet">{e.marge >= 0 ? `${nombre(e.marge, 1)} pt d'avance` : `${nombre(-e.marge, 1)} pt de retard`} sur la majorité</span>
          </div>
        )}
        {s.menace && (
          <div>
            <span className="tres-petit muet">Parlement</span>
            <strong className={s.menace.niveau === 'critique' ? 'negatif' : s.menace.niveau === 'bon' ? 'positif' : ''}>{s.menace.niveau === 'critique' ? 'Menace forte' : s.menace.niveau === 'attention' ? 'Sous tension' : 'Sous contrôle'}</strong>
            <span className="tres-petit muet">{s.menace.texte}</span>
          </div>
        )}
      </div>
      <div className="hero-actions">
        <button type="button" className="bouton principal" onClick={() => allerA?.('communication')}>🎤 Remonter dans l'opinion</button>
        <button type="button" className="bouton" onClick={() => allerA?.('reformes')}>📜 Réformer</button>
      </div>
    </div>
  );
}
