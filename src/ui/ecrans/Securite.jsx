import React, { useMemo } from 'react';
import { reformesDisponibles, risqueConstitutionnel, effetOpinionReforme } from '../../engine/index.js';
import { md, pct } from '../format.js';

const CATEGORIES = { securite: 'Sécurité et justice', immigration: 'Immigration', defense: 'Défense' };

/**
 * Sécurité et justice : budget du poste « intérieur et justice » et réformes
 * régaliennes à proposer directement (police, prisons, narcotrafic, immigration,
 * service national, renseignement).
 */
export default function Securite({ partie, decisions, majDecisions, allerA }) {
  const liste = useMemo(() => reformesDisponibles(partie).filter((r) => CATEGORIES[r.categorie] && r.disponible), [partie]);
  const budget = partie.budget?.interieurJustice?.montant;
  const proposer = (r, option) => majDecisions((d) => ({ reformes: [...d.reformes.filter((x) => x.id !== r.id), { id: r.id, option }] }));
  const retirer = (r) => majDecisions((d) => ({ reformes: d.reformes.filter((x) => x.id !== r.id) }));
  const groupes = Object.keys(CATEGORIES).map((c) => [c, liste.filter((r) => r.categorie === c)]).filter(([, l]) => l.length);
  return (
    <div className="pile">
      <h2>Sécurité, justice et ordre public</h2>
      <p className="petit muet">Les missions régaliennes : protéger (police, gendarmerie, renseignement), juger (justice, prisons), contrôler les frontières. {budget ? `Budget du poste « Intérieur et justice » : ${md(budget, 1)} (${pct(budget / partie.macro.pibNominal * 100, 2)} du PIB).` : ''}</p>
      <div className="ligne">
        <button type="button" className="bouton" onClick={() => allerA?.('budget')}>Ajuster les moyens (budget)</button>
        <button type="button" className="bouton" onClick={() => allerA?.('reformes')}>Toutes les réformes</button>
      </div>
      {groupes.length === 0 && <p className="petit muet">Aucune réforme régalienne disponible pour ce pays.</p>}
      {groupes.map(([c, l]) => (
        <div key={c} className="carte pile">
          <h3 style={{ margin: 0 }}>{CATEGORIES[c]}</h3>
          <ul className="liste-populaires petit">
            {l.map((r) => {
              const proposee = decisions.reformes.find((x) => x.id === r.id);
              const option = proposee?.option ?? r.options[0].id;
              const rc = risqueConstitutionnel(partie.pays, r.id, option);
              const op = effetOpinionReforme(partie, r.id, option);
              return (
                <li key={r.id}>
                  <span>
                    <strong>{r.nom}</strong>{r.active && <span className="etiquette" style={{ marginLeft: 6 }}>en vigueur</span>}
                    <br /><span className="tres-petit muet">{r.resume}</span>
                    {r.options.length > 1 && (
                      <><br /><select className="tres-petit" value={option} onChange={(ev) => proposer(r, ev.target.value)} aria-label={`Option pour ${r.nom}`}>
                        {r.options.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
                      </select></>
                    )}
                  </span>
                  <span className="ligne" style={{ gap: '0.3rem' }}>
                    {Math.abs(op) >= 0.5 && <span className={`etiquette ${op > 0 ? 'populaire' : 'impopulaire'}`}>{op > 0 ? '👍 +' : '👎 −'}{Math.abs(op).toFixed(1).replace('.', ',')} pt</span>}
                    {rc && <span className={`etiquette constitution ${rc.risque >= 0.35 ? 'eleve' : ''}`} title={`${rc.motif} ${rc.precedent}`}>⚖️ {Math.round(rc.risque * 100)} %</span>}
                  </span>
                  {proposee
                    ? <button type="button" className="bouton" onClick={() => retirer(r)}>Retirer</button>
                    : <button type="button" className="bouton principal" onClick={() => proposer(r, option)}>Proposer</button>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="tres-petit muet">Les réformes proposées ici passent au Parlement à la fin du trimestre, avec les autres. Détails, arguments et chiffrage : onglet Réformes.</p>
    </div>
  );
}
