import React, { useEffect, useRef, useState } from 'react';

const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Nombre animé : passe en douceur de l'ancienne à la nouvelle valeur et
 * clignote brièvement (vert ou rouge selon que la variation est favorable).
 * Respecte la préférence « réduire les animations » du système.
 * @param {number} valeur
 * @param {function} format mise en forme (par défaut : arrondi)
 * @param {boolean} favorableSiHausse sens favorable pour la couleur du flash
 */
export default function Nombre({ valeur, format = (x) => Math.round(x), favorableSiHausse = null, duree = 650 }) {
  const [affiche, setAffiche] = useState(valeur);
  const [flash, setFlash] = useState('');
  const precedent = useRef(valeur);
  useEffect(() => {
    const depart = precedent.current;
    precedent.current = valeur;
    if (valeur === undefined || valeur === null || Number.isNaN(valeur) || depart === valeur) { setAffiche(valeur); return undefined; }
    if (favorableSiHausse !== null && Math.abs(valeur - depart) > 1e-6) setFlash((valeur > depart) === favorableSiHausse ? 'flash-bon' : 'flash-mauvais');
    if (mouvementReduit() || depart === undefined || depart === null) { setAffiche(valeur); return undefined; }
    let raf;
    const t0 = performance.now();
    const pas = (t) => {
      const k = Math.min(1, (t - t0) / duree);
      const lisse = 1 - Math.pow(1 - k, 3);
      setAffiche(depart + (valeur - depart) * lisse);
      if (k < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    const fin = setTimeout(() => setFlash(''), 1400);
    return () => { cancelAnimationFrame(raf); clearTimeout(fin); };
  }, [valeur, duree, favorableSiHausse]);
  return <span className={`nombre-anime ${flash}`}>{format(affiche)}</span>;
}
