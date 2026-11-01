import React from 'react';

/** Jauge de progression (0 à 1), avec libellé accessible. */
export default function Jauge({ valeur, couleur = 'var(--accent)', libelle }) {
  const p = Math.max(0, Math.min(1, valeur ?? 0));
  return (
    <div className="jauge" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} aria-label={libelle}>
      <div style={{ width: `${p * 100}%`, background: couleur }} />
    </div>
  );
}
