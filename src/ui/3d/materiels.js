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

/**
 * Canon Caesar MkII : camion 6×6 Arquus à cabine blindée (quatre portes),
 * canon de 155 mm / 52 calibres monté à l'arrière, tube posé sur la cabine
 * en route, bêche arrière. Commandes : mise en batterie (la bêche descend,
 * le tube bascule vers l'arrière à 45°) et tir simulé (recul, flamme, fumée).
 */
export function construireCaesar(THREE) {
  const c = new THREE.Group();
  const camo = new THREE.MeshStandardMaterial({ map: textureCamouflage(THREE), roughness: 0.85, metalness: 0.08 });
  const kaki = vert(THREE), sombre = noir(THREE), verre = vitre(THREE);
  const pneu = new THREE.MeshStandardMaterial({ color: 0x1b1b1a, roughness: 0.95 });

  // Châssis, plate-forme arrière, garde-boue
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.32, 1.0), sombre);
  chassis.position.set(0, 0.9, 0);
  c.add(chassis);
  c.add(profilExtrude(THREE, [[-2.25, 1.05], [4.45, 1.05], [4.45, 1.4], [-2.25, 1.4]], 2.5, camo, 0.03));
  for (const z of [-1, 1]) {
    const gb = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.55), sombre);
    gb.position.set(1.85, 1.33, z * 1.0);
    c.add(gb);
  }
  // Cabine blindée : pare-brise incliné, quatre portes, rétroviseurs, pare-chocs et phares
  const cabine = [[-4.7, 0.95], [-2.3, 0.95], [-2.3, 2.95], [-3.85, 2.95], [-4.5, 2.1], [-4.7, 1.9]];
  c.add(profilExtrude(THREE, cabine, 2.5, camo, 0.06));
  for (const z of [-0.58, 0.58]) c.add(vitreInclinee(THREE, [-4.5, 2.1], [-3.85, 2.95], 1.0, z, verre));
  for (const cote of [-1, 1]) {
    for (const [x1, x2] of [[-3.95, -3.25], [-3.05, -2.5]]) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.55, 0.04), verre);
      v.position.set((x1 + x2) / 2, 2.45, cote * 1.26);
      c.add(v);
    }
    c.add(pieces(THREE, sombre, [[-3.15, 1.75, cote * 1.26, 0.03, 1.6, 0.03], [-2.38, 1.75, cote * 1.26, 0.03, 1.6, 0.03], [-4.0, 1.75, cote * 1.26, 0.03, 1.4, 0.03], [-3.5, 1.65, cote * 1.27, 0.18, 0.05, 0.04], [-2.75, 1.65, cote * 1.27, 0.18, 0.05, 0.04]]));
    const bras = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.3), sombre);
    bras.position.set(-4.35, 2.4, cote * 1.38);
    const miroir = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.22), sombre);
    miroir.position.set(-4.35, 2.3, cote * 1.55);
    const phare = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2efe2, emissive: 0x2a2820, roughness: 0.2 }));
    phare.position.set(-4.73, 1.55, cote * 0.85);
    // Marchepieds
    const marche = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.25), sombre);
    marche.position.set(-3.2, 0.95, cote * 1.3);
    c.add(bras, miroir, phare, marche);
  }
  const parechoc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 2.4), sombre);
  parechoc.position.set(-4.75, 1.15, 0);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 1.3), sombre);
  grille.position.set(-4.72, 1.6, 0);
  // Verrou de route du tube sur le toit de la cabine
  const verrou = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.5), sombre);
  verrou.position.set(-3.45, 3.06, 0);
  c.add(parechoc, grille, verrou);

  // Six roues (essieu avant sous la cabine, tandem arrière)
  for (const x of [-3.55, 1.15, 2.6]) for (const z of [-1, 1]) {
    const r = roue(THREE, 0.56, 0.42, pneu, kaki);
    r.position.set(x, 0.56, z * 1.04);
    c.add(r);
  }
  // Coffres à munitions (18 coups) et équipements derrière la cabine
  for (const z of [-0.78, 0.78]) {
    const coffre = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.75, 0.85), camo);
    coffre.position.set(-0.85, 1.78, z);
    c.add(coffre);
  }
  c.add(pieces(THREE, kaki, [[-0.85, 2.17, 0, 2.62, 0.04, 2.45]]), pieces(THREE, sombre, [[-2.1, 1.78, 0, 0.04, 0.6, 2.4], [-0.85, 1.78, 1.21, 2.5, 0.03, 0.03], [-0.85, 1.78, -1.21, 2.5, 0.03, 0.03]]));
  const bidon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 14), kaki);
  bidon.rotation.z = Math.PI / 2;
  bidon.position.set(0.6, 1.62, 1.05);
  c.add(bidon);

  // Affût arrière : socle, flasques, tourillons à 3,2 m de haut
  const socle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.6), camo);
  socle.position.set(3.3, 1.62, 0);
  c.add(socle);
  for (const z of [-0.5, 0.5]) {
    const flasque = profilExtrude(THREE, [[2.75, 1.84], [3.85, 1.84], [3.6, 3.35], [3.0, 3.35]], 0.14, kaki, 0.02);
    flasque.position.z = z;
    c.add(flasque);
  }
  // Ensemble basculant : berceau, freins de recul, culasse, tube de 8 m, frein de bouche
  const pivot = new THREE.Group();
  pivot.position.set(3.3, 3.2, 0);
  c.add(pivot);
  const masse = new THREE.Group(); // recule pendant le tir
  pivot.add(masse);
  const berceau = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 0.62), kaki);
  berceau.position.x = -0.95;
  pivot.add(berceau);
  for (const z of [-0.2, 0.2]) {
    const frein = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 10), sombre);
    frein.rotation.z = Math.PI / 2;
    frein.position.set(-0.9, 0.25, z);
    pivot.add(frein);
  }
  const culasse = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.46, 0.46), kaki);
  culasse.position.x = 0.55;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 7.2, 20), kaki);
  tube.rotation.z = Math.PI / 2;
  tube.position.x = -3.75;
  const manchon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 20), kaki);
  manchon.rotation.z = Math.PI / 2;
  manchon.position.x = -0.6;
  const bouche = new THREE.Group();
  bouche.position.x = -7.55;
  for (const [x, r, l] of [[0, 0.17, 0.16], [-0.24, 0.17, 0.16], [-0.12, 0.12, 0.1]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 16), sombre);
    b.rotation.z = Math.PI / 2;
    b.position.x = x;
    bouche.add(b);
  }
  masse.add(culasse, tube, manchon, bouche);
  // Flamme de bouche
  const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 }));
  flamme.position.x = -8.1;
  flamme.visible = false;
  masse.add(flamme);
  // Bêche arrière (stabilisation au tir)
  const beche = new THREE.Group();
  beche.position.set(4.5, 1.15, 0);
  const lame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.9), camo);
  lame.position.y = -0.8;
  const dents = pieces(THREE, sombre, [-0.7, -0.35, 0, 0.35, 0.7].map((z) => [0, -1.62, z, 0.1, 0.12, 0.14]));
  const verins = pieces(THREE, sombre, [[-0.25, -0.35, -0.6, 0.08, 0.8, 0.08], [-0.25, -0.35, 0.6, 0.08, 0.8, 0.08]]);
  beche.add(lame, dents, verins);
  c.add(beche);
  // Feux arrière et plaques
  c.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xa31d1d, roughness: 0.4 }), [[4.47, 1.25, -1.1, 0.04, 0.1, 0.2], [4.47, 1.25, 1.1, 0.04, 0.1, 0.2]]));

  const { groupe, p } = poser(THREE, c, 1.28, -4.8, 4.6);
  const fumee = bouffees(THREE, groupe, 6);
  groupe.userData.legendes = [
    { texte: 'Canon de 155 mm (52 calibres)', point: p(-1.5, 3.4, 0) },
    { texte: 'Cabine blindée à quatre portes', point: p(-3.5, 3.0, 1.3) },
    { texte: 'Coffres à munitions (18 coups)', point: p(-0.85, 2.2, 1.2) },
    { texte: 'Châssis 6×6 Arquus (460 ch)', point: p(1.9, 0.6, 1.3) },
    { texte: 'Bêche arrière (stabilisation au tir)', point: p(4.6, 0.5, 0) },
  ];
  groupe.userData.commandes = [
    { id: 'batterie', libelle: 'Mettre en batterie', actif: 'Position de route' },
    { id: 'tirCanon', type: 'action', libelle: '💥 Tir (simulation)', requiert: 'batterie', aide: 'Mettez d\'abord le canon en batterie' },
  ];
  let f = 0, tir = null;
  const v = new THREE.Vector3();
  groupe.userData.animer = (t, api) => {
    f += ((api.batterie ? 1 : 0) - f) * 0.035;
    // Le tube bascule de l'avant (route, posé sur la cabine) vers l'arrière, à 45° de hausse
    pivot.rotation.z = -f * (Math.PI * 0.75);
    beche.rotation.z = Math.PI * 0.9 - f * (Math.PI * 0.9 - 0.7);
    if (api.tirCanon && !tir && f > 0.97) { tir = t; api.tirCanon = false; }
    else if (api.tirCanon && f <= 0.97 && !api.batterie) api.tirCanon = false;
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
 * Véhicule blindé multirôle Griffon (6×6) : caisse en V, cabine à grand
 * pare-brise blindé, compartiment des fantassins, porte arrière, tourelleau
 * téléopéré, lance-pots fumigènes, détecteur de tirs. Commandes : ouvrir la
 * porte arrière, faire pivoter le tourelleau.
 */
export function construireGriffon(THREE) {
  const c = new THREE.Group();
  const camo = new THREE.MeshStandardMaterial({ map: textureCamouflage(THREE), roughness: 0.85, metalness: 0.08 });
  const kaki = vert(THREE), sombre = noir(THREE), verre = vitre(THREE);
  const pneu = new THREE.MeshStandardMaterial({ color: 0x1b1b1a, roughness: 0.95 });

  // Caisse basse en V (protection contre les mines), extrudée sur la longueur
  const v = new THREE.Shape([[0, 0.48], [1.0, 0.72], [1.22, 1.25], [-1.22, 1.25], [-1.0, 0.72]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoV = new THREE.ExtrudeGeometry(v, { depth: 7.3, bevelEnabled: false });
  geoV.rotateY(Math.PI / 2);
  geoV.translate(-3.7, 0, 0);
  c.add(new THREE.Mesh(geoV, camo));
  // Compartiment arrière aux flancs inclinés
  const sec = new THREE.Shape([[-1.24, 1.2], [1.24, 1.2], [1.2, 2.45], [0.98, 2.95], [-0.98, 2.95], [-1.2, 2.45]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoSec = new THREE.ExtrudeGeometry(sec, { depth: 5.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
  geoSec.rotateY(Math.PI / 2);
  geoSec.translate(-1.6, 0, 0);
  c.add(new THREE.Mesh(geoSec, camo));
  // Avant : capot moteur et cabine au pare-brise incliné
  c.add(profilExtrude(THREE, [[-3.85, 0.75], [-1.55, 0.75], [-1.55, 2.95], [-1.95, 2.95], [-2.8, 2.08], [-3.85, 1.72]], 2.38, camo, 0.05));
  for (const z of [-0.52, 0.52]) c.add(vitreInclinee(THREE, [-2.8, 2.08], [-1.95, 2.95], 0.95, z, verre, 0.1));
  for (const cote of [-1, 1]) {
    // Vitres latérales de la cabine et petits hublots du compartiment
    const vl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.04), verre);
    vl.position.set(-2.05, 2.35, cote * 1.2);
    c.add(vl);
    for (const x of [0.2, 1.4, 2.6]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.04), verre);
      h.position.set(x, 2.3, cote * 1.215);
      h.rotation.x = cote * 0.03;
      c.add(h);
    }
    // Coffres de rangement et garde-boue
    const coffre = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.25), camo);
    coffre.position.set(-0.6, 1.5, cote * 1.33);
    c.add(coffre);
    c.add(pieces(THREE, sombre, [[-2.35, 1.3, cote * 1.18, 1.3, 0.06, 0.4], [1.3, 1.3, cote * 1.18, 2.4, 0.06, 0.4]]));
    // Phares, rétroviseurs
    const phare = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.32), new THREE.MeshStandardMaterial({ color: 0xf2efe2, emissive: 0x2a2820, roughness: 0.2 }));
    phare.position.set(-3.87, 1.45, cote * 0.85);
    const miroir = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.2), sombre);
    miroir.position.set(-2.6, 2.35, cote * 1.45);
    // Lance-pots fumigènes GALIX sur le toit
    const galix = pieces(THREE, sombre, [0, 1, 2].map((i) => [-0.9 + i * 0.22, 3.02, cote * 0.85, 0.14, 0.14, 0.2]));
    c.add(phare, miroir, galix);
  }
  const parechoc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 2.3), sombre);
  parechoc.position.set(-3.9, 1.0, 0);
  const calandre = pieces(THREE, sombre, [0, 1, 2, 3, 4].map((i) => [-3.86, 1.35 + i * 0.07, 0, 0.03, 0.03, 1.1]));
  c.add(parechoc, calandre);
  // Six roues
  for (const x of [-2.45, 0.55, 2.05]) for (const z of [-1, 1]) {
    const r = roue(THREE, 0.58, 0.42, pneu, kaki);
    r.position.set(x, 0.58, z * 1.02);
    c.add(r);
  }
  // Porte arrière (charnière sur le côté droit) avec hublot et marchepied
  const charniere = new THREE.Group();
  charniere.position.set(3.77, 1.95, -0.55);
  const porte = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.45, 1.1), camo);
  porte.position.z = 0.55;
  const hublot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.25), verre);
  hublot.position.set(0.05, 0.3, 0.55);
  charniere.add(porte, hublot);
  c.add(charniere);
  const interieur = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.4, 1.05), new THREE.MeshStandardMaterial({ color: 0x2b2d2a, roughness: 0.9 }));
  interieur.position.set(3.74, 1.95, 0);
  const marche = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 1.0), sombre);
  marche.position.set(3.85, 0.95, 0);
  c.add(interieur, marche);
  // Tourelleau téléopéré (mitrailleuse de 12,7 mm), détecteur de tirs, antennes
  const tourelleau = new THREE.Group();
  tourelleau.position.set(-1.0, 2.95, -0.35);
  const fut = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.25, 16), camo);
  fut.position.y = 0.12;
  const corps = tronc(THREE, 0.7, 0.4, 0.6, 0.6, 0.5, camo);
  corps.position.y = 0.45;
  const optro = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.22), camo);
  optro.position.set(-0.1, 0.48, 0.38);
  const objectif = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.14), verre);
  objectif.position.set(-0.25, 0.48, 0.38);
  const mitrailleuse = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), sombre);
  mitrailleuse.rotation.z = Math.PI / 2;
  mitrailleuse.position.set(-0.75, 0.5, -0.05);
  const caisseMun = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.2), sombre);
  caisseMun.position.set(0.1, 0.45, -0.38);
  tourelleau.add(fut, corps, optro, objectif, mitrailleuse, caisseMun);
  c.add(tourelleau);
  const antares = new THREE.Group();
  const matA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), sombre);
  matA.position.y = 0.3;
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), sombre);
  tete.position.y = 0.65;
  antares.add(matA, tete);
  antares.position.set(1.2, 2.95, 0.5);
  c.add(antares);
  for (const [x, z, h] of [[3.2, 0.8, 2.0], [3.2, -0.8, 2.0], [-1.7, 0.85, 1.2]]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.018, h, 6), sombre);
    a.position.set(x, 2.95 + h / 2, z);
    c.add(a);
  }
  c.add(pieces(THREE, sombre, [[0.6, 2.97, -0.4, 0.8, 0.04, 0.7], [2.2, 2.97, 0.2, 0.8, 0.04, 0.7]]));

  const { groupe, p } = poser(THREE, c, 1.45, -3.95, 3.95);
  groupe.userData.legendes = [
    { texte: 'Tourelleau téléopéré', point: p(-1.0, 3.6, -0.35) },
    { texte: 'Pare-brise blindé', point: p(-2.4, 2.6, 0) },
    { texte: 'Caisse en V (protection contre les mines)', point: p(0, 0.5, 1.0) },
    { texte: 'Détecteur de tirs', point: p(1.2, 3.7, 0.5) },
    { texte: 'Porte arrière : 8 fantassins', point: p(3.8, 2.2, 0) },
  ];
  groupe.userData.commandes = [
    { id: 'porte', libelle: 'Ouvrir la porte arrière', actif: 'Fermer la porte arrière' },
    { id: 'veille', libelle: 'Faire pivoter le tourelleau', actif: 'Tourelleau en veille' },
  ];
  let ouverture = 0, angle = 0;
  groupe.userData.animer = (t, api) => {
    ouverture += ((api.porte ? 1 : 0) - ouverture) * 0.06;
    charniere.rotation.y = -ouverture * 1.75;
    angle += ((api.veille ? 1.2 * Math.sin(t / 1500) : 0) - angle) * 0.05;
    tourelleau.rotation.y = angle;
  };
  groupe.userData.taille = 14;
  return groupe;
}

/**
 * Engin blindé de reconnaissance et de combat Jaguar (6×6) : caisse basse à
 * facettes, tourelle à canon de 40 mm CTA, lanceur escamotable de deux
 * missiles MMP, viseurs, tourelleau. Commandes : rotation de la tourelle,
 * déploiement du lanceur de missiles.
 */
export function construireJaguar(THREE) {
  const c = new THREE.Group();
  const camo = new THREE.MeshStandardMaterial({ map: textureCamouflage(THREE), roughness: 0.85, metalness: 0.08 });
  const kaki = vert(THREE), sombre = noir(THREE), verre = vitre(THREE);
  const pneu = new THREE.MeshStandardMaterial({ color: 0x1b1b1a, roughness: 0.95 });

  // Caisse : partie basse en V et partie haute à flancs inclinés, glacis avant
  const v = new THREE.Shape([[0, 0.5], [1.0, 0.72], [1.25, 1.2], [-1.25, 1.2], [-1.0, 0.72]].map(([a, b]) => new THREE.Vector2(a, b)));
  const geoV = new THREE.ExtrudeGeometry(v, { depth: 6.9, bevelEnabled: false });
  geoV.rotateY(Math.PI / 2);
  geoV.translate(-3.45, 0, 0);
  c.add(new THREE.Mesh(geoV, camo));
  c.add(profilExtrude(THREE, [[-3.55, 1.1], [3.5, 1.1], [3.55, 1.75], [3.35, 1.95], [-1.7, 1.95], [-3.55, 1.45]], 2.6, camo, 0.05));
  for (const cote of [-1, 1]) {
    // Blindage additionnel incliné au-dessus des roues
    const pan = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.55, 0.12), camo);
    pan.position.set(0, 1.5, cote * 1.38);
    pan.rotation.x = -cote * 0.35;
    c.add(pan);
    const phare = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.28), new THREE.MeshStandardMaterial({ color: 0xf2efe2, emissive: 0x2a2820, roughness: 0.2 }));
    phare.position.set(-3.5, 1.5, cote * 0.95);
    c.add(phare);
    c.add(pieces(THREE, sombre, [[-2.3, 1.22, cote * 1.2, 1.4, 0.05, 0.42], [0.95, 1.22, cote * 1.2, 2.6, 0.05, 0.42]]));
  }
  // Poste de pilotage : épiscopes devant le conducteur
  c.add(vitreInclinee(THREE, [-2.6, 1.72], [-2.1, 1.95], 0.7, 0, verre, 0.05));
  const parechoc = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 2.3), sombre);
  parechoc.position.set(-3.6, 1.0, 0);
  c.add(parechoc);
  for (const x of [-2.3, -0.15, 1.95]) for (const z of [-1, 1]) {
    const r = roue(THREE, 0.58, 0.42, pneu, kaki);
    r.position.set(x, 0.58, z * 1.08);
    c.add(r);
  }
  // Grilles moteur à l'arrière, antennes
  c.add(pieces(THREE, sombre, [[2.6, 1.97, -0.6, 1.1, 0.03, 0.8], [2.6, 1.97, 0.6, 1.1, 0.03, 0.8]]));
  for (const z of [-0.9, 0.9]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.018, 2.0, 6), sombre);
    a.position.set(3.2, 2.95, z);
    c.add(a);
  }

  // Tourelle à facettes (pivot sur la couronne)
  const tourelle = new THREE.Group();
  tourelle.position.set(0.25, 1.95, 0);
  const dessus = [[-1.25, -0.95], [-1.25, 0.95], [-0.55, 1.22], [1.35, 1.22], [1.7, 0.85], [1.7, -0.85], [1.35, -1.22], [-0.55, -1.22]];
  const geoT = new THREE.ExtrudeGeometry(new THREE.Shape(dessus.map(([x, z]) => new THREE.Vector2(x, z))), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 });
  geoT.rotateX(-Math.PI / 2);
  const corpsT = new THREE.Mesh(geoT, camo);
  corpsT.position.y = 0.1;
  tourelle.add(corpsT);
  // Canon de 40 mm à munitions télescopées
  const masque = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.55), camo);
  masque.position.set(-1.38, 0.38, 0);
  const manchon = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 14), kaki);
  manchon.rotation.z = Math.PI / 2;
  manchon.position.set(-1.95, 0.4, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 2.3, 14), kaki);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(-3.5, 0.4, 0);
  const bouche = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), sombre);
  bouche.rotation.z = Math.PI / 2;
  bouche.position.set(-4.68, 0.4, 0);
  tourelle.add(masque, manchon, tube, bouche);
  // Viseur panoramique du chef (PASEO), viseur du tireur, tourelleau de 7,62 mm
  const paseo = new THREE.Group();
  paseo.position.set(0.2, 0.7, 0.55);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.35, 14), camo);
  pied.position.y = 0.17;
  const tete = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.4), camo);
  tete.position.y = 0.5;
  const fenetre = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.26), verre);
  fenetre.position.set(-0.21, 0.52, 0);
  paseo.add(pied, tete, fenetre);
  const viseur = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.4), camo);
  viseur.position.set(-0.75, 0.83, -0.6);
  const vitreV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.3), verre);
  vitreV.position.set(-1.01, 0.83, -0.6);
  const rws = new THREE.Group();
  rws.position.set(0.9, 0.7, -0.45);
  const rwsCorps = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.36), camo);
  rwsCorps.position.y = 0.2;
  const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), sombre);
  mg.rotation.z = Math.PI / 2;
  mg.position.set(-0.5, 0.25, 0);
  rws.add(rwsCorps, mg);
  tourelle.add(paseo, viseur, vitreV, rws);
  // Lance-pots fumigènes
  for (const cote of [-1, 1]) tourelle.add(pieces(THREE, sombre, [0, 1, 2, 3].map((i) => [1.0 + i * 0.16, 0.55, cote * 1.3, 0.12, 0.12, 0.16])));
  // Lanceur escamotable de deux missiles MMP sur le flanc gauche de la tourelle
  const lanceur = new THREE.Group();
  lanceur.position.set(0.3, 0.35, 1.32);
  const bras = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.12), kaki);
  bras.position.y = 0.2;
  const tubes = new THREE.Group();
  tubes.position.y = 0.45;
  for (const z of [0.08, 0.38]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.26, 0.26), camo);
    t.position.set(0, 0, z);
    const fond = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.18), sombre);
    fond.position.set(-0.66, 0, z);
    tubes.add(t, fond);
  }
  lanceur.add(bras, tubes);
  tourelle.add(lanceur);
  c.add(tourelle);

  const { groupe, p } = poser(THREE, c, 1.45, -4.45, 3.6);
  groupe.userData.legendes = [
    { texte: 'Canon de 40 mm CTA', point: p(-3.3, 2.5, 0) },
    { texte: 'Missiles MMP (4 000 m)', point: p(0.6, 3.1, 1.6) },
    { texte: 'Viseur panoramique du chef', point: p(0.45, 3.2, 0.55) },
    { texte: 'Six roues motrices', point: p(-0.15, 0.6, 1.3) },
  ];
  groupe.userData.commandes = [
    { id: 'pivoter', libelle: 'Faire pivoter la tourelle', actif: 'Tourelle en veille' },
    { id: 'missiles', libelle: 'Déployer les missiles MMP', actif: 'Replier les missiles' },
  ];
  let angle = 0, d = 0;
  groupe.userData.animer = (t, api) => {
    angle += ((api.pivoter ? 0.8 * Math.sin(t / 1400) : 0) - angle) * 0.05;
    tourelle.rotation.y = angle;
    d += ((api.missiles ? 1 : 0) - d) * 0.05;
    // Replié : couché contre le flanc ; déployé : levé au-dessus de la tourelle, légèrement cabré
    lanceur.rotation.x = (1 - d) * 1.45;
    tubes.rotation.z = -d * 0.12;
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

