import React from 'react';
import Info from './Info.jsx';

/** Petite courbe sans axes pour une tuile d'indicateur. */
function Mini({ valeurs }) {
  if (!valeurs || valeurs.length < 2) return null;
  const min = Math.min(...valeurs), max = Math.max(...valeurs);
  const l = 120, h = 26, et = max - min || 1;
  const pts = valeurs.map((v, i) => `${(i / (valeurs.length - 1)) * l},${h - 2 - ((v - min) / et) * (h - 4)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${l} ${h}`} width="100%" height={h} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--serie-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Tuile d'indicateur : valeur, variation depuis le trimestre précédent, mini-courbe. */
export default function Tuile({ libelle, valeur, variation, classe = '', info, serie, alerte }) {
  return (
    <div className="tuile" style={alerte ? { borderColor: 'var(--critique)' } : undefined}>
      <span className="libelle">{libelle}<Info texte={info} /></span>
      <span className="valeur chiffres">{valeur}</span>
      {variation !== undefined && <span className={`variation ${classe}`}>{variation}</span>}
      <Mini valeurs={serie} />
    </div>
  );
}
