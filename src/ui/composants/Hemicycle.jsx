import React, { useMemo, useState } from 'react';

/** Ordre de gauche à droite dans l'hémicycle. */
const ORDRE = {
  france: ['LFI', 'GDR', 'ECOS', 'SOC', 'LIOT', 'DEM', 'EPR', 'HOR', 'DR', 'UDR', 'RN'],
  allemagne: ['LINKE', 'SPD', 'GRUENE', 'SSW', 'CDUCSU', 'AFD'],
};

/** Noms courts lisibles pour la légende. */
const NOMS_COURTS = { CDUCSU: 'CDU/CSU', GRUENE: 'Verts', AFD: 'AfD', LINKE: 'Die Linke', ECOS: 'Écologistes', SOC: 'PS', DEM: 'MoDem', HOR: 'Horizons', DR: 'LR (DR)' };

/** Positions des sièges sur des arcs concentriques, triées de gauche à droite. */
function positionsSieges(total) {
  const rangs = Math.max(6, Math.round(Math.sqrt(total / 2.2)));
  const r0 = 40, r1 = 140;
  const rayons = Array.from({ length: rangs }, (_, i) => r0 + (i * (r1 - r0)) / (rangs - 1));
  const somme = rayons.reduce((s, r) => s + r, 0);
  const parRang = rayons.map((r) => Math.round((total * r) / somme));
  parRang[parRang.length - 1] += total - parRang.reduce((s, x) => s + x, 0);
  const pts = [];
  rayons.forEach((r, i) => {
    const k = parRang[i];
    for (let j = 0; j < k; j++) {
      const a = Math.PI - (k === 1 ? Math.PI / 2 : (j / (k - 1)) * Math.PI);
      pts.push({ x: 160 + r * Math.cos(a), y: 155 - r * Math.sin(a), a });
    }
  });
  return pts.sort((p, q) => q.a - p.a);
}

/**
 * Hémicycle : un point par siège, coloré selon le groupe. Survol d'un groupe
 * pour afficher ses sièges et sa satisfaction vis-à-vis du gouvernement.
 */
export default function Hemicycle({ pays, groupes, majorite }) {
  const [survol, setSurvol] = useState(null);
  const ordre = ORDRE[pays] ?? groupes.map((g) => g.id);
  const tries = [...groupes].sort((a, b) => ordre.indexOf(a.id) - ordre.indexOf(b.id));
  const total = tries.reduce((s, g) => s + g.sieges, 0);
  const pts = useMemo(() => positionsSieges(total), [total]);
  let k = 0;
  const points = [];
  for (const g of tries) for (let i = 0; i < g.sieges; i++) points.push({ ...pts[k++], g });
  const rayonPoint = total > 400 ? 3.1 : 3.6;
  return (
    <div>
      <svg viewBox="0 0 320 170" role="img" aria-label={`Hémicycle de ${total} sièges, majorité absolue à ${majorite}`} className="hemicycle">
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={rayonPoint} fill={p.g.couleur}
            opacity={survol && survol !== p.g.id ? 0.25 : 1} onPointerEnter={() => setSurvol(p.g.id)} onPointerLeave={() => setSurvol(null)} />
        ))}
        <line x1="160" y1="5" x2="160" y2="20" stroke="var(--encre-2)" strokeDasharray="2 2" />
        <text x="160" y="168" textAnchor="middle" fill="var(--encre-2)">{total} sièges · majorité {majorite}</text>
      </svg>
      <div className="legende">
        {tries.map((g) => (
          <span key={g.id} onPointerEnter={() => setSurvol(g.id)} onPointerLeave={() => setSurvol(null)} style={{ fontWeight: survol === g.id ? 600 : 400 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.couleur, display: 'inline-block' }} />
            {NOMS_COURTS[g.id] ?? g.id} {g.sieges}
          </span>
        ))}
      </div>
    </div>
  );
}
