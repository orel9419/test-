import React from 'react';

/**
 * Façades stylisées des lieux du pouvoir (dessins originaux, simplifiés) :
 * Élysée, Matignon, Palais Bourbon, Palais du Luxembourg, Conseil
 * constitutionnel. Couleurs : jetons du thème, sauf le drapeau tricolore.
 */
function Drapeau({ x, y }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 22} className="palais-mat" />
      <rect x={x} y={y - 22} width="4" height="8" fill="#0055a4" />
      <rect x={x + 4} y={y - 22} width="4" height="8" fill="#ffffff" stroke="var(--bordure)" strokeWidth="0.3" />
      <rect x={x + 8} y={y - 22} width="4" height="8" fill="#ef4135" />
    </g>
  );
}

const fenetres = (x0, y, n, pas, l = 6, h = 9) => Array.from({ length: n }, (_, i) => <rect key={`${x0}-${y}-${i}`} x={x0 + i * pas} y={y} width={l} height={h} rx="1" className="palais-fenetre" />);
const colonnes = (x0, y, n, pas, h) => Array.from({ length: n }, (_, i) => <rect key={`c${x0}-${i}`} x={x0 + i * pas} y={y} width="3" height={h} className="palais-colonne" />);

const DESSINS = {
  elysee: (
    <>
      <rect x="14" y="40" width="132" height="34" className="palais-mur" />
      <rect x="10" y="34" width="140" height="6" className="palais-toit" />
      <rect x="58" y="30" width="44" height="44" className="palais-mur" />
      <polygon points="54,30 80,16 106,30" className="palais-toit" />
      {colonnes(62, 44, 4, 11, 30)}
      {fenetres(20, 46, 4, 9)}{fenetres(20, 60, 4, 9)}
      {fenetres(108, 46, 4, 9)}{fenetres(108, 60, 4, 9)}
      <Drapeau x={78} y={16} />
      <rect x="0" y="74" width="160" height="6" className="palais-sol" />
    </>
  ),
  matignon: (
    <>
      <rect x="16" y="36" width="128" height="38" className="palais-mur" />
      <polygon points="12,36 24,24 136,24 148,36" className="palais-toit" />
      {fenetres(22, 42, 5, 10)}{fenetres(102, 42, 4, 10)}
      {fenetres(22, 58, 5, 10)}{fenetres(102, 58, 4, 10)}
      <path d="M70 74 V56 a10 10 0 0 1 20 0 V74 Z" className="palais-porte" />
      <rect x="66" y="50" width="28" height="2" className="palais-trait-plein" />
      <Drapeau x={78} y={24} />
      <rect x="0" y="74" width="160" height="6" className="palais-sol" />
    </>
  ),
  bourbon: (
    <>
      <rect x="22" y="40" width="116" height="30" className="palais-mur" />
      <polygon points="18,40 80,18 142,40" className="palais-toit" />
      <polygon points="34,37 80,22 126,37" className="palais-fronton" />
      {colonnes(26, 42, 12, 9.6, 26)}
      <rect x="16" y="68" width="128" height="3" className="palais-marche" />
      <rect x="12" y="71" width="136" height="3" className="palais-marche" />
      <Drapeau x={78} y={18} />
      <rect x="0" y="74" width="160" height="6" className="palais-sol" />
    </>
  ),
  luxembourg: (
    <>
      <rect x="8" y="42" width="48" height="32" className="palais-mur" />
      <rect x="104" y="42" width="48" height="32" className="palais-mur" />
      <polygon points="6,42 14,34 50,34 58,42" className="palais-toit" />
      <polygon points="102,42 110,34 146,34 154,42" className="palais-toit" />
      <rect x="56" y="36" width="48" height="38" className="palais-mur" />
      <path d="M62 36 Q80 6 98 36 Z" className="palais-toit" />
      <rect x="77" y="10" width="6" height="8" className="palais-toit" />
      {fenetres(14, 48, 4, 10)}{fenetres(110, 48, 4, 10)}
      {fenetres(14, 61, 4, 10)}{fenetres(110, 61, 4, 10)}
      <path d="M72 74 V60 a8 8 0 0 1 16 0 V74 Z" className="palais-porte" />
      {fenetres(62, 44, 2, 30)}
      <Drapeau x={78} y={10} />
      <rect x="0" y="74" width="160" height="6" className="palais-sol" />
    </>
  ),
  montpensier: (
    <>
      <rect x="10" y="30" width="140" height="44" className="palais-mur" />
      <rect x="6" y="26" width="148" height="5" className="palais-toit" />
      {fenetres(16, 35, 10, 13.5, 7, 8)}
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${16 + i * 15} 74 V58 a6 6 0 0 1 12 0 V74 Z`} className="palais-porte" />)}
      <rect x="0" y="74" width="160" height="6" className="palais-sol" />
    </>
  ),
};

export default function Palais({ id, titre }) {
  return (
    <svg viewBox="0 0 160 80" className="palais" role="img" aria-label={titre}>
      {DESSINS[id]}
    </svg>
  );
}
