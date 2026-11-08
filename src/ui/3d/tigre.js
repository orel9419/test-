/**
 * Tigre HAD (hélicoptère d'appui et de destruction) de l'armée de Terre,
 * relevé sur des plans (vues de dessus et de face) et des photos (profil et
 * trois-quarts avant) : cotes prises sur le profil (environ 81 pixels par
 * mètre), la vue de dessus et la vue de face (échelle donnée par les
 * 4,32 m d'envergure des ailerons).
 *  - fuselage étroit et haut (environ 1 m de large), nez noir, deux pilotes
 *    en tandem sous des verrières à vitres planes étagées (pilote devant,
 *    tireur derrière et plus haut), viseur de toit au-dessus du poste arrière ;
 *  - rotor principal à quatre pales de 13 m, moyeu aplati, mât à 5,05 m du nez ;
 *    deux turbines MTR390 de part et d'autre du mât, entrées d'air grillagées,
 *    échappements relevés vers l'arrière ;
 *  - ailerons à léger dièdre négatif, deux pylônes chacun (panier de
 *    roquettes de 68 mm, lanceur de missiles) ;
 *  - tourelle de canon de 30 mm sous le nez ; train principal à 3,3 m du nez
 *    (voie de 2,15 m), roulette de queue ;
 *  - poutre de queue, dérive très en flèche portant le rotor de queue tripale
 *    à gauche, plan horizontal à deux grandes dérives d'extrémité ;
 *  - camouflage trois tons de l'armée de Terre (brun, vert, noir), code « BJD ».
 * Fuselage de 14,08 m, rotor de 13 m, 3,83 m de haut (Airbus Helicopters).
 *
 * Repère : x du nez vers la queue (nez en x = 0), y vers le haut depuis le
 * sol, z vers la gauche de l'appareil.
 */
import { surface } from './modeles.js';
import { coqueArretes, prismeFacettes, voilure, tubeEntre, cadres } from './formes.js';

const L = 14.08;
const X_MAT = 5.05;
const TOUR = Math.PI * 2;
const COULEURS = { brun: '#7b5a3c', vert: '#5b6a43', noir: '#2b2c29', olive: '#4b5136' };

/**
 * Sections du fuselage [x, haut, bas, z de l'arête, y de l'arête, contrôle du dessus (z, y), contrôle du dessous (z, y)].
 * Flancs presque verticaux sous les verrières, quille plus étroite sous le poste, poutre de queue effilée.
 */
const SECTIONS = [
  [0.0, 1.0, 1.0, 0, 1.0, 0, 1.0, 0, 1.0],
  [0.25, 1.2, 0.84, 0.3, 1.02, 0.28, 1.2, 0.2, 0.84],
  [0.7, 1.36, 0.76, 0.42, 1.06, 0.4, 1.36, 0.27, 0.76],
  [1.3, 1.5, 0.7, 0.49, 1.1, 0.48, 1.5, 0.3, 0.7],
  [2.0, 1.62, 0.66, 0.51, 1.15, 0.5, 1.62, 0.32, 0.66],
  [2.9, 1.88, 0.63, 0.52, 1.2, 0.51, 1.88, 0.34, 0.63],
  [3.8, 2.45, 0.6, 0.54, 1.3, 0.5, 2.45, 0.38, 0.6],
  [4.6, 2.95, 0.56, 0.55, 1.4, 0.48, 2.95, 0.42, 0.56],
  [5.6, 3.1, 0.53, 0.54, 1.45, 0.47, 3.1, 0.44, 0.53],
  [6.8, 3.0, 0.56, 0.5, 1.5, 0.44, 3.0, 0.42, 0.56],
  [8.0, 2.55, 0.64, 0.42, 1.55, 0.36, 2.55, 0.36, 0.64],
  [9.2, 2.18, 0.76, 0.32, 1.55, 0.28, 2.18, 0.28, 0.76],
  [10.5, 2.0, 0.9, 0.26, 1.5, 0.22, 2.0, 0.22, 0.9],
  [11.8, 1.97, 1.02, 0.23, 1.5, 0.2, 1.97, 0.2, 1.02],
  [12.75, 1.95, 1.2, 0.16, 1.58, 0.14, 1.95, 0.14, 1.2],
].map(([x, yHaut, yBas, zArete, yArete, zH, yH, zB, yB]) => ({ x, yHaut, yBas, zArete, yArete, zH, yH, zB, yB }));
const X_FIN_COQUE = SECTIONS.at(-1).x;

/** Hauteur relative (de -1 sous la quille à 1 sur le dos) d'une coordonnée v de la coque à arêtes. */
const hauteurV = (v) => {
  const w = (v % 0.5) * 4; // 0 → 1 dans le dessus, 1 → 2 dans le dessous
  return w <= 1 ? 1 - w : -(w - 1);
};

/**
 * Toile du camouflage : bandes obliques (le bord se décale selon la hauteur)
 * dans l'ordre relevé sur la photo de profil, nez noir, code « BJD » sur les
 * deux flancs.
 */
function toileTigre(olive = false) {
  if (typeof document === 'undefined') return null;
  const W = 2048, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const u = (x) => (x / X_FIN_COQUE) * W;
  ctx.fillStyle = olive ? COULEURS.olive : COULEURS.brun;
  ctx.fillRect(0, 0, W, H);
  // Bandes : [début, fin (en x à l'arête), décalage du bord vers l'arrière en haut, couleur]
  const bandes = olive ? [[0, 0.95, 0.2, COULEURS.noir]] : [
    [0, 1.0, 0.25, COULEURS.noir],
    [3.35, 4.3, -0.6, COULEURS.noir],
    [4.3, 6.0, -0.4, COULEURS.vert],
    [7.55, 9.9, -0.35, COULEURS.vert],
    [9.9, 10.85, 0.5, COULEURS.noir],
    [11.6, 12.4, -0.3, COULEURS.vert],
  ];
  for (let y = 0; y < H; y += 2) {
    const v = 1 - y / H; // la toile est retournée verticalement
    const h = hauteurV(v);
    for (const [x1, x2, decalage, couleur] of bandes) {
      ctx.fillStyle = couleur;
      const a = u(x1 + (x1 > 0 ? decalage * h : 0)), b = u(x2 + decalage * h);
      ctx.fillRect(a, y, b - a, 2);
    }
    // Dos vert au-dessus du poste et du capot de transmission
    if (!olive && h > 0.72) { ctx.fillStyle = COULEURS.vert; ctx.fillRect(u(2.6), y, u(4.4) - u(2.6), 2); }
    // Ventre noir sous la poutre
    if (!olive && h < -0.75) { ctx.fillStyle = COULEURS.noir; ctx.fillRect(u(8.2), y, u(12.75) - u(8.2), 2); }
  }
  // Légère patine
  let g = 5;
  const alea = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 2600; k++) { ctx.fillStyle = `rgba(${alea() > 0.5 ? '255,255,255' : '0,0,0'},0.035)`; ctx.fillRect(alea() * W, alea() * H, 2 + alea() * 10, 1 + alea() * 3); }
  // Code de l'appareil sur chaque flanc, au-dessus de l'arête (dessus gauche : v 0 → 0,25 ; dessus droit : v 0,5 → 0,75)
  ctx.fillStyle = '#1b1c1a';
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [v, sens] of [[0.21, 1], [0.71, -1]]) {
    ctx.save();
    ctx.translate(u(2.3), (1 - v) * H);
    ctx.scale(sens * 0.75, -1); // vu de gauche, le nez est à gauche ; vu de droite, à droite
    ctx.fillText('BJD', 0, 0);
    ctx.restore();
  }
  return c;
}

/** Pale à saumon parabolique (le bord d'attaque se recourbe vers l'arrière au bout). */
function pale(THREE, rayon, corde, mat) {
  const r0 = 0.55;
  const g = new THREE.Mesh(surface(THREE, [[r0, -corde * 0.42], [rayon - 0.55, -corde / 2], [rayon - 0.2, -corde * 0.35], [rayon, corde * 0.1], [rayon, corde / 2], [r0, corde / 2]], 0.05, { biseau: 0.012 }), mat);
  return g;
}

/**
 * Construit le Tigre HAD. Commandes : orienter le canon, livrée vert olive.
 * @returns {THREE.Group} centré, avec userData.legendes, commandes et animer
 */
export function construireTigre(THREE) {
  const h = new THREE.Group();
  const mat = (couleur, rugosite = 0.82) => new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: 0.12, envMapIntensity: 0.55 });
  const brun = mat(COULEURS.brun), vert = mat(COULEURS.vert), noir = mat(COULEURS.noir);
  const sombre = new THREE.MeshStandardMaterial({ color: 0x1d1e1c, roughness: 0.7, metalness: 0.3 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8b8f92, roughness: 0.4, metalness: 0.8 });
  const pneu = new THREE.MeshStandardMaterial({ color: 0x161718, roughness: 0.92 });
  const jante = new THREE.MeshStandardMaterial({ color: 0x55594e, roughness: 0.6, metalness: 0.4 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x3a4a4c, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const cadre = new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.75 });
  const matPale = new THREE.MeshStandardMaterial({ color: 0x3a3f33, roughness: 0.75, metalness: 0.1 });
  const optique = new THREE.MeshStandardMaterial({ color: 0x0f1a24, metalness: 0.85, roughness: 0.08 });
  const ajouter = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); h.add(o); return o; };

  // ---- Fuselage (coque à arêtes) peint en camouflage
  const toiles = { photo: toileTigre(false), olive: toileTigre(true) };
  const texture = (c) => { if (!c) return null; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const textures = { photo: texture(toiles.photo), olive: texture(toiles.olive) };
  const peau = new THREE.MeshStandardMaterial({ color: textures.photo ? 0xffffff : COULEURS.brun, map: textures.photo, roughness: 0.82, metalness: 0.1, envMapIntensity: 0.55 });
  ajouter(coqueArretes(THREE, SECTIONS, { points: 10, parSegment: 6 }), peau);

  // ---- Verrières à vitres planes : pilote devant, tireur derrière et plus haut ; montants sombres
  const verriere = (sections) => {
    const g = prismeFacettes(THREE, sections.map(([x, yA, yT, dA, dT]) => [x, [[dA, yA], [dT, yT], [-dT, yT], [-dA, yA]]]), { fermer: true });
    h.add(new THREE.Mesh(g, verre));
    h.add(cadres(THREE, g, 0.028, cadre, 15));
  };
  verriere([[1.28, 1.49, 1.51, 0.45, 0.4], [1.8, 1.56, 2.18, 0.49, 0.3], [2.48, 1.63, 2.3, 0.5, 0.3], [2.62, 1.66, 2.3, 0.5, 0.3]]);
  verriere([[2.6, 1.66, 2.3, 0.5, 0.3], [2.98, 1.86, 2.85, 0.51, 0.29], [3.55, 1.95, 2.92, 0.51, 0.29], [3.88, 2.28, 2.78, 0.47, 0.28]]);
  // Équipage : deux casques et sièges
  for (const [x, y] of [[2.15, 1.95], [3.3, 2.4]]) {
    const casque = ajouter(new THREE.SphereGeometry(0.15, 14, 10), mat(0x4a5040, 0.6), x, y, 0);
    casque.scale.set(1.1, 1, 0.95);
    ajouter(new THREE.BoxGeometry(0.22, 0.6, 0.44), sombre, x + 0.3, y - 0.25, 0);
  }

  // ---- Viseur de toit (au-dessus du poste arrière, devant le mât) : tambour brun, vitre vers l'avant
  ajouter(new THREE.CylinderGeometry(0.38, 0.39, 0.36, 28), brun, 3.98, 3.1, 0);
  const coiffe = ajouter(new THREE.SphereGeometry(0.38, 28, 12, 0, TOUR, 0, Math.PI / 2), brun, 3.98, 3.28, 0);
  coiffe.scale.y = 0.42;
  const vitre = ajouter(new THREE.PlaneGeometry(0.46, 0.22), optique, 3.594, 3.12, 0);
  vitre.rotation.y = -Math.PI / 2;
  ajouter(new THREE.CylinderGeometry(0.2, 0.26, 0.32, 16), noir, 3.98, 2.8, 0);

  // ---- Turbines MTR390 : nacelles de part et d'autre du mât, entrées grillagées, échappements relevés
  for (const s of [1, -1]) {
    const nacelle = prismeFacettes(THREE, [
      [4.25, [[0.3, 2.95], [0.72, 2.92], [0.75, 2.5], [0.3, 2.45]]],
      [5.0, [[0.3, 3.08], [0.8, 3.02], [0.82, 2.42], [0.3, 2.38]]],
      [7.0, [[0.28, 3.0], [0.76, 2.95], [0.78, 2.45], [0.28, 2.42]]],
      [7.7, [[0.25, 2.85], [0.62, 2.82], [0.64, 2.55], [0.25, 2.52]]],
    ].map(([x, p]) => [x, p.map(([z, y]) => [z * s, y])]), { inverser: s > 0, fermer: true });
    ajouter(nacelle, s > 0 ? brun : vert);
    // Entrée d'air ronde et grille bombée (filtre à sable)
    const anneau = ajouter(new THREE.TorusGeometry(0.21, 0.04, 8, 24), sombre, 4.24, 2.72, s * 0.53);
    anneau.rotation.y = Math.PI / 2;
    const grille = ajouter(new THREE.SphereGeometry(0.21, 20, 12, 0, TOUR, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9aa3a6, roughness: 0.35, metalness: 0.6, transparent: true, opacity: 0.8 }), 4.24, 2.72, s * 0.53);
    grille.rotation.z = Math.PI / 2;
    grille.scale.y = 0.55;
    // Échappement : conduit qui se relève vers l'arrière et l'extérieur
    const carenage = prismeFacettes(THREE, [
      [7.65, [[0.26, 2.84], [0.62, 2.82], [0.64, 2.56], [0.26, 2.53]]],
      [8.3, [[0.3, 2.9], [0.6, 2.88], [0.6, 2.72], [0.3, 2.7]]],
    ].map(([x, p]) => [x, p.map(([z, y]) => [z * s, y])]), { inverser: s > 0, fermer: true });
    ajouter(carenage, vert);
    const bouche = ajouter(new THREE.CircleGeometry(1, 20), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 1 }), 8.31, 2.81, s * 0.45);
    bouche.scale.set(0.15, 0.08, 1);
    bouche.rotation.y = Math.PI / 2;
  }
  // Carénage du mât et de la boîte de transmission
  ajouter(new THREE.CylinderGeometry(0.26, 0.42, 0.42, 20), vert, X_MAT, 3.15, 0);

  // ---- Rotor principal : moyeu aplati (vert), quatre pales de 6,5 m à saumon parabolique
  const rotor = new THREE.Group();
  rotor.position.set(X_MAT, 3.62, 0);
  rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.4, 12), sombre));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 10), vert);
  dome.scale.set(1, 0.24, 1);
  dome.position.y = 0.18;
  rotor.add(dome);
  for (let i = 0; i < 4; i++) {
    const bras = new THREE.Group();
    bras.rotation.y = (i * TOUR) / 4;
    const p = pale(THREE, 6.5, 0.5, matPale);
    p.position.y = 0.06;
    p.rotation.x = 0.05;
    const manchon = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.22), sombre);
    manchon.position.set(0.5, 0.06, 0);
    bras.add(p, manchon);
    rotor.add(bras);
  }
  const flou = new THREE.Mesh(new THREE.CircleGeometry(6.5, 48), new THREE.MeshBasicMaterial({ color: 0x2a2c2e, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
  flou.rotation.x = -Math.PI / 2;
  flou.position.y = 0.06;
  rotor.add(flou);
  h.add(rotor);

  // ---- Ailerons (dièdre négatif) : pylône intérieur (roquettes de 68 mm), pylône extérieur (missiles)
  for (const s of [1, -1]) {
    const aile = new THREE.Group();
    aile.add(new THREE.Mesh(voilure(THREE, [[4.15, 0.45], [4.3, 2.16], [5.28, 2.16], [5.45, 0.45]], { profil: 'naca', relative: [0.14, 0.12] }), vert));
    // Pylônes
    for (const zp of [1.22, 1.88]) { const py = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.07), sombre); py.position.set(4.82, -0.16, zp); aile.add(py); }
    // Panier de 22 roquettes de 68 mm
    const panier = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 1.45, 20), vert);
    panier.rotation.z = Math.PI / 2;
    panier.position.set(4.8, -0.5, 1.22);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), sombre);
    face.rotation.y = -Math.PI / 2;
    face.position.set(4.07, -0.5, 1.22);
    aile.add(panier, face);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TOUR, r = k ? 0.12 : 0;
      const trou = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), new THREE.MeshStandardMaterial({ color: 0x050505 }));
      trou.rotation.y = -Math.PI / 2;
      trou.position.set(4.065, -0.5 + Math.sin(a) * r, 1.22 + Math.cos(a) * r);
      aile.add(trou);
    }
    // Lanceur à deux missiles (rail et tubes)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.3), vert);
    rail.position.set(4.85, -0.32, 1.88);
    aile.add(rail);
    for (const dz of [-0.09, 0.09]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 1.6, 12), mat(0x575d47, 0.7));
      m.rotation.z = Math.PI / 2;
      m.position.set(4.85, -0.47, 1.88 + dz);
      const ogive = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), mat(0x575d47, 0.7));
      ogive.position.set(4.05, -0.47, 1.88 + dz);
      aile.add(m, ogive);
    }
    // Saumon : petit lance-leurres
    const leurres = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.1), sombre);
    leurres.position.set(4.75, 0, 2.2);
    aile.add(leurres);
    aile.scale.z = s;
    aile.rotation.x = s * 0.15; // dièdre négatif : saumon plus bas que l'emplanture
    aile.position.y = 1.78;
    h.add(aile);
  }

  // ---- Tourelle du canon de 30 mm sous le nez (orientable)
  const tourelle = new THREE.Group();
  tourelle.position.set(0.58, 0.64, 0);
  const carter = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), sombre);
  carter.scale.set(1.2, 0.9, 1);
  const berceau = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.2), sombre);
  berceau.position.set(-0.25, -0.05, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.75, 10), sombre);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(-1.1, -0.05, 0);
  const bouche = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), sombre);
  bouche.rotation.z = Math.PI / 2;
  bouche.position.set(-1.95, -0.05, 0);
  tourelle.add(carter, berceau, tube, bouche);
  h.add(tourelle);
  h.add(tubeEntre(THREE, [0.58, 0.85, 0], [0.58, 0.72, 0], 0.12, sombre, 12));
  // Optiques du nez (vision du pilote)
  for (const z of [0.12, -0.12]) {
    const o = ajouter(new THREE.SphereGeometry(0.07, 12, 8), optique, 0.12, 1.05, z);
    o.scale.x = 0.5;
  }

  // ---- Train principal (jambe, amortisseur oblique, roue) et roulette de queue
  for (const s of [1, -1]) {
    h.add(tubeEntre(THREE, [3.0, 0.82, s * 0.38], [3.32, 0.3, s * 0.98], 0.055, metal));
    h.add(tubeEntre(THREE, [3.05, 1.55, s * 0.55], [3.3, 0.42, s * 1.0], 0.05, metal));
    const roue = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 24), pneu);
    p.rotation.x = Math.PI / 2;
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 16), jante);
    j.rotation.x = Math.PI / 2;
    roue.add(p, j);
    roue.position.set(3.3, 0.3, s * 1.075);
    h.add(roue);
  }
  h.add(tubeEntre(THREE, [11.1, 1.02, 0], [11.32, 0.14, 0], 0.04, metal));
  const roulette = ajouter(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), pneu, 11.35, 0.14, 0);
  roulette.rotation.x = Math.PI / 2;

  // ---- Empennage : dérive très en flèche, rotor de queue tripale à gauche, plan horizontal à dérives d'extrémité
  const derive = new THREE.Mesh(voilure(THREE, [[11.75, 0], [13.28, 1.72], [14.08, 1.72], [13.55, -0.1]], { plan: 'xy', profil: 'naca', relative: [0.12, 0.1] }), brun);
  derive.position.y = 1.93;
  h.add(derive);
  ajouter(new THREE.SphereGeometry(0.2, 14, 10), sombre, 13.3, 3.3, 0.1).scale.set(1.4, 1, 0.8);
  const rotorQueue = new THREE.Group();
  rotorQueue.position.set(13.3, 3.3, 0.3);
  rotorQueue.rotation.x = Math.PI / 2;
  rotorQueue.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12), sombre));
  for (let i = 0; i < 3; i++) {
    const bras = new THREE.Group();
    bras.rotation.y = (i * TOUR) / 3;
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.2), matPale);
    p.position.x = 0.75;
    bras.add(p);
    rotorQueue.add(bras);
  }
  const flouQueue = new THREE.Mesh(new THREE.CircleGeometry(1.35, 32), new THREE.MeshBasicMaterial({ color: 0x2a2c2e, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
  flouQueue.rotation.x = -Math.PI / 2;
  rotorQueue.add(flouQueue);
  h.add(rotorQueue);
  for (const s of [1, -1]) {
    const plan = new THREE.Mesh(voilure(THREE, [[12.45, 0.12], [12.55, 1.25], [13.15, 1.25], [13.1, 0.12]], { profil: 'naca', relative: [0.12, 0.11] }), brun);
    plan.position.y = 1.9;
    plan.scale.z = s;
    h.add(plan);
    const bout = new THREE.Mesh(voilure(THREE, [[12.1, -0.47], [12.9, 0.58], [13.84, 0.52], [13.04, -0.59]], { plan: 'xy', profil: 'naca', relative: [0.08, 0.08] }), s > 0 ? brun : vert);
    bout.position.set(0, 1.9, s * 1.27);
    h.add(bout);
  }

  h.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material?.transparent; o.receiveShadow = true; } });
  const xMilieu = L / 2, y0 = -2.2;
  h.position.set(-xMilieu, y0, 0);
  const groupe = new THREE.Group();
  groupe.add(h);
  const p = (x, y, z) => new THREE.Vector3(x - xMilieu, y + y0, z);
  groupe.userData.legendes = [
    { texte: 'Canon de 30 mm en tourelle', point: p(-0.9, 0.55, 0) },
    { texte: 'Viseur de toit', point: p(3.98, 3.5, 0) },
    { texte: 'Pilote (devant) et tireur (derrière)', point: p(2.6, 2.95, 0.5) },
    { texte: 'Turbines MTR390', point: p(5.8, 3.15, 0.8) },
    { texte: 'Roquettes de 68 mm', point: p(4.0, 1.25, 1.3) },
    { texte: 'Missiles', point: p(4.0, 1.25, -1.95) },
    { texte: 'Rotor de queue', point: p(13.3, 3.3, 0.5) },
    { texte: 'Dérives d\'extrémité', point: p(13.4, 2.6, 1.3) },
  ];
  groupe.userData.commandes = [
    { id: 'tourelle', libelle: 'Orienter le canon', actif: 'Canon dans l\'axe' },
    { id: 'olive', libelle: 'Livrée vert olive', actif: 'Livrée camouflée' },
  ];
  groupe.userData.dimensions = { longueur: L, rotor: 13, hauteur: 3.83 };
  let angle = 0, olive = false;
  groupe.userData.animer = (t, api = {}) => {
    rotor.rotation.y = t / 60;
    rotorQueue.rotation.y = t / 18;
    angle += ((api.tourelle ? 0.7 * Math.sin(t / 1100) : 0) - angle) * 0.06;
    tourelle.rotation.y = angle;
    tourelle.rotation.z = api.tourelle ? 0.12 + 0.08 * Math.sin(t / 900) : 0;
    if (!!api.olive !== olive && textures.photo) { olive = !!api.olive; peau.map = olive ? textures.olive : textures.photo; peau.needsUpdate = true; }
  };
  groupe.userData.taille = 14;
  return groupe;
}
