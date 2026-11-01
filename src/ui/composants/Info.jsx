import React, { useId, useState } from 'react';

/** Infobulle pédagogique : s'affiche au survol et au focus clavier. */
export default function Info({ texte }) {
  const [ouverte, setOuverte] = useState(false);
  const id = useId();
  if (!texte) return null;
  return (
    <span className="info" onMouseEnter={() => setOuverte(true)} onMouseLeave={() => setOuverte(false)}>
      <button type="button" aria-describedby={id} aria-label="Explication" onFocus={() => setOuverte(true)} onBlur={() => setOuverte(false)} onClick={() => setOuverte((o) => !o)}>?</button>
      {ouverte && <span role="tooltip" id={id} className="bulle">{texte}</span>}
    </span>
  );
}
