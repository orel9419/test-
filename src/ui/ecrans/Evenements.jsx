import React from 'react';

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
            <h3>{e.titre}</h3>
            <p>{e.description}</p>
            <div role="radiogroup" aria-label={e.titre}>
              {e.choix.map((c) => (
                <label key={c.id} className={`option ${choix === c.id ? 'choisie' : ''}`}>
                  <input type="radio" name={`ev-${e.id}`} checked={choix === c.id} onChange={() => majDecisions((d) => ({ evenements: { ...d.evenements, [e.id]: c.id } }))} />
                  <span>{c.texte}</span>
                </label>
              ))}
            </div>
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
