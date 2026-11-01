import React from 'react';

const STYLE = { alerte: 'critique', attention: '', idee: 'bonne' };
const ICONE = { alerte: '🔴', attention: '🟠', idee: '💡' };

/**
 * Conseiller : urgences et opportunités du trimestre, avec un lien vers
 * l'onglet où agir. Affiché en modes Facile et Intermédiaire.
 */
export default function Conseiller({ conseils, allerA, compact = false }) {
  if (!conseils?.length) return null;
  const liste = compact ? conseils.slice(0, 3) : conseils;
  return (
    <div className="carte conseiller">
      <h3><span aria-hidden="true">🧭</span> Votre conseiller</h3>
      <div className="pile">
        {liste.map((c, i) => (
          <div key={i} className={`alerte ${STYLE[c.niveau]}`}>
            <div className="ligne espace" style={{ alignItems: 'flex-start' }}>
              <strong className="petit"><span aria-hidden="true">{ICONE[c.niveau]} </span>{c.titre}</strong>
              {c.onglet && allerA && <button type="button" className="bouton petit" onClick={() => allerA(c.onglet)}>Agir</button>}
            </div>
            {!compact && <div className="petit">{c.texte}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
