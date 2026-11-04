import React, { useEffect, useRef } from 'react';

/** Fenêtre modale accessible : titre, fermeture par Échap ou par le bouton, focus initial. */
export default function Modale({ titre, onFermer, children, largeur = 560 }) {
  const ref = useRef(null);
  const id = useRef(`modale-${Math.random().toString(36).slice(2)}`).current;
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby={id} onKeyDown={(ev) => ev.key === 'Escape' && onFermer()} onClick={(ev) => ev.target === ev.currentTarget && onFermer()}>
      <div className="modale pile entree-modale" style={{ maxWidth: largeur }} ref={ref} tabIndex={-1}>
        <div className="ligne espace">
          <h2 id={id} style={{ margin: 0 }}>{titre}</h2>
          <button type="button" className="bouton" onClick={onFermer} aria-label="Fermer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
