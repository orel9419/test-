import React, { useId } from 'react';

/**
 * Illustrations vectorielles originales des grands programmes de défense
 * (silhouettes stylisées, pas des plans techniques). Les couleurs viennent
 * des jetons du thème (clair ou sombre).
 */

function Cadre({ titre, viewBox, children, legende }) {
  return (
    <figure className="illustration">
      <svg viewBox={viewBox} role="img" aria-label={titre} xmlns="http://www.w3.org/2000/svg">
        <title>{titre}</title>
        {children}
      </svg>
      {legende && <figcaption className="tres-petit muet">{legende}</figcaption>}
    </figure>
  );
}

/** Cocarde française : bleu, blanc, rouge du bord vers le centre. */
const Cocarde = ({ x, y, r = 10 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#1d4f9e" />
    <circle cx={x} cy={y} r={r * 0.66} fill="#ffffff" />
    <circle cx={x} cy={y} r={r * 0.33} fill="#d62f2f" />
  </g>
);

/** Rafale vu de dessus : aile delta, plans canard, deux réacteurs, perche de ravitaillement. */
export function Rafale({ legende = true }) {
  const id = useId().replace(/:/g, '');
  return (
    <Cadre titre="Rafale vu de dessus" viewBox="0 0 400 220" legende={legende ? 'Rafale vu de dessus : aile delta, plans « canard » à l\'avant, deux réacteurs M88, missiles MICA en bout d\'aile.' : null}>
      <defs>
        <linearGradient id={`rf-corps-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="illu-stop-clair" />
          <stop offset="0.5" className="illu-stop-moyen" />
          <stop offset="1" className="illu-stop-clair" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" className="illu-ciel" rx="12" />
      {/* Ailes delta */}
      <path d="M246,95 L120,24 L104,24 L94,34 L86,95 Z" className="illu-corps" />
      <path d="M246,125 L120,196 L104,196 L94,186 L86,125 Z" className="illu-corps" />
      {/* Volets (gouvernes) de bord de fuite */}
      <path d="M94,34 L86,95 L98,95 L104,40 Z M94,186 L86,125 L98,125 L104,180 Z" className="illu-sombre" opacity="0.35" />
      {/* Missiles MICA en bout d'aile */}
      <rect x="96" y="18" width="56" height="4" rx="2" className="illu-sombre" />
      <rect x="96" y="198" width="56" height="4" rx="2" className="illu-sombre" />
      {/* Fuselage */}
      <path d="M384,110 C372,106 348,101 322,98 L250,93 L140,92 L74,94 L58,98 L58,122 L74,126 L140,128 L250,127 L322,122 C348,119 372,114 384,110 Z" fill={`url(#rf-corps-${id})`} className="illu-trait" />
      {/* Entrées d'air */}
      <path d="M296,92 L256,90 L256,95 L292,96 Z M296,128 L256,130 L256,125 L292,124 Z" className="illu-sombre" />
      {/* Plans canard */}
      <path d="M298,96 L272,64 L261,64 L265,95 Z" className="illu-corps illu-trait" />
      <path d="M298,124 L272,156 L261,156 L265,125 Z" className="illu-corps illu-trait" />
      {/* Dérive (vue de dessus) */}
      <path d="M70,110 L150,108 L150,112 Z" className="illu-sombre" />
      {/* Tuyères */}
      <rect x="48" y="99" width="12" height="9" rx="3" className="illu-sombre" />
      <rect x="48" y="112" width="12" height="9" rx="3" className="illu-sombre" />
      {/* Verrière et perche de ravitaillement */}
      <ellipse cx="330" cy="110" rx="24" ry="6.5" className="illu-verriere" />
      <path d="M334,116 L374,119" className="illu-perche" />
      {/* Cocardes */}
      <Cocarde x={150} y={64} />
      <Cocarde x={150} y={156} />
      {/* Lignes de structure */}
      <path d="M200,93 L200,127 M110,93 L110,127" className="illu-ligne" />
    </Cadre>
  );
}

/** SNLE vu de profil, avec une vue en coupe optionnelle (tubes des missiles, chaufferie). */
export function Snle({ coupe = true, nom = 'SNLE', legende = true }) {
  const tubes = Array.from({ length: 8 }, (_, i) => 268 + i * 21);
  const id = useId().replace(/:/g, '');
  const mer = `snle-mer-${id}`, coque = `snle-coque-${id}`;
  return (
    <Cadre titre={`${nom} vu de profil${coupe ? ', en coupe' : ''}`} viewBox="0 0 600 240" legende={legende ? 'Profil stylisé d\'un sous-marin nucléaire lanceur d\'engins. En coupe : 16 tubes de missiles M51 (deux rangées de 8), la chaufferie nucléaire et la propulsion.' : null}>
      <defs>
        <linearGradient id={mer} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="illu-stop-mer-haut" />
          <stop offset="1" className="illu-stop-mer-bas" />
        </linearGradient>
        <linearGradient id={coque} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="illu-stop-coque-haut" />
          <stop offset="1" className="illu-stop-coque-bas" />
        </linearGradient>
      </defs>
      <rect width="600" height="240" rx="12" fill={`url(#${mer})`} />
      <path d="M0,26 Q25,20 50,26 T100,26 T150,26 T200,26 T250,26 T300,26 T350,26 T400,26 T450,26 T500,26 T550,26 T600,26" className="illu-vague" />
      {/* Gouvernails cruciformes et hydrojet */}
      <path d="M78,140 L52,100 L66,100 L96,134 Z" fill={`url(#${coque})`} />
      <path d="M78,140 L52,180 L66,180 L96,146 Z" fill={`url(#${coque})`} />
      <rect x="30" y="128" width="16" height="24" rx="5" className="illu-sombre" />
      {/* Coque */}
      <path d="M44,140 C62,124 96,112 150,112 L476,112 C526,112 562,124 570,140 C562,156 526,168 476,168 L150,168 C96,168 62,156 44,140 Z" fill={`url(#${coque})`} />
      {/* « Dos » du compartiment missiles */}
      <path d="M252,113 C262,104 270,102 282,102 L430,102 C442,102 450,106 454,113 Z" fill={`url(#${coque})`} />
      {tubes.map((x) => <rect key={`t${x}`} x={x} y="103.5" width="12" height="3" rx="1" className="illu-trappe" />)}
      {/* Kiosque et barres de plongée */}
      <path d="M458,113 L465,72 C466,68 469,66 474,66 L498,66 C503,66 505,69 505,73 L508,113 Z" fill={`url(#${coque})`} />
      <rect x="444" y="83" width="76" height="5" rx="2.5" className="illu-sombre" />
      <rect x="480" y="58" width="3" height="10" className="illu-sombre" />
      <rect x="488" y="54" width="2" height="14" className="illu-sombre" />
      {coupe && (
        <g>
          <path d="M150,118 L470,118 C500,118 520,124 528,140 C520,156 500,162 470,162 L150,162 Z" className="illu-coupe" />
          {/* 16 tubes de missiles M51 (8 visibles, deux rangées) */}
          {tubes.map((x) => (
            <g key={x}>
              <rect x={x} y="108" width="12" height="52" rx="3" className="illu-tube" />
              <path d={`M${x + 6},112 L${x + 10},120 L${x + 10},156 L${x + 2},156 L${x + 2},120 Z`} className="illu-missile" />
            </g>
          ))}
          {/* Chaufferie nucléaire */}
          <rect x="190" y="122" width="54" height="36" rx="6" className="illu-reacteur" />
          <g transform="translate(217,140)">
            <circle r="9" className="illu-trefle-fond" />
            {[0, 120, 240].map((a) => <path key={a} d="M0,0 L-4.5,-7.8 A9,9 0 0 1 4.5,-7.8 Z" transform={`rotate(${a})`} className="illu-trefle" />)}
            <circle r="2" className="illu-trefle-fond" />
          </g>
          {/* Turbines et propulsion */}
          <rect x="112" y="128" width="62" height="24" rx="4" className="illu-machines" />
          {/* Poste central et vie à bord */}
          <rect x="452" y="122" width="56" height="36" rx="5" className="illu-poste" />
          {/* Légendes */}
          <g className="illu-legende">
            <path d="M330,160 L330,196" /><text x="330" y="208" textAnchor="middle">16 missiles M51</text>
            <path d="M217,158 L217,196" /><text x="217" y="208" textAnchor="middle">Chaufferie nucléaire</text>
            <path d="M143,152 L120,196" /><text x="96" y="208" textAnchor="middle">Propulsion</text>
            <path d="M480,158 L480,196" /><text x="480" y="208" textAnchor="middle">Poste central</text>
            <path d="M486,62 L540,40" /><text x="545" y="44">Kiosque</text>
          </g>
        </g>
      )}
    </Cadre>
  );
}

/** Porte-avions vu de profil, avec son île et des avions sur le pont. */
export function PorteAvions({ legende = true, nom = 'Porte-avions' }) {
  const avions = [90, 150, 210, 470];
  return (
    <Cadre titre={`${nom} vu de profil`} viewBox="0 0 600 200" legende={legende ? 'Profil stylisé : pont d\'envol, île, catapultes ; propulsion nucléaire.' : null}>
      <rect width="600" height="200" rx="12" className="illu-ciel" />
      <path d="M30,96 L572,96 L548,150 L70,150 C52,140 38,120 30,96 Z" className="illu-corps illu-trait" />
      <rect x="28" y="90" width="548" height="8" rx="2" className="illu-sombre" />
      <path d="M380,90 L384,48 L420,48 L428,90 Z" className="illu-corps illu-trait" />
      <rect x="392" y="56" width="26" height="8" className="illu-verriere" />
      <path d="M400,48 L400,26 M396,32 L404,32" className="illu-perche" />
      {avions.map((x) => <path key={x} d={`M${x},88 L${x + 34},86 L${x + 40},88 L${x + 34},90 Z M${x + 12},84 L${x + 20},88 L${x + 12},92 Z`} className="illu-sombre" />)}
      <path d="M0,132 L600,132 L600,188 Q600,200 588,200 L12,200 Q0,200 0,188 Z" className="illu-mer" opacity="0.88" />
      <path d="M0,132 Q30,128 60,132 T120,132 T180,132 T240,132 T300,132 T360,132 T420,132 T480,132 T540,132 T600,132" className="illu-vague" />
    </Cadre>
  );
}

/** Avion de combat futur (furtif, sans dérive) et son drone d'accompagnement. */
export function ChasseurFutur({ legende = true }) {
  return (
    <Cadre titre="Avion de combat de nouvelle génération et drone d'accompagnement" viewBox="0 0 400 220" legende={legende ? 'Concept stylisé : forme furtive sans dérive, accompagné d\'un drone de combat.' : null}>
      <rect width="400" height="220" rx="12" className="illu-ciel" />
      <path d="M360,104 L250,88 L150,28 L124,28 L138,78 L110,94 L128,104 L110,114 L138,130 L124,180 L150,180 L250,120 Z" className="illu-corps illu-trait" />
      <ellipse cx="300" cy="104" rx="22" ry="5" className="illu-verriere" />
      <path d="M150,28 L170,104 L150,180" className="illu-ligne" />
      <Cocarde x={175} y={70} r={8} />
      <Cocarde x={175} y={138} r={8} />
      <path d="M352,186 L312,178 L282,160 L274,160 L280,178 L262,186 L280,194 L274,212 L282,212 L312,194 Z" className="illu-sombre" opacity="0.85" />
    </Cadre>
  );
}

/** Drone de surveillance (longues ailes droites, empennage en V). */
export function Drone({ legende = true }) {
  return (
    <Cadre titre="Drone de surveillance et munitions" viewBox="0 0 400 220" legende={legende ? 'Drone de moyenne altitude et longue endurance, et obus de 155 mm.' : null}>
      <rect width="400" height="220" rx="12" className="illu-ciel" />
      <path d="M330,100 C330,94 320,92 300,92 L110,96 L96,100 L110,104 L300,108 C320,108 330,106 330,100 Z" className="illu-corps illu-trait" />
      <path d="M232,96 L210,18 L196,18 L198,96 Z M232,104 L210,182 L196,182 L198,104 Z" className="illu-corps illu-trait" />
      <path d="M120,98 L92,76 L84,78 L104,100 Z M120,102 L92,124 L84,122 L104,100 Z" className="illu-sombre" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${250 + i * 26},176 L${250 + i * 26},150 Q${256 + i * 26},138 ${262 + i * 26},150 L${262 + i * 26},176 Z`} className="illu-missile" />)}
    </Cadre>
  );
}

/** Satellite (corps, panneaux solaires, antenne). */
export function Satellite({ legende = true }) {
  return (
    <Cadre titre="Satellite militaire" viewBox="0 0 400 220" legende={legende ? 'Satellite d\'observation stylisé : panneaux solaires et instrument optique.' : null}>
      <rect width="400" height="220" rx="12" className="illu-espace" />
      {[[40, 30], [90, 170], [330, 40], [360, 180], [250, 20], [150, 200]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" fill="#ffffff" opacity="0.8" />)}
      <rect x="60" y="88" width="100" height="44" className="illu-panneau" />
      <rect x="240" y="88" width="100" height="44" className="illu-panneau" />
      <path d="M60,110 L160,110 M85,88 L85,132 M110,88 L110,132 M135,88 L135,132 M240,110 L340,110 M265,88 L265,132 M290,88 L290,132 M315,88 L315,132" className="illu-ligne-claire" />
      <rect x="160" y="106" width="80" height="8" className="illu-sombre" />
      <rect x="176" y="80" width="48" height="60" rx="4" className="illu-or" />
      <circle cx="200" cy="150" r="10" className="illu-sombre" />
      <path d="M200,80 L200,60 M190,60 L210,60" className="illu-perche" />
    </Cadre>
  );
}

/** Chasseur générique (ailes trapézoïdales, empennages). */
export function Chasseur({ legende = true }) {
  return (
    <Cadre titre="Avion de combat vu de dessus" viewBox="0 0 400 220" legende={legende ? 'Silhouette générique d\'avion de combat.' : null}>
      <rect width="400" height="220" rx="12" className="illu-ciel" />
      <path d="M370,110 C356,104 330,100 300,98 L90,98 L70,102 L70,118 L90,122 L300,122 C330,120 356,116 370,110 Z" className="illu-corps illu-trait" />
      <path d="M240,98 L170,38 L150,38 L150,98 Z M240,122 L170,182 L150,182 L150,122 Z" className="illu-corps illu-trait" />
      <path d="M110,98 L86,66 L74,66 L76,98 Z M110,122 L86,154 L74,154 L76,122 Z" className="illu-corps illu-trait" />
      <ellipse cx="316" cy="110" rx="20" ry="6" className="illu-verriere" />
    </Cadre>
  );
}

/** Bombardier furtif en aile volante. */
export function Bombardier({ legende = true }) {
  return (
    <Cadre titre="Bombardier furtif en aile volante" viewBox="0 0 400 220" legende={legende ? 'Aile volante furtive, sans fuselage ni dérive.' : null}>
      <rect width="400" height="220" rx="12" className="illu-ciel" />
      <path d="M330,110 L120,20 L104,24 L120,52 L96,70 L120,90 L96,110 L120,130 L96,150 L120,168 L104,196 L120,200 Z" className="illu-corps illu-trait" />
      <path d="M300,104 L312,110 L300,116 Z" className="illu-verriere" />
    </Cadre>
  );
}

/** Défense aérienne : lanceur sur camion et radar. */
export function DefenseAerienne({ legende = true }) {
  return (
    <Cadre titre="Système de défense aérienne" viewBox="0 0 400 220" legende={legende ? 'Lanceur de missiles sol-air et radar (illustration générique).' : null}>
      <rect width="400" height="220" rx="12" className="illu-ciel" />
      <rect y="176" width="400" height="44" className="illu-sol" />
      <rect x="40" y="140" width="190" height="30" rx="4" className="illu-corps illu-trait" />
      <rect x="230" y="128" width="50" height="42" rx="4" className="illu-corps illu-trait" />
      {[60, 100, 140, 200, 250].map((x) => <circle key={x} cx={x} cy="176" r="11" className="illu-sombre" />)}
      <g transform="rotate(-38 70 140)">
        <rect x="70" y="104" width="130" height="34" rx="3" className="illu-sombre" />
        {[0, 1, 2, 3].map((i) => <circle key={i} cx="200" cy={110 + i * 7.5} r="3" className="illu-missile" />)}
      </g>
      <rect x="306" y="150" width="60" height="26" rx="3" className="illu-corps illu-trait" />
      <path d="M318,150 L310,92 L362,92 L354,150 Z" className="illu-panneau" />
      <path d="M296,88 Q336,60 376,88" className="illu-onde" />
      <path d="M306,76 Q336,52 366,76" className="illu-onde" />
    </Cadre>
  );
}

export const ILLUSTRATIONS = {
  rafale: Rafale, snle: Snle, porteAvions: PorteAvions, chasseurFutur: ChasseurFutur,
  drone: Drone, satellite: Satellite, chasseur: Chasseur, bombardier: Bombardier, defenseAerienne: DefenseAerienne,
};
