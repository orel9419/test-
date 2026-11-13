/**
 * Bâtiments de la Marine nationale en 3D : sous-marin nucléaire d'attaque
 * Suffren, porte-hélicoptères amphibie Mistral, frégate de défense aérienne
 * Chevalier Paul, frégate multi-missions (FREMM), ravitailleur de forces (BRF)
 * et bâtiment d'essais et de mesures Monge.
 *
 * Chaque navire est construit en mètres (x de l'étrave vers la poupe, y vers
 * le haut depuis la flottaison, z négatif à tribord), d'après les dimensions
 * publiques et les photos, infographies ou plans de référence, puis mis à
 * l'échelle pour mesurer environ 13 unités. Formes simplifiées.
 */
import { loft, surface, pieces, tronc, texturePeinte, texturePanneaux, construireCharlesDeGaulle, construirePorteAvions, construireRafale, construireSnle, construireSnle3G } from './modeles.js';
import { construireCaiman } from './aeronefs.js';

const GRIS = [0.24, 0.26, 0.28];
const LISERE = [0.07, 0.07, 0.08];
const CARENE = [0.43, 0.1, 0.09];

/**
 * Coque de navire de surface : sections définies par la demi-largeur au pont
 * (bd) et à la flottaison (bw), la hauteur du pont (D), le tirant d'eau (T),
 * l'exposant du bouchain (m : 1 en V, 3 et plus pour un fond plat) et
 * l'inclinaison de l'étrave (rake, en mètres vers l'arrière par mètre de
 * descente). Gris au-dessus de la flottaison, liseré noir, carène rouge.
 * Renvoie la coque et le pont (légèrement bombé).
 */
function coqueNavire(THREE, stations, { gris = GRIS, couleurPont = 0x6b7075, bombe = 0.25, segBas = 7 } = {}) {
  const couleur = (y) => (y > 0.7 ? gris : y > -0.6 ? LISERE : CARENE);
  const flanc = (s) => {
    const lin = (y) => s.bw + (s.bd - s.bw) * (y / s.D);
    const bas = (y) => s.bw * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y) / s.T, s.m ?? 2.5)), 1 / (s.m ?? 2.5));
    const pts = [[s.bd, s.D], [lin(0.75), 0.75], [lin(0.65), 0.65], [bas(0), 0], [bas(-0.55), -0.55], [bas(-0.65), -0.65]];
    for (let i = 1; i <= segBas; i++) { const y = -0.65 - (s.T - 0.65) * (i / segBas); pts.push([bas(y), y]); }
    return pts;
  };
  const pos = [], col = [], idx = [];
  let R = 0;
  for (const s of stations) {
    const f = flanc(s);
    const anneau = [...f.map(([z, y]) => [-z, y]), ...f.slice(0, -1).reverse().map(([z, y]) => [z, y])];
    R = anneau.length;
    for (const [z, y] of anneau) {
      pos.push(s.x + (s.rake ?? 0) * (s.D - y), y, z);
      col.push(...couleur(y));
    }
  }
  const n = stations.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < R - 1; j++) {
      const a = i * R + j, b = a + 1, c = (i + 1) * R + j, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  // Étrave et tableau arrière fermés
  for (const [i, sens] of [[0, 1], [n - 1, -1]]) {
    const centre = pos.length / 3;
    let cx = 0, cy = 0;
    for (let j = 0; j < R; j++) { cx += pos[(i * R + j) * 3]; cy += pos[(i * R + j) * 3 + 1]; }
    pos.push(cx / R, cy / R, 0);
    col.push(...couleur(cy / R));
    for (let j = 0; j < R; j++) {
      const a = i * R + j, b = i * R + ((j + 1) % R);
      if (sens > 0) idx.push(centre, a, b); else idx.push(centre, b, a);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const coque = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.12, roughness: 0.68, envMapIntensity: 0.5 }));
  // Pont : bande bombée entre les deux lisses
  const pp = [], pi = [];
  stations.forEach((s, i) => {
    const x = s.x;
    pp.push(x, s.D, -s.bd, x, s.D + bombe, 0, x, s.D, s.bd);
    if (i > 0) {
      const a = (i - 1) * 3, b = i * 3;
      pi.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
    }
  });
  const gp = new THREE.BufferGeometry();
  gp.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  gp.setIndex(pi);
  gp.computeVertexNormals();
  const pont = new THREE.Mesh(gp, new THREE.MeshStandardMaterial({ color: couleurPont, metalness: 0.1, roughness: 0.85, side: THREE.DoubleSide }));
  return { coque, pont };
}

/** Demi-largeur au pont d'une coque à l'abscisse x (interpolation entre stations). */
function demiLargeur(stations, x, cle = 'bd') {
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    if (x >= a.x && x <= b.x) return a[cle] + (b[cle] - a[cle]) * ((x - a.x) / Math.max(1e-6, b.x - a.x));
  }
  return stations.at(-1)[cle];
}

/** Mer autour du navire (même rendu que les porte-avions). */
function mer(THREE) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: 0x0e3a5f, roughness: 0.45, metalness: 0, envMapIntensity: 0.3, transparent: true, opacity: 0.86 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.05;
  m.receiveShadow = true;
  return m;
}

/** Numéro de coque peint sur les deux flancs (lisible de chaque côté). */
function numeroCoque(THREE, texte, { x, y, z, hauteur = 3, couleur = '#2a2d31' }) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, texte, { couleur, largeur: 512, hauteur: 160 }), transparent: true, depthWrite: false });
  for (const c of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(hauteur * 3.2, hauteur), mat);
    p.position.set(x, y, c * z);
    if (c < 0) p.rotation.y = Math.PI;
    g.add(p);
  }
  return g;
}

/** Place le navire (mètres) dans la scène : échelle, centrage, ombres, mer, légendes. */
function installerNavire(THREE, navire, { L, s, yFlottaison = -0.5, avecMer = true }) {
  navire.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material?.transparent; o.receiveShadow = true; } });
  if (avecMer) navire.add(mer(THREE));
  navire.scale.setScalar(s);
  navire.position.set(-(L / 2) * s, yFlottaison, 0);
  const groupe = new THREE.Group();
  groupe.add(navire);
  const p = (x, y, z) => new THREE.Vector3(x * s - (L / 2) * s, y * s + yFlottaison, z * s);
  groupe.userData.taille = 14;
  groupe.userData.mer = avecMer;
  return { groupe, p };
}

/** Matériaux communs des superstructures. */
function materiauxNavire(THREE, { teinte = 0xa9aeb3 } = {}) {
  return {
    gris: new THREE.MeshStandardMaterial({ color: teinte, metalness: 0.15, roughness: 0.62 }),
    clair: new THREE.MeshStandardMaterial({ color: 0xaeb3b8, metalness: 0.12, roughness: 0.58 }),
    blanc: new THREE.MeshStandardMaterial({ color: 0xf0f0ec, metalness: 0.05, roughness: 0.45 }),
    fonce: new THREE.MeshStandardMaterial({ color: 0x5c6267, metalness: 0.25, roughness: 0.6 }),
    noir: new THREE.MeshStandardMaterial({ color: 0x24272b, metalness: 0.2, roughness: 0.7 }),
    vitres: new THREE.MeshStandardMaterial({ color: 0x1b2631, metalness: 0.6, roughness: 0.18 }),
    jaune: new THREE.MeshStandardMaterial({ color: 0xf0c419, roughness: 0.6 }),
    rouge: new THREE.MeshStandardMaterial({ color: 0xb8322a, roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x7d838a, metalness: 0.6, roughness: 0.4 }),
  };
}

/** Bloc parallélépipédique (centre x, bas y, centre z). */
function bloc(THREE, mat, l, h, p, x, y, z = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), mat);
  b.position.set(x, y + h / 2, z);
  return b;
}

/** Bloc à flancs inclinés (furtivité) : base l × p, sommet lHaut × pHaut. */
function blocIncline(THREE, mat, l, h, p, lHaut, pHaut, x, y, z = 0) {
  const b = tronc(THREE, l, h, p, lHaut, pHaut, mat);
  b.position.set(x, y + h / 2, z);
  return b;
}

/** Rangée de fenêtres sur les deux flancs d'un bloc (ou sur une face avant si face = 'x'). */
function fenetres(THREE, mat, { x1, x2, y, z, n, l = 0.9, h = 0.8, face = 'z', zMin = null }) {
  const liste = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    if (face === 'z') for (const c of [-1, 1]) liste.push([x1 + (x2 - x1) * t, y, c * z, l, h, 0.12]);
    else liste.push([x1, y, (zMin ?? -z) + (z - (zMin ?? -z)) * t, 0.12, h, l]);
  }
  return pieces(THREE, mat, liste);
}

/** Radôme sphérique sur un fût. */
function radome(THREE, mat, matFut, r, x, y, z, fut = 0) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);
  s.position.set(x, y + fut + r * 0.85, z);
  g.add(s);
  if (fut > 0) { const f = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.45, fut, 12), matFut); f.position.set(x, y + fut / 2, z); g.add(f); }
  return g;
}

/** Mât pylône (poteau) avec vergues. */
function matPoteau(THREE, mat, x, y, z, h, { r = 0.25, vergues = [] } = {}) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r, h, 8), mat);
  p.position.set(x, y + h / 2, z);
  g.add(p);
  for (const [hv, lv] of vergues) g.add(bloc(THREE, mat, 0.2, 0.2, lv, x, y + hv, z));
  return g;
}

/** Tourelle de canon (76 mm ou 127 mm) : coupole facettée et tube. */
function tourelle(THREE, mat, { x, y, z = 0, r = 1.6, tube = 4.5, cal = 0.12, orientation = Math.PI }) {
  const g = new THREE.Group();
  const coupole = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, r * 0.9, 8), mat);
  coupole.position.y = r * 0.45;
  const canon = new THREE.Mesh(new THREE.CylinderGeometry(cal, cal * 1.2, tube, 10), mat);
  canon.rotation.z = Math.PI / 2;
  canon.position.set(tube / 2 + r * 0.4, r * 0.5, 0);
  const gaine = new THREE.Mesh(new THREE.CylinderGeometry(cal * 2.2, cal * 2.2, tube * 0.25, 10), mat);
  gaine.rotation.z = Math.PI / 2;
  gaine.position.set(r * 0.75, r * 0.5, 0);
  g.add(coupole, canon, gaine);
  g.rotation.y = orientation; // π : canon vers l'avant (x négatif)
  g.position.set(x, y, z);
  return g;
}

/** Hélicoptère NH90 simplifié (rotor replié), pour les ponts d'envol. */
function nh90(THREE, mat, matSombre) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.4, hHaut: 0.5, hBas: 0.5, y: 1.4 }, { x: 1.5, w: 2.4, hHaut: 1.3, hBas: 1.0, y: 1.6, n: 2.6 },
    { x: 7, w: 2.6, hHaut: 1.3, hBas: 1.0, y: 1.6, n: 3 }, { x: 10, w: 1.1, hHaut: 0.6, hBas: 0.3, y: 2.3 }, { x: 14.5, w: 0.45, hHaut: 0.35, hBas: 0.2, y: 2.8 },
  ], { segments: 20, parSegment: 4 }), mat));
  const rotor = new THREE.Group();
  rotor.position.set(5, 3.4, 0);
  [0.12, -0.12, 0.3, -0.3].forEach((a) => { const pale = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.08, 0.5), matSombre); pale.position.x = 3.75; const pv = new THREE.Group(); pv.rotation.y = a; pv.add(pale); rotor.add(pv); });
  const derive = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.2), mat);
  derive.position.set(14.3, 3.6, 0);
  g.add(rotor, derive);
  return g;
}

/** Plongeur (nageur de combat) en tenue sombre, palmes comprises. */
function plongeur(THREE, mat) {
  const g = new THREE.Group();
  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.1, 4, 8), mat);
  corps.rotation.z = Math.PI / 2;
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mat);
  tete.position.x = -0.85;
  const bouteille = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 4, 8), mat);
  bouteille.rotation.z = Math.PI / 2;
  bouteille.position.set(-0.1, 0.25, 0);
  g.add(corps, tete, bouteille);
  for (const z of [-0.12, 0.12]) { const palme = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.22), mat); palme.position.set(1.05, 0, z); g.add(palme); }
  return g;
}

// ---------------------------------------------------------------------------
// SNA de la classe Suffren
// ---------------------------------------------------------------------------

/**
 * Sous-marin nucléaire d'attaque de la classe Suffren (programme Barracuda),
 * d'après les infographies de Naval Group et de la Marine nationale : 99 m,
 * 8,8 m de diamètre ; kiosque à grand congé avant, mâts optroniques, hangar de
 * pont amovible pour les nageurs de combat, antennes latérales, barres avant
 * escamotables, gouvernes en X et hydrojet. Teinte bleu-noir des tuiles
 * anéchoïques. Échelle 1/7,7 (environ 13 unités).
 * Commandes : hangar de pont (nageurs de combat), tir de missile de croisière.
 */
export function construireSna(THREE) {
  const s = 0.13;
  const L = 99, R = 4.4;
  const sub = new THREE.Group();
  const coque = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#1d232c', trait: 'rgba(200,212,228,0.13)', repetition: [12, 4] }), metalness: 0.15, roughness: 0.5 });
  const kiosqueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#1f252e', trait: 'rgba(200,212,228,0.15)', repetition: [3, 2] }), metalness: 0.15, roughness: 0.5 });
  const uni = new THREE.MeshStandardMaterial({ color: 0x1d232b, metalness: 0.15, roughness: 0.5 });
  const antenneMat = new THREE.MeshStandardMaterial({ color: 0x252c36, metalness: 0.35, roughness: 0.28 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4d535b, metalness: 0.7, roughness: 0.4 });
  const m = new THREE.Group();
  m.scale.setScalar(s);
  sub.add(m);

  // Coque : étrave pleine et arrondie (sonar d'étrave), long cylindre, arrière effilé vers l'hydrojet
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0, h: 0 }, { x: 0.7, w: 3.4, h: 3.4 }, { x: 2.2, w: 5.9, h: 5.9 }, { x: 4.6, w: 7.6, h: 7.6 }, { x: 8, w: 8.5, h: 8.5 },
    { x: 11.5, w: 2 * R, h: 2 * R }, { x: 64, w: 2 * R, h: 2 * R }, { x: 72, w: 8.1, h: 8.1 }, { x: 80, w: 6.7, h: 6.7 },
    { x: 87, w: 4.9, h: 4.9 }, { x: 92.5, w: 3.4, h: 3.4 }, { x: 95.5, w: 2.6, h: 2.6 },
  ], { segments: 64, parSegment: 6 }), coque));
  // Carénage avant sur le dos (panneaux d'accès, logement des barres avant)
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 9, w: 0.4, hHaut: 0.05, hBas: 0.4, y: R - 0.3, n: 2 }, { x: 11, w: 2.2, hHaut: 0.45, hBas: 0.6, y: R - 0.3, n: 3 },
    { x: 18, w: 2.2, hHaut: 0.45, hBas: 0.6, y: R - 0.3, n: 3 }, { x: 20, w: 0.4, hHaut: 0.05, hBas: 0.4, y: R - 0.3, n: 2 },
  ], { segments: 24, parSegment: 4 }), kiosqueMat));

  // Kiosque : bord de fuite presque vertical, sommet plat, bord d'attaque prolongé par un long congé jusqu'au pont
  const H = 5.6;
  const profil = new THREE.Shape();
  profil.moveTo(43.8, -0.8);
  profil.lineTo(42.4, H);
  profil.lineTo(34.6, H);
  profil.quadraticCurveTo(33.3, H, 33.0, H - 0.9);
  profil.bezierCurveTo(31.6, 2.6, 28.4, 0.5, 23.6, -0.6);
  profil.lineTo(43.8, -0.8);
  const kg = new THREE.ExtrudeGeometry(profil, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.45, bevelSize: 0.35, bevelSegments: 4, curveSegments: 20 });
  kg.translate(0, R, -0.9);
  m.add(new THREE.Mesh(kg, kiosqueMat));
  // Raccord élargi au pied du kiosque
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 24.5, w: 0.5, hHaut: 0.1, hBas: 0.3, y: R - 0.25, n: 2 }, { x: 30, w: 2.9, hHaut: 0.9, hBas: 0.4, y: R - 0.25, n: 2.2 },
    { x: 40, w: 3.1, hHaut: 0.9, hBas: 0.4, y: R - 0.25, n: 2.4 }, { x: 44.5, w: 1.2, hHaut: 0.3, hBas: 0.3, y: R - 0.25, n: 2 },
  ], { segments: 24, parSegment: 5 }), kiosqueMat));
  // Mâts escamotables (optronique, radar, transmissions) à demi sortis
  [[35.4, 1.6, 0.26], [36.8, 2.9, 0.3], [38.2, 2.2, 0.24], [39.6, 3.4, 0.2], [41, 1.3, 0.22]].forEach(([x, h, r]) => {
    const mt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 12), metal);
    mt.position.set(x, R + H + h / 2, 0);
    m.add(mt);
  });
  const tete = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 14), metal);
  tete.position.set(36.8, R + H + 3.1, 0);
  m.add(tete);

  // Hangar de pont amovible (environ 15 m) : cylindre, dôme arrière, porte avant articulée, berceaux
  const DDS = { x1: 54, x2: 69, r: 1.45, y: R + 1.3 };
  const hangar = new THREE.Mesh(new THREE.CylinderGeometry(DDS.r, DDS.r, DDS.x2 - DDS.x1, 28), uni);
  hangar.rotation.z = Math.PI / 2;
  hangar.position.set((DDS.x1 + DDS.x2) / 2, DDS.y, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DDS.r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), uni);
  dome.rotation.z = -Math.PI / 2;
  dome.position.set(DDS.x2, DDS.y, 0);
  const berceaux = pieces(THREE, uni, [56, 62, 67].map((x) => [x, R + 0.15, 0, 1.2, 0.6, 2.4]));
  m.add(hangar, dome, berceaux);
  for (const x of [56, 59.5, 63, 66.5]) {
    const cercle = new THREE.Mesh(new THREE.TorusGeometry(DDS.r + 0.02, 0.07, 6, 32), metal);
    cercle.rotation.y = Math.PI / 2;
    cercle.position.set(x, DDS.y, 0);
    m.add(cercle);
  }
  const porte = new THREE.Group();
  porte.position.set(DDS.x1, DDS.y + DDS.r, 0);
  const battant = new THREE.Mesh(new THREE.CylinderGeometry(DDS.r, DDS.r, 0.25, 28), metal);
  battant.rotation.z = Math.PI / 2;
  battant.position.set(-0.12, -DDS.r, 0);
  porte.add(battant);
  m.add(porte);
  const interieur = new THREE.Mesh(new THREE.CircleGeometry(DDS.r * 0.92, 24), new THREE.MeshBasicMaterial({ color: 0x0b0d10 }));
  interieur.rotation.y = -Math.PI / 2;
  interieur.position.set(DDS.x1 + 0.02, DDS.y, 0);
  m.add(interieur);
  // Nageurs de combat (sortent quand le hangar est ouvert)
  const tenue = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.8 });
  const nageurs = [plongeur(THREE, tenue), plongeur(THREE, tenue)];
  nageurs.forEach((n) => { n.visible = false; m.add(n); });
  // Panneau d'évacuation circulaire et feu de position
  const panneau = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 24), metal);
  panneau.position.set(50.5, R + 0.05, 0);
  m.add(panneau);

  // Antennes latérales (sonar de flanc) et portes des quatre tubes de 533 mm
  for (const cote of [1, -1]) {
    m.add(new THREE.Mesh(loft(THREE, [
      { x: 21, w: 0.1, hHaut: 0.9, hBas: 0.9, y: -0.7, z: cote * (R - 0.12), n: 2.4 },
      { x: 22.5, w: 0.6, hHaut: 1.1, hBas: 1.1, y: -0.7, z: cote * (R - 0.05), n: 3.2 },
      { x: 58.5, w: 0.6, hHaut: 1.1, hBas: 1.1, y: -0.7, z: cote * (R - 0.05), n: 3.2 },
      { x: 60, w: 0.1, hHaut: 0.9, hBas: 0.9, y: -0.7, z: cote * (R - 0.12), n: 2.4 },
    ], { segments: 20, parSegment: 4 }), antenneMat));
    m.add(pieces(THREE, uni, [[7.2, -0.6, cote * 4.05, 2.2, 0.8, 0.12], [7.2, -1.8, cote * 3.95, 2.2, 0.8, 0.12]]));
    // Barres de plongée avant escamotables, sorties
    const barre = new THREE.Mesh(surface(THREE, [[12.2, 0], [13.2, 2.6], [15.0, 2.6], [15.4, 0]].map(([x, z]) => [x, cote * (R - 0.4 + z)]), 0.3, { biseau: 0.1 }), uni);
    barre.position.y = 1.2;
    m.add(barre);
  }

  // Gouvernes arrière en X et hydrojet (carénage, stator, moyeu)
  const forme = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(6.2, 0), new THREE.Vector2(6.9, 3.6), new THREE.Vector2(3.8, 3.6)]);
  for (const angle of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2 });
    g.translate(85.2, 2.1, -0.18);
    const pivot = new THREE.Group();
    pivot.rotation.x = angle;
    pivot.add(new THREE.Mesh(g, coque));
    m.add(pivot);
  }
  const carenageMat = coque.clone();
  carenageMat.side = THREE.DoubleSide;
  const carenage = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.6, 3.4, 36, 1, true), carenageMat);
  carenage.rotation.z = Math.PI / 2;
  carenage.position.set(96.6, 0, 0);
  const moyeu = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.8, 20), metal);
  moyeu.rotation.z = -Math.PI / 2;
  moyeu.position.set(97.6, 0, 0);
  const aubes = [];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; aubes.push([95.6, Math.sin(a) * 1.25, Math.cos(a) * 1.25, 0.5, 0.1, 0.8]); }
  m.add(carenage, moyeu, pieces(THREE, metal, aubes));

  // Missile de croisière naval (tir depuis un tube, simulation)
  const mdcn = new THREE.Group();
  const corpsMissile = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 5.5, 14), new THREE.MeshStandardMaterial({ color: 0xd9dcdf, metalness: 0.3, roughness: 0.45 }));
  corpsMissile.rotation.z = Math.PI / 2;
  const ogive = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.8, 14), corpsMissile.material);
  ogive.rotation.z = Math.PI / 2;
  ogive.position.x = -3.15;
  const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 12), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.85 }));
  flamme.rotation.z = -Math.PI / 2;
  flamme.position.x = 3.9;
  mdcn.add(corpsMissile, ogive, flamme);
  mdcn.visible = false;
  m.add(mdcn);

  sub.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material?.transparent; o.receiveShadow = true; } });
  sub.position.set(-(L / 2) * s, -0.6 * s, 0);
  const groupe = new THREE.Group();
  groupe.add(sub);
  const p = (x, y, z) => new THREE.Vector3(x * s - (L / 2) * s, y * s - 0.6 * s, z * s);
  groupe.userData.legendes = [
    { texte: 'Kiosque et son congé avant', point: p(31, R + 3, 0) },
    { texte: 'Mâts optroniques (pas de périscope)', point: p(38, R + H + 3, 0) },
    { texte: 'Hangar de pont : nageurs de combat', point: p(61, R + 2.8, 0) },
    { texte: 'Antenne sonar de flanc', point: p(40, -0.7, -(R + 0.3)) },
    { texte: 'Barres avant escamotables', point: p(14, 1.2, -(R + 2)) },
    { texte: 'Tubes de 533 mm (F21, MdCN, SM39)', point: p(7, -1.2, -4.2) },
    { texte: 'Gouvernes en X', point: p(89, -3, -3) },
    { texte: 'Hydrojet', point: p(97, 2, 0) },
  ];
  groupe.userData.taille = 13;
  groupe.userData.commandes = [
    { id: 'hangar', libelle: 'Ouvrir le hangar de pont', actif: 'Fermer le hangar de pont' },
    { id: 'tir', type: 'action', libelle: '🚀 Missile de croisière (simulation)' },
  ];
  let ouverture = 0, debutTir = null, debutNage = null;
  groupe.userData.animer = (t, api) => {
    ouverture += ((api.hangar ? 1 : 0) - ouverture) * 0.05;
    porte.rotation.z = ouverture * 1.9;
    const dehors = ouverture > 0.85;
    if (dehors && debutNage === null) debutNage = t;
    if (!dehors) debutNage = null;
    nageurs.forEach((n, i) => {
      n.visible = dehors;
      if (!dehors) return;
      const d = ((t - debutNage) / 1000) * 0.9 - i * 1.4;
      n.position.set(DDS.x1 - 1.5 - Math.max(0, d) * 1.2, DDS.y + 0.4 + Math.max(0, d) * 0.35 + Math.sin(t / 400 + i) * 0.1, i ? 1.1 : -0.9);
      if (d > 9) debutNage = t;
    });
    if (api.tir) { api.tir = false; debutTir = t; }
    if (debutTir !== null) {
      const d = (t - debutTir) / 1000;
      mdcn.visible = true;
      // Sortie du tube vers l'avant, remontée vers la surface, puis vol
      mdcn.position.set(6 - d * 6, -1.2 + d * d * 1.6, -5.2);
      mdcn.rotation.z = -Math.min(1.1, d * 0.45);
      flamme.visible = d > 1.2;
      if (d > 4.5) { debutTir = null; mdcn.visible = false; }
    }
  };
  return groupe;
}

// ---------------------------------------------------------------------------
// Porte-hélicoptères amphibie (classe Mistral)
// ---------------------------------------------------------------------------

/** Texture du pont d'envol d'un PHA : six spots d'hélicoptères, axes, ascenseurs, bordures. */
function texturePontPha(THREE, contour, L, B) {
  const W = 2048, H = Math.round((W * B) / L);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const px = (x) => (x / L) * W;
  const pz = (z) => ((z + B / 2) / B) * H; // haut de l'image = tribord (z négatif)
  ctx.beginPath();
  contour.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
  ctx.closePath();
  ctx.fillStyle = '#4b4f54';
  ctx.fill();
  ctx.save();
  ctx.clip();
  let g = 9;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 1800; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '0,0,0'},0.035)`; ctx.fillRect(h() * W, h() * H, 6 + h() * 28, 2 + h() * 6); }
  const trait = (x1, z1, x2, z2, couleur, largeur, tirets = []) => { ctx.strokeStyle = couleur; ctx.lineWidth = largeur; ctx.setLineDash(tirets); ctx.beginPath(); ctx.moveTo(px(x1), pz(z1)); ctx.lineTo(px(x2), pz(z2)); ctx.stroke(); ctx.setLineDash([]); };
  // Axe des spots (décalé vers bâbord) et ligne de sécurité le long de l'île
  trait(8, 3, L - 4, 3, '#f2f2f2', 3);
  trait(40, -6, L - 6, -6, '#f2f2f2', 2, [18, 14]);
  // Six spots : cercle, croix et numéro
  ctx.font = `bold ${Math.round(H * 0.07)}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  [22, 52, 82, 112, 142, 172].forEach((x, i) => {
    ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(px(x), pz(3), px(6.5) - px(0), pz(6.5) - pz(0), 0, 0, Math.PI * 2); ctx.stroke();
    trait(x - 9, 3, x + 9, 3, '#f2f2f2', 4);
    trait(x, -5, x, 11, '#f2f2f2', 3);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillText(String(i + 1), px(x + 10), pz(11));
  });
  // Ascenseurs (bordure jaune) : arrière dans l'axe et au milieu, derrière l'île
  ctx.strokeStyle = '#e8bf2a'; ctx.lineWidth = 6;
  for (const [x1, x2, z1, z2] of [[183, 197, -6.5, 6.5], [96, 110, -15.5, -5]]) ctx.strokeRect(px(x1), pz(z1), px(x2) - px(x1), pz(z2) - pz(z1));
  // Bordures jaunes des angles arrière et bande blanche de l'avant
  ctx.fillStyle = '#e8bf2a';
  ctx.fillRect(px(L - 3), pz(-15.5), px(3) - px(0), pz(-9) - pz(-15.5));
  ctx.fillRect(px(L - 3), pz(9), px(3) - px(0), pz(15.5) - pz(9));
  trait(1.5, -5.5, 1.5, 5.5, '#f2f2f2', 5);
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Porte-hélicoptères amphibie de la classe Mistral (L9013), d'après des
 * photos : 199 m × 32 m, coque haute aux flancs plats, étrave à bulbe, pont
 * d'envol continu rétréci à l'avant (six spots), île à tribord vers l'avant
 * (passerelle, mât principal, radômes), ascenseurs, porte du radier à la poupe.
 * Commande : faire décoller un hélicoptère.
 */
export function construirePha(THREE) {
  const L = 199, B = 32, D = 20;
  const s = 13 / L;
  const navire = new THREE.Group();
  const M = materiauxNavire(THREE, { teinte: 0x9da3a9 });
  const stations = [
    { x: 0, bd: 6, bw: 0.3, D: D + 0.6, T: 1.2, m: 1, rake: 0.32 },
    { x: 6, bd: 9.5, bw: 3.2, D: D + 0.4, T: 4.5, m: 1.3, rake: 0.16 },
    { x: 15, bd: 12.5, bw: 8.2, D: D + 0.2, T: 6.0, m: 1.8, rake: 0.04 },
    { x: 30, bd: 15.5, bw: 12.6, D, T: 6.3, m: 2.6 },
    { x: 45, bd: 16, bw: 14, D, T: 6.3, m: 3.5 },
    { x: 160, bd: 16, bw: 14, D, T: 6.3, m: 3.5 },
    { x: 185, bd: 16, bw: 13.6, D, T: 5.4, m: 3 },
    { x: L, bd: 16, bw: 12.8, D, T: 3.4, m: 2.4 },
  ];
  const { coque, pont } = coqueNavire(THREE, stations, { gris: [0.24, 0.26, 0.28], couleurPont: 0x4b4f54, bombe: 0.05 });
  navire.add(coque, pont);
  // Bulbe d'étrave
  const bulbe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: 0x6e1b16, roughness: 0.7 }));
  bulbe.scale.set(5.2, 2.1, 1.9);
  bulbe.position.set(7, -3.6, 0);
  navire.add(bulbe);
  // Marquages du pont d'envol
  const contour = [[0, -6], [6, -9.5], [15, -12.5], [30, -15.5], [45, -16], [L, -16], [L, 16], [45, 16], [30, 15.5], [15, 12.5], [6, 9.5], [0, 6]];
  const marquages = new THREE.Mesh(new THREE.PlaneGeometry(L, B), new THREE.MeshStandardMaterial({ map: texturePontPha(THREE, contour, L, B), transparent: true, alphaTest: 0.4, roughness: 0.85 }));
  marquages.rotation.x = -Math.PI / 2;
  marquages.position.set(L / 2, D + 0.08, 0);
  navire.add(marquages);
  // Coursive sombre sous la lisse du pont, ouvertures et portes latérales, numéro de coque
  const sombre = [];
  for (const c of [-1, 1]) {
    for (let x = 47; x < 196; x += 3) sombre.push([x, D - 1.4, c * 16.03, 1.6, 0.8, 0.1]);
    for (const x of [118, 150]) sombre.push([x, 5.5, c * 14.7, 7, 4.2, 0.1]);
    for (const x of [64, 66.5, 69, 71.5, 74]) sombre.push([x, D - 4.2, c * 16.03, 1.2, 0.9, 0.1]);
    for (const x of [170, 172.5, 175]) sombre.push([x, 9, c * 14.65, 1.2, 0.9, 0.1]);
  }
  navire.add(pieces(THREE, M.noir, sombre));
  // Porte du radier (poupe) et rampe arrière
  navire.add(pieces(THREE, M.fonce, [[L + 0.05, 6.5, 0, 0.2, 11, 15.5]]));
  navire.add(numeroCoque(THREE, 'L9013', { x: 34, y: 13.2, z: 15.25, hauteur: 3.6 }));

  // Île à tribord : deux niveaux de base, passerelle vitrée et ses ailerons, mât avant, mât principal
  // treillis portant le radar de veille, tour arrière à radôme, cheminée des diesels
  const zi = -11.3;
  navire.add(blocIncline(THREE, M.gris, 42, 6, 9.4, 41.5, 9.2, 71, D, zi));
  navire.add(blocIncline(THREE, M.gris, 37, 3.2, 9.2, 36, 8.8, 68.5, D + 6, zi));
  navire.add(blocIncline(THREE, M.gris, 16, 3.4, 9, 15.4, 8.6, 58, D + 9.2, zi));
  navire.add(bloc(THREE, M.gris, 4, 0.5, 13, 51.8, D + 11.6, zi));
  navire.add(fenetres(THREE, M.vitres, { x1: 49.95, y: D + 11.2, z: -5.2, zMin: -17.3, n: 7, l: 1.3, h: 1.2, face: 'x' }));
  navire.add(fenetres(THREE, M.vitres, { x1: 51, x2: 64, y: D + 11.2, z: 4.55, n: 6, l: 1.4, h: 1.1 }).translateZ(zi));
  navire.add(fenetres(THREE, M.vitres, { x1: 50.05, y: D + 7.6, z: -6.8, zMin: -15.8, n: 6, l: 1.1, h: 1.0, face: 'x' }));
  navire.add(blocIncline(THREE, M.gris, 10, 2.6, 7, 9, 6.4, 57, D + 12.6, zi));
  navire.add(fenetres(THREE, M.vitres, { x1: 52.4, y: D + 13.9, z: -8.4, zMin: -14.2, n: 4, l: 1.1, h: 0.9, face: 'x' }));
  navire.add(bloc(THREE, M.fonce, 11, 0.3, 7.6, 57, D + 15.2, zi));
  navire.add(matPoteau(THREE, M.fonce, 56, D + 15.5, zi, 10, { r: 0.4, vergues: [[5, 6], [8.5, 3]] }));
  navire.add(blocIncline(THREE, M.gris, 7, 9, 6, 4.8, 4.4, 69.5, D + 9.2, zi));
  navire.add(bloc(THREE, M.fonce, 6.5, 0.35, 6.5, 69.5, D + 18.2, zi));
  const treillis = [];
  for (let k = 0; k < 6; k++) treillis.push([69.5, D + 19.5 + k * 2.2, zi, 2.2 - k * 0.25, 0.15, 2.2 - k * 0.25]);
  for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) treillis.push([69.5 + dx * 0.75, D + 24.5, zi + dz * 0.75, 0.18, 10.5, 0.18]);
  navire.add(pieces(THREE, M.fonce, treillis));
  navire.add(matPoteau(THREE, M.fonce, 69.5, D + 29.5, zi, 7, { r: 0.25, vergues: [[1.5, 6.5]] }));
  const radar = bloc(THREE, M.fonce, 0.9, 1.8, 4.4, 69.5, D + 26.6, zi);
  navire.add(radar);
  navire.add(blocIncline(THREE, M.gris, 8, 6, 7.4, 6.6, 6.2, 82, D + 9.2, zi));
  navire.add(radome(THREE, M.blanc, M.gris, 1.9, 82, D + 15.2, zi, 1.0));
  navire.add(radome(THREE, M.blanc, M.gris, 1.7, 64.5, D + 12.6, zi - 3.4, 0.9));
  navire.add(radome(THREE, M.blanc, M.gris, 1.5, 75.5, D + 9.2, zi + 3.3, 0.8));
  navire.add(blocIncline(THREE, M.gris, 4, 3, 4.5, 3.4, 3.8, 89.5, D + 9.2, zi - 1.5));
  navire.add(bloc(THREE, M.noir, 3.4, 0.4, 3.8, 89.5, D + 12.2, zi - 1.5));
  // Postes de missiles Simbad et passavants
  for (const [x, z] of [[40, -15], [40, 15], [192, -15], [192, 15]]) navire.add(bloc(THREE, M.fonce, 1.4, 1.2, 1.4, x, D + 0.1, z));

  // Hélicoptères (Caïman) et tracteurs de pont
  const helicos = [nh90(THREE, M.fonce, M.noir), nh90(THREE, M.fonce, M.noir)];
  helicos[0].position.set(105, D, 3); helicos[0].rotation.y = 0.02;
  helicos[1].position.set(135, D, 3); helicos[1].rotation.y = -0.02;
  navire.add(...helicos);
  for (const [x, z, m] of [[95, -3.5, M.jaune], [99, -3.5, M.jaune], [104, -4.2, M.rouge], [45, -4, M.rouge], [150, -4, M.jaune]]) navire.add(bloc(THREE, m, 3, 1.4, 1.8, x, D, z));

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  groupe.userData.legendes = [
    { texte: 'Île à tribord : passerelle et mât radar', point: p(69.5, D + 27, zi) },
    { texte: 'Pont d\'envol : six spots d\'hélicoptères', point: p(30, D + 1, 3) },
    { texte: 'Hélicoptères Caïman', point: p(110, D + 4, 3) },
    { texte: 'Radômes de télécommunications', point: p(86, D + 18, zi) },
    { texte: 'Ascenseur arrière (hangar à hélicoptères)', point: p(190, D + 0.5, 0) },
    { texte: 'Radier : porte des engins de débarquement', point: p(L, 7, 0) },
    { texte: 'Étrave à bulbe', point: p(4, -2, 0) },
  ];
  groupe.userData.commandes = [{ id: 'decoller', libelle: 'Faire décoller un Caïman', actif: 'Poser le Caïman' }];
  let h = 0;
  const depart = helicos[0].position.clone();
  groupe.userData.animer = (t, api) => {
    h += ((api.decoller ? 1 : 0) - h) * 0.02;
    helicos[0].position.set(depart.x - h * 25, depart.y + h * 22, depart.z + h * 30);
    helicos[0].rotation.z = -h * 0.08;
  };
  return groupe;
}

// ---------------------------------------------------------------------------
// Frégates : défense aérienne (Horizon) et multi-missions (FREMM)
// ---------------------------------------------------------------------------

/** Plateforme hélicoptère : cercle, croix d'axe, bordure jaune (texture). */
function helipont(THREE, longueur, largeur) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round((512 * largeur) / longueur);
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#55595e'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(W * 0.45, H / 2, H * 0.33, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.05, H / 2); ctx.lineTo(W * 0.95, H / 2); ctx.stroke();
  ctx.strokeStyle = '#e8bf2a'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, W - 8, H - 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(longueur, largeur), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** Cellules de lancement vertical Sylver (trappes carrées) : n modules de 8. */
function sylver(THREE, mat, matTrappe, { x, y, z = 0, modules = 4, rangees = 2 }) {
  const g = new THREE.Group();
  const l = modules * 1.4, p = rangees * 2.9;
  g.add(bloc(THREE, mat, l + 0.6, 0.5, p + 0.6, x, y, z));
  const trappes = [];
  for (let i = 0; i < modules * 2; i++) for (let j = 0; j < rangees * 4; j++) trappes.push([x - l / 2 + 0.35 + i * 0.7, y + 0.52, z - p / 2 + 0.36 + j * 0.72, 0.58, 0.05, 0.6]);
  g.add(pieces(THREE, matTrappe, trappes));
  return g;
}

/** Lanceurs d'Exocet MM40 (deux paires de conteneurs croisés). */
function exocets(THREE, mat, x, y) {
  const g = new THREE.Group();
  for (const c of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.75, 0.75), mat);
      tube.position.set(x + k * 0.2, y + 0.9 + k * 0.8, c * (1.2 + k * 0.85));
      tube.rotation.y = c * 0.45;
      tube.rotation.z = -0.25;
      g.add(tube);
    }
  }
  return g;
}

/**
 * Frégate de défense aérienne Chevalier Paul (D621, classe Horizon), d'après
 * des photos : 153 m, étrave très élancée, deux canons de 76 mm côte à côte
 * devant la passerelle, 48 cellules Sylver (missiles Aster), tour avant
 * portant le grand radôme du radar multifonction, mât treillis, cheminées,
 * mât arrière et son radar de veille à longue portée, hangar et plateforme.
 */
export function construireFda(THREE) {
  const L = 153;
  const s = 13 / L;
  const navire = new THREE.Group();
  const M = materiauxNavire(THREE, { teinte: 0x9da3a9 });
  const stations = [
    { x: 0, bd: 1.0, bw: 0.15, D: 10.2, T: 1, m: 1, rake: 0.6 },
    { x: 8, bd: 4.6, bw: 1.5, D: 9.6, T: 3.4, m: 1.1, rake: 0.28 },
    { x: 20, bd: 7.6, bw: 4.8, D: 8.9, T: 5, m: 1.4, rake: 0.05 },
    { x: 40, bd: 9.7, bw: 7.8, D: 8.1, T: 5.4, m: 1.9 },
    { x: 70, bd: 10.15, bw: 8.7, D: 7.5, T: 5.4, m: 2.2 },
    { x: 112, bd: 10.15, bw: 8.6, D: 7.2, T: 5, m: 2.3 },
    { x: 136, bd: 9.8, bw: 8.0, D: 7.1, T: 4.2, m: 2.4 },
    { x: L, bd: 9.1, bw: 7.0, D: 7.1, T: 2.4, m: 2.4 },
  ];
  const { coque, pont } = coqueNavire(THREE, stations, { gris: [0.24, 0.26, 0.28], couleurPont: 0x7d8287 });
  navire.add(coque, pont);
  const Dm = 7.6;
  // Sylver (48 Aster) sur la plage avant, rouf des canons, passerelle
  navire.add(sylver(THREE, M.gris, M.fonce, { x: 29, y: 8.6, modules: 3, rangees: 2 }));
  navire.add(blocIncline(THREE, M.gris, 20, 3, 15, 19, 13.5, 45, Dm, 0));
  for (const z of [-3.6, 3.6]) navire.add(tourelle(THREE, M.clair, { x: 42, y: Dm + 3, z, r: 1.5, tube: 4.2 }));
  navire.add(blocIncline(THREE, M.gris, 22, 6.4, 14.5, 20, 12, 62, Dm, 0));
  navire.add(blocIncline(THREE, M.gris, 13, 2.6, 12, 12, 11, 59, Dm + 6.4, 0));
  navire.add(fenetres(THREE, M.vitres, { x1: 52.4, y: Dm + 7.6, z: 5.4, n: 8, l: 1.0, h: 1.0, face: 'x' }));
  navire.add(fenetres(THREE, M.vitres, { x1: 54, x2: 63, y: Dm + 7.6, z: 5.6, n: 6, l: 1.0, h: 0.9 }));
  // Tour avant (pyramide) et radôme du radar multifonction
  navire.add(blocIncline(THREE, M.gris, 11, 11, 9, 5.5, 4.6, 63, Dm + 9, 0));
  navire.add(bloc(THREE, M.clair, 7, 0.6, 7, 63, Dm + 20, 0));
  navire.add(radome(THREE, M.clair, M.gris, 2.6, 63, Dm + 20.6, 0, 0.6));
  navire.add(radome(THREE, M.blanc, M.gris, 0.9, 59, Dm + 14, -3.4, 0.5));
  navire.add(bloc(THREE, M.fonce, 2.2, 0.5, 3.2, 58, Dm + 17, 3.2));
  // Mât treillis, cheminées à grilles, Exocet
  navire.add(blocIncline(THREE, M.gris, 22, 7.5, 15, 20, 12.5, 84, Dm, 0));
  const grilles = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (const c of [-1, 1]) grilles.push([78 + i * 1.2, Dm + 3.5 + j * 1.1, c * 7.3, 0.9, 0.8, 0.1]);
  navire.add(pieces(THREE, M.fonce, grilles));
  navire.add(blocIncline(THREE, M.gris, 8, 4, 7, 6, 5, 88, Dm + 7.5, 0));
  navire.add(bloc(THREE, M.noir, 6, 0.4, 5, 88, Dm + 11.5, 0));
  const treillis = [];
  for (let k = 0; k < 7; k++) treillis.push([78, Dm + 8.2 + k * 2, 0, 1.8 - k * 0.18, 0.12, 1.8 - k * 0.18]);
  for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) treillis.push([78 + dx * 0.6, Dm + 14.2, dz * 0.6, 0.15, 12.5, 0.15]);
  navire.add(pieces(THREE, M.fonce, treillis));
  navire.add(matPoteau(THREE, M.fonce, 78, Dm + 20.4, 0, 6, { r: 0.18, vergues: [[1, 5], [3.5, 2.5]] }));
  navire.add(exocets(THREE, M.clair, 97, Dm));
  // Rouf arrière, mât pyramidal et radar de veille à longue portée (antenne plane tournante)
  navire.add(blocIncline(THREE, M.gris, 16, 6.5, 14.5, 15, 12.5, 106, Dm, 0));
  navire.add(blocIncline(THREE, M.gris, 7, 8, 7, 3.6, 3.4, 105, Dm + 6.5, 0));
  const antenne = new THREE.Group();
  antenne.position.set(105, Dm + 15.2, 0);
  antenne.add(bloc(THREE, M.noir, 1.4, 3, 8, 0, 0, 0));
  antenne.add(bloc(THREE, M.fonce, 1, 0.6, 1, 0, -0.6, 0));
  navire.add(antenne);
  // Hangar, porte, plateforme hélicoptère, Caïman Marine
  navire.add(blocIncline(THREE, M.gris, 17, 6.5, 15, 16.5, 13, 122.5, Dm - 0.4, 0));
  navire.add(bloc(THREE, M.fonce, 0.2, 5, 9, 131.05, Dm - 0.4, 0));
  const pf = helipont(THREE, 21, 17);
  pf.position.set(141.5, 7.25, 0);
  navire.add(pf);
  navire.add(numeroCoque(THREE, 'D621', { x: 54, y: 4.2, z: 9.55, hauteur: 2.8 }));
  for (const [x, z] of [[73, -6.8], [73, 6.8], [98, -6.8], [98, 6.8]]) navire.add(bloc(THREE, M.fonce, 1.6, 1.4, 1.2, x, Dm, z));

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  groupe.userData.legendes = [
    { texte: 'Radar multifonction sous radôme (missiles Aster)', point: p(63, Dm + 25, 0) },
    { texte: '48 cellules Sylver : Aster 15 et Aster 30', point: p(29, Dm + 1.5, 0) },
    { texte: 'Deux canons de 76 mm', point: p(40, Dm + 4.5, -3.6) },
    { texte: 'Radar de veille à longue portée', point: p(105, Dm + 17, 0) },
    { texte: 'Missiles antinavires Exocet', point: p(97, Dm + 2, 2) },
    { texte: 'Hangar et plateforme hélicoptère', point: p(138, Dm, 0) },
    { texte: 'Étrave élancée', point: p(2, 8, 0) },
  ];
  groupe.userData.animer = (t) => { antenne.rotation.y = t / 900; };
  return groupe;
}

/**
 * Frégate multi-missions (FREMM, classe Aquitaine), d'après un plan trois
 * vues (profil, dessus, face) : 142 m, étrave élancée, canon de 76 mm,
 * cellules Sylver (Aster et missile de croisière naval), passerelle sous le
 * mât intégré pyramidal (radar Herakles), mât de communications arrière,
 * cheminée à sommet noir, logement d'embarcation, hangar et plateforme.
 */
export function construireFremm(THREE) {
  const L = 142;
  const s = 13 / L;
  const navire = new THREE.Group();
  const M = materiauxNavire(THREE, { teinte: 0x9da3a9 });
  const stations = [
    { x: 0, bd: 0.8, bw: 0.1, D: 7.9, T: 0.9, m: 1, rake: 0.55 },
    { x: 7, bd: 4.2, bw: 1.6, D: 7.5, T: 3.2, m: 1.1, rake: 0.22 },
    { x: 20, bd: 7.5, bw: 4.8, D: 7.1, T: 4.6, m: 1.5, rake: 0.04 },
    { x: 40, bd: 9.6, bw: 7.6, D: 6.4, T: 5, m: 2 },
    { x: 70, bd: 10, bw: 8.4, D: 5.9, T: 5, m: 2.3 },
    { x: 110, bd: 9.9, bw: 8.2, D: 5.7, T: 4.6, m: 2.4 },
    { x: 130, bd: 9.6, bw: 7.5, D: 5.7, T: 3.8, m: 2.4 },
    { x: L, bd: 9.0, bw: 6.6, D: 5.7, T: 2.2, m: 2.4 },
  ];
  const { coque, pont } = coqueNavire(THREE, stations, { gris: [0.24, 0.26, 0.28], couleurPont: 0x7d8287 });
  navire.add(coque, pont);
  const Dm = 5.9;
  // Canon de 76 mm et Sylver (Aster, missile de croisière naval) devant la passerelle
  navire.add(tourelle(THREE, M.clair, { x: 36, y: 6.7, r: 1.6, tube: 4.4 }));
  navire.add(sylver(THREE, M.gris, M.fonce, { x: 41.5, y: 6.25, modules: 4, rangees: 2 }));
  // Superstructure continue : façade avant inclinée (passerelle), toit plat jusqu'au hangar
  const sup = new THREE.Shape([[44.6, 0], [48.5, 6.2], [116.5, 6.2], [116.5, 0]].map(([x, y]) => new THREE.Vector2(x, y)));
  const supGeo = new THREE.ExtrudeGeometry(sup, { depth: 15.2, bevelEnabled: false });
  supGeo.translate(0, Dm - 0.2, -7.6);
  navire.add(new THREE.Mesh(supGeo, M.gris));
  navire.add(fenetres(THREE, M.vitres, { x1: 49.6, x2: 56, y: Dm + 4.7, z: 7.65, n: 5, l: 1.0, h: 0.8 }));
  navire.add(pieces(THREE, M.vitres, [[48.2, Dm + 5.2, 0, 0.4, 0.8, 12.5]]));
  // Mât intégré pyramidal et radar Herakles, mât arrière, cheminée, antenne fouet
  navire.add(blocIncline(THREE, M.gris, 10.5, 8.2, 9, 5.2, 4.4, 61, Dm + 6, 0));
  navire.add(blocIncline(THREE, M.clair, 3.6, 3.4, 3.4, 2.4, 2.4, 61, Dm + 14.2, 0));
  navire.add(radome(THREE, M.blanc, M.gris, 0.9, 56.5, Dm + 6, 5.5, 0.6));
  navire.add(radome(THREE, M.blanc, M.gris, 0.9, 56.5, Dm + 6, -5.5, 0.6));
  navire.add(blocIncline(THREE, M.gris, 6.5, 9, 6, 2.2, 2, 76.5, Dm + 6, 0));
  navire.add(matPoteau(THREE, M.fonce, 76.5, Dm + 15, 0, 14, { r: 0.35, vergues: [[2, 3.5], [5, 2.5]] }));
  navire.add(blocIncline(THREE, M.gris, 11, 6.5, 8, 10, 7, 90.5, Dm + 6, 0));
  navire.add(bloc(THREE, M.noir, 10.4, 1.4, 7.2, 90.5, Dm + 12.4, 0));
  navire.add(matPoteau(THREE, M.fonce, 47.5, Dm + 6.2, 4, 9, { r: 0.12 }));
  navire.add(radome(THREE, M.blanc, M.gris, 1.0, 101, Dm + 6.2, 0, 0.5));
  // Logement d'embarcation et hublots sur les flancs, numéro de coque
  for (const c of [-1, 1]) navire.add(pieces(THREE, M.fonce, [[74.5, Dm + 2.6, c * 7.62, 9, 4, 0.1], [113.5, Dm + 2.6, c * 7.62, 3, 1.2, 0.1]]));
  navire.add(numeroCoque(THREE, 'D650', { x: 28, y: 3.2, z: 9.0, hauteur: 2.6 }));
  // Hangar (dans le prolongement), plateforme hélicoptère
  navire.add(bloc(THREE, M.fonce, 0.2, 5, 9, 116.65, Dm - 0.2, 0));
  const pf = helipont(THREE, 24, 17);
  pf.position.set(129.5, 5.82, 0);
  navire.add(pf);
  navire.add(exocets(THREE, M.clair, 99, Dm + 6.2));

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  groupe.userData.legendes = [
    { texte: 'Mât intégré et radar Herakles', point: p(61, Dm + 17, 0) },
    { texte: 'Sylver : Aster et missile de croisière naval', point: p(41.5, Dm + 1.5, 0) },
    { texte: 'Canon de 76 mm', point: p(34, 8.5, 0) },
    { texte: 'Cheminée', point: p(90.5, Dm + 14, 0) },
    { texte: 'Mât de communications', point: p(76.5, Dm + 27, 0) },
    { texte: 'Hangar et plateforme (Caïman Marine)', point: p(128, Dm + 0.5, 0) },
  ];
  return groupe;
}

// ---------------------------------------------------------------------------
// Ravitailleur de forces (BRF)
// ---------------------------------------------------------------------------

/**
 * Bâtiment ravitailleur de forces (classe Jacques Chevallier), d'après une
 * photo et une image de synthèse : 194 m, gaillard d'avant, grue avant,
 * quatre portiques de ravitaillement à la mer, superstructure et passerelle
 * vers l'arrière, logements d'embarcations, hangar et plateforme hélicoptère.
 * Commande : déployer les tuyaux de ravitaillement.
 */
export function construireBrf(THREE) {
  const L = 194;
  const s = 13 / L;
  const navire = new THREE.Group();
  const M = materiauxNavire(THREE, { teinte: 0x9da3a9 });
  const stations = [
    { x: 0, bd: 1.2, bw: 0.2, D: 16.5, T: 1, m: 1, rake: 0.34 },
    { x: 8, bd: 7, bw: 3, D: 16, T: 5, m: 1.2, rake: 0.14 },
    { x: 22, bd: 11.5, bw: 9, D: 15.5, T: 7.4, m: 2 },
    { x: 34, bd: 13.4, bw: 12.6, D: 15.2, T: 7.7, m: 3 },
    { x: 38, bd: 13.7, bw: 13.2, D: 12.4, T: 7.7, m: 3.2 },
    { x: 160, bd: 13.7, bw: 13.2, D: 12.4, T: 7.7, m: 3.2 },
    { x: 182, bd: 13.5, bw: 12, D: 12.4, T: 6, m: 2.6 },
    { x: L, bd: 12.8, bw: 10.2, D: 12.4, T: 3.5, m: 2.2 },
  ];
  const { coque, pont } = coqueNavire(THREE, stations, { gris: [0.24, 0.26, 0.28], couleurPont: 0x7d8287, bombe: 0.15 });
  navire.add(coque, pont);
  const Dm = 12.4;
  // Gaillard d'avant : pavois et grue à flèche
  navire.add(bloc(THREE, M.gris, 4, 2.5, 26, 36, Dm, 0));
  navire.add(bloc(THREE, M.gris, 3, 7, 3, 31, 15.4, 6));
  const fleche = new THREE.Mesh(new THREE.BoxGeometry(22, 0.9, 0.9), M.gris);
  fleche.position.set(21, 24, 6);
  fleche.rotation.z = 0.32;
  navire.add(fleche);
  // Quatre portiques de ravitaillement (deux paires), cabine de contrôle entre eux
  const tuyaux = [];
  for (const x of [52, 60, 80, 88]) {
    for (const c of [-1, 1]) {
      navire.add(bloc(THREE, M.clair, 1.4, 17, 1.4, x, Dm, c * 7.5));
      navire.add(bloc(THREE, M.clair, 1.2, 1.2, 5, x, Dm + 15.5, c * 9.5));
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 8), M.noir);
      t.visible = false;
      t.userData.cote = c;
      t.position.set(x, Dm + 15, c * 12);
      tuyaux.push(t);
      navire.add(t);
    }
    navire.add(bloc(THREE, M.clair, 1.2, 1.2, 15, x, Dm + 17, 0));
    navire.add(pieces(THREE, M.fonce, [-1, 1].flatMap((c) => [[x, Dm + 6, c * 8.4, 0.3, 9, 0.3], [x - 0.6, Dm + 6, c * 8.4, 0.3, 9, 0.3]])));
  }
  navire.add(bloc(THREE, M.clair, 8, 4.5, 8, 70, Dm, 0));
  navire.add(fenetres(THREE, M.vitres, { x1: 66, x2: 74, y: Dm + 3.2, z: 4.05, n: 4, l: 1.2, h: 0.9 }));
  // Conteneurs et rouf central
  navire.add(pieces(THREE, M.rouge, [[100, Dm + 1.3, -5, 12, 2.6, 2.4], [100, Dm + 1.3, 5, 12, 2.6, 2.4]]));
  navire.add(bloc(THREE, M.gris, 12, 3.5, 10, 102, Dm, 0));
  // Superstructure arrière : étages, passerelle vitrée et ailerons, mât, cheminée
  navire.add(blocIncline(THREE, M.gris, 46, 6, 26, 45, 25, 135, Dm, 0));
  navire.add(blocIncline(THREE, M.gris, 30, 5.5, 22, 29, 21, 128, Dm + 6, 0));
  navire.add(blocIncline(THREE, M.gris, 14, 3.4, 18, 13, 17, 121, Dm + 11.5, 0));
  navire.add(bloc(THREE, M.gris, 4, 0.6, 26, 115.5, Dm + 13.6, 0));
  navire.add(fenetres(THREE, M.vitres, { x1: 113.9, y: Dm + 13, z: 8.4, n: 9, l: 1.3, h: 1.2, face: 'x' }));
  navire.add(fenetres(THREE, M.vitres, { x1: 106, y: Dm + 8.2, z: 10.4, n: 10, l: 1.2, h: 0.9, face: 'x' }));
  navire.add(fenetres(THREE, M.vitres, { x1: 115, x2: 154, y: Dm + 3.2, z: 13.05, n: 18, l: 0.8, h: 0.8 }));
  navire.add(blocIncline(THREE, M.gris, 5, 6, 5, 2.6, 2.6, 121, Dm + 14.9, 0));
  navire.add(matPoteau(THREE, M.fonce, 121, Dm + 20.9, 0, 9, { r: 0.3, vergues: [[2, 6], [5, 3.5]] }));
  navire.add(radome(THREE, M.blanc, M.gris, 1.4, 126, Dm + 14.9, -5, 0.6));
  navire.add(radome(THREE, M.blanc, M.gris, 1.1, 126, Dm + 14.9, 5, 0.5));
  navire.add(blocIncline(THREE, M.gris, 7, 6, 6, 6, 5, 141, Dm + 11.5, 0));
  navire.add(bloc(THREE, M.noir, 6, 0.4, 5, 141, Dm + 17.5, 0));
  // Logements d'embarcations (ouvertures latérales) avec leur canot orange
  for (const c of [-1, 1]) {
    navire.add(pieces(THREE, M.noir, [[118, Dm + 2.5, c * 13.1, 8, 3.6, 0.2], [146, Dm + 2.5, c * 13.1, 6, 3.6, 0.2]]));
    const canot = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 4.5, 4, 10), new THREE.MeshStandardMaterial({ color: 0xe86a1f, roughness: 0.6 }));
    canot.rotation.z = Math.PI / 2;
    canot.position.set(118, Dm + 2, c * 12.6);
    navire.add(canot);
  }
  // Hangar et plateforme hélicoptère surélevée à la poupe
  navire.add(bloc(THREE, M.gris, 14, 7, 22, 165, Dm, 0));
  const pf = helipont(THREE, 26, 25);
  pf.position.set(181, Dm + 3.05, 0);
  navire.add(pf);
  navire.add(bloc(THREE, M.gris, 26, 3, 25, 181, Dm, 0));
  navire.add(numeroCoque(THREE, 'A725', { x: 24, y: 10, z: 12.6, hauteur: 3.2 }));

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  groupe.userData.legendes = [
    { texte: 'Portiques de ravitaillement à la mer', point: p(56, Dm + 18, 0) },
    { texte: 'Grue', point: p(21, 25, 6) },
    { texte: 'Passerelle de navigation', point: p(114, Dm + 14, 0) },
    { texte: 'Embarcations', point: p(118, Dm + 2.5, -13.5) },
    { texte: 'Plateforme et hangar hélicoptère', point: p(180, Dm + 3.5, 0) },
  ];
  groupe.userData.commandes = [{ id: 'ravitailler', libelle: 'Déployer les tuyaux de ravitaillement', actif: 'Rentrer les tuyaux' }];
  let f = 0;
  groupe.userData.animer = (t, api) => {
    f += ((api.ravitailler ? 1 : 0) - f) * 0.04;
    for (const tu of tuyaux) {
      tu.visible = f > 0.02;
      const longueur = 2 + f * 26;
      tu.scale.y = longueur;
      tu.rotation.x = tu.userData.cote * (Math.PI / 2 + 0.35);
      tu.position.set(tu.position.x, Dm + 15 - Math.sin(0.35) * longueur / 2, tu.userData.cote * (11 + Math.cos(0.35) * longueur / 2));
    }
  };
  return groupe;
}

// ---------------------------------------------------------------------------
// Bâtiment d'essais et de mesures Monge
// ---------------------------------------------------------------------------

/** Antenne parabolique orientable sur piédestal (radar de trajectographie, télémesure). */
function parabole(THREE, mat, matPied, { x, y, z = 0, diametre, pied, inclinaison = 0.5 }) {
  const g = new THREE.Group();
  const fut = new THREE.Mesh(new THREE.CylinderGeometry(diametre * 0.09, diametre * 0.16, pied, 16), matPied);
  fut.position.set(x, y + pied / 2, z);
  const tete = new THREE.Mesh(new THREE.BoxGeometry(diametre * 0.22, diametre * 0.3, diametre * 0.26), matPied);
  tete.position.set(x, y + pied + diametre * 0.12, z);
  const orient = new THREE.Group();
  orient.position.set(x, y + pied + diametre * 0.32, z);
  const coupe = new THREE.Mesh(new THREE.SphereGeometry(diametre / 2, 32, 10, 0, Math.PI * 2, 0, 0.62), mat);
  coupe.material.side = THREE.DoubleSide;
  coupe.rotation.x = Math.PI; // concavité vers le haut, puis inclinée
  const support = new THREE.Group();
  support.add(coupe);
  coupe.position.y = diametre * 0.4;
  const source = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, diametre * 0.35, 6), matPied);
  source.position.y = diametre * 0.08;
  support.add(source);
  support.rotation.z = inclinaison;
  orient.add(support);
  g.add(fut, tete, orient);
  g.userData.orient = orient;
  return g;
}

/**
 * Bâtiment d'essais et de mesures Monge (A601), d'après une photo : 225 m,
 * coque grise à franc-bord élevé, grand bloc blanc de passerelle à l'avant,
 * trois grandes antennes paraboliques (radars de trajectographie et
 * télémesure), radômes, mât arrière élancé, plage arrière et plateforme
 * hélicoptère en porte-à-faux. Commande : suivre un tir (les antennes pivotent).
 */
export function construireMonge(THREE) {
  const L = 225;
  const s = 13 / L;
  const navire = new THREE.Group();
  const M = materiauxNavire(THREE, { teinte: 0x9da3a9 });
  const blanc = M.blanc;
  const stations = [
    { x: 0, bd: 1.0, bw: 0.2, D: 18.5, T: 1, m: 1, rake: 0.3 },
    { x: 9, bd: 6.5, bw: 3, D: 18.2, T: 5, m: 1.2, rake: 0.12 },
    { x: 26, bd: 10.8, bw: 9, D: 17.8, T: 7, m: 2 },
    { x: 50, bd: 12.4, bw: 12, D: 17.4, T: 7.4, m: 3 },
    { x: 180, bd: 12.4, bw: 12, D: 17, T: 7.4, m: 3 },
    { x: 202, bd: 12.2, bw: 11, D: 17, T: 6, m: 2.6 },
    { x: 205, bd: 12.1, bw: 10.8, D: 10.5, T: 5.8, m: 2.6 },
    { x: L - 12, bd: 11.4, bw: 9.4, D: 10.5, T: 3.6, m: 2.2 },
  ];
  const { coque, pont } = coqueNavire(THREE, stations, { gris: [0.24, 0.26, 0.28], couleurPont: 0x7f8489 });
  navire.add(coque, pont);
  const Dm = 17;
  // Bulbe d'étrave et ancre
  const bulbe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: 0x6e1b16, roughness: 0.7 }));
  bulbe.scale.set(5, 2.2, 2);
  bulbe.position.set(8.5, -4.3, 0);
  navire.add(bulbe);
  for (const c of [-1, 1]) navire.add(bloc(THREE, M.noir, 1.6, 1.6, 0.4, 14, 12.6, c * 8.6));
  // Grand bloc blanc de l'avant : six étages, passerelle vitrée en haut
  navire.add(blocIncline(THREE, blanc, 51, 13, 24.6, 50.5, 24.2, 74.5, Dm, 0));
  navire.add(blocIncline(THREE, blanc, 46, 3.2, 23.6, 45, 23, 77, Dm + 13, 0));
  navire.add(bloc(THREE, M.gris, 2, 0.5, 24.8, 54.4, Dm + 16.2, 0));
  navire.add(fenetres(THREE, M.vitres, { x1: 53.9, y: Dm + 14.6, z: 10.8, n: 12, l: 1.2, h: 1.1, face: 'x' }));
  for (const yy of [2.5, 5.5, 8.5, 11]) navire.add(fenetres(THREE, M.vitres, { x1: 52, x2: 98, y: Dm + yy, z: 12.35, n: 14, l: 0.7, h: 0.7 }));
  navire.add(radome(THREE, blanc, M.gris, 2.3, 70, Dm + 16.2, -6, 1.2));
  navire.add(matPoteau(THREE, M.fonce, 64, Dm + 16.2, 4, 7, { r: 0.2, vergues: [[4, 4]] }));
  // Pont central : roufs, trois grandes paraboles (la plus grande à l'arrière), radômes
  navire.add(blocIncline(THREE, M.gris, 80, 4.5, 21, 79, 20, 141, Dm, 0));
  const antennes = [
    parabole(THREE, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), blanc, { x: 111, y: Dm + 4.5, diametre: 14, pied: 10, inclinaison: 0.75 }),
    parabole(THREE, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), blanc, { x: 127.5, y: Dm + 4.5, diametre: 14, pied: 10.5, inclinaison: 0.75 }),
    parabole(THREE, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), blanc, { x: 146, y: Dm + 4.5, diametre: 19, pied: 12, inclinaison: 0.7 }),
  ];
  navire.add(...antennes);
  for (const [x, z, r] of [[160, -6, 2.4], [166, 5, 2.0], [172, -2, 1.6], [101, 7, 1.4]]) navire.add(radome(THREE, blanc, M.gris, r, x, Dm + 4.5, z, 1.4));
  for (const [x, z] of [[156, 7], [176, 6]]) navire.add(parabole(THREE, blanc, M.gris, { x, y: Dm + 4.5, z, diametre: 4, pied: 2.5, inclinaison: 0.9 }));
  // Mât arrière élancé (radar de navigation, antennes)
  navire.add(blocIncline(THREE, M.gris, 14, 6, 16, 12, 12, 185, Dm, 0));
  navire.add(blocIncline(THREE, blanc, 7, 22, 6, 3.2, 3, 185, Dm + 6, 0));
  navire.add(bloc(THREE, M.gris, 9, 0.5, 9, 185, Dm + 28, 0));
  navire.add(matPoteau(THREE, M.fonce, 185, Dm + 28.5, 0, 9, { r: 0.4, vergues: [[3, 9], [6, 4]] }));
  const radarNav = bloc(THREE, M.fonce, 0.8, 0.8, 4.5, 185, Dm + 30.5, 0);
  navire.add(radarNav);
  // Plage arrière basse et plateforme hélicoptère en porte-à-faux
  const pf = helipont(THREE, 20, 22);
  pf.position.set(L - 9, 12.2, 0);
  navire.add(pf);
  navire.add(bloc(THREE, M.gris, 20, 1.5, 22, L - 9, 10.6, 0));
  for (const c of [-1, 1]) navire.add(pieces(THREE, M.fonce, [[L - 9, 12.8, c * 11, 20, 0.08, 0.08], [L - 9, 13.4, c * 11, 20, 0.08, 0.08]]));
  navire.add(numeroCoque(THREE, 'A601', { x: 70, y: 5.5, z: 12.15, hauteur: 3.4 }));
  // Ouvertures de coque (sabords) près de la poupe
  for (const c of [-1, 1]) navire.add(pieces(THREE, M.noir, [[190, 6, c * 12.15, 3.2, 2.2, 0.15], [194.5, 6, c * 12.15, 3.2, 2.2, 0.15], [160, 6, c * 12.15, 2.4, 2.2, 0.15]]));

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  groupe.userData.legendes = [
    { texte: 'Radars de trajectographie et antennes de télémesure', point: p(146, Dm + 24, 0) },
    { texte: 'Passerelle et laboratoires (bloc avant)', point: p(56, Dm + 15, 0) },
    { texte: 'Radômes (télécommunications, mesures)', point: p(160, Dm + 9, -6) },
    { texte: 'Mât arrière', point: p(185, Dm + 33, 0) },
    { texte: 'Plateforme hélicoptère', point: p(L - 9, 13, 0) },
  ];
  groupe.userData.commandes = [{ id: 'suivre', libelle: 'Suivre un tir de missile', actif: 'Antennes au repos' }];
  let f = 0;
  groupe.userData.animer = (t, api) => {
    f += ((api.suivre ? 1 : 0) - f) * 0.03;
    antennes.forEach((a, i) => { a.userData.orient.rotation.y = f * (1.2 + Math.sin(t / 2500 + i) * 0.25); });
    radarNav.rotation.y = t / 700;
  };
  return groupe;
}

// ---------------------------------------------------------------------------
// Groupe aéronaval (un ou deux), composé selon la partie
// ---------------------------------------------------------------------------

/**
 * Échelle et flottaison de chaque modèle dans sa propre visionneuse :
 * s (unités par mètre) et y de la flottaison, pour les ramener tous à une
 * échelle commune, flottaison à y = 0.
 */
const MODELES_GROUPE = {
  cdg: { construire: construireCharlesDeGaulle, s: 0.05, y: 0.4 - 17.5 * 0.05, L: 261.5, B: 64, nom: 'Charles-de-Gaulle' },
  pang: { construire: construirePorteAvions, s: 0.05, y: 0.4 - 20 * 0.05, L: 310, B: 85, nom: 'porte-avions de nouvelle génération' },
  fda: { construire: construireFda, s: 13 / 153, y: -0.5, L: 153, B: 20, nom: 'frégate de défense aérienne' },
  fremm: { construire: construireFremm, s: 13 / 142, y: -0.5, L: 142, B: 20, nom: 'FREMM' },
  brf: { construire: construireBrf, s: 13 / 194, y: -0.5, L: 194, B: 27, nom: 'ravitailleur de forces' },
  sna: { construire: construireSna, s: 0.13, y: -0.6 * 0.13, L: 99, B: 9, nom: 'SNA' },
  pha: { construire: construirePha, s: 13 / 199, y: -0.5, L: 199, B: 32, nom: 'porte-hélicoptères amphibie' },
  monge: { construire: construireMonge, s: 13 / 225, y: -0.5, L: 225, B: 24, nom: 'Monge' },
};

/** Positions de l'escorte autour du porte-avions (mètres ; cap vers x négatif ; z négatif à tribord). Distances resserrées. */
const POSTES = {
  fda: [[-430, 230]],
  fremm: [[-330, -300], [390, 330]],
  sna: [[-660, -60]],
  brf: [[310, -270]],
  pha: [[700, 10]],
};
/** À quai à Toulon : le porte-avions le long du quai, l'escorte amarrée de l'autre côté de la jetée. */
const POSTES_PORT = {
  fda: [[-260, 84]],
  fremm: [[-90, 84], [75, 84]],
  brf: [[260, 88]],
  sna: [[420, 70]],
  pha: [[-500, 72]],
};

/** Sillage d'écume en V derrière un navire (longueur L, largeur B, en mètres). */
function sillage(THREE, L, B) {
  const forme = new THREE.Shape([new THREE.Vector2(0, -B * 0.45), new THREE.Vector2(L * 1.8, -B * 1.6), new THREE.Vector2(L * 1.8, B * 1.6), new THREE.Vector2(0, B * 0.45)]);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(forme), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2; // dessiné après la mer (transparente elle aussi)
  return m;
}

/** Construit un navire du groupe à l'échelle commune k (unités par mètre), flottaison à y = 0. */
function navireDuGroupe(THREE, type, k) {
  const d = MODELES_GROUPE[type];
  const objet = d.construire(THREE, {});
  // Une seule mer pour tout le groupe : on retire celle de chaque modèle
  const mers = [];
  objet.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.geometry.parameters.width > 1000) mers.push(o); });
  for (const m of mers) { m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); }
  const f = k / d.s;
  const conteneur = new THREE.Group();
  conteneur.add(objet);
  conteneur.scale.setScalar(f);
  conteneur.position.y = -d.y * f;
  return { conteneur, objet, d };
}

/**
 * Caïman Marine (NH90 NFH) en vol stationnaire à 45 m, agrandi comme les
 * avions de la scène, avec son sonar trempé : le câble descend sous la
 * surface quand on « trempe » le sonar. Position en mètres (x, z).
 */
function caimanAsm(THREE, k, racine, x, z) {
  const helo = construireCaiman(THREE, { modele: 'caimanMarine' });
  const echelleModele = 0.85, baseModele = -2.2 + 0.35; // voir construireCaiman (installer)
  const fH = (k * 2.2) / echelleModele;
  const altitude = 45;
  const enveloppe = new THREE.Group();
  enveloppe.add(helo);
  enveloppe.scale.setScalar(fH);
  const y0 = altitude * k - baseModele * fH;
  enveloppe.position.set(x * k, y0, z * k);
  racine.add(enveloppe);
  // Point d'attache du sonar (6,6 m de l'avant, 0,8 m de haut dans le modèle)
  const attache = { x: (6.6 - 8) * echelleModele * fH, y: (0.8 * echelleModele + baseModele) * fH };
  const matCable = new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.6 });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), matCable);
  const sonar = new THREE.Mesh(new THREE.CapsuleGeometry(1, 2.2, 4, 10), new THREE.MeshStandardMaterial({ color: 0xe0a32a, roughness: 0.5 }));
  sonar.scale.setScalar(0.9 * k * 2.2);
  racine.add(cable, sonar);
  const fond = -32 * k; // profondeur d'immersion du sonar
  let fS = 0;
  return {
    animer(t, plonger) {
      helo.userData.animer?.(t, {});
      const yH = y0 + Math.sin(t / 900) * 0.6 * k; // vol stationnaire, léger balancement
      enveloppe.position.y = yH;
      fS += ((plonger ? 1 : 0) - fS) * 0.02;
      const haut = yH + attache.y;
      const bas = haut - 0.02 - (haut - fond) * fS;
      const longueur = Math.max(0.001, haut - bas);
      cable.visible = sonar.visible = fS > 0.02;
      cable.scale.set(0.6 * k, longueur, 0.6 * k);
      cable.position.set(x * k + attache.x, (haut + bas) / 2, z * k);
      sonar.position.set(x * k + attache.x, bas - 1.5 * k, z * k);
    },
  };
}

/**
 * Groupe(s) aéronaval(s) : le porte-avions (Charles-de-Gaulle ou porte-avions
 * de nouvelle génération) et son escorte telle qu'elle existe dans la partie
 * (frégate de défense aérienne, FREMM anti-sous-marine et son Caïman Marine à
 * sonar trempé, autre FREMM, sous-marin d'attaque en plongée, ravitailleur,
 * porte-hélicoptères amphibie en renfort), sillages et Rafale Marine en patrouille. Tous les navires
 * sont à la même échelle ; les distances sont resserrées (en réalité, les
 * escorteurs croisent à plusieurs kilomètres) et les avions agrandis.
 * donnees : { groupes: [{ porteAvions: 'cdg' | 'pang', nom, enMer, theatre, escorte: { fda, fremm, sna, brf, pha } }] }
 * Commandes : sonar trempé du Caïman Marine, ravitaillement à la mer.
 */
export function construireGroupeAeronaval(THREE, { donnees = null } = {}) {
  const groupes = (donnees?.groupes?.length ? donnees.groupes : [{ porteAvions: 'cdg', nom: 'Charles-de-Gaulle', escorte: { fda: 1, fremm: 2, sna: 1, brf: 1, pha: 1 } }]).slice(0, 2);
  const deux = groupes.length > 1;
  const k = deux ? 0.0085 : 0.012;
  const ecart = 950; // mètres entre les deux groupes
  const racine = new THREE.Group();
  const p = (x, y, z) => new THREE.Vector3(x * k, y * k, z * k);
  const legendes = [];
  const animations = [];
  const ravitailleurs = [];
  const avions = [];
  const helicos = []; // Caïman Marine de lutte anti-sous-marine, sonar trempé

  groupes.forEach((g, i) => {
    const z0 = deux ? (i === 0 ? ecart / 2 : -ecart / 2) : 0;
    const typePA = g.porteAvions === 'cdg' ? 'cdg' : 'pang';
    const enMer = g.enMer !== false;
    const pa = navireDuGroupe(THREE, typePA, k);
    pa.conteneur.position.z = z0 * k;
    racine.add(pa.conteneur);
    if (enMer) {
      const sPA = sillage(THREE, pa.d.L, pa.d.B);
      sPA.scale.setScalar(k);
      sPA.position.set((pa.d.L / 2) * k, 1.5 * k, z0 * k);
      racine.add(sPA);
    } else {
      // Jetée de la base navale de Toulon, hangars et grues
      const quai = new THREE.MeshStandardMaterial({ color: 0xa7a59d, roughness: 0.9 });
      const jetee = new THREE.Mesh(new THREE.BoxGeometry(1350, 6, 44), quai);
      jetee.scale.setScalar(k);
      jetee.position.set(60 * k, 1 * k, (z0 + (pa.d.B / 2) + 26) * k);
      racine.add(jetee);
      const batiments = [];
      for (const x of [-520, -470, 520, 570]) batiments.push([x, 12, z0 + pa.d.B / 2 + 26, 40, 18, 30]);
      racine.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.85 }), batiments.map(([x, y, z, l, h, pr]) => [x * k, y * k, z * k, l * k, h * k, pr * k])));
      const grue = new THREE.MeshStandardMaterial({ color: 0xd9a03a, roughness: 0.7 });
      for (const x of [-380, 380]) {
        racine.add(pieces(THREE, grue, [[x * k, 22 * k, (z0 + pa.d.B / 2 + 26) * k, 4 * k, 40 * k, 4 * k], [(x - 12) * k, 42 * k, (z0 + pa.d.B / 2 + 18) * k, 32 * k, 3 * k, 3 * k]]));
      }
    }
    const lieu = g.theatre ? (enMer ? ` · en mission : ${g.theatre}` : ' · à quai à Toulon') : '';
    legendes.push({ texte: `${deux ? `Groupe ${i + 1} : ` : 'Porte-avions '}${g.nom ?? pa.d.nom}${lieu}`, point: p(0, 60, z0) });
    const esc = { fda: 1, fremm: 2, sna: 1, brf: 1, pha: 1, ...(g.escorte ?? {}) };
    for (const type of ['fda', 'fremm', 'sna', 'brf', 'pha']) {
      const postes = enMer ? POSTES[type] : POSTES_PORT[type];
      const n = Math.min(esc[type] ?? 0, postes.length);
      for (let j = 0; j < n; j++) {
        const [x, zr] = postes[j];
        // À quai, l'escorte est amarrée de l'autre côté de la jetée
        const z = enMer ? zr : pa.d.B / 2 + zr;
        const nav = navireDuGroupe(THREE, type, k);
        const profondeur = type === 'sna' && enMer ? -8 : 0; // sous-marin en plongée (kiosque affleurant), en surface au port
        nav.conteneur.position.set(x * k, nav.conteneur.position.y + profondeur * k, (z0 + z) * k);
        racine.add(nav.conteneur);
        if (type !== 'sna' && enMer) {
          const sl = sillage(THREE, nav.d.L, nav.d.B);
          sl.scale.setScalar(k);
          sl.position.set((x + nav.d.L / 2) * k, 1.5 * k, (z0 + z) * k);
          racine.add(sl);
          if (type === 'brf') ravitailleurs.push({ conteneur: nav.conteneur, sillage: sl, x, z: z0 + z, z0, L: nav.d.L, objet: nav.objet });
        }
        if (nav.objet.userData.animer) animations.push(nav.objet);
        // Frégate anti-sous-marine : son Caïman Marine en vol stationnaire devant elle, sonar trempé
        if (type === 'fremm' && j === 0 && enMer) helicos.push(caimanAsm(THREE, k, racine, x - 90, z0 + z + 70));
        if (i === 0 || !deux) {
          const texte = { fda: 'Frégate de défense aérienne (missiles Aster)', fremm: 'FREMM anti-sous-marine (sonar remorqué)', sna: enMer ? 'Sous-marin nucléaire d\'attaque en plongée' : 'Sous-marin nucléaire d\'attaque', brf: 'Ravitailleur de forces', pha: 'Porte-hélicoptères amphibie (renfort)' }[type];
          if (type !== 'fremm' || j === 0) legendes.push({ texte, point: p(x, type === 'sna' ? 5 : 35, z0 + z) });
          if (type === 'fremm' && j === 0 && enMer) legendes.push({ texte: 'Caïman Marine : sonar trempé (lutte anti-sous-marine)', point: p(x - 90, 95, z0 + z + 70) });
        }
      }
    }
    // Rafale Marine en patrouille au-dessus du groupe (en mission seulement)
    for (let j = 0; j < (enMer ? 2 : 0); j++) {
      const r = construireRafale(THREE, { armement: true });
      r.scale.setScalar(k * 2.6);
      racine.add(r);
      avions.push({ r, z0, phase: j * Math.PI, rayon: 300 + j * 90, altitude: 260 + j * 40 });
    }
    if (enMer && !legendes.some((l) => l.texte.startsWith('Rafale'))) legendes.push({ texte: 'Rafale Marine en patrouille (agrandis)', point: p(-300, 300, z0) });
  });

  // Mer commune, un peu transparente : on devine le sous-marin sous la surface
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: 0x0e3a5f, roughness: 0.45, metalness: 0, envMapIntensity: 0.3, transparent: true, opacity: 0.74 }));
  mer.rotation.x = -Math.PI / 2;
  mer.position.y = -0.01;
  mer.receiveShadow = true;
  mer.renderOrder = 1;
  racine.add(mer);

  racine.userData.legendes = legendes;
  racine.userData.taille = 14;
  racine.userData.mer = true;
  racine.userData.commandes = [
    ...(helicos.length ? [{ id: 'sonar', libelle: 'Tremper le sonar (lutte anti-sous-marine)', actif: 'Remonter le sonar' }] : []),
    ...(ravitailleurs.length ? [{ id: 'ravitailler', libelle: 'Ravitaillement à la mer', actif: 'Fin du ravitaillement' }] : []),
  ];
  let f = 0;
  racine.userData.animer = (t, api) => {
    for (const h of helicos) h.animer(t, !!api.sonar);
    f += ((api.ravitailler ? 1 : 0) - f) * 0.02;
    // Le ravitailleur vient se placer à couple, à tribord du porte-avions, puis déploie ses tuyaux
    for (const rv of ravitailleurs) {
      const cible = { x: 20, z: rv.z0 - 78 };
      const x = rv.x + (cible.x - rv.x) * f, z = rv.z + (cible.z - rv.z) * f;
      rv.conteneur.position.x = x * k;
      rv.conteneur.position.z = z * k;
      rv.sillage.position.set((x + rv.L / 2) * k, 1.5 * k, z * k);
      rv.objet.userData.animer?.(t, { ravitailler: f > 0.9 });
    }
    for (const o of animations) if (!ravitailleurs.some((rv) => rv.objet === o)) o.userData.animer(t, {});
    for (const a of avions) {
      const ang = t / 4200 + a.phase;
      a.r.position.set(Math.cos(ang) * a.rayon * k, a.altitude * k, (a.z0 + Math.sin(ang) * a.rayon) * k);
      a.r.rotation.order = 'YXZ'; // cap, puis inclinaison dans le virage
      a.r.rotation.set(-0.35, Math.PI / 2 - ang, 0);
    }
  };
  return racine;
}

// ---------------------------------------------------------------------------
// Dissuasion océanique : SNLE en patrouille, son escorte, tir d'essai d'un M51
// ---------------------------------------------------------------------------

/** Missile M51 (12 m, 2,3 m de diamètre), en mètres, base en y = 0, pointe vers le haut ; tuyère et flamme. */
function missileM51(THREE) {
  const g = new THREE.Group();
  const blanc = new THREE.MeshStandardMaterial({ color: 0xe9ebee, roughness: 0.45, metalness: 0.15 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.6, metalness: 0.3 });
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 8.6, 24), blanc);
  corps.position.y = 4.3;
  const coiffe = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.4, 24), blanc);
  coiffe.position.y = 10.3;
  const bague = new THREE.Mesh(new THREE.CylinderGeometry(1.17, 1.17, 0.35, 24), sombre);
  bague.position.y = 6.2;
  const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.0, 0.8, 18, 1, true), sombre);
  tuyere.position.y = -0.3;
  const flamme = new THREE.Group();
  const coeur = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
  const halo = new THREE.Mesh(new THREE.ConeGeometry(1.6, 11, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
  coeur.rotation.x = halo.rotation.x = Math.PI; // pointe vers le bas
  coeur.position.y = -4.1;
  halo.position.y = -6;
  flamme.add(halo, coeur);
  flamme.visible = false;
  g.add(corps, coiffe, bague, tuyere, flamme);
  g.traverse((o) => { if (o.isMesh) o.castShadow = !o.material.transparent; });
  return { groupe: g, flamme };
}

/** Côte basse et falaises à l'horizon (Finistère), en mètres × k. */
function cote(THREE, k, z) {
  const g = new THREE.Group();
  const lande = new THREE.MeshStandardMaterial({ color: 0x6f7a55, roughness: 1, flatShading: true });
  const falaise = new THREE.MeshStandardMaterial({ color: 0x8a8273, roughness: 1, flatShading: true });
  const reliefs = [[-2600, 520, 70], [-1700, 640, 95], [-800, 520, 60], [0, 760, 110], [900, 600, 80], [1800, 700, 100], [2700, 560, 65]];
  for (const [x, l, h] of reliefs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), lande);
    m.scale.set(l * k, h * k, 230 * k);
    m.position.set(x * k, -h * 0.25 * k, z * k);
    const f = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), falaise);
    f.scale.set(l * 0.8 * k, h * 0.55 * k, 60 * k);
    f.position.set(x * k, 0, (z + 170) * k);
    g.add(m, f);
  }
  return g;
}

/**
 * Dissuasion océanique : un SNLE en patrouille, en plongée (SNLE 3G s'il est
 * en service dans la partie), un SNA qui protège sa patrouille, une FREMM
 * anti-sous-marine et son Caïman Marine à sonar trempé, et le bâtiment
 * d'essais et de mesures Monge, au large des côtes du Finistère.
 * Commandes : trappes des missiles, tir d'essai d'un M51 (éjection à froid,
 * sortie de l'eau, allumage du premier étage, montée et basculement vers
 * l'Atlantique), sonar trempé.
 * donnees : { snle3g: booléen, nom: nom du SNLE }
 * Navires à la même échelle, distances resserrées ; missile agrandi en vol.
 */
export function construireDissuasion(THREE, { donnees = null } = {}) {
  const k = 0.05;
  const racine = new THREE.Group();
  const P = (x, y, z) => new THREE.Vector3(x * k, y * k, z * k);
  const legendes = [];
  const animations = [];

  // SNLE en plongée : axe à 30 m sous la surface, cap vers x négatif
  const nouveau = !!donnees?.snle3g;
  const snle = nouveau ? construireSnle3G(THREE) : construireSnle(THREE);
  const s = 0.1; // échelle propre des modèles de SNLE (1/10)
  const f = k / s;
  const conteneurSnle = new THREE.Group();
  conteneurSnle.add(snle);
  conteneurSnle.scale.setScalar(f);
  conteneurSnle.position.y = -30 * k + 0.15 * f; // l'axe de la coque est à y = -0,15 dans le modèle
  racine.add(conteneurSnle);
  const trappes = snle.userData.trappes ?? [];
  if (snle.userData.missile) snle.userData.missile.visible = false;
  const nom = donnees?.nom ?? (nouveau ? 'L\'Invincible (SNLE 3G)' : 'Le Téméraire');
  legendes.push({ texte: `SNLE ${nom} en patrouille, à une trentaine de mètres de profondeur`, point: P(0, 4, 0) });
  legendes.push({ texte: '16 tubes de missiles M51, derrière le kiosque', point: P(nouveau ? 0 : -3, -12, 14) });

  // SNA d'escorte : il « nettoie » la zone et protège la patrouille
  const sna = navireDuGroupe(THREE, 'sna', k);
  sna.conteneur.position.set(-300 * k, sna.conteneur.position.y - 22 * k, 190 * k);
  racine.add(sna.conteneur);
  legendes.push({ texte: 'SNA (classe Suffren) : il protège la patrouille contre les sous-marins adverses', point: P(-300, 2, 190) });

  // FREMM anti-sous-marine, son sillage, son Caïman Marine
  const fremm = navireDuGroupe(THREE, 'fremm', k);
  fremm.conteneur.position.set(-430 * k, fremm.conteneur.position.y, -300 * k);
  racine.add(fremm.conteneur);
  const sf = sillage(THREE, fremm.d.L, fremm.d.B);
  sf.scale.setScalar(k);
  sf.position.set((-430 + fremm.d.L / 2) * k, 1.5 * k, -300 * k);
  racine.add(sf);
  if (fremm.objet.userData.animer) animations.push(fremm.objet);
  const helico = caimanAsm(THREE, k, racine, -560, -210);
  legendes.push({ texte: 'FREMM anti-sous-marine (sonar remorqué)', point: P(-430, 40, -300) });
  legendes.push({ texte: 'Caïman Marine : sonar trempé', point: P(-560, 95, -210) });

  // Monge : il suit le tir (radars de trajectographie, télémesure)
  const monge = navireDuGroupe(THREE, 'monge', k);
  monge.conteneur.position.set(620 * k, monge.conteneur.position.y, -560 * k);
  monge.conteneur.rotation.y = 0.5;
  racine.add(monge.conteneur);
  legendes.push({ texte: 'Bâtiment d\'essais et de mesures Monge : il suit le missile', point: P(620, 50, -560) });

  // Côtes du Finistère à l'horizon
  racine.add(cote(THREE, k, -2300));
  legendes.push({ texte: 'Côtes du Finistère (essais au large de la baie d\'Audierne)', point: P(-800, 90, -2200) });

  // Mer un peu transparente : on devine les sous-marins sous la surface
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: 0x174a72, roughness: 0.4, metalness: 0, envMapIntensity: 0.3, transparent: true, opacity: 0.62 }));
  mer.rotation.x = -Math.PI / 2;
  mer.position.y = -0.01;
  mer.receiveShadow = true;
  mer.renderOrder = 1;
  racine.add(mer);

  // Missile, bulles, gerbe d'eau et panache
  const { groupe: m51, flamme } = missileM51(THREE);
  m51.visible = false;
  racine.add(m51);
  racine.updateMatrixWorld(true);
  const iTube = Math.min(6, Math.max(0, trappes.length - 1));
  const t0 = trappes[iTube];
  const depart = t0 ? t0.parent.localToWorld(new THREE.Vector3(t0.position.x, t0.position.y, (t0.userData.cote ?? 1) * 2.0 * s)) : P(0, -22, 2);
  const mBulle = new THREE.MeshStandardMaterial({ color: 0xe8f3ff, roughness: 0.2, transparent: true, opacity: 0.55, depthWrite: false });
  const bulles = Array.from({ length: 24 }, () => { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mBulle); b.visible = false; racine.add(b); return b; });
  const gerbe = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.3, 1, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4f8fb, roughness: 0.9, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  gerbe.visible = false;
  const anneau = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  anneau.rotation.x = -Math.PI / 2;
  anneau.visible = false;
  anneau.renderOrder = 3;
  racine.add(gerbe, anneau);
  const mFumee = new THREE.MeshStandardMaterial({ color: 0xf1f1ef, roughness: 1, transparent: true, depthWrite: false });
  const fumees = Array.from({ length: 110 }, () => { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), mFumee.clone()); b.visible = false; racine.add(b); return { b, ne: -1, x: 0, y: 0, z: 0 }; });
  let prochaine = 0;

  racine.userData.legendes = legendes;
  racine.userData.taille = 14;
  racine.userData.mer = true;
  racine.userData.brume = [0xc9dcec, 45, 190];
  racine.userData.m51 = m51; // missile du tir d'essai (tests)
  racine.userData.commandes = [
    { id: 'trappes', libelle: 'Ouvrir les trappes des missiles', actif: 'Fermer les trappes' },
    { id: 'tir', type: 'action', libelle: '🚀 Tir d\'essai d\'un M51 (simulation)', requiert: 'trappes', aide: 'Ouvrez d\'abord les trappes' },
    { id: 'sonar', libelle: 'Tremper le sonar (lutte anti-sous-marine)', actif: 'Remonter le sonar' },
  ];
  let tir = null;
  racine.userData.animer = (t, api = {}) => {
    helico.animer(t, !!api.sonar);
    for (const o of animations) o.userData.animer(t, {});
    // Trappes : ouverture progressive
    const cible = api.trappes ? 1.75 : 0;
    for (const tr of trappes) {
      tr.userData.angle += (cible - tr.userData.angle) * 0.08;
      tr.rotation.x = tr.userData.cote * tr.userData.angle;
    }
    if (api.tir && tir === null && api.trappes) { tir = t; prochaine = 0; }
    api.tir = false;
    monge.objet.userData.animer?.(t, { suivre: tir !== null });
    const d = tir === null ? -1 : (t - tir) / 1000;
    const surface = 0;
    let pos = null, inclinaison = 0, echelle = 1.6;
    if (d >= 0) {
      if (d < 1.8) {
        // Éjection à froid : un générateur de gaz pousse le missile hors du tube, jusqu'à la surface
        const u = d / 1.8;
        pos = new THREE.Vector3(depart.x, depart.y + (surface + 0.15 - depart.y) * (u * u * (3 - 2 * u)), depart.z);
      } else if (d < 2.5) {
        // Il jaillit de l'eau, presque à l'arrêt, puis le premier étage s'allume
        const u = (d - 1.8) / 0.7;
        pos = new THREE.Vector3(depart.x, surface + 0.15 + 1.1 * Math.sin(u * Math.PI / 2), depart.z);
      } else {
        // Montée accélérée, puis basculement progressif vers le large (x négatif)
        const u = d - 2.5;
        const h = 1.25 + 0.8 * u * u + 1.2 * u;
        inclinaison = Math.min(0.75, Math.max(0, (u - 1.2) * 0.25));
        const deport = Math.max(0, u - 1.2) ** 2;
        pos = new THREE.Vector3(depart.x - deport, surface + h, depart.z);
        echelle = 1.6 + Math.min(2.4, u * 0.8); // agrandi en vol pour rester visible
      }
    }
    const enVol = pos && d < 15;
    m51.visible = !!enVol;
    if (enVol) {
      m51.position.copy(pos);
      m51.rotation.set(0, 0, inclinaison);
      m51.scale.setScalar(k * echelle);
      flamme.visible = d >= 2.45;
      if (flamme.visible) flamme.scale.set(1 + Math.sin(t / 30) * 0.08, 1 + Math.sin(t / 45) * 0.15, 1);
    }
    // Bulles pendant l'éjection
    bulles.forEach((b, i) => {
      const u = d - i * 0.06;
      b.visible = d >= 0 && d < 3 && u > 0 && u < 1.6;
      if (b.visible) {
        const y = Math.min(-0.02, depart.y + u * 1.3);
        b.position.set(depart.x + Math.sin(i * 2.1) * 0.12, y, depart.z + Math.cos(i * 1.7) * 0.12);
        b.scale.setScalar(k * (0.6 + (i % 4) * 0.25));
      }
    });
    // Gerbe et anneau d'écume à la sortie de l'eau
    const g = d - 1.75;
    gerbe.visible = anneau.visible = d >= 0 && g > 0 && g < 4;
    if (gerbe.visible) {
      gerbe.position.set(depart.x, (0.5 + g * 0.6) * k * 6, depart.z);
      gerbe.scale.set((3 + g * 4) * k * 1.6, (2 + g * 10) * k * 1.4, (3 + g * 4) * k * 1.6);
      gerbe.material.opacity = 0.7 * Math.max(0, 1 - g / 2.2);
      anneau.position.set(depart.x, 0.02, depart.z);
      anneau.scale.setScalar((4 + g * 22) * k);
      anneau.material.opacity = 0.75 * Math.max(0, 1 - g / 4);
    }
    // Panache du premier étage : bouffées émises sous la tuyère, qui grossissent et se dissipent
    if (enVol && d >= 2.45) {
      while (prochaine <= d) {
        const libre = fumees.find((x) => x.ne < 0) ?? fumees.reduce((a, b) => (a.ne < b.ne ? a : b));
        const queue = new THREE.Vector3(0, -1.2, 0).applyEuler(m51.rotation).multiplyScalar(k * echelle).add(m51.position);
        Object.assign(libre, { ne: prochaine, x: queue.x, y: queue.y, z: queue.z });
        prochaine += d < 7.5 ? 0.07 : 0.3; // panache dense au départ, plus lâche une fois le missile hors de vue
      }
    }
    for (const fu of fumees) {
      if (fu.ne < 0) continue;
      const age = d - fu.ne;
      if (d < 0 || age > 14) { fu.ne = -1; fu.b.visible = false; continue; }
      fu.b.visible = age >= 0;
      fu.b.position.set(fu.x + age * 0.05, fu.y + age * 0.01, fu.z + age * 0.02);
      fu.b.scale.setScalar((0.22 + Math.sqrt(age) * 0.42) * (fu.y > 1.2 ? 1 : 1.5));
      fu.b.material.opacity = 0.82 * Math.max(0, 1 - age / 14);
    }
    if (d > 28) { tir = null; m51.visible = false; for (const fu of fumees) { fu.ne = -1; fu.b.visible = false; } }
  };
  racine.userData.animer(0, {});
  return racine;
}
