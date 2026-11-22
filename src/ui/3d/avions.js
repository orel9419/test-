/**
 * Mirage 2000-5F en 3D (three.js), d'après les photos de l'armée de l'Air
 * et de l'Espace : aile delta pure, entrées d'air latérales à demi-cônes
 * (« souris ») et petits plans fixes au-dessus, verrière en bulle, perche de
 * ravitaillement fixe, grande dérive, réacteur M53-P2, camouflage deux tons
 * de gris. Dimensions : 14,36 m de long, 9,13 m d'envergure, 5,20 m de haut.
 *
 * Repère : x du nez vers la queue, y vers le haut, z vers la gauche ; le
 * groupe renvoyé est centré, le nez vers -x.
 */
import { loft, surface, cocarde, missile, texturePeinte } from './modeles.js';

/**
 * Livrées : camouflage deux tons de gris de l'armée de l'Air et de l'Espace.
 *  - « bleu » : gris bleu clair (Celomer 1625) à taches gris bleu foncé (1620),
 *    d'après un profil de l'EC 2/5 ;
 *  - « gris » : gris moyen à taches gris foncé, dessous gris clair, d'après un
 *    plan de l'EC 2/2 (code 2-FD).
 */
const LIVREES = {
  bleu: { clair: '#7c828a', fonce: '#566b89', ventre: '#7c828a', code: '5-OZ', radome: 0x8d9095 },
  gris: { clair: '#5f6266', fonce: '#303337', ventre: '#7e8186', code: '2-FD', radome: 0x85878a },
};

function hasard(g) { return () => { g = (g * 16807) % 2147483647; return g / 2147483647; }; }

/** Tache à contour ondulé (sommets lissés par deux harmoniques), centre (cx, cy) et demi-axes en mètres. */
function tache(ctx, versToile, cx, cy, rx, ry, h) {
  const p1 = h() * 6, p2 = h() * 6;
  ctx.beginPath();
  for (let k = 0; k < 28; k++) {
    const t = (k / 28) * Math.PI * 2;
    const f = 1 + 0.2 * Math.sin(3 * t + p1) + 0.12 * Math.sin(5 * t + p2);
    const [X, Y] = versToile(cx + Math.cos(t) * rx * f, cy + Math.sin(t) * ry * f);
    if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.closePath();
  ctx.fill();
}

const nouveauCanvas = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

/**
 * Fuselage : u = position le long de x (0 à 14 m), v = angle autour de l'axe
 * (0 : flanc gauche, 0,25 : dessus, 0,5 : flanc droit, 0,75 : ventre). Taches
 * sur le dessus et la moitié haute des flancs, dessous clair ; les deux flancs
 * ne sont pas identiques, comme sur un avion réel.
 */
function toileFuselage(l) {
  const W = 2048, H = 512;
  const c = nouveauCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = l.clair;
  ctx.fillRect(0, 0, W, H);
  if (l.ventre !== l.clair) { ctx.fillStyle = l.ventre; ctx.fillRect(0, (1 - 0.9) * H, W, 0.32 * H); }
  const versToile = (x, v) => [(x / 14) * W, (1 - v) * H];
  const h = hasard(41);
  ctx.filter = 'blur(2px)';
  ctx.fillStyle = l.fonce;
  // Flanc gauche : [x, hauteur (0 flanc, 0,25 dessus), demi-longueur, demi-hauteur]
  for (const [x, v, rx, rv] of [[2.3, 0.15, 1.1, 0.07], [4.9, 0.12, 1.9, 0.085], [5.6, 0.03, 1.2, 0.04], [8.7, 0.15, 2.0, 0.075], [12.3, 0.08, 1.3, 0.055], [3.5, 0.245, 1.8, 0.045], [7, 0.25, 2.0, 0.05], [11, 0.25, 1.8, 0.045]]) tache(ctx, versToile, x, v, rx, rv, h);
  // Flanc droit : angle miroir (0,5 - hauteur), taches décalées
  for (const [x, v, rx, rv] of [[2.9, 0.14, 1.0, 0.07], [5.5, 0.1, 1.7, 0.085], [9.3, 0.14, 1.9, 0.075], [11.8, 0.05, 1.3, 0.05], [4, 0.24, 1.8, 0.045], [8, 0.25, 2.2, 0.05], [12, 0.25, 1.5, 0.045]]) tache(ctx, versToile, x, 0.5 - v, rx, rv, h);
  ctx.filter = 'none';
  for (let k = 0; k < 700; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '25,32,42'},0.035)`; ctx.fillRect(h() * W, h() * H, 3 + h() * 14, 1 + h() * 3); }
  return c;
}

/** Dessus de l'aile : taches gris foncé sur fond transparent (x, z en mètres sur 16 × 8 m), posées sur l'aile gris clair. */
function toileAile(l) {
  const W = 1024, H = 512;
  const c = nouveauCanvas(W, H);
  const ctx = c.getContext('2d');
  const h = hasard(77);
  ctx.filter = 'blur(1.5px)';
  ctx.fillStyle = l.fonce;
  const versToile = (x, z) => [(x / 16) * W, (1 - z / 8) * H];
  for (const [x, z, rx, rz] of [[6.6, 1.1, 0.9, 0.45], [9.0, 1.7, 1.1, 0.5], [10.9, 3.5, 0.7, 0.6], [8.0, 3.1, 0.7, 0.35], [10.6, 0.8, 0.8, 0.3], [11.7, 4.4, 0.3, 0.3], [7.4, 2.2, 0.5, 0.3]]) tache(ctx, versToile, x, z, rx, rz, h);
  return c;
}

/** Dérive : x, y en mètres sur 16 × 8 m, fond gris et taches foncées. */
function toileDerive(l) {
  const W = 2048, H = 1024;
  const c = nouveauCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = l.clair;
  ctx.fillRect(0, 0, W, H);
  const h = hasard(19);
  ctx.filter = 'blur(2px)';
  ctx.fillStyle = l.fonce;
  const versToile = (x, y) => [(x / 16) * W, (1 - y / 8) * H];
  for (const [x, y, rx, ry] of [[10.4, 0.35, 0.8, 0.3], [12.0, 1.1, 0.6, 0.4], [13.3, 0.35, 0.5, 0.25], [13.0, 2.2, 0.5, 0.15]]) tache(ctx, versToile, x, y, rx, ry, h);
  return c;
}

/**
 * Mirage 2000-5F, relevé sur un plan trois vues coté (profil, dessous, face
 * et sections) et d'après les photos de l'armée de l'Air et de l'Espace :
 * long radôme conique, verrière en bulle, perche de ravitaillement fixe à
 * droite, entrées d'air latérales en « D » avec leurs demi-cônes (souris),
 * petits plans fixes au-dessus, aile delta pure (bord d'attaque à 58°, bord
 * de fuite droit) placée bas sur le fuselage, dérive en flèche, deux quilles
 * ventrales, tuyère du M53-P2, camouflage deux tons de gris.
 * 14,36 m de long, 9,13 m d'envergure, 5,20 m de haut. Repère : y = 0 sur
 * l'axe du fuselage arrière, sol à y = -1,9 (train sorti).
 */
export function construireMirage2000(THREE, { police = false } = {}) {
  const avion = new THREE.Group();
  const texture = (canvas, planaire = false) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (planaire) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 16, 1 / 8); }
    return t;
  };
  const textures = {};
  const livree = (id) => (textures[id] ??= { fus: texture(toileFuselage(LIVREES[id])), aile: texture(toileAile(LIVREES[id]), true), derive: texture(toileDerive(LIVREES[id]), true) });
  const camo = new THREE.MeshStandardMaterial({ map: livree('bleu').fus, metalness: 0.08, roughness: 0.62, envMapIntensity: 0.35 });
  const camoAile = new THREE.MeshStandardMaterial({ color: LIVREES.bleu.ventre, metalness: 0.08, roughness: 0.62, envMapIntensity: 0.35 });
  const camoDessus = new THREE.MeshStandardMaterial({ map: livree('bleu').aile, transparent: true, side: THREE.DoubleSide, depthWrite: false, metalness: 0.08, roughness: 0.62, envMapIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const camoDerive = new THREE.MeshStandardMaterial({ map: livree('bleu').derive, metalness: 0.08, roughness: 0.62, envMapIntensity: 0.35 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x6e7379, metalness: 0.15, roughness: 0.6, envMapIntensity: 0.4 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x585d63, metalness: 0.25, roughness: 0.55 });
  const radome = new THREE.MeshStandardMaterial({ color: LIVREES.bleu.radome, metalness: 0.1, roughness: 0.55, envMapIntensity: 0.4 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.9, roughness: 0.35 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.2, roughness: 0.85 });
  const interieur = new THREE.MeshStandardMaterial({ color: 0x23272c, metalness: 0.2, roughness: 0.75, side: THREE.DoubleSide });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x3d4a52, metalness: 0.5, roughness: 0.04, transparent: true, opacity: 0.6, clearcoat: 1 });
  const materiaux = { missile: new THREE.MeshStandardMaterial({ color: 0xd9dcde, metalness: 0.2, roughness: 0.5 }), missileOgive: new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.3, roughness: 0.4 }) };

  // Fuselage relevé sur le profil du plan : nez plus bas que l'arrière, hauteur maximale au droit des entrées d'air
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 0.0, w: 0, h: 0, y: -0.41 },
    { x: 0.25, w: 0.16, hHaut: 0.08, hBas: 0.08, y: -0.405 },
    { x: 0.6, w: 0.31, hHaut: 0.155, hBas: 0.155, y: -0.4 },
    { x: 1.0, w: 0.47, hHaut: 0.235, hBas: 0.235, y: -0.375 },
    { x: 1.5, w: 0.65, hHaut: 0.325, hBas: 0.33, y: -0.345 },
    { x: 2.4, w: 0.98, hHaut: 0.52, hBas: 0.56, y: -0.27, n: 2.1 },
    { x: 3.6, w: 1.05, hHaut: 0.6, hBas: 0.6, y: -0.27, n: 2.3 },
    { x: 4.8, w: 1.1, hHaut: 0.75, hBas: 0.7, y: -0.12, n: 2.5 },
    { x: 6.5, w: 1.15, hHaut: 0.85, hBas: 0.75, y: 0, n: 2.6 },
    { x: 9.0, w: 1.15, hHaut: 0.82, hBas: 0.7, y: 0, n: 2.6 },
    { x: 11.5, w: 1.1, hHaut: 0.72, hBas: 0.67, y: 0.03, n: 2.4 },
    { x: 13.0, w: 1.05, hHaut: 0.62, hBas: 0.62, y: 0, n: 2.2 },
    { x: 14.0, w: 0.95, hHaut: 0.52, hBas: 0.52, y: 0.04, n: 2 },
  ], { segments: 56, parSegment: 8 }), camo));
  // Radôme du radar RDY, d'un gris légèrement différent
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: -0.005, w: 0, h: 0, y: -0.41 },
    { x: 0.25, w: 0.165, hHaut: 0.083, hBas: 0.083, y: -0.405 },
    { x: 0.6, w: 0.325, hHaut: 0.163, hBas: 0.163, y: -0.4 },
    { x: 1.0, w: 0.488, hHaut: 0.245, hBas: 0.245, y: -0.375 },
    { x: 1.5, w: 0.668, hHaut: 0.336, hBas: 0.341, y: -0.345 },
    { x: 2.2, w: 0.955, hHaut: 0.505, hBas: 0.54, y: -0.285 },
  ], { segments: 40, parSegment: 6, fermer: false }), radome));
  // Entrées d'air latérales en « D » : construites pour le côté gauche (z > 0), puis symétrisées.
  // Lèvre semi-circulaire (rayon 0,5 m) dont le côté plat longe le fuselage, séparée de lui par le
  // piège à couche limite ; demi-cône (« souris ») qui dépasse de 0,7 m en avant ; conduit gris
  // visible à l'intérieur ; petit plan fixe au-dessus.
  for (const cote of [1, -1]) {
    const ea = new THREE.Group();
    ea.add(new THREE.Mesh(loft(THREE, [
      { x: 5.05, w: 0.58, hHaut: 0.52, hBas: 0.52, y: -0.2, z: 0.98, n: 2.3 },
      { x: 6.5, w: 0.74, hHaut: 0.56, hBas: 0.56, y: -0.18, z: 0.9, n: 2.3 },
      { x: 8.5, w: 0.58, hHaut: 0.5, hBas: 0.52, y: -0.16, z: 0.78, n: 2.2 },
      { x: 10.5, w: 0.16, hHaut: 0.25, hBas: 0.26, y: -0.12, z: 0.58, n: 2 },
    ], { segments: 36, parSegment: 6, fermer: false }), camo));
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 1.0, 28, 1, true, -Math.PI / 2, Math.PI), interieur);
    conduit.rotation.z = -Math.PI / 2;
    conduit.position.set(5.6, -0.2, 0.7);
    const fondConduit = new THREE.Mesh(new THREE.CircleGeometry(0.45, 28, -Math.PI / 2, Math.PI), noir);
    fondConduit.rotation.y = -Math.PI / 2;
    fondConduit.position.set(6.08, -0.2, 0.7);
    const levre = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.045, 8, 28, Math.PI), gris);
    levre.rotation.set(0, -Math.PI / 2, -Math.PI / 2);
    levre.position.set(5.08, -0.2, 0.7);
    const separateur = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.02, 0.035), gris);
    separateur.position.set(5.6, -0.2, 0.69);
    const souris = new THREE.Mesh(new THREE.ConeGeometry(0.27, 1.2, 24, 1, false, -Math.PI / 2, Math.PI), gris);
    souris.rotation.z = Math.PI / 2;
    souris.position.set(4.98, -0.2, 0.705);
    const corpsSouris = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.55, 24, 1, false, -Math.PI / 2, Math.PI), gris);
    corpsSouris.rotation.z = Math.PI / 2;
    corpsSouris.position.set(5.85, -0.2, 0.705);
    const plan = new THREE.Mesh(surface(THREE, [[5.4, 1.02], [6.2, 1.44], [6.65, 1.44], [6.55, 1.02]], 0.04, { biseau: 0.01 }), camo);
    plan.position.y = 0.32;
    ea.add(conduit, fondConduit, levre, separateur, souris, corpsSouris, plan);
    ea.scale.z = cote;
    avion.add(ea);
  }

  // Aile delta pure relevée sur la vue de dessous : bord d'attaque de (5,1 ; 0,75) à (11,2 ; 4,57), bord de fuite droit à 12,05 m
  const contourAile = [[5.1, 0.6], [11.2, 4.57], [12.07, 4.57], [12.05, 0.6]];
  const aileG = surface(THREE, contourAile, 0.16);
  const aileDessus = new THREE.ShapeGeometry(new THREE.Shape(contourAile.map(([a, b]) => new THREE.Vector2(a, b))));
  aileDessus.rotateX(Math.PI / 2);
  const elevonInt = surface(THREE, [[11.25, 0.75], [11.25, 2.55], [12.06, 2.55], [12.06, 0.75]], 0.08, { biseau: 0.015 });
  const elevonExt = surface(THREE, [[11.25, 2.65], [11.25, 4.4], [12.07, 4.4], [12.07, 2.65]], 0.08, { biseau: 0.015 });
  for (const cote of [1, -1]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(aileG, camoAile));
    const e1 = new THREE.Mesh(elevonInt, camoAile), e2 = new THREE.Mesh(elevonExt, camoAile);
    e1.position.y = e2.position.y = 0.012;
    g.add(e1, e2);
    // Dessus : taches de camouflage posées sur l'aile gris clair
    const dessus = new THREE.Mesh(aileDessus, camoDessus);
    dessus.position.y = 0.117;
    dessus.renderOrder = 2;
    g.add(dessus);
    const c = cocarde(THREE, 0.32);
    c.rotation.x = -Math.PI / 2;
    c.position.set(10.6, 0.13, 3.5);
    g.add(c);
    // Joints des gouvernes (élevons) et des becs de bord d'attaque
    const joint = (x, z, l, rot = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(l, 0.006, 0.02), noir); m.position.set(x, 0.118, z); m.rotation.y = rot; return m; };
    g.add(joint(11.28, 1.65, 1.8, Math.PI / 2), joint(11.28, 3.5, 1.8, Math.PI / 2), joint(11.64, 2.6, 0.82), joint(11.66, 0.76, 0.8), joint(11.66, 4.35, 0.8));
    const ang = Math.atan2(4.57 - 0.75, 11.2 - 5.1); // bord d'attaque
    for (const u of [0.18, 0.4, 0.62, 0.84]) {
      const x = 5.1 + (11.2 - 5.1) * u, z = 0.75 + (4.57 - 0.75) * u;
      const bec = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 0.5), noir);
      bec.position.set(x + 0.16, 0.118, z - 0.03);
      bec.rotation.y = -ang + Math.PI / 2 - 0.02;
      g.add(bec);
    }
    g.scale.z = cote;
    g.rotation.x = -cote * 0.015;
    g.position.y = -0.6;
    avion.add(g);
    // Cocarde sur le flanc arrière, quilles ventrales
    const cr = cocarde(THREE, 0.24);
    cr.position.set(12.4, 0.12, cote * 0.555);
    cr.rotation.y = cote > 0 ? 0.08 : Math.PI - 0.08;
    const quille = new THREE.Mesh(surface(THREE, [[11.9, 0], [12.9, -0.36], [13.3, -0.36], [13.3, 0]], 0.04, { plan: 'xy', biseau: 0.01 }), grisFonce);
    quille.position.set(0, -0.5, cote * 0.3);
    avion.add(cr, quille);
  }
  // Dérive relevée sur le profil : bord d'attaque de 9,5 m à 12,9 m, saumon jusqu'à 13,9 m, 2,37 m au-dessus du dos
  const derive = new THREE.Mesh(surface(THREE, [[9.5, 0.0], [12.9, 2.37], [13.9, 2.37], [13.4, 0.0]], 0.12, { plan: 'xy' }), camoDerive);
  derive.position.y = 0.68;
  const gouverne = new THREE.Mesh(surface(THREE, [[13.0, 0.3], [13.55, 2.15], [13.82, 2.15], [13.38, 0.3]], 0.1, { plan: 'xy', biseau: 0.012 }), camoDerive);
  gouverne.position.y = 0.68;
  // Conteneur du parachute de freinage, au pied du bord de fuite de la dérive
  const parachute = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.7, 6, 16), camoDerive);
  parachute.rotation.z = Math.PI / 2;
  parachute.position.set(13.3, 0.7, 0);
  const pointeParachute = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 16), grisFonce);
  pointeParachute.rotation.z = Math.PI / 2;
  pointeParachute.position.set(14.25, 0.7, 0);
  avion.add(parachute, pointeParachute);
  const saumon = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.95, 4, 10), grisFonce);
  saumon.rotation.z = Math.PI / 2;
  saumon.position.set(13.35, 3.1, 0);
  avion.add(derive, gouverne, saumon);
  const ecriture = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, 'ARMÉE DE L\'AIR', { couleur: '#1d2733', largeur: 512, hauteur: 64 }), transparent: true, depthWrite: false });
  const codes = Object.fromEntries(Object.entries(LIVREES).map(([id, l]) => [id, texturePeinte(THREE, l.code, { couleur: id === 'gris' ? '#e8eaec' : '#1d2733', largeur: 256, hauteur: 80 })]));
  const code = new THREE.MeshBasicMaterial({ map: codes.bleu, transparent: true, depthWrite: false });
  for (const cote of [1, -1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.2), ecriture);
    e.position.set(12.0, 1.35, cote * 0.075);
    e.rotation.set(0, cote > 0 ? 0 : Math.PI, 0);
    const k = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.3), code);
    k.position.set(3.75, -0.22, cote * 0.55);
    k.rotation.y = cote > 0 ? 0.08 : Math.PI - 0.08;
    const insigne = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshStandardMaterial({ color: 0x2b333d, roughness: 0.6 }));
    insigne.position.set(12.6, 2.0, cote * 0.075);
    insigne.rotation.y = cote > 0 ? 0 : Math.PI;
    avion.add(e, k, insigne);
  }
  // Tuyère du M53-P2 : jonc de sortie et seize volets articulés (titane), cône interne sombre
  const titane = new THREE.MeshStandardMaterial({ color: 0x8a847a, metalness: 0.75, roughness: 0.42 });
  const brule = new THREE.MeshStandardMaterial({ color: 0x4b4640, metalness: 0.8, roughness: 0.5 });
  const arriere = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 32, 1, true), metal);
  arriere.rotation.z = Math.PI / 2;
  arriere.position.set(13.95, 0.04, 0);
  avion.add(arriere);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    const volet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.015, 0.2), k % 2 ? titane : brule);
    volet.position.set(14.2, 0.04 + Math.sin(a) * 0.44, Math.cos(a) * 0.44);
    volet.rotation.x = a - Math.PI / 2;
    volet.rotateZ(-0.09); // les volets se resserrent vers l'arrière
    avion.add(volet);
  }
  const fond = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), noir);
  fond.rotation.y = Math.PI / 2;
  fond.position.set(14.0, 0.04, 0);
  const postcombustion = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 20), metal);
  postcombustion.rotation.y = Math.PI / 2;
  postcombustion.position.set(14.02, 0.04, 0);
  avion.add(fond, postcombustion);

  // Verrière en bulle (pare-brise de 2,45 m à 3,2 m, sommet à 3,8 m) et baquet, siège, casque
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 2.5, w: 0.58, hHaut: 0.0, hBas: 0.02, y: 0.26 },
    { x: 3.05, w: 0.76, hHaut: 0.44, hBas: 0.02, y: 0.27 },
    { x: 3.9, w: 0.82, hHaut: 0.74, hBas: 0.02, y: 0.28 },
    { x: 4.6, w: 0.8, hHaut: 0.7, hBas: 0.02, y: 0.3 },
    { x: 5.2, w: 0.7, hHaut: 0.55, hBas: 0.02, y: 0.33 },
  ], { segments: 36, parSegment: 6 }), verre));
  // Dorsale : carénage opaque derrière la verrière, qui file presque droit jusqu'au pied de la dérive
  const dos = loft(THREE, [
    { x: 5.0, w: 0.74, hHaut: 0.58, hBas: 0.4, y: 0.3 },
    { x: 6.0, w: 0.56, hHaut: 0.55, hBas: 0.45, y: 0.4 },
    { x: 8.0, w: 0.46, hHaut: 0.5, hBas: 0.45, y: 0.44 },
    { x: 9.8, w: 0.3, hHaut: 0.4, hBas: 0.4, y: 0.5 },
    { x: 10.4, w: 0.12, hHaut: 0.2, hBas: 0.2, y: 0.55 },
  ], { segments: 36, parSegment: 6 });
  // Coordonnées de texture recalées sur celles du fuselage (u = x / 14), pour un camouflage continu
  const uvDos = dos.attributes.uv;
  for (let k = 0; k < uvDos.count; k++) uvDos.setX(k, (5.0 + uvDos.getX(k) * 5.4) / 14);
  avion.add(new THREE.Mesh(dos, camo));
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 2.7, w: 0.5, hHaut: 0.0, hBas: 0.02, y: 0.26 },
    { x: 3.2, w: 0.64, hHaut: 0.14, hBas: 0.02, y: 0.27 },
    { x: 4.8, w: 0.56, hHaut: 0.14, hBas: 0.02, y: 0.34 },
    { x: 5.2, w: 0.34, hHaut: 0.02, hBas: 0.02, y: 0.4 },
  ], { segments: 24, parSegment: 4 }), noir));
  const cadre = (x, rayon, grosseur, y0) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(rayon, grosseur, 8, 24, Math.PI), grisFonce);
    a.scale.set(1, 1.05, 1);
    a.position.set(x, y0, 0);
    a.rotation.y = Math.PI / 2;
    return a;
  };
  // Cadre du pare-brise, arceau intermédiaire et cadre arrière de la verrière
  avion.add(cadre(3.05, 0.39, 0.035, 0.27), cadre(3.95, 0.41, 0.025, 0.28), cadre(5.05, 0.37, 0.035, 0.32));
  // Rails latéraux de la verrière
  for (const c of [1, -1]) avion.add(tube(THREE, [2.55, 0.28, c * 0.3], [5.1, 0.4, c * 0.24], 0.022, grisFonce));
  // Montant central du pare-brise et glace du collimateur tête haute
  avion.add(tube(THREE, [2.5, 0.27, 0], [3.0, 0.62, 0], 0.014, grisFonce));
  const collimateur = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.17), new THREE.MeshPhysicalMaterial({ color: 0x9ec6c0, transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide }));
  collimateur.position.set(3.0, 0.55, 0);
  collimateur.rotation.set(0, Math.PI / 2, -0.2);
  avion.add(collimateur);
  // Siège éjectable (assise, dossier, appuie-tête, boîtier de parachute), pilote et casque
  const matSiege = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 });
  const matCombi = new THREE.MeshStandardMaterial({ color: 0x4d5a45, roughness: 0.85 });
  const siege = new THREE.Group();
  const bloc = (mat, l, h, w, x, y, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, w), mat); m.position.set(x, y, z); return m; };
  siege.add(bloc(matSiege, 0.4, 0.07, 0.42, 3.95, 0.42), bloc(matSiege, 0.08, 0.45, 0.4, 4.2, 0.62), bloc(matSiege, 0.1, 0.17, 0.26, 4.2, 0.92), bloc(new THREE.MeshStandardMaterial({ color: 0x71766c, roughness: 0.8 }), 0.12, 0.32, 0.3, 4.28, 0.7));
  siege.add(bloc(matCombi, 0.26, 0.36, 0.34, 4.0, 0.66), bloc(matCombi, 0.34, 0.1, 0.18, 3.8, 0.52, 0.12), bloc(matCombi, 0.34, 0.1, 0.18, 3.8, 0.52, -0.12));
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), new THREE.MeshStandardMaterial({ color: 0xc9cbc8, roughness: 0.4 }));
  casque.position.set(4.02, 0.9, 0);
  const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 10, -0.9, 1.8, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0x1c2a33, roughness: 0.1, metalness: 0.6 }));
  visiere.position.copy(casque.position);
  visiere.rotation.y = Math.PI;
  siege.add(casque, visiere);
  avion.add(siege);
  // Perche de ravitaillement fixe, à droite devant le pare-brise (de 2,37 m à 1,53 m sur le plan)
  avion.add(tube(THREE, [2.62, 0.0, -0.4], [2.44, 0.6, -0.42], 0.065, gris), tube(THREE, [2.44, 0.6, -0.42], [1.72, 0.76, -0.42], 0.05, gris));
  const coude = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), gris);
  coude.position.set(2.44, 0.6, -0.42);
  avion.add(coude);
  const buse = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.26, 14), grisFonce);
  buse.rotation.z = Math.PI / 2 - 0.22;
  buse.position.set(1.62, 0.78, -0.42);
  avion.add(buse);
  const embout = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), metal);
  embout.position.set(1.48, 0.81, -0.42);
  avion.add(embout);
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.4, 8), metal);
  pitot.rotation.z = Math.PI / 2;
  pitot.position.set(-0.18, -0.41, 0);
  avion.add(pitot);

  // Charges : deux réservoirs de 1 700 L sous l'aile, deux MICA sur les pylônes extérieurs
  const reservoir = loft(THREE, [
    { x: 0, w: 0, h: 0 }, { x: 0.12, w: 0.36, h: 0.36 }, { x: 0.4, w: 0.62, h: 0.62 }, { x: 0.9, w: 0.82, h: 0.82 }, { x: 1.6, w: 0.92, h: 0.92 }, { x: 4.2, w: 0.92, h: 0.92 }, { x: 5.4, w: 0.5, h: 0.5 }, { x: 5.9, w: 0, h: 0 },
  ], { segments: 28, parSegment: 5 });
  for (const cote of [1, -1]) {
    const res = new THREE.Mesh(reservoir, gris);
    res.position.set(4.9, -1.22, cote * 2.15);
    // Pylônes profilés : courts, le réservoir est presque plaqué sous l'aile
    const pyl = new THREE.Mesh(surface(THREE, [[6.4, 0.02], [6.9, -0.12], [9.2, -0.12], [9.6, 0.02]], 0.1, { plan: 'xy', biseau: 0.02 }), gris);
    pyl.position.set(0, -0.66, cote * 2.15);
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const ailette = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.26), grisFonce);
      ailette.position.set(10.25, -1.22 + Math.sin(a) * 0.3, cote * 2.15 + Math.cos(a) * 0.3);
      ailette.rotation.x = a;
      avion.add(ailette);
    }
    const mica = missile(THREE, 3.1, 0.16, materiaux);
    mica.position.set(9.6, -0.92, cote * 3.45);
    const pyl2 = new THREE.Mesh(surface(THREE, [[10.2, 0.02], [10.4, -0.12], [11.5, -0.12], [11.7, 0.02]], 0.07, { plan: 'xy', biseau: 0.015 }), gris);
    pyl2.position.set(0, -0.66, cote * 3.45);
    avion.add(res, pyl, mica, pyl2);
  }
  // Emport de police du ciel (photos d'Ämari et de Luxeuil) : bidon ventral de 1 300 L entre les jambes du
  // train principal, et deux MICA de plus sous les entrées d'air (quatre au total)
  const emportPolice = new THREE.Group();
  const ventral = new THREE.Mesh(reservoir, gris);
  ventral.scale.setScalar(0.82);
  ventral.position.set(6.0, -1.18, 0);
  const pylVentral = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.12), gris);
  pylVentral.position.set(8.3, -0.79, 0);
  emportPolice.add(ventral, pylVentral);
  for (const cote of [1, -1]) {
    const m = missile(THREE, 3.1, 0.16, materiaux);
    m.position.set(5.5, -0.98, cote * 0.66);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.07), gris);
    rail.position.set(6.9, -0.86, cote * 0.66);
    emportPolice.add(m, rail);
  }
  emportPolice.visible = police;
  avion.add(emportPolice);

  // Train d'atterrissage relevé sur le plan : roulette avant à 3,7 m, train principal à 8,4 m (voie de 3,4 m), sol à -1,9 m
  const train = new THREE.Group();
  const matJambe = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.6, roughness: 0.35 });
  const matPneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const roue = (r, l) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), matPneu); m.rotation.x = Math.PI / 2; return m; };
  // Atterrisseur avant : jambe, compas, deux roues, trappe
  train.add(tube(THREE, [3.55, -0.7, 0], [3.72, -1.62, 0], 0.075, matJambe), tube(THREE, [3.4, -0.75, 0], [3.66, -1.25, 0], 0.03, matJambe));
  for (const z of [0.14, -0.14]) { const r = roue(0.23, 0.14); r.position.set(3.75, -1.67, z); train.add(r); }
  const essieu = tube(THREE, [3.75, -1.67, 0.2], [3.75, -1.67, -0.2], 0.035, matJambe);
  const trappeAv = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.03), gris);
  trappeAv.position.set(3.35, -0.95, 0.24);
  train.add(essieu, trappeAv);
  // Atterrisseurs principaux : jambe forte, contrefiche, grande roue (environ 0,75 m), trappe de jambe
  for (const cote of [1, -1]) {
    train.add(tube(THREE, [8.3, -0.7, cote * 1.35], [8.4, -1.5, cote * 1.6], 0.1, matJambe));
    train.add(tube(THREE, [7.7, -0.72, cote * 1.2], [8.35, -1.25, cote * 1.52], 0.04, matJambe));
    const r = roue(0.38, 0.24); r.position.set(8.4, -1.52, cote * 1.74);
    const jante = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 20), matJambe);
    jante.rotation.x = Math.PI / 2;
    jante.position.copy(r.position);
    const trappe = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.62, 0.03), gris);
    trappe.position.set(8.3, -1.0, cote * 1.25);
    trappe.rotation.x = cote * 0.12;
    train.add(r, jante, trappe);
  }
  avion.add(train);

  avion.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // Longueur ramenée aux 14,36 m officiels (le relevé donnait 14,89 m) : compression de 3,6 % selon l'axe
  const kx = 14.36 / 14.89;
  avion.scale.x = kx;
  avion.position.set(-7.2 * kx, 0, 0);
  const groupe = new THREE.Group();
  groupe.add(avion);
  const p = (x, y, z) => new THREE.Vector3((x - 7.2) * kx, y, z);
  groupe.userData.legendes = [
    { texte: 'Entrée d\'air à demi-cône (« souris »)', point: p(5.0, 0.15, 0.95) },
    { texte: 'Perche de ravitaillement fixe', point: p(1.6, 0.8, -0.42) },
    { texte: 'Aile delta pure (flèche de 58°)', point: p(10.5, -0.45, 3.6) },
    { texte: 'Réservoirs de 1 700 L (les deux « bidons »)', point: p(8.5, -1.65, 2.35) },
    { texte: 'Missile MICA', point: p(11.2, -1.05, -3.45) },
    { texte: 'Réacteur M53-P2', point: p(14.3, 0.1, 0) },
    { texte: 'Verrière en bulle', point: p(3.8, 1.05, 0) },
  ];
  if (police) groupe.userData.legendes.push({ texte: 'Police du ciel : bidon ventral de 1 300 L et deux MICA sous les entrées d\'air', point: p(8.0, -1.45, 0.4) });
  // Pour les scènes : train et emport réglables sans passer par les commandes de la visionneuse
  groupe.userData.basculer = { train: (sorti) => { train.visible = sorti; }, police: (oui) => { emportPolice.visible = oui; } };
  groupe.userData.commandes = [
    { id: 'rentrer', libelle: 'Rentrer le train', actif: 'Sortir le train' },
    { id: 'police', libelle: 'Emport police du ciel (3 bidons, 4 MICA)', actif: 'Emport léger (2 bidons, 2 MICA)' },
    { id: 'grise', libelle: 'Livrée gris foncé (EC 2/2)', actif: 'Livrée gris bleuté (EC 2/5)' },
  ];
  let courante = 'bleu';
  groupe.userData.animer = (t, api) => {
    train.visible = !api.rentrer;
    emportPolice.visible = police || !!api.police;
    const voulue = api.grise ? 'gris' : 'bleu';
    if (voulue !== courante) {
      courante = voulue;
      const l = livree(voulue);
      camo.map = l.fus;
      camoDessus.map = l.aile;
      camoDerive.map = l.derive;
      camoAile.color.set(LIVREES[voulue].ventre);
      radome.color.set(LIVREES[voulue].radome);
      code.map = codes[voulue];
      for (const m of [camo, camoDessus, camoDerive, code]) m.needsUpdate = true;
    }
  };
  groupe.userData.taille = 15;
  return groupe;
}

/** Tube entre deux points (jambe de train, perche). */
function tube(THREE, a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
