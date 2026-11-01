import React from 'react';
import Info from '../composants/Info.jsx';
import { euros, signe, classeVariation, nombre } from '../format.js';

/** Ménages types : effet concret des décisions, en euros par mois. */
export default function Menages({ partie, apercu }) {
  return (
    <div className="pile">
      <h2>Ménages types</h2>
      <p className="petit muet">Des cas concrets pour voir ce que vos décisions changent dans la vie des gens. Les montants sont en euros par mois ; le « pouvoir d'achat » corrige de la hausse des prix, propre à chaque ménage (un gros budget énergie pèse plus quand le gaz flambe). Le salaire minimum et la pension moyenne sont sourcés ; les autres revenus sont des ordres de grandeur illustratifs.</p>
      <div className="grille-2">
        {partie.menages.map((m) => {
          const prevu = apercu?.unAn?.menages?.[m.id];
          return (
            <div key={m.id} className="carte pile">
              <div className="ligne espace"><strong>{m.nom}</strong>{m.note && <Info texte={m.note} />}</div>
              <div className="ligne espace petit"><span>Revenu net au départ</span><span className="chiffres">{euros(m.revenuNet0)}</span></div>
              <div className="ligne espace petit"><span>Revenu net actuel (euros courants)</span><span className="chiffres">{euros(m.revenuNominal)}</span></div>
              <div className="ligne espace"><span>Pouvoir d'achat (euros du départ)</span><strong className={`chiffres ${classeVariation(m.delta)}`}>{euros(m.revenuReel)} ({signe(m.delta, 0)} €, {signe(m.variationPct, 1)} %)</strong></div>
              {prevu !== undefined && Math.abs(prevu) >= 0.5 && <div className="petit">Effet estimé de vos décisions en préparation, dans un an : <strong className={classeVariation(prevu)}>{signe(prevu, 0)} €/mois</strong></div>}
              <details>
                <summary>D'où vient la variation ?</summary>
                <table className="petit" style={{ marginTop: '0.3rem' }}>
                  <tbody>
                    {m.details.map((d, i) => (
                      <tr key={i}>
                        <td>{d.cause}{d.sousDetail && (Math.abs(d.sousDetail.energie) >= 1 || Math.abs(d.sousDetail.tva) >= 1) && <div className="tres-petit muet">dont énergie {signe(d.sousDetail.energie, 0)} €, TVA {signe(d.sousDetail.tva, 0)} €</div>}</td>
                        <td className={`nombre ${classeVariation(d.montant)}`}>{signe(d.montant, 0)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
              <span className={`badge ${m.statut === 'estimation' ? 'estimation' : 'officiel'}`}>{m.statut === 'estimation' ? 'revenu illustratif' : 'revenu sourcé'}</span>
            </div>
          );
        })}
      </div>
      <p className="tres-petit muet">Indice des prix depuis le départ : {nombre(partie.macro.niveauPrix, 1)} (100 au départ).</p>
    </div>
  );
}
