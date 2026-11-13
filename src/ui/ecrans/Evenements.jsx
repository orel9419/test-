import React from 'react';
import { previsionOpex } from '../../engine/index.js';
import { OPEX, SOURCES_OPEX } from '../../data/opex.js';
import { md } from '../format.js';

/** Opération extérieure : forces demandées par un choix (disponibles ou non), chances de succès et coût. */
function ForcesPrevues({ partie, opex, unites }) {
  const p = previsionOpex(partie, opex, unites);
  if (!p) return null;
  return (
    <span className="forces-prevues tres-petit">
      <span className="ligne" style={{ gap: '0.25rem', flexWrap: 'wrap' }}>
        {p.engageables.map((u) => <span key={u.id} className="etiquette bonne">{u.icone} {u.court}</span>)}
        {p.indisponibles.map((u) => <span key={u.id} className="etiquette critique" title={u.motif}>{u.icone} {u.court} : {u.motif}</span>)}
      </span>
      {p.engageables.length
        ? <span>Chances de succès estimées : <strong>{Math.round(p.chance * 100)} %</strong> · coût : environ {md(p.cout, 2)} sur {p.duree} trimestre{p.duree > 1 ? 's' : ''} · les unités rentrent ensuite en métropole pour se remettre en condition.</span>
        : <span className="negatif">Aucune de ces forces n'est disponible : l'opération ne pourra pas partir.</span>}
    </span>
  );
}

/** Événements à trancher ce trimestre. Sans choix explicite, la première option s'applique. */
export default function Evenements({ partie, decisions, majDecisions }) {
  const ev = partie.evenements.enAttente;
  const historique = partie.evenements.historique;
  return (
    <div className="pile">
      <h2>Événements</h2>
      {ev.length === 0 && <div className="carte petit muet">Aucun événement à trancher ce trimestre.</div>}
      {ev.map((e) => {
        const choix = decisions.evenements[e.id] ?? e.choix[0].id;
        return (
          <div key={e.id} className="carte pile">
            <h3>{e.opex ? '🎖️ ' : ''}{e.titre}</h3>
            <p>{e.description}</p>
            {e.opex && <p className="tres-petit muet" style={{ margin: 0 }}>Opération extérieure : décision du président, chef des armées. Les forces engagées partent pour plusieurs trimestres, coûtent et s'usent ; l'issue (succès ou échec) est connue à la fin. Chances, coûts et effets : hypothèses de jeu.</p>}
            <div role="radiogroup" aria-label={e.titre}>
              {e.choix.map((c) => (
                <label key={c.id} className={`option ${choix === c.id ? 'choisie' : ''}`}>
                  <input type="radio" name={`ev-${e.id}`} checked={choix === c.id} onChange={() => majDecisions((d) => ({ evenements: { ...d.evenements, [e.id]: c.id } }))} />
                  <span>{c.texte}{c.unites && e.opex && <ForcesPrevues partie={partie} opex={e.opex} unites={c.unites} />}</span>
                </label>
              ))}
            </div>
            {e.opex && OPEX[e.opex] && <p className="tres-petit muet" style={{ margin: 0 }}>Sources : {OPEX[e.opex].sources.map((s, i) => <span key={s}>{i > 0 && ' · '}<a href={SOURCES_OPEX[s].url} target="_blank" rel="noreferrer">{SOURCES_OPEX[s].titre}</a></span>)}</p>}
          </div>
        );
      })}
      {historique.length > 0 && (
        <div className="carte">
          <h3>Événements passés</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {historique.slice().reverse().map((h, i) => <li key={i}>Tour {h.tour} · {h.titre} — {h.texteChoix}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
