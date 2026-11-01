import React, { useMemo, useRef, useState } from 'react';
import { nombre } from '../format.js';

const COULEURS = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)', 'var(--serie-4)', 'var(--serie-5)', 'var(--serie-6)', 'var(--serie-7)', 'var(--serie-8)'];

/** Graduations « rondes » pour l'axe vertical. */
function graduations(min, max, n = 4) {
  if (min === max) { min -= 1; max += 1; }
  const brut = (max - min) / n;
  const p = Math.pow(10, Math.floor(Math.log10(brut)));
  const pas = [1, 2, 2.5, 5, 10].map((k) => k * p).find((k) => k >= brut) ?? brut;
  const debut = Math.floor(min / pas) * pas;
  const fin = Math.ceil(max / pas) * pas;
  const t = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) t.push(Math.round(v * 1e6) / 1e6);
  return t;
}

/** Étiquettes directes en fin de courbe, écartées verticalement pour ne pas se chevaucher. */
function etiquettesFin(series, x, y) {
  const e = series.map((s) => {
    const k = s.valeurs.length - 1;
    return { id: s.id, nom: s.nom, x: x(k), y: y(s.valeurs[k]) };
  }).sort((a, b) => a.y - b.y);
  for (let i = 1; i < e.length; i++) if (e[i].y - e[i - 1].y < 13) e[i].y = e[i - 1].y + 13;
  return e;
}

/**
 * Graphique en lignes (une seule échelle verticale), avec réticule et
 * infobulle au survol ou au clavier, légende, étiquettes directes (≤ 4
 * séries) et vue tableau.
 *
 * @param {object} props { titre, series: [{ id, nom, valeurs, couleur }], etiquettes, unite, decimales, reference, hauteur }
 */
export default function GraphiqueLignes({ titre, series, etiquettes, unite = '', decimales = 1, reference, hauteur = 220 }) {
  const [survol, setSurvol] = useState(null);
  const [tableau, setTableau] = useState(false);
  const svgRef = useRef(null);
  const L = 640, H = hauteur, mg = { g: 46, d: series.length <= 4 && series.length > 1 ? 92 : 16, h: 12, b: 26 };
  const n = Math.max(...series.map((s) => s.valeurs.length), 1);
  const toutes = series.flatMap((s) => s.valeurs.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)));
  if (reference) toutes.push(reference.valeur);
  const ticks = useMemo(() => graduations(Math.min(...toutes), Math.max(...toutes)), [toutes.join(',')]); // eslint-disable-line
  const ymin = ticks[0], ymax = ticks[ticks.length - 1];
  const x = (i) => mg.g + (n <= 1 ? 0 : (i / (n - 1)) * (L - mg.g - mg.d));
  const y = (v) => mg.h + (1 - (v - ymin) / (ymax - ymin || 1)) * (H - mg.h - mg.b);
  const couleur = (s, i) => s.couleur ?? COULEURS[i % COULEURS.length];
  const pasEtiquettes = Math.max(1, Math.ceil(n / 6));

  const surMouvement = (ev) => {
    const r = svgRef.current.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * L;
    const i = Math.round(((px - mg.g) / (L - mg.g - mg.d)) * (n - 1));
    setSurvol(Math.max(0, Math.min(n - 1, i)));
  };
  const surTouche = (ev) => {
    if (ev.key === 'ArrowRight') setSurvol((s) => Math.min(n - 1, (s ?? -1) + 1));
    if (ev.key === 'ArrowLeft') setSurvol((s) => Math.max(0, (s ?? n) - 1));
  };

  return (
    <figure className="graphique" style={{ margin: 0 }}>
      <div className="ligne espace">
        <figcaption><strong>{titre}</strong>{unite && <span className="muet petit"> ({unite})</span>}</figcaption>
        <button type="button" className="bouton petit" style={{ padding: '0.15rem 0.5rem' }} onClick={() => setTableau((t) => !t)}>{tableau ? 'Graphique' : 'Tableau'}</button>
      </div>
      {n < 2 ? (
        <p className="petit muet" style={{ padding: '2.5rem 0', textAlign: 'center' }}>La courbe s'affichera après le premier trimestre.</p>
      ) : tableau ? (
        <div style={{ overflowX: 'auto', maxHeight: 260 }}>
          <table className="petit">
            <thead><tr><th>Trimestre</th>{series.map((s) => <th key={s.id} className="nombre">{s.nom}</th>)}</tr></thead>
            <tbody>{Array.from({ length: n }, (_, i) => (
              <tr key={i}><td>{etiquettes[i]}</td>{series.map((s) => <td key={s.id} className="nombre">{nombre(s.valeurs[i], decimales)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg ref={svgRef} viewBox={`0 0 ${L} ${H}`} role="img" aria-label={`${titre}. Utilisez les flèches pour parcourir les valeurs.`} tabIndex={0}
            onPointerMove={surMouvement} onPointerLeave={() => setSurvol(null)} onKeyDown={surTouche} onBlur={() => setSurvol(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={mg.g} x2={L - mg.d} y1={y(t)} y2={y(t)} stroke="var(--grille)" strokeWidth="1" />
                <text x={mg.g - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--encre-attenuee)" className="chiffres">{nombre(t, Math.abs(ymax - ymin) < 5 ? 1 : 0)}</text>
              </g>
            ))}
            {etiquettes.map((e, i) => (i % pasEtiquettes === 0 || i === n - 1) && (
              <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--encre-attenuee)">{e}</text>
            ))}
            {reference && (
              <g>
                <line x1={mg.g} x2={L - mg.d} y1={y(reference.valeur)} y2={y(reference.valeur)} stroke="var(--encre-2)" strokeDasharray="4 4" strokeWidth="1" />
                <text x={mg.g + 4} y={y(reference.valeur) - 4} fontSize="11" fill="var(--encre-2)">{reference.libelle}</text>
              </g>
            )}
            {series.map((s, i) => {
              const pts = s.valeurs.map((v, k) => (v === null || v === undefined || Number.isNaN(v) ? null : `${x(k)},${y(v)}`)).filter(Boolean).join(' ');
              return <polyline key={s.id} points={pts} fill="none" stroke={couleur(s, i)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />;
            })}
            {series.length > 1 && series.length <= 4 && etiquettesFin(series, x, y).map((e) => (
              <text key={e.id} x={e.x + 6} y={e.y + 4} fontSize="11" fill="var(--encre-2)">{e.nom}</text>
            ))}
            {survol !== null && (
              <g>
                <line x1={x(survol)} x2={x(survol)} y1={mg.h} y2={H - mg.b} stroke="var(--axe)" strokeWidth="1" />
                {series.map((s, i) => s.valeurs[survol] !== undefined && (
                  <circle key={s.id} cx={x(survol)} cy={y(s.valeurs[survol])} r="4" fill={couleur(s, i)} stroke="var(--surface)" strokeWidth="2" />
                ))}
              </g>
            )}
          </svg>
          {survol !== null && (
            <div className="bulle-graphique" style={{ left: `${Math.min(70, (x(survol) / L) * 100)}%`, top: 4 }}>
              <div className="muet tres-petit">{etiquettes[survol]}</div>
              {series.map((s, i) => (
                <div key={s.id} className="ligne espace" style={{ gap: '0.8rem' }}>
                  <span className="ligne" style={{ gap: '0.35rem' }}><span className="trait" style={{ background: couleur(s, i) }} /><span className="muet">{s.nom}</span></span>
                  <strong className="chiffres">{nombre(s.valeurs[survol], decimales)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {series.length > 1 && (
        <div className="legende">{series.map((s, i) => <span key={s.id}><span className="trait" style={{ background: couleur(s, i) }} />{s.nom}</span>)}</div>
      )}
    </figure>
  );
}
