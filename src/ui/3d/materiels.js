/**
 * Matériels de l'armée de Terre et de l'espace en 3D (three.js), aux
 * dimensions réelles quand elles sont publiques : canon Caesar MkII,
 * véhicules du programme SCORPION (Griffon, Jaguar), drone tactique
 * Patroller, satellite d'observation (silhouette indicative).
 *
 * Repère : x vers l'arrière (l'avant en x négatif), y vers le haut, z vers la
 * gauche du véhicule. Unité : le mètre, puis mise à l'échelle de la scène.
 * userData.commandes : boutons proposés par la visionneuse (bascules et
 * actions), lus à chaque image par userData.animer(t, api).
 */
import { textureCamouflage, profilExtrude, pieces, tronc, loft, surface, cocarde } from './modeles.js';

const vert = (THREE) => new THREE.MeshStandardMaterial({ color: 0x4a5332, roughness: 0.8, metalness: 0.15 });
const noir = (THREE) => new THREE.MeshStandardMaterial({ color: 0x161716, roughness: 0.75, metalness: 0.25 });
const vitre = (THREE) => new THREE.MeshStandardMaterial({ color: 0x18232c, roughness: 0.08, metalness: 0.85 });

/** Roue de véhicule à roues : pneu, jante, moyeu (axe selon z). */
function roue(THREE, r, largeur, pneu, jante) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largeur, 28), pneu);
  p.rotation.x = Math.PI / 2;
  const sculptures = new THREE.Mesh(new THREE.TorusGeometry(r - 0.02, 0.05, 6, 28), pneu);
  const j = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, largeur + 0.02, 18), jante);
  j.rotation.x = Math.PI / 2;
  const moyeu = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r * 0.22, largeur + 0.1, 10), jante);
  moyeu.rotation.x = Math.PI / 2;
  g.add(p, sculptures, j, moyeu);
  return g;
}

/** Vitre plaquée sur un pan incliné allant de (x1, y1) à (x2, y2), de largeur l, centrée en z. */
function vitreInclinee(THREE, [x1, y1], [x2, y2], l, z, materiau, marge = 0.12) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, L - 2 * marge, l), materiau);
  m.position.set((x1 + x2) / 2 - (dy / L) * 0.075, (y1 + y2) / 2 + (dx / L) * 0.075, z);
  m.rotation.z = -Math.atan2(dx, dy);
  return m;
}

/** Pose un engin au sol de la visionneuse (sol en y = -2,2) et le centre ; renvoie le groupe et la fonction de légende. */
function poser(THREE, objet, k, xMin, xMax, y0 = -2.2) {
  const ox = -((xMin + xMax) / 2) * k;
  objet.scale.setScalar(k);
  objet.position.set(ox, y0, 0);
  objet.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const groupe = new THREE.Group();
  groupe.add(objet);
  const p = (x, y, z) => new THREE.Vector3(x * k + ox, y * k + y0, z * k);
  return { groupe, p };
}

/** Fumée de tir : quelques bouffées qui grossissent et s'estompent. */
function bouffees(THREE, parent, n = 5) {
  const liste = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshStandardMaterial({ color: 0xcfcac0, transparent: true, opacity: 0, roughness: 1, depthWrite: false }));
    m.visible = false;
    parent.add(m);
    liste.push(m);
  }
  return liste;
}

/** Peinture unie légèrement patinée (sable, brun) en texture procédurale. */
function textureUnie(THREE, base) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  let g = 13;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 2200; k++) { ctx.fillStyle = h() > 0.5 ? 'rgba(255,245,230,0.07)' : 'rgba(40,30,20,0.08)'; ctx.fillRect(h() * 256, h() * 256, 1 + h() * 3, 1 + h() * 3); }
  for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '230,215,190' : '70,55,40'},0.035)`; ctx.beginPath(); ctx.arc(h() * 256, h() * 256, 12 + h() * 34, 0, Math.PI * 2); ctx.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.4, 0.4);
  return t;
}

/** Crampons de pneu tout-terrain (chevrons) pour la bande de roulement. */
function textureCrampons(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#26272a';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#121314';
  for (let i = 0; i < 32; i++) {
    const x = i * 16;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 7, 0); ctx.lineTo(x + 12, 30); ctx.lineTo(x + 5, 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 5, 34); ctx.lineTo(x + 12, 34); ctx.lineTo(x + 7, 64); ctx.lineTo(x, 64); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  return t;
}

/** Roue tout-terrain : pneu à crampons, flanc, jante peinte creusée, moyeu et couronne de goujons. */
function roueTT(THREE, r, largeur, mats) {
  const g = new THREE.Group();
  const pneu = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largeur, 40, 1), [mats.bande, mats.flanc, mats.flanc]);
  pneu.rotation.x = Math.PI / 2;
  const bourrelet = new THREE.Mesh(new THREE.TorusGeometry(r - 0.06, 0.07, 8, 36), mats.flanc);
  bourrelet.position.z = largeur / 2 - 0.03;
  const bourrelet2 = bourrelet.clone();
  bourrelet2.position.z = -largeur / 2 + 0.03;
  const jante = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, largeur - 0.04, 24), mats.jante);
  jante.rotation.x = Math.PI / 2;
  const moyeu = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.26, largeur + 0.06, 16), mats.jante);
  moyeu.rotation.x = Math.PI / 2;
  const goujons = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    for (const s of [-1, 1]) goujons.push([Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, s * (largeur / 2 + 0.005), 0.045, 0.045, 0.04]);
  }
  g.add(pneu, bourrelet, bourrelet2, jante, moyeu, pieces(THREE, mats.goujon, goujons));
  return g;
}

/** Matériaux de roues partagés par un véhicule. */
function materiauxRoues(THREE, peinture) {
  return {
    bande: new THREE.MeshStandardMaterial({ map: textureCrampons(THREE), roughness: 0.95 }),
    flanc: new THREE.MeshStandardMaterial({ color: 0x1f2022, roughness: 0.92 }),
    jante: peinture,
    goujon: new THREE.MeshStandardMaterial({ color: 0x3b3a37, metalness: 0.6, roughness: 0.4 }),
  };
}

/** Panneau de classe de pont (disque jaune et chiffre noir) à l'avant des véhicules militaires. */
function classePont(THREE, n) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2c81e'; ctx.beginPath(); ctx.arc(32, 32, 31, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold 34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 32, 35);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
}

/** Change la livrée (couleur des photos ou camouflage centre-Europe) d'après la commande « camouflage ». */
function livree(peinture, textures) {
  let etat = false;
  return (api) => {
    const v = !!api.camouflage;
    if (v !== etat) { etat = v; peinture.map = v ? textures.camo : textures.photo; peinture.needsUpdate = true; }
  };
}

/**
 * Canon Caesar MkII, d'après le rendu de KNDS et Arquus : cabine blindée
 * Arquus à pare-brise incliné, capot en pointe et quatre portes, canon de
 * 155 mm / 52 calibres posé sur la cabine en route (frein de bouche à double
 * chicane bien en avant), berceau et deux freins de recul au-dessus du tube,
 * coffres à munitions et rambardes, bêche arrière relevée, antennes, livrée
 * brune. Commandes : mise en batterie (la bêche descend, le tube bascule
 * vers l'arrière à 45°), tir simulé (recul, flamme, fumée), camouflage.
 */
export function construireCaesar(THREE) {
  const c = new THREE.Group();
  const textures = { photo: textureUnie(THREE, '#4f4645'), camo: textureCamouflage(THREE) };
  const peinture = new THREE.MeshStandardMaterial({ map: textures.photo, roughness: 0.85, metalness: 0.08, envMapIntensity: 0.45 });
  const sombre = noir(THREE), verre = vitre(THREE);
  const roues = materiauxRoues(THREE, peinture);

  // Châssis, plate-forme arrière, garde-boue
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.32, 1.0), sombre);
  chassis.position.set(-0.1, 0.92, 0);
  c.add(chassis);
  c.add(profilExtrude(THREE, [[-2.2, 1.06], [4.45, 1.06], [4.45, 1.42], [-2.2, 1.42]], 2.5, peinture, 0.03));
  for (const z of [-1, 1]) c.add(pieces(THREE, sombre, [[1.8, 1.36, z * 1.02, 2.8, 0.08, 0.55], [-3.7, 1.38, z * 1.06, 1.4, 0.08, 0.5]]));
  // Cabine blindée Arquus : capot en pointe, pare-brise incliné, toit plat, deux portes par côté
  c.add(profilExtrude(THREE, [[-4.95, 1.0], [-2.25, 1.0], [-2.25, 2.95], [-3.75, 2.95], [-4.3, 2.12], [-4.9, 1.92], [-5.05, 1.45]], 2.5, peinture, 0.06));
  const bec = profilExtrude(THREE, [[-5.1, 1.42], [-4.3, 1.62], [-4.3, 2.08], [-4.92, 1.9]], 1.5, peinture, 0.03);
  c.add(bec);
  for (const z of [-0.6, 0.6]) c.add(vitreInclinee(THREE, [-4.3, 2.12], [-3.75, 2.95], 1.05, z, verre, 0.1));
  for (const cote of [-1, 1]) {
    // Vitres des portes avant et arrière, joints de portes, poignées, marchepieds
    c.add(pieces(THREE, verre, [[-3.55, 2.42, cote * 1.27, 0.62, 0.55, 0.04], [-2.75, 2.48, cote * 1.27, 0.42, 0.42, 0.04]]));
    c.add(pieces(THREE, sombre, [
      [-3.12, 1.95, cote * 1.27, 0.03, 1.9, 0.03], [-2.3, 1.95, cote * 1.27, 0.03, 1.9, 0.03], [-3.95, 1.85, cote * 1.27, 0.03, 1.7, 0.03],
      [-3.4, 1.72, cote * 1.28, 0.2, 0.05, 0.04], [-2.6, 1.72, cote * 1.28, 0.2, 0.05, 0.04],
      [-3.2, 0.98, cote * 1.32, 1.5, 0.06, 0.26], [-3.2, 0.62, cote * 1.32, 1.3, 0.05, 0.22],
      [-4.15, 1.45, cote * 1.27, 0.5, 0.05, 0.03], [-4.0, 1.3, cote * 1.27, 0.5, 0.05, 0.03],
    ]));
    const bras = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.35), sombre);
    bras.position.set(-4.25, 2.55, cote * 1.42);
    const miroir = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.24), sombre);
    miroir.position.set(-4.25, 2.42, cote * 1.62);
    const phare = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2efe2, emissive: 0x2a2820, roughness: 0.2 }));
    phare.position.set(-5.08, 1.18, cote * 0.82);
    c.add(bras, miroir, phare);
  }
  // Calandre, pare-chocs, crochets, plaque, classe de pont
  c.add(pieces(THREE, sombre, [[-5.12, 1.05, 0, 0.18, 0.32, 2.4], ...[0, 1, 2, 3].map((i) => [-5.07, 1.55 + i * 0.09, 0, 0.03, 0.04, 0.95]), [-5.18, 0.95, -0.6, 0.12, 0.12, 0.12], [-5.18, 0.95, 0.6, 0.12, 0.12, 0.12]]));
  const pont = classePont(THREE, 21);
  pont.position.set(-5.13, 1.75, -0.95);
  pont.rotation.y = -Math.PI / 2;
  c.add(pont);
  // Six roues : essieu avant sous la cabine, tandem arrière
  for (const x of [-3.7, 1.05, 2.55]) for (const z of [-1, 1]) {
    const r = roueTT(THREE, 0.58, 0.44, roues);
    r.position.set(x, 0.58, z * 1.04);
    c.add(r);
  }
  // Coffres à munitions et équipements derrière la cabine, rambardes
  for (const z of [-0.75, 0.75]) {
    const coffre = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.8, 0.95), peinture);
    coffre.position.set(-0.8, 1.82, z);
    c.add(coffre);
  }
  c.add(pieces(THREE, sombre, [[-0.8, 1.82, 1.23, 2.6, 0.02, 0.02], [-0.8, 1.6, 1.23, 2.6, 0.02, 0.02], [-1.5, 1.82, 1.23, 0.03, 0.75, 0.02], [-0.1, 1.82, 1.23, 0.03, 0.75, 0.02], [-0.8, 1.82, -1.23, 2.6, 0.02, 0.02], [-0.8, 1.6, -1.23, 2.6, 0.02, 0.02]]));
  const rambarde = [];
  for (const z of [-1.2, 1.2]) {
    rambarde.push([-0.8, 2.6, z, 2.7, 0.05, 0.05]);
    for (const x of [-2.1, -0.8, 0.5]) rambarde.push([x, 2.42, z, 0.05, 0.38, 0.05]);
  }
  c.add(pieces(THREE, peinture, rambarde));
  // Affût arrière : couronne, flasques, tourillons
  const socle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.7), peinture);
  socle.position.set(2.75, 1.66, 0);
  c.add(socle);
  for (const z of [-0.52, 0.52]) {
    const flasque = profilExtrude(THREE, [[2.0, 1.88], [3.5, 1.88], [3.15, 3.4], [2.35, 3.4]], 0.14, peinture, 0.02);
    flasque.position.z = z;
    c.add(flasque);
  }
  // Ensemble basculant : berceau, deux freins de recul au-dessus du tube, culasse, tube, frein de bouche
  const pivot = new THREE.Group();
  pivot.position.set(2.75, 3.25, 0);
  c.add(pivot);
  const masse = new THREE.Group();
  pivot.add(masse);
  const berceau = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 0.66), peinture);
  berceau.position.x = -1.2;
  pivot.add(berceau);
  for (const z of [-0.17, 0.17]) {
    const frein = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.3, 14), peinture);
    frein.rotation.z = Math.PI / 2;
    frein.position.set(-1.6, 0.3, z);
    const tete = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 14), sombre);
    tete.rotation.z = Math.PI / 2;
    tete.position.set(-3.25, 0.3, z);
    pivot.add(frein, tete);
  }
  const culasse = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), peinture);
  culasse.position.x = 0.55;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.125, 7.6, 22), peinture);
  tube.rotation.z = Math.PI / 2;
  tube.position.x = -4.1;
  const manchon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 22), peinture);
  manchon.rotation.z = Math.PI / 2;
  manchon.position.x = -0.6;
  const bouche = new THREE.Group();
  bouche.position.x = -8.1;
  for (const [x, r, l] of [[0, 0.19, 0.2], [-0.3, 0.19, 0.2], [-0.15, 0.13, 0.12], [0.16, 0.13, 0.14]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 18), peinture);
    b.rotation.z = Math.PI / 2;
    b.position.x = x;
    bouche.add(b);
  }
  for (const s of [-1, 1]) bouche.add(pieces(THREE, sombre, [[0, 0, s * 0.19, 0.12, 0.2, 0.02], [-0.3, 0, s * 0.19, 0.12, 0.2, 0.02]]));
  masse.add(culasse, tube, manchon, bouche);
  const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 }));
  flamme.position.x = -8.7;
  flamme.visible = false;
  masse.add(flamme);
  // Verrou de route : berceau en U sur le toit de la cabine
  c.add(pieces(THREE, peinture, [[-2.55, 3.05, 0, 0.3, 0.2, 0.55], [-2.55, 3.2, -0.22, 0.3, 0.2, 0.08], [-2.55, 3.2, 0.22, 0.3, 0.2, 0.08]]));
  // Antennes : deux fouets et un mât épais sur la cabine
  for (const [x, z, h, r] of [[-2.45, 1.05, 2.6, 0.012], [-3.9, 1.05, 2.4, 0.012], [-2.6, -0.95, 1.2, 0.05]]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 8), r > 0.03 ? peinture : sombre);
    a.position.set(x, 2.95 + h / 2, z);
    c.add(a);
  }
  // Bêche arrière à dents (stabilisation au tir)
  const beche = new THREE.Group();
  beche.position.set(4.5, 1.2, 0);
  const lame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 2.0), peinture);
  lame.position.y = -0.82;
  const renfort = pieces(THREE, peinture, [[-0.12, -0.8, -0.5, 0.12, 1.5, 0.1], [-0.12, -0.8, 0.5, 0.12, 1.5, 0.1]]);
  const dents = pieces(THREE, sombre, [-0.75, -0.38, 0, 0.38, 0.75].map((z) => [0, -1.68, z, 0.12, 0.14, 0.16]));
  beche.add(lame, renfort, dents);
  c.add(beche);
  c.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xa31d1d, roughness: 0.4 }), [[4.47, 1.27, -1.1, 0.04, 0.1, 0.2], [4.47, 1.27, 1.1, 0.04, 0.1, 0.2]]));

  const { groupe, p } = poser(THREE, c, 1.2, -5.2, 4.6);
  const fumee = bouffees(THREE, groupe, 6);
  groupe.userData.legendes = [
    { texte: 'Canon de 155 mm (52 calibres)', point: p(-3.5, 3.5, 0) },
    { texte: 'Cabine blindée Arquus à quatre portes', point: p(-3.3, 3.0, 1.3) },
    { texte: 'Freins de recul', point: p(1.0, 3.7, 0.2) },
    { texte: 'Coffres à munitions (18 coups)', point: p(-0.8, 2.3, 1.25) },
    { texte: 'Châssis 6×6 (460 ch)', point: p(1.8, 0.6, 1.3) },
    { texte: 'Bêche arrière (stabilisation au tir)', point: p(4.6, 2.6, 0) },
  ];
  groupe.userData.commandes = [
    { id: 'batterie', libelle: 'Mettre en batterie', actif: 'Position de route' },
    { id: 'tirCanon', type: 'action', libelle: '💥 Tir (simulation)', requiert: 'batterie', aide: 'Mettez d\'abord le canon en batterie' },
    { id: 'camouflage', libelle: 'Camouflage centre-Europe', actif: 'Livrée brune' },
  ];
  const peindre = livree(peinture, textures);
  let f = 0, tir = null;
  const v = new THREE.Vector3();
  groupe.userData.animer = (t, api) => {
    peindre(api);
    f += ((api.batterie ? 1 : 0) - f) * 0.035;
    // En route, le tube est posé sur la cabine ; en batterie, il bascule vers l'arrière à 45° de hausse
    pivot.rotation.z = -f * (Math.PI * 0.75);
    beche.rotation.z = Math.PI * 0.9 - f * (Math.PI * 0.9 - 0.7);
    if (api.tirCanon && !tir && f > 0.97) { tir = t; api.tirCanon = false; }
    else if (api.tirCanon && !api.batterie) api.tirCanon = false;
    if (tir) {
      const d = (t - tir) / 1000;
      masse.position.x = d < 0.08 ? (d / 0.08) * 0.9 : Math.max(0, 0.9 * (1 - (d - 0.08) / 1.1));
      flamme.visible = d < 0.14;
      flamme.scale.setScalar(0.6 + d * 8);
      if (d < 0.05) {
        flamme.getWorldPosition(v);
        groupe.worldToLocal(v);
        fumee.forEach((b, i) => { b.position.copy(v); b.userData.depart = d + i * 0.06; b.userData.dir = new THREE.Vector3(0.6 + Math.random() * 0.6, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8); });
      }
      fumee.forEach((b) => {
        const u = d - (b.userData.depart ?? 0);
        b.visible = u > 0 && u < 3;
        if (b.visible) {
          b.scale.setScalar(0.4 + u * 1.3);
          b.material.opacity = Math.max(0, 0.55 * (1 - u / 3));
          b.position.addScaledVector(b.userData.dir, 0.012);
        }
      });
      if (d > 3.2) { tir = null; fumee.forEach((b) => { b.visible = false; }); }
    }
  };
  groupe.userData.taille = 14;
  return groupe;
}

/**
 * Véhicule blindé multirôle Griffon (6×6), d'après une photo de l'armée de
 * Terre : capot moteur à grilles, grand pare-brise blindé en deux parties,
 * caisse haute aux flancs droits, porte du conducteur vitrée, essieu avant et
 * tandem arrière à gros pneus à crampons, tourelleau téléopéré avec couronne
 * de lance-pots, mât et antennes, filet de camouflage roulé sur le toit,
 * porte arrière, livrée sable. Commandes : porte arrière, tourelleau,
 * camouflage.
 */
export function construireGriffon(THREE) {
  const c = new THREE.Group();
  const textures = { photo: textureUnie(THREE, '#8c765f'), camo: textureCamouflage(THREE) };
  const peinture = new THREE.MeshStandardMaterial({ map: textures.photo, roughness: 0.88, metalness: 0.06, envMapIntensity: 0.45 });
  const sombre = noir(THREE), verre = vitre(THREE);
  const roues = materiauxRoues(THREE, peinture);

  // Caisse basse en V (protection contre les mines)
  const v = new THREE.Shape([[0, 0.5], [0.95, 0.74], [1.22, 1.25], [-1.22, 1.25], [-0.95, 0.74]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoV = new THREE.ExtrudeGeometry(v, { depth: 7.4, bevelEnabled: false });
  geoV.rotateY(Math.PI / 2);
  geoV.translate(-3.75, 0, 0);
  c.add(new THREE.Mesh(geoV, peinture));
  // Caisse haute : flancs presque droits, arête de toit chanfreinée
  const sec = new THREE.Shape([[-1.24, 1.2], [1.24, 1.2], [1.24, 2.78], [1.1, 2.98], [-1.1, 2.98], [-1.24, 2.78]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoSec = new THREE.ExtrudeGeometry(sec, { depth: 6.0, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
  geoSec.rotateY(Math.PI / 2);
  geoSec.translate(-2.2, 0, 0);
  c.add(new THREE.Mesh(geoSec, peinture));
  // Capot moteur incliné et face avant, pare-brise blindé presque vertical
  c.add(profilExtrude(THREE, [[-3.9, 0.78], [-2.15, 0.78], [-2.15, 2.0], [-2.3, 2.02], [-3.75, 1.72], [-3.95, 1.55]], 2.44, peinture, 0.05));
  c.add(profilExtrude(THREE, [[-2.35, 1.95], [-2.0, 1.95], [-1.95, 2.98], [-2.12, 2.98]], 2.44, peinture, 0.03));
  for (const z of [-0.55, 0.55]) c.add(vitreInclinee(THREE, [-2.33, 2.03], [-2.1, 2.9], 1.0, z, verre, 0.06));
  c.add(pieces(THREE, sombre, [
    // Grilles du capot, calandre, pare-chocs, crochets
    [-3.0, 1.9, -0.55, 0.8, 0.03, 0.7], [-3.0, 1.9, 0.55, 0.8, 0.03, 0.7],
    ...[0, 1, 2, 3].map((i) => [-3.97, 1.0 + i * 0.12, 0, 0.03, 0.05, 1.3]),
    [-4.0, 0.88, 0, 0.18, 0.22, 2.3], [-4.05, 0.82, -0.7, 0.12, 0.12, 0.12], [-4.05, 0.82, 0.7, 0.12, 0.12, 0.12],
  ]));
  const pont = classePont(THREE, 20);
  pont.position.set(-3.82, 1.66, -0.82);
  pont.rotation.set(0, -Math.PI / 2, 0);
  pont.rotation.x = 0;
  c.add(pont);
  for (const cote of [-1, 1]) {
    // Feux avant doubles, rétroviseurs, porte du conducteur vitrée, épiscopes, garde-boue
    c.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xf2efe2, emissive: 0x2a2820, roughness: 0.2 }), [[-3.97, 1.42, cote * 0.82, 0.04, 0.1, 0.1], [-3.97, 1.42, cote * 0.98, 0.04, 0.1, 0.1]]));
    c.add(pieces(THREE, sombre, [[-2.3, 2.75, cote * 1.42, 0.06, 0.5, 0.26], [-2.25, 2.95, cote * 1.3, 0.04, 0.04, 0.3]]));
    c.add(pieces(THREE, verre, [[-1.75, 2.35, cote * 1.255, 0.55, 0.5, 0.03], [-0.35, 2.55, cote * 1.255, 0.18, 0.12, 0.03], [0.05, 2.55, cote * 1.255, 0.18, 0.12, 0.03]]));
    c.add(pieces(THREE, sombre, [[-1.4, 2.0, cote * 1.255, 0.03, 1.5, 0.03], [-2.12, 2.0, cote * 1.255, 0.03, 1.5, 0.03], [-1.55, 1.75, cote * 1.27, 0.2, 0.05, 0.04]]));
    c.add(pieces(THREE, peinture, [[-2.4, 1.32, cote * 1.12, 1.4, 0.07, 0.52], [1.8, 1.32, cote * 1.12, 2.7, 0.07, 0.52], [-0.45, 1.45, cote * 1.28, 1.6, 0.4, 0.1]]));
    // Lance-pots fumigènes sur le toit, poignées
    c.add(pieces(THREE, sombre, [0, 1, 2].map((i) => [-0.4 + i * 0.22, 3.04, cote * 0.95, 0.14, 0.14, 0.18])));
  }
  // Six roues : essieu avant, tandem arrière
  for (const x of [-2.6, 1.05, 2.55]) for (const z of [-1, 1]) {
    const r = roueTT(THREE, 0.62, 0.46, roues);
    r.position.set(x, 0.62, z * 1.02);
    c.add(r);
  }
  // Porte arrière (charnière côté droit) avec hublot, marchepied
  const charniere = new THREE.Group();
  charniere.position.set(3.82, 2.0, -0.6);
  const porte = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.55, 1.2), peinture);
  porte.position.z = 0.6;
  const hublot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.25), verre);
  hublot.position.set(0.05, 0.35, 0.6);
  charniere.add(porte, hublot);
  c.add(charniere);
  const interieur = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.5, 1.15), new THREE.MeshStandardMaterial({ color: 0x2b2d2a, roughness: 0.9 }));
  interieur.position.set(3.79, 2.0, 0);
  c.add(interieur, pieces(THREE, sombre, [[3.92, 0.95, 0, 0.35, 0.06, 1.1]]));
  // Tourelleau téléopéré (mitrailleuse, viseur) sur couronne de lance-pots
  const tourelleau = new THREE.Group();
  tourelleau.position.set(-1.45, 2.98, -0.25);
  const couronne = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.22, 20), peinture);
  couronne.position.y = 0.11;
  const pots = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; pots.push([Math.cos(a) * 0.5, 0.3, Math.sin(a) * 0.5, 0.12, 0.12, 0.12]); }
  const corps = tronc(THREE, 0.8, 0.45, 0.72, 0.72, 0.62, peinture);
  corps.position.y = 0.6;
  const viseur = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.26), peinture);
  viseur.position.set(-0.08, 0.98, 0.3);
  const objectif = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.16), verre);
  objectif.position.set(-0.26, 0.98, 0.3);
  const mitrailleuse = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), sombre);
  mitrailleuse.rotation.z = Math.PI / 2;
  mitrailleuse.position.set(-0.85, 0.66, -0.05);
  const caisseMun = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.22), peinture);
  caisseMun.position.set(0.15, 0.62, -0.42);
  tourelleau.add(couronne, pieces(THREE, sombre, pots), corps, viseur, objectif, mitrailleuse, caisseMun);
  c.add(tourelleau);
  // Mât épais, antennes fouets, filet de camouflage roulé à l'arrière du toit
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.9, 10), sombre);
  mat.position.set(-0.85, 3.93, 0.55);
  c.add(mat);
  for (const [x, z, h] of [[-0.6, 0.95, 1.9], [0.0, -0.95, 1.7], [3.4, 0.85, 2.0], [3.4, -0.85, 1.6]]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.015, h, 6), sombre);
    a.position.set(x, 2.98 + h / 2, z);
    c.add(a);
  }
  const toileFilet = document.createElement('canvas');
  toileFilet.width = toileFilet.height = 128;
  const cf = toileFilet.getContext('2d');
  cf.fillStyle = '#6e5a42'; cf.fillRect(0, 0, 128, 128);
  cf.strokeStyle = '#c9b48d'; cf.lineWidth = 3;
  for (let i = -128; i < 256; i += 12) { cf.beginPath(); cf.moveTo(i, 0); cf.lineTo(i + 128, 128); cf.stroke(); cf.beginPath(); cf.moveTo(i + 128, 0); cf.lineTo(i, 128); cf.stroke(); }
  const texFilet = new THREE.CanvasTexture(toileFilet);
  texFilet.colorSpace = THREE.SRGBColorSpace;
  texFilet.wrapS = texFilet.wrapT = THREE.RepeatWrapping;
  texFilet.repeat.set(3, 2);
  const filet = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 1.9), new THREE.MeshStandardMaterial({ map: texFilet, roughness: 1 }));
  filet.position.set(2.6, 3.35, 0);
  filet.rotation.y = 0.02;
  c.add(filet, pieces(THREE, new THREE.MeshStandardMaterial({ color: 0x6d5a40, roughness: 1 }), [[2.6, 3.36, 0, 1.52, 0.04, 1.92], [2.6, 3.36, 0, 0.04, 0.77, 1.92], [2.2, 3.36, 0, 0.04, 0.77, 1.92], [3.0, 3.36, 0, 0.04, 0.77, 1.92]]));

  const { groupe, p } = poser(THREE, c, 1.45, -4.05, 3.95);
  groupe.userData.legendes = [
    { texte: 'Tourelleau téléopéré', point: p(-1.45, 4.0, -0.25) },
    { texte: 'Pare-brise blindé', point: p(-2.2, 2.6, 0) },
    { texte: 'Caisse en V (protection contre les mines)', point: p(0, 0.55, 1.0) },
    { texte: 'Filet de camouflage', point: p(2.6, 3.8, 0) },
    { texte: 'Porte arrière : 8 fantassins', point: p(3.85, 2.2, 0) },
  ];
  groupe.userData.commandes = [
    { id: 'porte', libelle: 'Ouvrir la porte arrière', actif: 'Fermer la porte arrière' },
    { id: 'veille', libelle: 'Faire pivoter le tourelleau', actif: 'Tourelleau en veille' },
    { id: 'camouflage', libelle: 'Camouflage centre-Europe', actif: 'Livrée sable' },
  ];
  const peindre = livree(peinture, textures);
  let ouverture = 0, angle = 0;
  groupe.userData.animer = (t, api) => {
    peindre(api);
    ouverture += ((api.porte ? 1 : 0) - ouverture) * 0.06;
    charniere.rotation.y = -ouverture * 1.75;
    angle += ((api.veille ? 1.2 * Math.sin(t / 1500) : 0) - angle) * 0.05;
    tourelleau.rotation.y = angle;
  };
  groupe.userData.taille = 14;
  return groupe;
}

/**
 * Engin blindé de reconnaissance et de combat Jaguar (6×6), d'après une photo
 * de l'armée de Terre : caisse basse à facettes, nez en pointe avec bandeau de
 * phares, essieu avant et tandem arrière, tourelle à canon de 40 mm CTA
 * décalé à droite, caisson du lanceur de missiles MMP sur le flanc gauche
 * (il se dresse, capot ouvert), grappes de lance-pots, viseur panoramique,
 * tourelleau, antennes, sacoches, livrée brune. Commandes : rotation de la
 * tourelle, déploiement du lanceur MMP, camouflage.
 */
export function construireJaguar(THREE) {
  const c = new THREE.Group();
  const textures = { photo: textureUnie(THREE, '#584c44'), camo: textureCamouflage(THREE) };
  const peinture = new THREE.MeshStandardMaterial({ map: textures.photo, roughness: 0.85, metalness: 0.08, envMapIntensity: 0.45 });
  const sombre = noir(THREE), verre = vitre(THREE);
  const roues = materiauxRoues(THREE, peinture);

  // Caisse basse en V et caisse haute à flancs inclinés
  const v = new THREE.Shape([[0, 0.55], [0.95, 0.75], [1.25, 1.2], [-1.25, 1.2], [-0.95, 0.75]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoV = new THREE.ExtrudeGeometry(v, { depth: 6.6, bevelEnabled: false });
  geoV.rotateY(Math.PI / 2);
  geoV.translate(-3.1, 0, 0);
  c.add(new THREE.Mesh(geoV, peinture));
  const sec = new THREE.Shape([[-1.3, 1.15], [1.3, 1.15], [1.3, 1.5], [1.1, 1.92], [-1.1, 1.92], [-1.3, 1.5]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoSec = new THREE.ExtrudeGeometry(sec, { depth: 5.6, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
  geoSec.rotateY(Math.PI / 2);
  geoSec.translate(-2.1, 0, 0);
  c.add(new THREE.Mesh(geoSec, peinture));
  // Nez en pointe : glacis supérieur, bandeau des phares, pan inférieur rentrant
  c.add(profilExtrude(THREE, [[-3.15, 0.75], [-2.05, 0.75], [-2.05, 1.92], [-2.4, 1.92], [-3.55, 1.62], [-3.62, 1.35], [-3.45, 1.0]], 2.55, peinture, 0.05));
  c.add(pieces(THREE, sombre, [[-3.6, 1.45, -0.72, 0.04, 0.16, 0.7], [-3.6, 1.45, 0.72, 0.04, 0.16, 0.7]]));
  c.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xf2efe2, emissive: 0x2a2820, roughness: 0.2 }), [[-3.63, 1.45, -0.55, 0.03, 0.08, 0.1], [-3.63, 1.45, -0.85, 0.03, 0.08, 0.1], [-3.63, 1.45, 0.55, 0.03, 0.08, 0.1], [-3.63, 1.45, 0.85, 0.03, 0.08, 0.1]]));
  const pont = classePont(THREE, 28);
  pont.position.set(-3.6, 1.52, -1.05);
  pont.rotation.y = -Math.PI / 2;
  c.add(pont);
  // Poste de pilotage : épiscopes devant le conducteur
  c.add(vitreInclinee(THREE, [-2.55, 1.84], [-2.2, 1.92], 0.7, 0.3, verre, 0.03));
  for (const cote of [-1, 1]) {
    // Pans inclinés au-dessus des roues, garde-boue, sacoches noires, feux latéraux orange
    const pan = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.5, 0.1), peinture);
    pan.position.set(-0.1, 1.4, cote * 1.36);
    pan.rotation.x = -cote * 0.4;
    c.add(pan);
    c.add(pieces(THREE, peinture, [[-2.3, 1.18, cote * 1.2, 1.5, 0.06, 0.5], [1.15, 1.18, cote * 1.2, 2.8, 0.06, 0.5]]));
    c.add(pieces(THREE, sombre, [[-0.6, 1.52, cote * 1.47, 0.32, 0.36, 0.12], [2.5, 1.52, cote * 1.47, 0.32, 0.36, 0.12], [3.0, 1.52, cote * 1.47, 0.32, 0.36, 0.12]]));
    c.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xe0802a, emissive: 0x3a1a00, roughness: 0.4 }), [[-1.7, 1.2, cote * 1.33, 0.1, 0.05, 0.04], [1.9, 1.2, cote * 1.33, 0.1, 0.05, 0.04]]));
  }
  c.add(pieces(THREE, sombre, [[-3.5, 0.95, 0, 0.15, 0.25, 2.2], [2.6, 1.94, -0.6, 1.0, 0.03, 0.8], [2.6, 1.94, 0.6, 1.0, 0.03, 0.8]]));
  // Six roues : essieu avant, tandem arrière
  for (const x of [-2.3, 0.4, 1.95]) for (const z of [-1, 1]) {
    const r = roueTT(THREE, 0.6, 0.46, roues);
    r.position.set(x, 0.6, z * 1.1);
    c.add(r);
  }

  // Tourelle (pivot sur la couronne) : corps à facettes, nuque haute, canon décalé à droite
  const tourelle = new THREE.Group();
  tourelle.position.set(0.35, 1.92, 0);
  const dessus = [[-1.15, -1.0], [-1.15, 0.55], [-0.75, 0.8], [1.55, 0.8], [1.75, 0.55], [1.75, -1.0], [1.5, -1.15], [-0.95, -1.15]];
  const geoT = new THREE.ExtrudeGeometry(new THREE.Shape(dessus.map(([x, z]) => new THREE.Vector2(x, z))), { depth: 0.66, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1 });
  geoT.rotateX(-Math.PI / 2);
  const corpsT = new THREE.Mesh(geoT, peinture);
  corpsT.position.y = 0.06;
  tourelle.add(corpsT);
  // Caisson du lanceur MMP sur le flanc gauche (plus haut que la tourelle), capot articulé
  const caisson = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.86, 0.5), peinture);
  caisson.position.set(0.55, 0.45, 1.05);
  tourelle.add(caisson);
  const lanceur = new THREE.Group();
  lanceur.position.set(0.55, 0.5, 1.05);
  const support = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), peinture);
  support.position.y = 0.0;
  const tubes = new THREE.Group();
  tubes.position.y = 0.42;
  const boite = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.45), peinture);
  const fonds = pieces(THREE, sombre, [[-0.71, 0.13, 0, 0.02, 0.22, 0.22], [-0.71, -0.15, 0, 0.02, 0.22, 0.22]]);
  const camera = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), verre);
  camera.rotation.z = Math.PI / 2;
  camera.position.set(-0.75, 0.38, 0);
  const capotPivot = new THREE.Group();
  capotPivot.position.set(0.7, 0.32, 0);
  const capot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.55), peinture);
  capot.position.x = -0.8;
  capotPivot.add(capot);
  tubes.add(boite, fonds, camera, capotPivot);
  lanceur.add(support, tubes);
  tourelle.add(lanceur);
  // Masque et canon de 40 mm CTA (manchon, tube, embout de bouche)
  const masque = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.62), peinture);
  masque.position.set(-1.3, 0.4, -0.3);
  const manchon = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.2, 16), peinture);
  manchon.rotation.z = Math.PI / 2;
  manchon.position.set(-2.1, 0.42, -0.3);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.2, 14), peinture);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(-3.75, 0.42, -0.3);
  const bouche = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.2, 14), peinture);
  bouche.rotation.z = Math.PI / 2;
  bouche.position.set(-4.9, 0.42, -0.3);
  const radarBouche = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), sombre);
  radarBouche.position.set(-4.92, 0.28, -0.3);
  tourelle.add(masque, manchon, tube, bouche, radarBouche);
  // Grappes de lance-pots fumigènes aux angles avant
  for (const [z, s] of [[0.55, 1], [-1.0, -1]]) {
    const liste = [];
    for (let i = 0; i < 4; i++) liste.push([-0.95, 0.35 + i * 0.12, z + s * (0.1 + i * 0.04), 0.3, 0.1, 0.1]);
    tourelle.add(pieces(THREE, sombre, liste));
  }
  // Viseur panoramique du chef, tourelleau téléopéré, antennes
  const paseo = new THREE.Group();
  paseo.position.set(-0.1, 0.72, 0.15);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 14), peinture);
  pied.position.y = 0.21;
  const tete = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.42), peinture);
  tete.position.y = 0.56;
  const fenetre = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.28), verre);
  fenetre.position.set(-0.22, 0.58, 0);
  paseo.add(pied, tete, fenetre);
  const rws = new THREE.Group();
  rws.position.set(0.7, 0.72, -0.55);
  const couronne = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.28, 18), peinture);
  couronne.position.y = 0.14;
  const rwsCorps = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.5), peinture);
  rwsCorps.position.y = 0.44;
  const optro = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.24, 0.2), peinture);
  optro.position.set(-0.05, 0.72, 0.15);
  const objectif = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.12), verre);
  objectif.position.set(-0.19, 0.72, 0.15);
  const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), sombre);
  mg.rotation.z = Math.PI / 2;
  mg.position.set(-0.6, 0.5, -0.05);
  rws.add(couronne, rwsCorps, optro, objectif, mg);
  tourelle.add(paseo, rws);
  for (const [x, z, h] of [[1.55, 0.45, 2.2], [1.5, -0.85, 1.8]]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.015, h, 6), sombre);
    a.position.set(x, 0.72 + h / 2, z);
    tourelle.add(a);
  }
  c.add(tourelle);

  const { groupe, p } = poser(THREE, c, 1.45, -4.6, 3.6);
  groupe.userData.legendes = [
    { texte: 'Canon de 40 mm CTA', point: p(-3.3, 2.6, -0.3) },
    { texte: 'Lanceur de missiles MMP (4 000 m)', point: p(0.9, 3.4, 1.1) },
    { texte: 'Viseur panoramique du chef', point: p(0.25, 3.3, 0.15) },
    { texte: 'Tourelleau téléopéré', point: p(1.05, 3.3, -0.55) },
    { texte: 'Lance-pots fumigènes', point: p(-0.6, 2.5, -1.1) },
    { texte: 'Essieu avant et tandem arrière', point: p(1.2, 0.6, 1.4) },
  ];
  groupe.userData.commandes = [
    { id: 'pivoter', libelle: 'Faire pivoter la tourelle', actif: 'Tourelle en veille' },
    { id: 'missiles', libelle: 'Déployer les missiles MMP', actif: 'Replier les missiles' },
    { id: 'camouflage', libelle: 'Camouflage centre-Europe', actif: 'Livrée brune' },
  ];
  const peindre = livree(peinture, textures);
  let angle = 0, d = 0;
  groupe.userData.animer = (t, api) => {
    peindre(api);
    angle += ((api.pivoter ? 0.8 * Math.sin(t / 1400) : 0) - angle) * 0.05;
    tourelle.rotation.y = angle;
    d += ((api.missiles ? 1 : 0) - d) * 0.05;
    // Replié dans son caisson ; déployé : il se dresse au-dessus de la tourelle, capot relevé
    lanceur.position.y = 0.5 + d * 0.75;
    tubes.rotation.z = -d * 0.15;
    capotPivot.rotation.z = -d * 0.9;
  };
  groupe.userData.taille = 14;
  return groupe;
}

/**
 * Drone tactique Patroller (Safran), dérivé d'un motoplaneur : envergure
 * 18 m, longueur 8,5 m, hélice à l'avant, empennage en T, boule optronique
 * sous le fuselage, nacelles sous les ailes. Représenté en vol. Commande :
 * balayage de la boule optronique.
 */
export function construirePatroller(THREE) {
  const d = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.5, metalness: 0.2 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x5d646b, roughness: 0.6, metalness: 0.3 });
  const sombre = noir(THREE), verre = vitre(THREE);

  // Fuselage (nez en x = 0) : ancien habitacle bombé, poutre arrière effilée
  d.add(new THREE.Mesh(loft(THREE, [
    { x: 0.15, w: 0.2, hHaut: 0.12, hBas: 0.12, y: 0, n: 2 },
    { x: 0.5, w: 0.62, hHaut: 0.3, hBas: 0.32, y: 0, n: 2.2 },
    { x: 1.3, w: 1.05, hHaut: 0.5, hBas: 0.42, y: 0.02, n: 2.4 },
    { x: 2.2, w: 1.12, hHaut: 0.62, hBas: 0.42, y: 0.05, n: 2.4 },
    { x: 3.2, w: 0.92, hHaut: 0.48, hBas: 0.38, y: 0.05, n: 2.3 },
    { x: 4.3, w: 0.5, hHaut: 0.3, hBas: 0.26, y: 0.1, n: 2.1 },
    { x: 6.0, w: 0.28, hHaut: 0.18, hBas: 0.16, y: 0.14, n: 2 },
    { x: 8.0, w: 0.18, hHaut: 0.14, hBas: 0.12, y: 0.16, n: 2 },
    { x: 8.45, w: 0.08, hHaut: 0.06, hBas: 0.06, y: 0.17, n: 2 },
  ], { segments: 36, parSegment: 6 }), gris));
  // Capot opaque à la place de la verrière
  const capot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), grisFonce);
  capot.scale.set(1.9, 0.5, 1);
  capot.position.set(2.0, 0.5, 0);
  d.add(capot);
  // Ailes : 18 m d'envergure, léger dièdre, cocardes
  for (const cote of [-1, 1]) {
    const aile = new THREE.Group();
    const pts = [[2.55, 0.4], [2.95, 9.0], [3.35, 9.0], [3.55, 0.4]].map(([x, z]) => [x, z * cote]);
    aile.add(new THREE.Mesh(surface(THREE, pts, 0.12, { biseau: 0.03 }), gris));
    aile.rotation.x = -cote * 0.05;
    aile.position.y = 0.05;
    const cc = cocarde(THREE, 0.32);
    cc.rotation.x = -Math.PI / 2;
    cc.position.set(3.15, 0.1, cote * 7.6);
    aile.add(cc);
    // Nacelle sous l'aile (capteurs)
    const nacelle = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 1.1, 6, 12), grisFonce);
    nacelle.rotation.z = Math.PI / 2;
    nacelle.position.set(2.9, -0.22, cote * 2.6);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.04), grisFonce);
    mat.position.set(3.0, -0.1, cote * 2.6);
    aile.add(nacelle, mat);
    d.add(aile);
    const cf = cocarde(THREE, 0.18);
    cf.position.set(5.2, 0.15, cote * 0.2);
    cf.rotation.y = cote > 0 ? 0 : Math.PI;
    d.add(cf);
  }
  // Empennage en T
  d.add(new THREE.Mesh(surface(THREE, [[7.0, 0], [7.85, 1.45], [8.3, 1.45], [8.35, 0]], 0.08, { plan: 'xy', biseau: 0.02 }), gris).translateY(0.15));
  const stab = new THREE.Mesh(surface(THREE, [[7.75, -1.5], [8.25, -1.5], [8.3, 1.5], [7.75, 1.5]], 0.07, { biseau: 0.02 }), gris);
  stab.position.y = 1.6;
  d.add(stab);
  // Hélice tripale à l'avant, cône et disque de rotation
  const helice = new THREE.Group();
  helice.position.set(0.02, 0, 0);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.35, 16), grisFonce);
  cone.rotation.z = Math.PI / 2;
  cone.position.x = -0.12;
  helice.add(cone);
  for (let i = 0; i < 3; i++) {
    const pale = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.85, 0.11), sombre);
    pale.position.y = 0.45;
    const bras = new THREE.Group();
    bras.rotation.x = (i * Math.PI * 2) / 3;
    bras.add(pale);
    helice.add(bras);
  }
  d.add(helice);
  // Boule optronique sous le nez
  const boule = new THREE.Group();
  boule.position.set(1.15, -0.45, 0);
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12), grisFonce);
  support.position.y = 0.12;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), grisFonce);
  sphere.position.y = -0.1;
  const optique = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), verre);
  optique.position.set(-0.235, -0.12, 0);
  optique.rotation.y = -Math.PI / 2;
  boule.add(support, sphere, optique);
  d.add(boule);
  // Antennes
  d.add(pieces(THREE, grisFonce, [[3.6, 0.48, 0, 0.3, 0.2, 0.03], [4.4, -0.28, 0, 0.25, 0.18, 0.03]]));

  const k = 0.74;
  d.scale.setScalar(k);
  d.position.set(-4.2 * k, 0.6, 0);
  d.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const vol = new THREE.Group();
  vol.add(d);
  const groupe = new THREE.Group();
  groupe.add(vol);
  const p = (x, y, z) => new THREE.Vector3(x * k - 4.2 * k, y * k + 0.6, z * k);
  groupe.userData.legendes = [
    { texte: 'Boule optronique (jour et nuit)', point: p(1.15, -0.7, 0) },
    { texte: 'Envergure : 18 m', point: p(3.1, 0.2, 8.5) },
    { texte: 'Hélice à l\'avant', point: p(-0.1, 0.5, 0) },
    { texte: 'Nacelle de capteurs', point: p(2.9, -0.4, -2.6) },
    { texte: 'Empennage en T', point: p(8.0, 1.8, 0) },
  ];
  groupe.userData.commandes = [{ id: 'balayer', libelle: 'Balayer avec la boule optronique', actif: 'Boule optronique fixe' }];
  let cap = 0;
  groupe.userData.animer = (t, api) => {
    helice.rotation.x = t / 25;
    vol.position.y = Math.sin(t / 900) * 0.18;
    vol.rotation.x = Math.sin(t / 1300) * 0.05;
    cap += ((api.balayer ? 1.2 * Math.sin(t / 1100) : 0) - cap) * 0.05;
    boule.rotation.y = cap;
  };
  groupe.userData.taille = 14;
  return groupe;
}

/** Feuille d'isolation dorée (MLI) en texture procédurale. */
function textureMli(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c99a3a';
  ctx.fillRect(0, 0, 256, 256);
  let g = 3;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 160; k++) {
    ctx.fillStyle = h() > 0.5 ? `rgba(255,230,160,${0.15 + h() * 0.25})` : `rgba(110,70,15,${0.1 + h() * 0.25})`;
    ctx.beginPath();
    const x = h() * 256, y = h() * 256;
    ctx.moveTo(x, y); ctx.lineTo(x + 20 + h() * 40, y + h() * 20 - 10); ctx.lineTo(x + h() * 30, y + 15 + h() * 30);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cellules solaires (bleu nuit, quadrillage). */
function textureCellules(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#16264d';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(170,190,230,0.45)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Terre vue de l'orbite : océans, continents et nuages procéduraux. */
function textureTerre(THREE) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1d4f86';
  ctx.fillRect(0, 0, 1024, 512);
  let g = 17;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  const tache = (couleur, n, r0) => {
    ctx.fillStyle = couleur;
    for (let k = 0; k < n; k++) {
      const x = h() * 1024, y = 60 + h() * 392, r = r0 * (0.5 + h());
      ctx.beginPath();
      for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2, rr = r * (0.6 + 0.6 * h()); ctx.lineTo(x + Math.cos(t) * rr * 1.5, y + Math.sin(t) * rr); }
      ctx.fill();
    }
  };
  tache('#4f7a3a', 22, 50);
  tache('#8a7a4a', 10, 30);
  tache('rgba(255,255,255,0.55)', 40, 28);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Satellite d'observation militaire (type CSO) en orbite basse, silhouette
 * indicative : corps sous isolation dorée, télescope tourné vers la Terre,
 * deux ailes de panneaux solaires, antenne de transmission, viseurs
 * d'étoiles. Commande : replier ou déployer les panneaux.
 */
export function construireSatellite(THREE) {
  const groupe = new THREE.Group();
  const sat = new THREE.Group();
  const mli = new THREE.MeshStandardMaterial({ map: textureMli(THREE), roughness: 0.35, metalness: 0.7 });
  const blanc = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.5, metalness: 0.1 });
  const sombre = noir(THREE);
  const cellules = new THREE.MeshStandardMaterial({ map: textureCellules(THREE), roughness: 0.25, metalness: 0.6, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.35, metalness: 0.8 });

  const corps = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.8, 6), mli);
  sat.add(corps);
  const radiateur = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.16, 0.12, 6), blanc);
  radiateur.position.y = 1.45;
  sat.add(radiateur);
  // Télescope (pare-soleil) tourné vers la Terre
  const baffle = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.75, 1.6, 28, 1, true), blanc);
  baffle.position.y = -2.2;
  const interieurB = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.72, 1.58, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1, side: THREE.BackSide }));
  interieurB.position.y = -2.2;
  const miroir = new THREE.Mesh(new THREE.CircleGeometry(0.7, 28), new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.05, metalness: 1 }));
  miroir.rotation.x = Math.PI / 2;
  miroir.position.y = -1.45;
  sat.add(baffle, interieurB, miroir);
  // Antenne de transmission et viseurs d'étoiles
  const parabole = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 8, 0, Math.PI * 2, 0, 0.9), blanc);
  parabole.rotation.x = Math.PI;
  parabole.position.set(0.9, -1.55, 0.5);
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), metal);
  mat.position.set(0.9, -1.3, 0.5);
  sat.add(parabole, mat);
  sat.add(pieces(THREE, sombre, [[-0.7, 1.0, 0.9, 0.3, 0.3, 0.3], [-0.95, 1.0, 0.55, 0.3, 0.3, 0.3]]));
  // Deux ailes de trois panneaux solaires
  const ailes = [];
  for (const cote of [-1, 1]) {
    const aile = new THREE.Group();
    aile.position.set(0, 0.3, cote * 1.05);
    const bras = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), metal);
    bras.rotation.x = Math.PI / 2;
    bras.position.z = cote * 0.4;
    aile.add(bras);
    const panneaux = [];
    for (let i = 0; i < 3; i++) {
      const pn = new THREE.Group();
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 2.0), cellules);
      plaque.position.z = cote * 1.0;
      const cadre = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.06, 0.06), metal);
      cadre.position.z = cote * 2.0;
      pn.add(plaque, cadre);
      aile.add(pn);
      panneaux.push(pn);
    }
    sat.add(aile);
    ailes.push({ aile, panneaux, cote });
  }
  sat.rotation.z = 0.25;
  groupe.add(sat);

  // La Terre en contrebas, son atmosphère et des étoiles
  const terre = new THREE.Mesh(new THREE.SphereGeometry(70, 64, 32), new THREE.MeshStandardMaterial({ map: textureTerre(THREE), roughness: 0.9 }));
  terre.position.set(0, -86, -30);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(71.5, 64, 32), new THREE.MeshBasicMaterial({ color: 0x3d7fd9, transparent: true, opacity: 0.45, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  atmosphere.position.copy(terre.position);
  groupe.add(terre, atmosphere);
  const etoiles = [];
  let gr = 9;
  const h = () => { gr = (gr * 16807) % 2147483647; return gr / 2147483647; };
  for (let i = 0; i < 600; i++) {
    const th = h() * Math.PI * 2, ph = Math.acos(2 * h() - 1), r = 250;
    etoiles.push(r * Math.sin(ph) * Math.cos(th), Math.abs(r * Math.cos(ph)) * 0.9 + 10, r * Math.sin(ph) * Math.sin(th));
  }
  const geoE = new THREE.BufferGeometry();
  geoE.setAttribute('position', new THREE.Float32BufferAttribute(etoiles, 3));
  groupe.add(new THREE.Points(geoE, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false })));
  sat.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  groupe.userData.legendes = [
    { texte: 'Télescope (vers la Terre)', point: new THREE.Vector3(0.6, -2.9, 0) },
    { texte: 'Panneaux solaires', point: new THREE.Vector3(0, 0.8, 5.2) },
    { texte: 'Isolation thermique (feuille dorée)', point: new THREE.Vector3(1.1, 0.4, 0) },
    { texte: 'Antenne de transmission des images', point: new THREE.Vector3(1.2, -1.8, 0.6) },
  ];
  groupe.userData.commandes = [{ id: 'replier', libelle: 'Replier les panneaux', actif: 'Déployer les panneaux' }];
  let f = 1;
  groupe.userData.animer = (t, api) => {
    f += ((api.replier ? 0 : 1) - f) * 0.04;
    for (const { panneaux, cote } of ailes) {
      // Accordéon : les panneaux se déplient l'un après l'autre
      panneaux.forEach((pn, i) => {
        pn.position.z = cote * (0.8 + i * 2.0 * f);
        pn.position.y = (1 - f) * (i % 2 ? 0.06 : 0) - (1 - f) * i * 0.07;
        pn.rotation.x = 0;
      });
    }
    terre.rotation.y = t / 60000;
  };
  groupe.userData.taille = 12;
  return groupe;
}

