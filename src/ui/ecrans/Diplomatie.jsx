import React, { useMemo, useState } from 'react';
import { actionsDisponibles } from '../../engine/index.js';
import { PARTENAIRES } from '../../data/diplomatie.js';
import Info from '../composants/Info.jsx';
import G7 from './G7.jsx';
import { nombre, md } from '../format.js';

/** Barre de relation divergente (−100 à +100). */
function Relation({ valeur }) {
  const l = (Math.abs(valeur) / 100) * 50;
  return (
    <div className="barre-fond" style={{ width: '100%' }}>
      <div style={{ left: valeur >= 0 ? '50%' : `${50 - l}%`, width: `${l}%`, background: valeur >= 0 ? 'var(--divergent-pos)' : 'var(--divergent-neg)' }} />
      <div style={{ left: '50%', width: 1, background: 'var(--encre-attenuee)' }} />
    </div>
  );
}

export default function Diplomatie({ partie, decisions, majDecisions }) {
  const i = partie.international;
  const actions = useMemo(() => actionsDisponibles(partie), [partie]);
  const [options, setOptions] = useState({});
  const coutEngage = decisions.diplomatie.reduce((s, a) => s + (actions.find((x) => x.id === a.id)?.cout ?? 0), 0);
  // Le sommet du G7 (bilatérales, préparation) passe avant les autres initiatives
  const coutG7 = (decisions.g7?.bilaterales?.length ?? 0) + (decisions.g7Preparation ? 1 : 0);
  const restant = i.capitalDiplomatique - coutEngage - coutG7;
  const basculer = (a) => {
    const deja = decisions.diplomatie.find((x) => x.id === a.id);
    if (deja) majDecisions((d) => ({ diplomatie: d.diplomatie.filter((x) => x.id !== a.id) }));
    else majDecisions((d) => ({ diplomatie: [...d.diplomatie, { id: a.id, option: options[a.id] ?? a.options?.[0]?.id }] }));
  };
  return (
    <div className="pile">
      <h2>Diplomatie et coopération</h2>
      {partie.g7 && <G7 partie={partie} decisions={decisions} majDecisions={majDecisions} capitalRestant={i.capitalDiplomatique - coutEngage} />}
      <div className="grille-2">
        <div className="carte">
          <h3>Relations <Info texte="De −100 (hostile) à +100 (allié proche). Elles évoluent selon vos initiatives et votre politique budgétaire (les partenaires européens surveillent votre déficit), puis reviennent lentement vers leur niveau de départ." /></h3>
          <table className="petit">
            <tbody>{Object.entries(i.relations).sort((a, b) => b[1] - a[1]).map(([p, v]) => (
              <tr key={p}><td style={{ width: '45%' }}>{PARTENAIRES[p] ?? p}</td><td style={{ width: '40%' }}><Relation valeur={v} /></td><td className="nombre">{nombre(v, 0)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="carte pile">
          <h3>Influence internationale : {nombre(i.influence, 0)}/100</h3>
          <p className="petit">Capital diplomatique disponible ce trimestre : <strong>{i.capitalDiplomatique}</strong> point(s), dont <strong>{Math.max(0, restant)}</strong> non engagé(s). Vous en regagnez 2 par trimestre (3 si l'influence dépasse 70).</p>
          {i.safe > 0 && <p className="petit">Dette de défense financée par les prêts européens SAFE : {md(i.safe, 1)}.</p>}
          {i.facteurEnergie < 1 && <p className="petit">Accords énergétiques : prix de l'énergie importée réduit de {nombre((1 - i.facteurEnergie) * 100, 1)} %.</p>}
          {i.recettesExterieures !== 0 && <p className="petit">Effet net des accords européens sur le budget : {md(i.recettesExterieures, 1)} par an.</p>}
          <h3 style={{ marginTop: '0.6rem' }}>Actions réalisées</h3>
          {i.actionsRealisees.length === 0 ? <p className="petit muet">Aucune pour l'instant.</p> : (
            <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {i.actionsRealisees.slice(-8).reverse().map((a, k) => <li key={k}>Tour {a.tour} : {actions.find((x) => x.id === a.id)?.nom ?? a.id} — {a.reussite ? 'réussite' : 'échec'}</li>)}
            </ul>
          )}
        </div>
      </div>

      <h3>Initiatives possibles</h3>
      {actions.map((a) => {
        const choisie = decisions.diplomatie.some((x) => x.id === a.id);
        const impossible = !choisie && a.cout > restant;
        return (
          <div key={a.id} className="carte pile">
            <div className="ligne espace"><strong>{a.nom}</strong><span className="etiquette">{a.cout} point(s)</span></div>
            <p className="petit">{a.description}</p>
            {a.options && (
              <div className="ligne">
                {a.options.map((o) => (
                  <label key={o.id} className={`option ${(options[a.id] ?? a.options[0].id) === o.id ? 'choisie' : ''}`}>
                    <input type="radio" name={`dipl-${a.id}`} checked={(options[a.id] ?? a.options[0].id) === o.id} disabled={choisie}
                      onChange={() => setOptions((x) => ({ ...x, [a.id]: o.id }))} />
                    <span className="petit">{o.nom}</span>
                  </label>
                ))}
              </div>
            )}
            <div><button type="button" className={`bouton ${choisie ? '' : 'principal'}`} onClick={() => basculer(a)} disabled={impossible}>{choisie ? 'Annuler' : impossible ? 'Capital insuffisant' : 'Engager ce trimestre'}</button></div>
          </div>
        );
      })}
    </div>
  );
}
