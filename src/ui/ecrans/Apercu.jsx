import React from 'react';
import { signe, classeVariation, devise } from '../format.js';
import { GROUPES } from '../../model/ministeres.js';

/** Panneau d'impact estimé des décisions en préparation (comparaison avec / sans). */
export default function Apercu({ apercu, partie, titre = 'Impact estimé de vos décisions' }) {
  if (!apercu) return <div className="carte petit muet">Calcul de l'impact…</div>;
  const ligne = (libelle, a, b, d = 1, unite = '', favorable = true) => (
    <tr>
      <td>{libelle}</td>
      <td className={`nombre ${classeVariation(a, favorable)}`}>{signe(a, d, unite)}</td>
      <td className={`nombre ${classeVariation(b, favorable)}`}>{signe(b, d, unite)}</td>
    </tr>
  );
  const u = apercu.unAn, i = apercu.immediat;
  return (
    <div className="carte">
      <h3>{titre}</h3>
      <p className="tres-petit muet">Différence avec une politique inchangée, à contexte mondial identique. Les effets différés (recherche, éducation, transition) apparaissent sur plusieurs années.</p>
      <table className="petit">
        <thead><tr><th></th><th className="nombre">Ce trimestre</th><th className="nombre">Dans un an</th></tr></thead>
        <tbody>
          {ligne(`Solde public (Md${devise()}/an)`, i.soldeMd, u.soldeMd, 1)}
          {ligne('Déficit (pt de PIB)', -i.deficitPct, -u.deficitPct, 2, '', false)}
          {ligne('Dette (pt de PIB)', i.dettePct, u.dettePct, 2, '', false)}
          {ligne('PIB (%)', i.pib, u.pib, 2)}
          {ligne('Inflation (pt)', i.inflation, u.inflation, 2, '', false)}
          {ligne('Chômage (pt)', i.chomage, u.chomage, 2, '', false)}
          {ligne('Popularité (pt)', i.popularite, u.popularite, 1)}
          {ligne('Risque social (pt)', i.risqueSocial, u.risqueSocial, 1, '', false)}
        </tbody>
      </table>
      <details style={{ marginTop: '0.5rem' }}>
        <summary>Détail par groupe et par ménage type (dans un an)</summary>
        <table className="petit">
          <tbody>
            {Object.entries(u.groupes).map(([g, v]) => <tr key={g}><td>{GROUPES[g].nom}</td><td className={`nombre ${classeVariation(v)}`}>{signe(v, 1)} pt</td></tr>)}
            {partie.menages.map((m) => <tr key={m.id}><td>{m.nom}</td><td className={`nombre ${classeVariation(u.menages[m.id])}`}>{signe(u.menages[m.id], 0)} {devise()}/mois</td></tr>)}
          </tbody>
        </table>
      </details>
      <p className="tres-petit muet" style={{ marginTop: '0.4rem' }}>Solde : un nombre positif signifie moins de déficit.</p>
    </div>
  );
}
