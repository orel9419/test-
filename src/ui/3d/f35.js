/**
 * Lockheed Martin F-35 Lightning II, en trois versions, relevé sur des plans
 * trois vues (face, dessus, profil ; cotes prises sur le profil à l'échelle
 * de la hauteur officielle) et d'après des photos (vues de face au sol et en
 * vol, comparaison F-35A / F-35C, F-35A belge au roulage vu de trois quarts
 * avant, qui a servi à recaler la hauteur du fuselage, la teinte, la verrière,
 * les entrées d'air et les trappes) et une infographie des versions :
 *  - F-35A (armée de l'air) : 15,67 m de long, 10,67 m d'envergure, 4,38 m de
 *    haut ; canon interne de 25 mm, réceptacle pour perche rigide, roue avant simple ;
 *  - F-35B (décollage court et atterrissage vertical) : 15,61 m, 10,67 m,
 *    4,36 m ; soufflante de sustentation derrière le poste, entrées d'air
 *    auxiliaires, tuyère orientable à trois paliers, buses de roulis, perche ;
 *  - F-35C (embarqué) : 15,70 m, 13,11 m, 4,48 m ; aile et empennages
 *    agrandis, bouts d'aile repliables, roue avant double avec barre de
 *    catapultage, crosse d'appontage, perche.
 * Formes communes : nez à arêtes vives (« chines »), verrière d'une seule
 * pièce sans arceau, entrées d'air sans piège à couche limite (bosse « DSI »)
 * à lèvres inclinées, capteur optronique EOTS à facettes sous le nez, aile
 * trapézoïdale (bord d'attaque à environ 35°), dérives inclinées vers
 * l'extérieur, réacteur unique F135 à tuyère dentelée, deux soutes ventrales.
 * Formes à facettes simplifiées.
 *
 * Repère : x de l'avant vers l'arrière (nez en x = 0), y vers le haut, z vers
 * la gauche de l'appareil (côté droit en z négatif). Échelle 1 (mètres).
 */
import { loft, missile } from './modeles.js';
import { coqueArretes, prismeFacettes, voilure, tubeEntre } from './formes.js';

const VERSIONS = {
  f35a: {
    lettre: 'A', longueur: 15.67, hauteur: 4.38,
    aile: [[6.79, 1.2], [9.9, 5.335], [11.25, 5.335], [12.46, 1.2]],
    stab: [[12.6, 1.3], [14.45, 3.35], [15.2, 3.35], [15.67, 1.3]],
    derive: [[12.0, 0], [13.6, 2.05], [14.65, 2.05], [14.7, 0]],
    soute: [5.0, 9.4], sortie: 15.25, canon: true, receptacle: true,
  },
  f35b: {
    lettre: 'B', longueur: 15.61, hauteur: 4.36,
    aile: [[6.79, 1.2], [9.9, 5.335], [11.25, 5.335], [12.46, 1.2]],
    stab: [[12.6, 1.3], [14.45, 3.35], [15.15, 3.35], [15.61, 1.3]],
    derive: [[12.0, 0], [13.6, 2.05], [14.65, 2.05], [14.7, 0]],
    soute: [6.95, 9.4], sortie: 15.2, stovl: true, perche: true,
  },
  f35c: {
    lettre: 'C', longueur: 15.7, hauteur: 4.48,
    aile: [[6.51, 1.2], [10.3, 6.555], [12.0, 6.555], [12.78, 1.2]],
    stab: [[12.4, 1.3], [14.5, 3.75], [15.25, 3.75], [15.7, 1.3]],
    derive: [[11.8, 0], [13.55, 2.25], [14.75, 2.25], [14.8, 0]],
    soute: [5.0, 9.4], sortie: 15.3, pliage: 4.74, crosse: true, perche: true, roueDouble: true,
  },
};
const ANGLE_DERIVES = 0.38; // environ 22° vers l'extérieur
const Y_DERIVES = 0.42;
const X_TRAIN_AVANT = 3.9, X_TRAIN_PRINCIPAL = 9.9;
/** Demi-voie du train principal : environ 4,3 m entre les roues (photo de face). */
const DEMI_VOIE = 2.15;

/**
 * Sections du fuselage (plans trois vues pour les longueurs et largeurs ; hauteurs recalées
 * sur une photo au sol d'un F-35A belge, ventre à environ 1,2 m du sol) :
 * [x, haut, bas, z de l'arête, y de l'arête, contrôle du dessus (z, y), contrôle du dessous (z, y)].
 * Fuselage épais (soutes et conduits d'air) ; arêtes du nez à l'aile ; dos large ; ventre plat.
 */
const SECTIONS_CORPS = [
  [0, -0.02, -0.02, 0, -0.02, 0, -0.02, 0, -0.02],
  [0.25, 0.15, -0.19, 0.27, -0.02, 0.16, 0.15, 0.22, -0.19],
  [0.7, 0.33, -0.39, 0.5, -0.01, 0.31, 0.33, 0.41, -0.39],
  [1.4, 0.46, -0.52, 0.64, 0.0, 0.42, 0.46, 0.52, -0.52],
  [2.2, 0.62, -0.64, 0.82, 0.04, 0.52, 0.62, 0.66, -0.64],
  [3.2, 0.74, -0.72, 0.98, 0.1, 0.6, 0.74, 0.8, -0.72],
  [4.2, 0.84, -0.76, 1.04, 0.14, 0.68, 0.84, 0.88, -0.76],
  [5.2, 1.0, -0.8, 1.16, 0.16, 0.84, 1.0, 1.0, -0.8],
  [6.3, 1.12, -0.8, 1.6, 0.14, 1.15, 1.1, 1.45, -0.8],
  [7.4, 1.14, -0.8, 1.76, 0.1, 1.25, 1.12, 1.62, -0.8],
  [9.6, 1.02, -0.78, 1.76, 0.06, 1.25, 1.0, 1.62, -0.78],
  [11.4, 0.84, -0.68, 1.72, 0.06, 1.18, 0.82, 1.58, -0.66],
  [12.8, 0.66, -0.56, 1.58, 0.07, 1.0, 0.64, 1.45, -0.54],
  [13.9, 0.55, -0.48, 1.32, 0.08, 0.8, 0.53, 1.2, -0.47],
  [14.6, 0.62, -0.5, 1.0, 0.06, 0.66, 0.6, 0.9, -0.48],
];
/** Dos plus haut du F-35B (soufflante de sustentation), par section. */
const BOSSE_B = [0, 0, 0, 0, 0, 0, 0, 0.02, 0.06, 0.08, 0.04, 0, 0, 0, 0];

/** Toile du revêtement : gris moyen satiné, légères marbrures du revêtement absorbant, joints discrets. */
function textureRevetement(THREE) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#56595d';
  ctx.fillRect(0, 0, c.width, c.height);
  let g = 11;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  // Marbrures : zones un peu plus claires ou plus foncées (retouches du revêtement)
  for (let k = 0; k < 90; k++) {
    ctx.fillStyle = `rgba(${h() < 0.5 ? '255,255,255' : '0,0,0'},${0.012 + h() * 0.022})`;
    ctx.fillRect(h() * c.width, h() * c.height, 60 + h() * 260, 30 + h() * 90);
  }
  // Joints de panneaux fins et sombres
  ctx.strokeStyle = 'rgba(38,42,46,0.32)';
  ctx.lineWidth = 2;
  for (const u of [0.13, 0.35, 0.47, 0.6, 0.74, 0.88]) {
    ctx.beginPath(); ctx.moveTo(u * c.width, 0); ctx.lineTo(u * c.width, c.height); ctx.stroke();
  }
  for (const v of [0.18, 0.32, 0.68, 0.82]) {
    ctx.beginPath(); ctx.moveTo(0, v * c.height); ctx.lineTo(c.width, v * c.height); ctx.stroke();
  }
  // Trappes de visite à bords en dents de scie (furtivité), un peu plus claires
  ctx.strokeStyle = 'rgba(150,156,162,0.3)';
  for (let k = 0; k < 14; k++) {
    const x0 = 0.2 * c.width + h() * 0.6 * c.width, y0 = h() * c.height, w = 40 + h() * 70, hh = 20 + h() * 30;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x0 + x, y0 + ((x / 8) % 2 ? 4 : 0));
    ctx.lineTo(x0 + w, y0 + hh);
    for (let x = w; x >= 0; x -= 8) ctx.lineTo(x0 + x, y0 + hh + ((x / 8) % 2 ? 4 : 0));
    ctx.closePath(); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Cocarde américaine basse visibilité (étoile et barres en gris). */
function textureInsigne(THREE) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(40,44,50,0.85)';
  ctx.fillStyle = 'rgba(40,44,50,0.85)';
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 50, 228, 28);
  ctx.beginPath(); ctx.arc(128, 64, 44, 0, Math.PI * 2); ctx.fillStyle = 'rgba(92,98,105,1)'; ctx.fill(); ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 ? 16 : 40;
    ctx.lineTo(128 + r * Math.cos(a), 66 + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(40,44,50,0.85)';
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Abscisse du bord d'un trapèze d'aile [racine BA, extrémité BA, extrémité BF, racine BF] à l'ordonnée z. */
function bordA(aile, z, fuite) {
  const [a, b] = fuite ? [aile[3], aile[2]] : [aile[0], aile[1]];
  return a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]);
}

/**
 * Construit un F-35 (version f35a, f35b ou f35c).
 * Commandes : train, soutes ; A : réceptacle de ravitaillement ; B : mode
 * vertical, perche ; C : ailes repliées, crosse, perche.
 * @returns {THREE.Group} centré, avec userData.legendes, commandes et animer
 */
export function construireF35(THREE, { modele = 'f35a' } = {}) {
  const v = VERSIONS[modele] ?? VERSIONS.f35a;
  const avion = new THREE.Group();
  const toile = textureRevetement(THREE);
  // Gris moyen satiné du revêtement furtif (plus clair qu'il n'y paraît sur les photos en vol)
  const peau = new THREE.MeshStandardMaterial({ color: toile ? 0xffffff : 0x56595d, map: toile, metalness: 0.15, roughness: 0.6, envMapIntensity: 0.35 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x585b5f, metalness: 0.15, roughness: 0.6, envMapIntensity: 0.35 });
  const grisClair = new THREE.MeshStandardMaterial({ color: 0x5c5f63, metalness: 0.15, roughness: 0.55, envMapIntensity: 0.35 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x4c4f53, metalness: 0.15, roughness: 0.65, envMapIntensity: 0.35 });
  const interieur = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.1, roughness: 0.6 }); // faces internes des trappes
  const jante = new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 0.5, roughness: 0.4 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x0e1012, metalness: 0.2, roughness: 0.85 });
  const ceramique = new THREE.MeshStandardMaterial({ color: 0x8e9296, metalness: 0.55, roughness: 0.45 });
  // Verrière : revêtement à l'oxyde d'indium-étain, reflets dorés et rosés, pilote visible au travers
  const verre = new THREE.MeshPhysicalMaterial({ color: 0xd9a888, metalness: 0.35, roughness: 0.05, transparent: true, opacity: 0.48, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false });
  const saphir = new THREE.MeshStandardMaterial({ color: 0x2f4a6a, metalness: 0.9, roughness: 0.08, flatShading: true });
  const matJambe = new THREE.MeshStandardMaterial({ color: 0xd3d6da, metalness: 0.6, roughness: 0.35 });
  const matPneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const matSoute = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.8, side: THREE.DoubleSide });
  const materiaux = { missile: new THREE.MeshStandardMaterial({ color: 0xd9dcde, metalness: 0.2, roughness: 0.5 }), missileOgive: new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.3, roughness: 0.4 }) };
  const L = v.longueur;
  const ajouter = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); avion.add(m); return m; };

  // ---- Fuselage à arêtes vives (plans trois vues) : arêtes droites du nez à l'aile, dos haut, ventre plat
  // (le F-35B a le dos un peu plus haut : il loge la soufflante de sustentation)
  const corps = SECTIONS_CORPS.map(([x, yHaut, yBas, zArete, yArete, zH, yH, zB, yB], k) => {
    const b = v.stovl ? BOSSE_B[k] ?? 0 : 0;
    return { x, yHaut: yHaut + b, yBas, zArete, yArete, zH, yH: yH + b, zB, yB };
  });
  /** Hauteur du dos (axe) à l'abscisse x, par interpolation des sections. */
  const dos = (x) => {
    const k = corps.findIndex((c) => c.x >= x);
    if (k <= 0) return corps[Math.max(0, k)].yHaut;
    const a = corps[k - 1], b = corps[k];
    return a.yHaut + ((b.yHaut - a.yHaut) * (x - a.x)) / (b.x - a.x);
  };
  ajouter(coqueArretes(THREE, corps, { points: 12, parSegment: 6 }), peau);
  // Radôme, d'une teinte à peine différente
  ajouter(coqueArretes(THREE, corps.slice(0, 3).map((c, k) => (k === 2 ? { ...c, x: 1.15 } : c)).map((c) => ({ ...c, yHaut: c.yHaut + 0.004, yBas: c.yBas - 0.004, zArete: c.zArete + 0.004, yH: c.yH + 0.004, yB: c.yB - 0.004 })), { points: 12, parSegment: 4 }), grisClair).position.x = -0.004;

  // ---- Entrées d'air trapézoïdales sous la verrière, collées au fuselage, lèvres inclinées (le haut en avant) ;
  // leur arête extérieure prolonge celle du nez jusqu'au bord d'attaque de l'aile ; bosse DSI au bord intérieur
  for (const cote of [1, -1]) {
    const conduit = prismeFacettes(THREE, [
      [4.15, [[1.0, 0.6], [1.5, 0.42], [1.44, -0.6], [1.0, -0.7]]],
      [5.2, [[1.1, 0.8], [1.68, 0.5], [1.62, -0.64], [1.1, -0.78]]],
      [6.3, [[1.25, 0.74], [1.74, 0.38], [1.7, -0.58], [1.25, -0.78]]],
      [7.2, [[1.4, 0.5], [1.78, 0.2], [1.76, -0.34], [1.4, -0.62]]],
    ].map(([x, poly]) => [x, poly.map(([z, y]) => [z * cote, y])]), { inverser: cote < 0, cisaillement: (x, y) => Math.min(1, Math.max(0, (5.0 - x) / 0.85)) * -0.6 * (y - 0.05) });
    ajouter(conduit, peau);
    // Bouche : fond noir un peu en retrait de la lèvre
    const forme = new THREE.Shape([[1.03, 0.56], [1.47, 0.4], [1.41, -0.56], [1.03, -0.66]].map(([z, y]) => new THREE.Vector2(z * cote, y)));
    const bouche = new THREE.ShapeGeometry(forme);
    bouche.rotateY(-Math.PI / 2);
    bouche.applyMatrix4(new THREE.Matrix4().set(1, -0.6, 0, 0.03, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
    ajouter(bouche, new THREE.MeshStandardMaterial({ color: 0x0e1012, roughness: 0.9, side: THREE.DoubleSide }), 4.2, 0, 0);
    const dsi = ajouter(new THREE.SphereGeometry(1, 24, 14), gris, 4.45, -0.05, cote * 1.0);
    dsi.scale.set(0.8, 0.45, 0.17);
  }

  // ---- Verrière d'une seule pièce, sans arceau, teintée d'or et de rose (de 1,8 m à 5 m du nez) ; siège éjectable et pilote
  ajouter(loft(THREE, [
    { x: 1.8, w: 0.46, hHaut: 0.0, hBas: 0.02, y: dos(1.8) - 0.01 },
    { x: 2.2, w: 0.78, hHaut: 0.22, hBas: 0.02, y: dos(2.2) - 0.01 },
    { x: 2.9, w: 0.98, hHaut: 0.5, hBas: 0.02, y: dos(2.9) - 0.01 },
    { x: 3.6, w: 1.04, hHaut: 0.68, hBas: 0.02, y: dos(3.6) - 0.01 },
    { x: 4.3, w: 1.02, hHaut: 0.7, hBas: 0.02, y: dos(4.3) - 0.01 },
    { x: 5.0, w: 0.9, hHaut: 0.54, hBas: 0.02, y: dos(5.0) - 0.01 },
  ], { segments: 44, parSegment: 6 }), verre);
  // Arrière de la verrière, opaque (couleur du fuselage), qui se fond dans le dos
  ajouter(loft(THREE, [
    { x: 4.9, w: 0.95, hHaut: 0.57, hBas: 0.02, y: dos(4.9) - 0.01 },
    { x: 5.45, w: 0.82, hHaut: 0.38, hBas: 0.02, y: dos(5.45) - 0.01 },
    { x: 5.95, w: 0.6, hHaut: 0.16, hBas: 0.02, y: dos(5.95) - 0.01 },
    { x: 6.4, w: 0.3, hHaut: 0.01, hBas: 0.01, y: dos(6.4) - 0.01 },
  ], { segments: 36, parSegment: 5 }), peau);
  // Cadre de la verrière (joint gris le long de l'appui)
  const cadre = new THREE.MeshStandardMaterial({ color: 0x4d5258, roughness: 0.55, metalness: 0.3 });
  const appui = [[1.8, 0.46], [2.2, 0.78], [2.9, 0.98], [3.6, 1.04], [4.3, 1.02], [5.0, 0.9]];
  for (const cote of [1, -1]) {
    for (let k = 0; k < appui.length - 1; k++) {
      const [xa, wa] = appui[k], [xb, wb] = appui[k + 1];
      avion.add(tubeEntre(THREE, [xa, dos(xa) + 0.01, cote * wa / 2], [xb, dos(xb) + 0.01, cote * wb / 2], 0.035, cadre, 6));
    }
  }
  const matSiege = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 });
  const matCasque = new THREE.MeshStandardMaterial({ color: 0x3d4247, roughness: 0.45, metalness: 0.2 });
  ajouter(new THREE.BoxGeometry(0.28, 0.56, 0.42), matSiege, 4.4, dos(4.4) + 0.24, 0);
  const casque = ajouter(new THREE.SphereGeometry(0.15, 18, 12), matCasque, 4.05, dos(4.05) + 0.42, 0);
  casque.scale.set(1.1, 1, 0.95);
  ajouter(new THREE.BoxGeometry(0.6, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.9 }), 2.95, dos(2.95) + 0.02, 0); // planche de bord (un grand écran tactile)

  // ---- Capteurs : EOTS à facettes sous le nez, ouvertures du système DAS
  const eots = new THREE.CylinderGeometry(0.17, 0.22, 0.52, 7, 1, false);
  eots.rotateZ(Math.PI / 2);
  const mEots = ajouter(eots, saphir, 2.05, -0.62, 0);
  mEots.scale.set(1, 0.62, 1);
  for (const [x, y, z, rx, rz] of [[1.85, 0.37, 0, -Math.PI / 2, 0], [6.4, dos(6.4) - 0.02, 0.45, -Math.PI / 2, 0], [6.4, dos(6.4) - 0.02, -0.45, -Math.PI / 2, 0], [3.2, -0.735, 0.32, Math.PI / 2, 0]]) {
    const d = ajouter(new THREE.PlaneGeometry(0.16, 0.16), saphir, x, y, z);
    d.rotation.set(rx, 0, rz);
  }
  // Cocardes basse visibilité sur les flancs, derrière les entrées d'air
  const insigne = textureInsigne(THREE);
  if (insigne) {
    for (const cote of [1, -1]) {
      const p = ajouter(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: insigne, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }), 5.75, 0.02, cote * 1.665);
      p.rotation.y = cote > 0 ? 0 : Math.PI;
    }
  }

  // ---- Voilure : aile trapézoïdale, flaperons ; F-35C : bouts d'aile repliables
  const pliages = [];
  const roulis = [];
  for (const cote of [1, -1]) {
    const aile = new THREE.Group();
    const [, , , racineBF] = v.aile;
    if (v.pliage) {
      const zp = v.pliage;
      const baP = bordA(v.aile, zp, false), bfP = bordA(v.aile, zp, true);
      aile.add(new THREE.Mesh(voilure(THREE, [v.aile[0], [baP, zp], [bfP, zp], v.aile[3]], { relative: [0.05, 0.045] }), gris));
      // Partie repliable : charnière le long de la corde, à 4,74 m de l'axe
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.0, zp);
      const ext = new THREE.Mesh(voilure(THREE, [[baP, 0], [v.aile[1][0], v.aile[1][1] - zp], [v.aile[2][0], v.aile[2][1] - zp], [bfP, 0]], { relative: [0.045, 0.04] }), gris);
      pivot.add(ext);
      aile.add(pivot);
      pliages.push(pivot);
    } else {
      aile.add(new THREE.Mesh(voilure(THREE, v.aile, { relative: [0.05, 0.04] }), gris));
    }
    // Flaperon (bord de fuite intérieur), un peu plus foncé
    const z1 = 1.9, z2 = Math.min(3.9, (v.pliage ?? 5) - 0.2);
    const f1 = bordA(v.aile, z1, true), f2 = bordA(v.aile, z2, true);
    const flap = new THREE.Mesh(voilure(THREE, [[f1 - 0.7, z1], [f2 - 0.6, z2], [f2 + 0.01, z2], [f1 + 0.01, z1]], { relative: [0.11, 0.1] }), grisFonce);
    aile.add(flap);
    if (v.stovl) {
      // Buse de roulis sous l'aile (trappe ouverte en vol vertical)
      const trappe = new THREE.Group();
      trappe.position.set(9.6, -0.11, 3.2);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.3), grisFonce);
      t.position.z = 0.15;
      trappe.add(t);
      aile.add(trappe);
      roulis.push(trappe);
    }
    const bout = v.aile[1][1];
    const feu = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: cote > 0 ? 0xd02020 : 0x20b040, emissive: cote > 0 ? 0x701010 : 0x105a20, roughness: 0.3 }));
    feu.position.set((v.aile[1][0] + v.aile[2][0]) / 2, 0, bout - 0.04);
    (pliages.at(-1) ?? aile).add(feu);
    if (v.pliage) feu.position.z = bout - v.pliage - 0.04;
    aile.scale.z = cote;
    aile.rotation.x = -cote * 0.035; // léger dièdre négatif
    aile.position.y = 0.0;
    avion.add(aile);

    // Gouvernes de profondeur monobloc, sur les poutres arrière
    const stab = new THREE.Mesh(voilure(THREE, v.stab, { relative: [0.05, 0.035] }), gris);
    stab.scale.z = cote;
    stab.position.y = 0.05;
    avion.add(stab);
    ajouter(loft(THREE, [
      { x: 11.4, w: 0.5, hHaut: 0.28, hBas: 0.26, y: 0.1, z: cote * 1.36, n: 2.6 },
      { x: 13.4, w: 0.56, hHaut: 0.32, hBas: 0.28, y: 0.1, z: cote * 1.38, n: 2.6 },
      { x: 15.0, w: 0.4, hHaut: 0.2, hBas: 0.18, y: 0.08, z: cote * 1.36, n: 2.2 },
      { x: L - 0.05, w: 0.08, hHaut: 0.04, hBas: 0.04, y: 0.07, z: cote * 1.34 },
    ], { segments: 24, parSegment: 5 }), peau);

    // Dérives inclinées vers l'extérieur, gouverne de direction
    const derive = new THREE.Group();
    derive.add(new THREE.Mesh(voilure(THREE, v.derive, { plan: 'xy', relative: [0.05, 0.04] }), gris));
    const [, , d2, d3] = v.derive;
    const gouv = new THREE.Mesh(voilure(THREE, [[d3[0] - 0.55, 0.2], [d2[0] - 0.5, d2[1] - 0.25], [d2[0] - 0.01, d2[1] - 0.25], [d3[0] - 0.01, 0.2]], { plan: 'xy', relative: [0.11, 0.1] }), grisFonce);
    derive.add(gouv);
    derive.position.set(0, Y_DERIVES, cote * 1.2);
    derive.rotation.x = cote * ANGLE_DERIVES;
    avion.add(derive);
  }

  // ---- Réacteur F135 : tuyère à bord dentelé (fixe sur A et C ; orientable à trois paliers sur le B)
  const tuyere = new THREE.Group();
  const sortie = v.sortie;
  const construireTuyere = (parent, x0) => {
    const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.56, sortie - 0.25 - x0, 36, 1, true), ceramique);
    corps.rotation.z = Math.PI / 2;
    corps.position.x = (sortie - 0.25 - x0) / 2;
    parent.add(corps);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const dent = new THREE.Mesh(new THREE.BoxGeometry(k % 2 ? 0.25 : 0.18, 0.26, 0.03), ceramique);
      dent.position.set(sortie - x0 - (k % 2 ? 0.125 : 0.16), Math.sin(a) * 0.54, Math.cos(a) * 0.54);
      dent.rotation.x = -a;
      parent.add(dent);
    }
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.52, 32), noir);
    fond.rotation.y = Math.PI / 2;
    fond.position.x = sortie - x0 - 0.45;
    parent.add(fond);
  };
  const segmentsB = [];
  if (v.stovl) {
    // Tuyère orientable : trois segments qui pivotent l'un dans l'autre
    const x0 = 13.75;
    tuyere.position.set(x0, 0.05, 0);
    let parent = tuyere;
    const longueurs = [0.5, 0.5, sortie - x0 - 1.0];
    longueurs.forEach((l, i) => {
      const seg = new THREE.Group();
      if (i > 0) seg.position.x = longueurs[i - 1];
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6 - i * 0.03, 0.6 - i * 0.03, l, 32, 1, true), ceramique);
      c.rotation.z = Math.PI / 2;
      c.position.x = l / 2;
      const bague = new THREE.Mesh(new THREE.TorusGeometry(0.6 - i * 0.03, 0.03, 8, 32), grisFonce);
      bague.rotation.y = Math.PI / 2;
      seg.add(c, bague);
      parent.add(seg);
      segmentsB.push(seg);
      parent = seg;
    });
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), noir);
    fond.rotation.y = Math.PI / 2;
    fond.position.x = longueurs[2] - 0.15;
    parent.add(fond);
  } else {
    tuyere.position.set(14.5, 0.05, 0);
    construireTuyere(tuyere, 14.5);
  }
  avion.add(tuyere);

  // ---- Soutes : deux soutes ventrales, chacune à deux portes (armes visibles une fois ouvertes)
  const [sx0, sx1] = v.soute;
  const lS = sx1 - sx0;
  const portes = [];
  const ouvertures = [];
  const ySoute = -0.815;
  for (const cote of [1, -1]) {
    const soute = new THREE.Group();
    soute.scale.z = cote;
    const fond = new THREE.Mesh(new THREE.PlaneGeometry(lS, 0.8), matSoute);
    fond.rotation.x = Math.PI / 2;
    fond.position.set(sx0 + lS / 2, ySoute - 0.012, 0.6);
    fond.visible = false;
    soute.add(fond);
    ouvertures.push(fond);
    // Porte intérieure (charnière près de l'axe) et porte extérieure
    for (const [z, largeur, sens] of [[0.2, 0.3, 1], [1.0, 0.5, -1]]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx0 + lS / 2, ySoute, z);
      const p = new THREE.Mesh(new THREE.BoxGeometry(lS, 0.03, largeur), gris);
      p.position.z = sens * largeur / 2;
      pivot.add(p);
      pivot.userData.sens = sens;
      soute.add(pivot);
      portes.push(pivot);
    }
    // Armement : missile air-air AMRAAM et bombe guidée (GBU-31 de 900 kg ; GBU-32 de 450 kg sur le F-35B)
    const armes = new THREE.Group();
    const amraam = missile(THREE, 3.65, 0.178, materiaux);
    amraam.position.set(sx0 + 0.05, ySoute - 0.09, 0.33);
    const lb = v.stovl ? 3.0 : 3.88, db = v.stovl ? 0.36 : 0.46;
    const bombe = new THREE.Mesh(loft(THREE, [
      { x: 0, w: 0.06, h: 0.06 }, { x: lb * 0.12, w: db * 0.8, h: db * 0.8 }, { x: lb * 0.3, w: db, h: db }, { x: lb * 0.72, w: db, h: db }, { x: lb, w: db * 0.55, h: db * 0.55 },
    ], { segments: 20, parSegment: 4 }), new THREE.MeshStandardMaterial({ color: 0x6b6f4e, roughness: 0.7 }));
    bombe.position.set(sx0 + 0.1, ySoute - db * 0.32, 0.72);
    for (let k = 0; k < 4; k++) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, db * 0.9), grisFonce);
      a.position.set(sx0 + 0.1 + lb * 0.9, ySoute - db * 0.32, 0.72);
      a.rotation.x = (k * Math.PI) / 2 + Math.PI / 4;
      armes.add(a);
    }
    armes.add(amraam, bombe);
    armes.visible = false;
    soute.add(armes);
    ouvertures.push(armes);
    avion.add(soute);
  }

  // ---- Particularités des versions
  const animes = {};
  if (v.canon) {
    // Canon GAU-22/A de 25 mm dans l'épaule gauche, au-dessus de l'entrée d'air
    ajouter(loft(THREE, [
      { x: 6.2, w: 0.02, h: 0.02, y: 0.9, z: 1.0 },
      { x: 6.6, w: 0.22, hHaut: 0.1, hBas: 0.06, y: 0.9, z: 1.0 },
      { x: 8.6, w: 0.24, hHaut: 0.1, hBas: 0.06, y: 0.86, z: 1.0 },
      { x: 9.2, w: 0.02, h: 0.02, y: 0.82, z: 0.98 },
    ], { segments: 16, parSegment: 4 }), peau);
    ajouter(new THREE.BoxGeometry(0.08, 0.06, 0.12), noir, 6.52, 0.93, 1.0);
  }
  if (v.receptacle) {
    // Réceptacle pour la perche rigide des ravitailleurs (A330 Phénix, KC-46…)
    const creux = ajouter(new THREE.BoxGeometry(0.5, 0.02, 0.22), noir, 7.3, dos(7.3) + 0.002, 0);
    creux.visible = false;
    const pivot = new THREE.Group();
    pivot.position.set(7.55, dos(7.55) + 0.006, 0);
    const porte = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.24), gris);
    porte.position.x = -0.25;
    pivot.add(porte);
    avion.add(pivot);
    animes.receptacle = { pivot, creux };
  }
  if (v.perche) {
    // Perche de ravitaillement escamotable, côté droit devant la verrière
    const pivot = new THREE.Group();
    pivot.position.set(2.95, 0.62, -0.4);
    const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.35, 12), grisClair);
    tige.rotation.z = Math.PI / 2;
    tige.position.x = -0.675;
    const embout = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.16, 12), ceramique);
    embout.rotation.z = Math.PI / 2;
    embout.position.x = -1.38;
    pivot.add(tige, embout);
    avion.add(pivot);
    const trappe = ajouter(new THREE.BoxGeometry(1.3, 0.02, 0.1), grisFonce, 2.3, 0.6, -0.48);
    trappe.rotation.x = 0.6;
    animes.perche = { pivot, trappe };
  }
  if (v.stovl) {
    // Soufflante de sustentation : grande trappe articulée à l'arrière, soufflante, trappes ventrales
    const yDos = dos(6.15) + 0.005;
    const soufflante = ajouter(new THREE.CircleGeometry(0.5, 36), noir, 6.15, yDos + 0.002, 0);
    soufflante.rotation.x = -Math.PI / 2;
    soufflante.visible = false;
    const moyeu = ajouter(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), ceramique, 6.15, yDos + 0.01, 0);
    moyeu.visible = false;
    const pivot = new THREE.Group();
    pivot.position.set(6.85, dos(6.85) + 0.01, 0);
    const porte = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.04, 1.05), gris);
    porte.position.x = -0.675;
    pivot.add(porte);
    avion.add(pivot);
    // Entrées d'air auxiliaires du réacteur, sur le dos
    const auxiliaires = [];
    for (const z of [0.26, -0.26]) {
      const pa = new THREE.Group();
      pa.position.set(8.2, dos(8.2) + 0.005, z);
      const pp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.4), gris);
      pp.position.x = -0.3;
      pa.add(pp);
      avion.add(pa);
      auxiliaires.push(pa);
    }
    const ventrales = [];
    for (const cote of [1, -1]) {
      const pv = new THREE.Group();
      pv.position.set(6.25, -0.805, cote * 0.48);
      const pp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.45), gris);
      pp.position.z = -cote * 0.225;
      pv.add(pp);
      pv.userData.cote = cote;
      avion.add(pv);
      ventrales.push(pv);
    }
    // Colonnes d'air (vol stationnaire)
    const matAir = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.16, depthWrite: false });
    const souffle1 = ajouter(new THREE.CylinderGeometry(0.5, 0.9, 2.2, 24, 1, true), matAir, 6.2, -1.72, 0);
    const souffle2 = ajouter(new THREE.CylinderGeometry(0.5, 0.95, 2.2, 24, 1, true), matAir, 14.85, -1.72, 0);
    souffle1.visible = souffle2.visible = false;
    animes.stovl = { pivot, soufflante, moyeu, auxiliaires, ventrales, souffles: [souffle1, souffle2] };
  }
  if (v.crosse) {
    // Crosse d'appontage renforcée, sous l'arrière du fuselage
    const pivot = new THREE.Group();
    pivot.position.set(13.0, -0.52, 0);
    const bras = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.1), grisClair);
    bras.position.x = 0.85;
    const crochet = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.14), new THREE.MeshStandardMaterial({ color: 0xd8d8d0, metalness: 0.5, roughness: 0.4 }));
    crochet.position.set(1.72, -0.06, 0);
    pivot.add(bras, crochet);
    avion.add(pivot);
    animes.crosse = { pivot };
  }

  // ---- Train d'atterrissage (sorti par défaut) : roue avant simple (A, B) ou double avec barre de catapultage (C)
  // Sommet des dérives (épaisseur comprise) : la hauteur officielle se mesure de là au sol
  const sommet = Y_DERIVES + v.derive[1][1] * Math.cos(ANGLE_DERIVES) + 0.07;
  const ySol = sommet - v.hauteur;
  const train = new THREE.Group();
  /** Roue : pneu et jante claire (moyeu) des deux côtés. */
  const roue = (r, l) => {
    const g = new THREE.Group();
    const pneu = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 28), matPneu);
    pneu.rotation.x = Math.PI / 2;
    const moyeu = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, l + 0.02, 20), jante);
    moyeu.rotation.x = Math.PI / 2;
    g.add(pneu, moyeu);
    return g;
  };
  /** Trappe : une face couleur du fuselage, l'autre claire, tournée vers z = -cote × infini (vers l'axe si cote est le côté de la trappe). */
  const trappeTrain = (lx, ly, cote) => {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, 0.02), gris);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(lx * 0.96, ly * 0.94), interieur);
    b.position.z = -cote * 0.012;
    b.rotation.y = cote > 0 ? Math.PI : 0;
    g.add(a, b);
    return g;
  };
  const yVentre = -0.78;
  const rAvant = v.roueDouble ? 0.3 : 0.29;
  const xa = X_TRAIN_AVANT;
  const jambeAvant = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, yVentre - (ySol + rAvant), 12), matJambe);
  jambeAvant.position.set(xa, (yVentre + ySol + rAvant) / 2, 0);
  train.add(jambeAvant);
  // Compas et vérin de la jambe avant
  const compas = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.05), matJambe);
  compas.position.set(xa + 0.2, ySol + rAvant + 0.3, 0);
  compas.rotation.z = -0.7;
  train.add(compas);
  train.add(tubeEntre(THREE, [xa + 0.7, yVentre + 0.02, 0], [xa + 0.05, ySol + rAvant + 0.45, 0], 0.035, matJambe, 8));
  if (v.roueDouble) {
    for (const z of [0.15, -0.15]) { const r = roue(rAvant, 0.17); r.position.set(xa + 0.06, ySol + rAvant, z); train.add(r); }
    // Barre de catapultage
    const barre = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.08), matJambe);
    barre.position.set(xa - 0.35, ySol + rAvant + 0.08, 0);
    barre.rotation.z = 0.32;
    train.add(barre);
  } else {
    const r = roue(rAvant, 0.2); r.position.set(xa + 0.06, ySol + rAvant, 0); train.add(r);
  }
  // Trappes du train avant, pendantes, bords en dents de scie
  for (const cote of [1, -1]) {
    const t = trappeTrain(1.5, 0.55, cote);
    t.position.set(xa - 0.35, yVentre - 0.26, cote * 0.3);
    t.rotation.x = -cote * 0.12;
    train.add(t);
  }
  const rP = v.roueDouble ? 0.42 : 0.4;
  const xp = X_TRAIN_PRINCIPAL;
  for (const cote of [1, -1]) {
    const haut = new THREE.Vector3(xp - 0.1, -0.45, cote * 1.7);
    const bas = new THREE.Vector3(xp, ySol + rP, cote * (DEMI_VOIE - 0.12));
    const dir = new THREE.Vector3().subVectors(bas, haut);
    const jambe = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, dir.length(), 12), matJambe);
    jambe.position.copy(haut).addScaledVector(dir, 0.5);
    jambe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    // Contrefiche oblique vers l'emplanture
    const h2 = new THREE.Vector3(xp - 0.9, -0.4, cote * 1.75);
    const b2 = new THREE.Vector3(xp - 0.05, ySol + rP + 0.45, cote * (DEMI_VOIE - 0.14));
    const d2 = new THREE.Vector3().subVectors(b2, h2);
    const contrefiche = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, d2.length(), 8), matJambe);
    contrefiche.position.copy(h2).addScaledVector(d2, 0.5);
    contrefiche.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d2.clone().normalize());
    const r = roue(rP, 0.28); r.position.set(xp, ySol + rP, cote * DEMI_VOIE);
    // Grande trappe du train principal, articulée côté axe et rabattue au-delà de la verticale :
    // sa face interne claire regarde vers l'extérieur (photo au sol)
    const trappe = trappeTrain(2.2, 0.6, -cote);
    trappe.position.set(xp - 1.55, yVentre - 0.3, cote * 1.42);
    trappe.rotation.x = -cote * 0.22;
    train.add(jambe, contrefiche, r, trappe);
  }
  avion.add(train);

  avion.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material?.transparent; o.receiveShadow = true; } });
  const ox = -L / 2;
  avion.position.set(ox, 0, 0);
  const groupe = new THREE.Group();
  groupe.add(avion);
  const p = (x, y, z) => new THREE.Vector3(x + ox, y, z);

  groupe.userData.version = v.lettre;
  groupe.userData.pieces = { tuyere, porteSoufflante: animes.stovl?.pivot ?? null };
  groupe.userData.taille = 16;
  groupe.userData.dimensions = { longueur: L, envergure: 2 * v.aile[1][1], hauteur: v.hauteur };
  groupe.userData.legendes = [
    { texte: 'Verrière d\'une seule pièce', point: p(3.8, 1.55, 0) },
    { texte: 'Entrée d\'air sans piège à couche limite (DSI)', point: p(4.2, 0.25, 1.45) },
    { texte: 'Capteur optronique EOTS', point: p(2.05, -0.75, 0) },
    { texte: 'Soutes à armement', point: p((sx0 + sx1) / 2, -0.92, 0.7) },
    { texte: 'Dérives inclinées', point: p(14.1, 2.3, 1.9) },
    { texte: 'Réacteur F135', point: p(v.sortie, 0.05, 0) },
    { texte: 'Gouvernes de profondeur', point: p(15.0, 0.1, 3.0) },
    ...(v.canon ? [{ texte: 'Canon de 25 mm', point: p(7.4, 1.02, 1.0) }] : []),
    ...(v.receptacle ? [{ texte: 'Réceptacle de ravitaillement', point: p(7.3, 1.25, 0) }] : []),
    ...(v.stovl ? [{ texte: 'Soufflante de sustentation', point: p(6.15, 1.45, 0) }, { texte: 'Tuyère orientable', point: p(15.0, 0.05, 0) }, { texte: 'Buses de roulis', point: p(9.6, -0.2, 3.3) }] : []),
    ...(v.pliage ? [{ texte: 'Bouts d\'aile repliables', point: p(10.2, 0.1, 5.6) }] : []),
    ...(v.crosse ? [{ texte: 'Crosse d\'appontage', point: p(13.8, -0.7, 0) }] : []),
    ...(v.perche ? [{ texte: 'Perche de ravitaillement', point: p(2.2, 0.8, -0.7) }] : []),
  ];
  groupe.userData.commandes = [
    { id: 'rentrer', libelle: 'Rentrer le train', actif: 'Sortir le train' },
    { id: 'soutes', libelle: 'Ouvrir les soutes', actif: 'Fermer les soutes' },
    ...(v.receptacle ? [{ id: 'receptacle', libelle: 'Ouvrir le réceptacle', actif: 'Fermer le réceptacle' }] : []),
    ...(v.stovl ? [{ id: 'vertical', libelle: 'Mode vol vertical', actif: 'Mode avion' }] : []),
    ...(v.pliage ? [{ id: 'replier', libelle: 'Replier les ailes', actif: 'Déplier les ailes' }] : []),
    ...(v.crosse ? [{ id: 'crosse', libelle: 'Sortir la crosse', actif: 'Rentrer la crosse' }] : []),
    ...(v.perche ? [{ id: 'perche', libelle: 'Sortir la perche', actif: 'Rentrer la perche' }] : []),
  ];

  // Progressions animées (0 : position de repos, 1 : déployé)
  const etat = { soutes: 0, receptacle: 0, vertical: 0, replier: 0, crosse: 0, perche: 0 };
  const appliquer = () => {
    const s = etat.soutes;
    for (const pv of portes) pv.rotation.x = pv.userData.sens * s * 1.5;
    for (const o of ouvertures) o.visible = s > 0.03;
    if (animes.receptacle) {
      animes.receptacle.pivot.rotation.z = -etat.receptacle * 1.3;
      animes.receptacle.creux.visible = etat.receptacle > 0.03;
    }
    if (animes.perche) {
      const k = etat.perche;
      animes.perche.pivot.rotation.set(0, -0.42 * k, -0.14 * k);
      animes.perche.pivot.position.z = -0.4 - 0.14 * k;
      animes.perche.pivot.visible = k > 0.02;
      animes.perche.trappe.visible = k > 0.02;
    }
    if (animes.stovl) {
      const k = etat.vertical;
      const a = animes.stovl;
      a.pivot.rotation.z = -1.35 * k;
      a.soufflante.visible = a.moyeu.visible = k > 0.03;
      for (const pa of a.auxiliaires) pa.rotation.z = -0.55 * k;
      for (const pv of a.ventrales) pv.rotation.x = -pv.userData.cote * 1.3 * k;
      for (const tr of roulis) tr.rotation.x = 1.2 * k;
      segmentsB[0].rotation.z = -0.35 * k;
      segmentsB[1].rotation.z = -0.6 * k;
      segmentsB[2].rotation.z = -0.6 * k;
      for (const so of a.souffles) { so.visible = k > 0.9; }
    }
    for (const pl of pliages) pl.rotation.x = -1.6 * etat.replier;
    if (animes.crosse) animes.crosse.pivot.rotation.z = -0.55 * etat.crosse;
  };
  appliquer();
  groupe.userData.animer = (t, api = {}) => {
    train.visible = !api.rentrer;
    for (const c of Object.keys(etat)) {
      const cible = api[c] ? 1 : 0;
      etat[c] += (cible - etat[c]) * 0.06;
      if (Math.abs(cible - etat[c]) < 0.002) etat[c] = cible;
    }
    // Les souffles du vol stationnaire ondulent légèrement
    if (animes.stovl) for (const [i, so] of animes.stovl.souffles.entries()) so.material.opacity = 0.12 + 0.05 * Math.sin(t / 120 + i);
    appliquer();
  };
  return groupe;
}
