import React from 'react';
import GraphiqueLignes from '../composants/GraphiqueLignes.jsx';
import Jauge from '../composants/Jauge.jsx';
import { LIBELLES_COMPOSANTES } from '../../engine/score.js';
import { nombre, pct, signe, classeVariation, euros, devise } from '../format.js';

/** Écran de fin de partie : score pondéré, objectifs, trajectoires. */
export default function FinDePartie({ partie, onNouvelle, onExporter }) {
  const sc = partie.score;
  const h = partie.historique;
  const etiquettes = h.map((x) => x.trimestre);
  const d0 = h[0], d1 = h.at(-1);
  return (
    <div className="accueil pile">
      <h1>{partie.issue?.type === 'defaite' ? 'Fin prématurée du mandat' : 'Fin du mandat'}</h1>
      <div className={`alerte ${partie.issue?.type === 'defaite' ? 'critique' : 'bonne'}`}>{partie.issue?.texte}</div>
      {sc && (
        <div className="carte pile">
          <div className="ligne espace"><h2>Score : {sc.total}/100</h2><strong>{sc.mention}</strong></div>
          <p className="petit muet">Pondération selon le régime ({{ 'semi-presidentiel': 'semi-présidentiel', 'parlementaire-coalition': 'parlementaire de coalition', presidentiel: 'présidentiel', 'parlementaire-minoritaire': 'parlementaire minoritaire' }[partie.statique.regime] ?? partie.statique.regime}) et le mode de jeu.</p>
          {Object.entries(sc.composantes).map(([k, v]) => (
            <div key={k}>
              <div className="ligne espace petit"><span>{LIBELLES_COMPOSANTES[k]} <span className="muet">(poids {Math.round(sc.ponderations[k] * 100)} %)</span></span><span className="chiffres">{nombre(v, 0)}/100</span></div>
              <Jauge valeur={v / 100} libelle={LIBELLES_COMPOSANTES[k]} />
            </div>
          ))}
        </div>
      )}
      {(partie.succes ?? []).length > 0 && (
        <div className="carte">
          <h3>Succès obtenus ({partie.succes.length})</h3>
          <div className="ligne">{partie.succes.map((x) => <span key={x.id} className="succes-badge" title={x.description}>{x.icone} {x.nom}</span>)}</div>
        </div>
      )}
      <div className="grille-2">
        <div className="carte">
          <h3>Bilan chiffré</h3>
          <table className="petit"><tbody>
            <tr><td>Dette</td><td className="nombre">{pct(d0.dette)} → {pct(d1.dette)}</td></tr>
            <tr><td>Déficit</td><td className="nombre">{pct(d0.deficit)} → {pct(d1.deficit)}</td></tr>
            <tr><td>Chômage</td><td className="nombre">{pct(d0.chomage)} → {pct(d1.chomage)}</td></tr>
            <tr><td>Inflation</td><td className="nombre">{pct(d0.inflation)} → {pct(d1.inflation)}</td></tr>
            <tr><td>Émissions</td><td className="nombre">{nombre(d0.emissions, 0)} → {nombre(d1.emissions, 0)} Mt</td></tr>
            <tr><td>Popularité</td><td className="nombre">{pct(d0.popularite, 0)} → {pct(d1.popularite, 0)}</td></tr>
            <tr><td>Influence</td><td className="nombre">{nombre(d0.influence, 0)} → {nombre(d1.influence, 0)}</td></tr>
          </tbody></table>
        </div>
        <div className="carte">
          <h3>Objectifs</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {partie.objectifs.map((o) => <li key={o.id} className={o.statut === 'atteint' ? 'positif' : 'negatif'}>{o.statut === 'atteint' ? '✓' : '✗'} {o.nom}{o.type === 'principal' ? ' (principal)' : ''}</li>)}
          </ul>
        </div>
      </div>
      <div className="grille-2">
        <div className="carte"><GraphiqueLignes titre="Dette publique" unite="% du PIB" series={[{ id: 'd', nom: 'Dette', valeurs: h.map((x) => x.dette) }]} etiquettes={etiquettes} /></div>
        <div className="carte"><GraphiqueLignes titre="Popularité" unite="%" decimales={0} series={[{ id: 'p', nom: 'Popularité', valeurs: h.map((x) => x.popularite) }]} etiquettes={etiquettes} /></div>
      </div>
      <div className="carte">
        <h3>Ce que votre mandat a changé pour les ménages types</h3>
        <table className="petit"><tbody>{partie.menages.map((m) => (
          <tr key={m.id}><td>{m.nom}</td><td className="nombre">{euros(m.revenuNet0)} → {euros(m.revenuReel)}</td><td className={`nombre ${classeVariation(m.delta)}`}>{signe(m.delta, 0)} {devise()}/mois</td></tr>
        ))}</tbody></table>
      </div>
      <div className="ligne">
        <button type="button" className="bouton principal" onClick={onNouvelle}>Nouvelle partie</button>
        <button type="button" className="bouton" onClick={onExporter}>Exporter la partie (JSON)</button>
      </div>
    </div>
  );
}
