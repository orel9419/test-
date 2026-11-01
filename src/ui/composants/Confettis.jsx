import React, { useEffect, useRef } from 'react';

/**
 * Pluie de confettis pour célébrer un succès (élection gagnée, objectif
 * atteint, Jeux réussis). Dessinée sur un canevas, sans bibliothèque ;
 * désactivée si l'utilisateur préfère réduire les animations.
 */
export default function Confettis({ declencheur }) {
  const canevas = useRef(null);
  useEffect(() => {
    if (!declencheur) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const c = canevas.current;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const couleurs = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6'];
    const morceaux = Array.from({ length: 140 }, () => ({
      x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.4, y: c.height * 0.35,
      vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      l: 6 + Math.random() * 6, h: 3 + Math.random() * 4, c: couleurs[Math.floor(Math.random() * couleurs.length)],
    }));
    let raf; const t0 = performance.now();
    const image = (t) => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const m of morceaux) {
        m.vy += 0.35; m.vx *= 0.99; m.x += m.vx; m.y += m.vy; m.r += m.vr;
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.r); ctx.fillStyle = m.c; ctx.fillRect(-m.l / 2, -m.h / 2, m.l, m.h); ctx.restore();
      }
      if (t - t0 < 2600) raf = requestAnimationFrame(image); else ctx.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(image);
    return () => cancelAnimationFrame(raf);
  }, [declencheur]);
  return <canvas ref={canevas} className="confettis" aria-hidden="true" />;
}
