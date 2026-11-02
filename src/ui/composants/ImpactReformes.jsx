import React, { useMemo, useState } from 'react';
import Info from './Info.jsx';
import { bilanReformes } from '../../engine/index.js';
import { nombre, devise } from '../format.js';

const signeFixe = (x, d) => (Math.abs(x) < 0.5 * 10 ** -d ? '—' : `${x > 0 ? '+' : '−'}${nombre(Math.abs(x), d)}`);
const classe = (x, favorableSiPositif = true) => (Math.abs(x) < 1e-6 ? 'muet' : (x > 0) === favorableSiPositif ? 'positif' : 'negatif');

/**
 * « Impact de vos réformes » : effet annuel de chaque réforme en vigueur
 * (solde public, emploi, croissance potentielle, émissions), avec le total.
 * Les réformes adoptées mais pas encore en vigueur sont listées à part.
 */
export default function ImpactReformes({ partie, allerA }) {
  const [tout, setTout] = useState(false);
  const lignes = useMemo(() => bilanReformes(partie), [partie]);
  const actives = lignes.filter((l) => l.appliquee).sort((a, b) => Math.abs(b.solde) + Math.abs(b.emploi) * 10 - Math.abs(a.solde) - Math.abs(a.emploi) * 10);
  const attente = lignes.filter((l) => !l.appliquee);
  const total = actives.reduce((t, l) => ({ solde: t.solde + l.solde, emploi: t.emploi + l.emploi, chomage: t.chomage + l.chomage, croissance: t.croissance + l.croissance, emissions: t.emissions + l.emissions, pret: t.pret + l.pret }), { solde: 0, emploi: 0, chomage: 0, croissance: 0, emissions: 0, pret: 0 });
  const k = partie.intensiteReformes ?? 1;
  const visibles = tout ? actives : actives.slice(0, 8);
  const trimestre = (tour) => {
    const n = partie.trimestre.annee * 4 + partie.trimestre.t - 1 + (tour - partie.tour);
    return `T${(n % 4) + 1} ${Math.floor(n / 4)}`;
  };

  return (
    <div className="carte">
      <h3>Impact de vos réformes <Info texte={`Effet annuel de chaque réforme en vigueur, ce trimestre : solde public (recettes moins dépenses, en Md${devise()} par an ; un prêt de l'État augmente la dette sans creuser le déficit), population active, chômage structurel, croissance potentielle et émissions évitées. ${k > 1 ? `Effets accentués : × ${nombre(k, 0)} sur l'emploi, la croissance, les émissions et l'influence, réactions de l'opinion × ${nombre(Math.sqrt(k), 1)}.` : 'Effets au calibrage « réaliste ».'}`} /></h3>
      {actives.length === 0 && attente.length === 0 && (
        <p className="petit muet">Aucune réforme adoptée pour l'instant. <button type="button" className="lien" onClick={() => allerA?.('reformes')}>Voir le catalogue</button></p>
      )}
      {actives.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="petit">
            <thead>
              <tr><th>Réforme</th><th className="nombre">Solde public</th><th className="nombre">Actifs</th><th className="nombre">Chômage struct.</th><th className="nombre">Croissance pot.</th><th className="nombre">Émissions</th></tr>
            </thead>
            <tbody>
              {visibles.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.nom}</strong><div className="tres-petit muet">{l.option}{l.note ? ` · ${l.note}` : ''}{l.pret > 0.05 ? ` · prêt de l'État ${nombre(l.pret, 1)} Md${devise()}/an` : ''}</div></td>
                  <td className={`nombre chiffres ${classe(l.solde)}`}>{signeFixe(l.solde, 1)}</td>
                  <td className={`nombre chiffres ${classe(l.emploi)}`}>{signeFixe(l.emploi, 2)}{Math.abs(l.emploi) >= 0.005 ? ' %' : ''}</td>
                  <td className={`nombre chiffres ${classe(l.chomage, false)}`}>{signeFixe(l.chomage, 2)}{Math.abs(l.chomage) >= 0.005 ? ' pt' : ''}</td>
                  <td className={`nombre chiffres ${classe(l.croissance)}`}>{signeFixe(l.croissance, 3)}{Math.abs(l.croissance) >= 0.0005 ? ' pt' : ''}</td>
                  <td className={`nombre chiffres ${classe(l.emissions)}`}>{signeFixe(-l.emissions, 1)}{Math.abs(l.emissions) >= 0.05 ? ' Mt' : ''}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--axe)' }}>
                <td><strong>Total ({actives.length} réforme{actives.length > 1 ? 's' : ''})</strong></td>
                <td className={`nombre chiffres ${classe(total.solde)}`}><strong>{signeFixe(total.solde, 1)}</strong></td>
                <td className={`nombre chiffres ${classe(total.emploi)}`}><strong>{signeFixe(total.emploi, 2)}</strong></td>
                <td className={`nombre chiffres ${classe(total.chomage, false)}`}><strong>{signeFixe(total.chomage, 2)}</strong></td>
                <td className={`nombre chiffres ${classe(total.croissance)}`}><strong>{signeFixe(total.croissance, 3)}</strong></td>
                <td className={`nombre chiffres ${classe(total.emissions)}`}><strong>{signeFixe(-total.emissions, 1)}</strong></td>
              </tr>
            </tbody>
          </table>
          <p className="tres-petit muet">Solde en Md{devise()} par an (positif = moins de déficit). Actifs : variation de la population active. Émissions : MtCO2e par an (négatif = émissions évitées).</p>
          {actives.length > 8 && <button type="button" className="lien petit" onClick={() => setTout(!tout)}>{tout ? 'Afficher moins' : `Afficher les ${actives.length} réformes`}</button>}
        </div>
      )}
      {attente.length > 0 && (
        <p className="petit"><strong>Adoptées, pas encore en vigueur :</strong> {attente.map((l) => `${l.nom} (${trimestre(l.tourApplication)})`).join(' ; ')}.</p>
      )}
    </div>
  );
}
