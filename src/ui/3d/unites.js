/**
 * Unités projetables en 3D, comme le groupe aéronaval : chaque scène assemble
 * les modèles existants à une même échelle, dans son décor.
 *  - groupement tactique interarmes (GTIA) : Jaguar en tête, Griffon et leur
 *    infanterie, Caesar en batterie à l'arrière, Tigre en appui ;
 *  - police du ciel : deux Rafale interceptent un aéronef non identifié
 *    (le leader à sa gauche pour l'identification visuelle, l'ailier en
 *    couverture), ou patrouillent à deux ;
 *  - ravitaillement en vol : un A330 Phénix et deux Rafale aux paniers ;
 *  - forces spéciales : descente en corde lisse d'un Caïman sur un toit,
 *    Caracal posé, véhicules légers, Tigre en appui.
 * Chaque scène a deux états, tirés de la partie : en mission (sur une base
 * extérieure, dans le décor de la région) ou en métropole (garnison, base
 * aérienne, alerte au sol).
 * donnees : { deploye, base (nom affiché), terrain: 'desert' | 'europe' | 'tropical', interception }
 *
 * Tous les engins d'une scène sont à la même échelle ; les distances sont
 * resserrées. Décors, effectifs et dispositifs : simplifiés.
 * Repère : les engins font face à x négatif ; y vers le haut ; mètres × K.
 */
import { construireGriffon, construireJaguar, construireCaesar } from './materiels.js';
import { construireRafale, construireLeclerc, loft, pieces } from './modeles.js';
import { construirePhenix, construireCaiman, construireCaracal, soldat } from './aeronefs.js';
import { construireTigre } from './tigre.js';
import { voilure, tubeEntre } from './formes.js';

const TOUR = Math.PI * 2;

/**
 * Modèles réutilisés : s = unités du modèle par mètre ; sol = hauteur du sol
 * (bas des roues) dans le repère du modèle ; axe = hauteur de l'axe du
 * fuselage (pour placer un avion en vol).
 */
const MODELES = {
  griffon: { construire: (T) => construireGriffon(T), s: 1.45, sol: -2.2 },
  jaguar: { construire: (T) => construireJaguar(T), s: 1.45, sol: -2.2 },
  caesar: { construire: (T) => construireCaesar(T), s: 1.2, sol: -2.2 },
  tigre: { construire: (T) => construireTigre(T), s: 1, sol: -2.2, axe: -0.5 },
  caimanFS: { construire: (T) => construireCaiman(T, { modele: 'caimanFS' }), s: 0.85, sol: -1.85, axe: -1.85 },
  caracal: { construire: (T) => construireCaracal(T), s: 0.82, sol: -1.8, axe: -1.8 },
  rafale: { construire: (T) => construireRafale(T, { armement: true }), s: 1, sol: -1.75, axe: 0 },
  phenix: { construire: (T) => construirePhenix(T), s: 0.26, sol: -1.12, axe: 0.6 },
  leclerc: { construire: (T) => construireLeclerc(T), s: 1.35, sol: -2.2 },
};

/** Construit un engin à l'échelle commune K (unités par mètre) ; origine au sol, ou sur l'axe du fuselage en vol. */
function placer(THREE, type, K, { vol = false } = {}) {
  const d = MODELES[type];
  const objet = d.construire(THREE);
  objet.position.y -= vol ? (d.axe ?? 0) : d.sol;
  const conteneur = new THREE.Group();
  conteneur.add(objet);
  conteneur.scale.setScalar(K / d.s);
  return { conteneur, objet };
}

/** Générateur pseudo-aléatoire reproductible (décors identiques d'un affichage à l'autre). */
function hasard(graine) {
  let g = graine;
  return () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
}

const mat = (THREE, couleur, rugosite = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: 0, ...extra });

const BRUME = 0xdfe3e2; // brume d'horizon : la même pour tous les décors, raccordée au bas du ciel (styles.css)
const SOLS = {
  desert: { sol: 0xb2935f, piste: 0x9a7d50 },
  europe: { sol: 0x5f7243, piste: 0x7d6c4e },
  tropical: { sol: 0x4d6b3c, piste: 0xa67b52 },
  levant: { sol: 0xa38f63, piste: 0x8c7752 }, // collines sèches du Sud-Liban : calcaire, oliviers
  garnison: { sol: 0x84847f, piste: 0x767672 },
};

/**
 * Sol et décor d'une scène terrestre, en mètres × K : sol, piste, et reliefs
 * selon la région (rochers et dunes, sapins, palmiers).
 */
function decor(THREE, K, type, { piste = true, rayon = 600, libre = 40, lointain = 125 } = {}) {
  const c = SOLS[type] ?? SOLS.desert;
  const g = new THREE.Group();
  const sol = new THREE.Mesh(new THREE.CircleGeometry(rayon * K, 64), mat(THREE, c.sol, 1));
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  g.add(sol);
  if (piste) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(rayon * 2 * K, 7 * K), mat(THREE, c.piste, 1));
    p.rotation.x = -Math.PI / 2;
    p.position.y = 0.004;
    p.receiveShadow = true;
    g.add(p);
  }
  if (type === 'garnison') return g;
  const h = hasard(type.length * 7919 + 13);
  const roche = mat(THREE, type === 'desert' ? 0x8f7650 : type === 'levant' ? 0xb3a88f : 0x7a7a72, 1, { flatShading: true });
  const olivier = mat(THREE, 0x6f7b4e, 1, { flatShading: true });
  const feuillage = mat(THREE, type === 'tropical' ? 0x3f7a3a : 0x3f5f34, 1, { flatShading: true });
  const tronc = mat(THREE, 0x6a5238, 1);
  const dune = mat(THREE, 0xbb9d69, 1);
  for (let k = 0; k < 60; k++) {
    // En couronne autour du dispositif, jamais au milieu
    const a = h() * TOUR, d = libre + h() * (lointain - libre);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (piste && Math.abs(z) < 7) continue;
    const t = h();
    if (type === 'levant') {
      // Rochers calcaires et oliviers trapus
      if (t < 0.45) {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry((0.6 + h() * 1.6) * K, 0), roche);
        m.position.set(x * K, 0.3 * K, z * K);
        m.rotation.set(h() * 3, h() * 3, h() * 3);
        m.scale.y = 0.6;
        m.castShadow = true;
        g.add(m);
      } else {
        const haut = 2 + h() * 1.2;
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * K, 0.36 * K, haut * K, 6), tronc);
        tr.position.set(x * K, (haut / 2) * K, z * K);
        const cime = new THREE.Mesh(new THREE.IcosahedronGeometry((1.7 + h() * 0.9) * K, 0), olivier);
        cime.position.set(x * K, (haut + 0.9) * K, z * K);
        cime.scale.y = 0.7;
        tr.castShadow = cime.castShadow = true;
        g.add(tr, cime);
      }
    } else if (type === 'desert') {
      if (t < 0.3) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), dune);
        m.scale.set((9 + h() * 10) * K, (1 + h() * 1.6) * K, (6 + h() * 8) * K);
        m.position.set(x * K, -0.2 * K, z * K);
        m.receiveShadow = true;
        g.add(m);
      } else {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry((0.5 + h() * 1.3) * K, 0), roche);
        m.position.set(x * K, 0.25 * K, z * K);
        m.rotation.set(h() * 3, h() * 3, h() * 3);
        m.castShadow = true;
        g.add(m);
      }
    } else {
      const haut = (type === 'tropical' ? 7 : 9) + h() * 5;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * K, 0.32 * K, haut * 0.55 * K, 6), tronc);
      tr.position.set(x * K, haut * 0.275 * K, z * K);
      const cime = type === 'tropical'
        ? new THREE.Mesh(new THREE.SphereGeometry(2.6 * K, 8, 5), feuillage)
        : new THREE.Mesh(new THREE.ConeGeometry(2.4 * K, haut * 0.75 * K, 7), feuillage);
      cime.position.set(x * K, (type === 'tropical' ? haut * 0.6 : haut * 0.62) * K, z * K);
      if (type === 'tropical') cime.scale.y = 0.45;
      tr.castShadow = cime.castShadow = true;
      g.add(tr, cime);
    }
  }
  return g;
}

/** Hangar à toit en berceau (longueur selon x), en mètres × K. */
function hangar(THREE, K, { longueur = 50, profondeur = 14, hauteur = 6, couleur = 0xc9c5b8 } = {}) {
  const g = new THREE.Group();
  const murs = new THREE.Mesh(new THREE.BoxGeometry(longueur * K, hauteur * K, profondeur * K), mat(THREE, couleur, 0.85));
  murs.position.y = (hauteur / 2) * K;
  // Demi-cylindre couché le long de x, voûte vers le haut, aplati
  const berceau = new THREE.CylinderGeometry((profondeur / 2) * K, (profondeur / 2) * K, longueur * K, 20, 1, false, 0, Math.PI);
  berceau.rotateZ(Math.PI / 2);
  const toit = new THREE.Mesh(berceau, mat(THREE, 0x8f969c, 0.6, { metalness: 0.3, side: THREE.DoubleSide }));
  toit.position.y = hauteur * K;
  toit.scale.set(1, 0.45, 1);
  const portes = [];
  for (let i = -2; i <= 2; i++) portes.push([i * (longueur / 5.4) * K, (hauteur * 0.42) * K, (profondeur / 2 + 0.05) * K, (longueur / 6.4) * K, (hauteur * 0.84) * K, 0.1 * K]);
  g.add(murs, toit, pieces(THREE, mat(THREE, 0x5d646b, 0.7), portes));
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/** Mât et drapeau tricolore, en mètres × K. */
function drapeau(THREE, K) {
  const g = new THREE.Group();
  const mt = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * K, 0.1 * K, 11 * K, 8), mat(THREE, 0xdadada, 0.4, { metalness: 0.6 }));
  mt.position.y = 5.5 * K;
  g.add(mt);
  [0x21468b, 0xf4f4f0, 0xc8102e].forEach((c, i) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2 * K, 2.4 * K), mat(THREE, c, 0.8, { side: THREE.DoubleSide }));
    b.position.set((0.7 + i * 1.2) * K, 9.6 * K, 0);
    g.add(b);
  });
  return g;
}

/** Groupe de fantassins debout (positions en mètres, [x, z, cap]). */
function fantassins(THREE, K, positions, tenue = 0x6b6a4e, casque = 0x4a4b3c) {
  const mT = mat(THREE, tenue), mC = mat(THREE, casque, 0.8);
  const arme = mat(THREE, 0x1c1d1b, 0.6);
  return positions.map(([x, z, cap = 0]) => {
    const s = soldat(THREE, mT, mC);
    const fusil = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.07, 0.06), arme);
    fusil.position.set(-0.22, 1.2, 0.16);
    fusil.rotation.z = 0.25;
    s.add(fusil);
    s.scale.setScalar(K);
    s.position.set(x * K, 0, z * K);
    s.rotation.y = cap;
    s.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return s;
  });
}

/** Véhicule léger des forces spéciales (type buggy armé), en mètres ; avant vers x négatif. */
function vehiculeLeger(THREE) {
  const g = new THREE.Group();
  const sable = mat(THREE, 0x8c7f62, 0.85), sombre = mat(THREE, 0x25261f, 0.7), pneu = mat(THREE, 0x161718, 0.95);
  g.add(pieces(THREE, sable, [
    [0, 0.72, 0, 4.3, 0.34, 1.75], // plancher
    [-1.65, 1.02, 0, 1.2, 0.42, 1.6], // capot
    [1.5, 1.05, 0, 1.35, 0.5, 1.7], // plateau arrière
    [-0.15, 1.0, 0.84, 1.9, 0.5, 0.07], [-0.15, 1.0, -0.84, 1.9, 0.5, 0.07], // flancs bas
  ]));
  // Arceau tubulaire et affût de mitrailleuse
  for (const z of [0.8, -0.8]) {
    g.add(tubeEntre(THREE, [-0.95, 1.1, z], [-0.55, 2.0, z], 0.045, sombre, 8));
    g.add(tubeEntre(THREE, [-0.55, 2.0, z], [0.85, 2.0, z], 0.045, sombre, 8));
    g.add(tubeEntre(THREE, [0.85, 2.0, z], [1.2, 1.2, z], 0.045, sombre, 8));
  }
  g.add(tubeEntre(THREE, [-0.55, 2.0, 0.8], [-0.55, 2.0, -0.8], 0.045, sombre, 8), tubeEntre(THREE, [0.85, 2.0, 0.8], [0.85, 2.0, -0.8], 0.045, sombre, 8));
  g.add(tubeEntre(THREE, [0.15, 2.0, 0], [0.15, 2.35, 0], 0.05, sombre, 8), tubeEntre(THREE, [0.6, 2.4, 0], [-0.75, 2.47, 0], 0.035, sombre, 8));
  for (const [x, z] of [[-1.5, 0.92], [-1.5, -0.92], [1.45, 0.92], [1.45, -0.92]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 18), pneu);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, 0.46, z);
    g.add(r);
  }
  const mT = mat(THREE, 0x5f5b47), mC = mat(THREE, 0x3d3e33, 0.8);
  for (const [x, z] of [[-0.35, 0.42], [-0.35, -0.42], [0.55, 0]]) {
    const s = soldat(THREE, mT, mC, true);
    s.position.set(x, 0.92, z);
    s.rotation.y = Math.PI; // regard vers l'avant (x négatif)
    g.add(s);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/**
 * Aéronef non identifié : quadrimoteur à hélices de patrouille et de
 * renseignement, gris uni, sans marques (forme générique). En mètres, nez en
 * x = 0, axe du fuselage en y = 0. Renvoie le groupe (centré) et ses hélices.
 */
function aeronefInconnu(THREE) {
  const a = new THREE.Group();
  const gris = mat(THREE, 0x8d9499, 0.55, { metalness: 0.25 });
  const fonce = mat(THREE, 0x4a4f54, 0.6, { metalness: 0.2 });
  const noir = mat(THREE, 0x15171a, 0.6);
  a.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.3, h: 0.3, y: -0.3 }, { x: 1.2, w: 2.0, h: 2.0, y: -0.15 }, { x: 4, w: 3.3, h: 3.5 }, { x: 22, w: 3.3, h: 3.5 },
    { x: 29, w: 2.2, h: 2.6, y: 0.4 }, { x: 35, w: 0.5, h: 0.9, y: 1.0 }, { x: 37.5, w: 0.12, h: 0.2, y: 1.15 },
  ], { segments: 28, parSegment: 5 }), gris));
  // Nez sombre (radar), vitrage du poste, bosse ventrale et antenne dorsale
  a.add(new THREE.Mesh(loft(THREE, [{ x: -0.02, w: 0.32, h: 0.32, y: -0.3 }, { x: 1.2, w: 2.04, h: 2.04, y: -0.15 }, { x: 2.2, w: 2.62, h: 2.7, y: -0.08 }], { segments: 24, parSegment: 4 }), noir));
  a.add(pieces(THREE, noir, [[3.6, 1.05, 0, 1.5, 0.5, 2.5]]));
  const bosse = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), fonce);
  bosse.scale.set(3.2, 0.7, 1.1);
  bosse.position.set(12, -1.75, 0);
  const antenne = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), fonce);
  antenne.scale.set(4.2, 0.35, 0.5);
  antenne.position.set(17, 1.8, 0);
  a.add(bosse, antenne);
  const helices = [];
  for (const cote of [1, -1]) {
    const aile = new THREE.Mesh(voilure(THREE, [[13.2, 1.5], [16.2, 18.6], [18.6, 18.6], [19.6, 1.5]], { profil: 'naca', relative: [0.13, 0.11] }), gris);
    aile.scale.z = cote;
    aile.position.y = -0.9;
    a.add(aile);
    const plan = new THREE.Mesh(voilure(THREE, [[32.2, 0.3], [34.4, 6.6], [36.2, 6.6], [36.3, 0.3]], { profil: 'naca', relative: [0.11, 0.1] }), gris);
    plan.scale.z = cote;
    plan.position.y = 1.2;
    a.add(plan);
    for (const z of [5.4, 11.4]) {
      const xBA = 13.2 + ((16.2 - 13.2) * (z - 1.5)) / 17.1;
      const nacelle = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 4.6, 6, 14), gris);
      nacelle.rotation.z = Math.PI / 2;
      nacelle.position.set(xBA + 0.6, -0.75, cote * z);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 14), fonce);
      cone.rotation.z = Math.PI / 2;
      cone.position.set(xBA - 2.75, -0.75, cote * z);
      const helice = new THREE.Group();
      helice.position.set(xBA - 2.5, -0.75, cote * z);
      for (let k = 0; k < 4; k++) {
        const pale = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.1, 0.24), noir);
        pale.position.y = 1.2;
        const bras = new THREE.Group();
        bras.rotation.x = (k * TOUR) / 4;
        bras.add(pale);
        helice.add(bras);
      }
      const disque = new THREE.Mesh(new THREE.CircleGeometry(2.25, 28), new THREE.MeshBasicMaterial({ color: 0x2a2c2e, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
      disque.rotation.y = Math.PI / 2;
      helice.add(disque);
      a.add(nacelle, cone, helice);
      helices.push(helice);
    }
  }
  const derive = new THREE.Mesh(voilure(THREE, [[29.5, 0], [34.6, 6.6], [36.6, 6.6], [36.4, 0]], { plan: 'xy', profil: 'naca', relative: [0.11, 0.1] }), gris);
  derive.position.y = 1.1;
  a.add(derive);
  a.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material.transparent; o.receiveShadow = true; } });
  a.position.x = -18.7;
  const g = new THREE.Group();
  g.add(a);
  return { groupe: g, helices };
}

/** Couche de nuages qui défilent vers l'arrière (donne la sensation de vol), en unités de scène. */
function nuages(THREE, { y = -3, n = 34, etendue = 46, graine = 5 } = {}) {
  const g = new THREE.Group();
  const h = hasard(graine);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.9, depthWrite: false });
  const liste = [];
  for (let k = 0; k < n; k++) {
    const nuage = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), m);
      b.scale.set(1.6 + h() * 1.8, 0.5 + h() * 0.5, 1.2 + h() * 1.4);
      b.position.set((h() - 0.5) * 3.5, (h() - 0.5) * 0.5, (h() - 0.5) * 2.6);
      nuage.add(b);
    }
    const x0 = (h() - 0.5) * etendue, z = (h() - 0.5) * etendue;
    nuage.position.set(x0, y - h() * 5, z);
    g.add(nuage);
    liste.push({ nuage, x0 });
  }
  const animer = (t, vitesse = 0.0045) => {
    for (const { nuage, x0 } of liste) nuage.position.x = ((((x0 + t * vitesse) % etendue) + etendue * 1.5) % etendue) - etendue / 2;
  };
  animer(0);
  return { groupe: g, animer };
}

/** Mer ou sol très loin sous les avions. */
function fondLointain(THREE, couleur = 0x3d6a8f, y = -11) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(520, 48), mat(THREE, couleur, 0.8));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

const lieu = (d, garnison) => (d?.deploye === false ? garnison : d?.base ? `en mission : ${d.base}` : 'en mission');

/**
 * Groupement tactique interarmes.
 * Commandes en mission : débarquer l'infanterie, Caesar en batterie, tir.
 */
export function construireGtia(THREE, { donnees = null } = {}) {
  const K = 0.24;
  const enMission = donnees?.deploye !== false;
  const terrain = enMission ? (donnees?.terrain ?? 'desert') : 'garnison';
  const camoufle = terrain !== 'desert';
  const racine = new THREE.Group();
  const p = (x, y, z) => new THREE.Vector3(x * K, y * K, z * K);
  const legendes = [];
  racine.add(decor(THREE, K, terrain, { piste: enMission }));

  // [type, x, z, cap] : en mission, Jaguar en tête, Griffon au centre, Caesar à l'arrière (retournés : ils tirent par l'arrière)
  const dispositif = enMission
    ? [['jaguar', -27, -8, 0.12], ['jaguar', -22, 9, -0.1], ['griffon', -8, -7, 0.05], ['griffon', -5, 8, -0.05], ['griffon', 8, -8, 0], ['griffon', 11, 7, 0], ['caesar', 25, -8, Math.PI + 0.08], ['caesar', 28, 8, Math.PI - 0.08]]
    : [['jaguar', -24.5, -4, Math.PI / 2], ['jaguar', -17.5, -4, Math.PI / 2], ['griffon', -10.5, -4, Math.PI / 2], ['griffon', -3.5, -4, Math.PI / 2], ['griffon', 3.5, -4, Math.PI / 2], ['griffon', 10.5, -4, Math.PI / 2], ['caesar', 17.5, -4, Math.PI / 2], ['caesar', 24.5, -4, Math.PI / 2]];
  const engins = dispositif.map(([type, x, z, cap]) => {
    const e = placer(THREE, type, K);
    e.conteneur.position.set(x * K, 0, z * K);
    e.conteneur.rotation.y = cap;
    racine.add(e.conteneur);
    return { type, x, z, ...e };
  });
  const premier = (type) => engins.find((e) => e.type === type);
  legendes.push({ texte: `Groupement tactique interarmes · ${lieu(donnees, 'en garnison, en métropole')}`, point: p(0, 14, 0) });
  legendes.push({ texte: 'Jaguar : reconnaissance et combat (canon de 40 mm)', point: p(premier('jaguar').x, 4.5, premier('jaguar').z) });
  legendes.push({ texte: 'Griffon : transport de l\'infanterie', point: p(premier('griffon').x, 4.5, premier('griffon').z) });
  legendes.push({ texte: enMission ? 'Caesar : artillerie de 155 mm, à l\'arrière du dispositif' : 'Caesar : artillerie de 155 mm', point: p(premier('caesar').x, 5, premier('caesar').z) });

  // Infanterie : débarquée derrière les deux premiers Griffon (mission), ou rassemblée (garnison)
  const sections = [];
  if (enMission) {
    engins.filter((e) => e.type === 'griffon').slice(0, 2).forEach((g, i) => {
      const cote = i ? 1 : -1;
      const cibles = Array.from({ length: 7 }, (_, k) => [g.x - 9 - (k % 2) * 2.2, g.z + cote * (3.5 + k * 1.9)]);
      const hommes = fantassins(THREE, K, cibles.map(([x, z]) => [x, z, Math.PI]));
      hommes.forEach((s, k) => { s.visible = false; racine.add(s); sections.push({ s, depart: [g.x + 5.2, g.z], cible: cibles[k], rang: k }); });
    });
    legendes.push({ texte: 'Section d\'infanterie débarquée', point: p(-18, 3, 17) });
  } else {
    const rangs = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) rangs.push([-12 + c * 1.6, 9 + r * 1.6, -Math.PI / 2]);
    for (const s of fantassins(THREE, K, rangs)) racine.add(s);
    const h = hangar(THREE, K, { longueur: 62 });
    h.position.set(0, 0, -22 * K);
    const d = drapeau(THREE, K);
    d.position.set(-30 * K, 0, 12 * K);
    racine.add(h, d);
    legendes.push({ texte: 'Rassemblement de la compagnie', point: p(-5, 3.5, 11) });
  }

  // Tigre en appui (mission) : il tourne au-dessus de la tête du dispositif
  let tigre = null;
  if (enMission) {
    tigre = placer(THREE, 'tigre', K, { vol: true });
    tigre.conteneur.rotation.order = 'YXZ';
    racine.add(tigre.conteneur);
    legendes.push({ texte: 'Tigre : appui de l\'aviation légère de l\'armée de Terre', point: p(-10, 25, 0) });
  }

  racine.userData.legendes = legendes;
  racine.userData.taille = 16;
  racine.userData.echelle = K;
  racine.userData.sol = true;
  racine.userData.brume = [BRUME, 42, 150];
  racine.userData.commandes = enMission ? [
    { id: 'debarquer', libelle: 'Débarquer l\'infanterie', actif: 'Rembarquer l\'infanterie' },
    { id: 'batterie', libelle: 'Mettre les Caesar en batterie', actif: 'Caesar en position de route' },
    { id: 'tirCanon', type: 'action', libelle: '💥 Tir (simulation)', requiert: 'batterie', aide: 'Mettez d\'abord les Caesar en batterie' },
  ] : [
    { id: 'sable', libelle: 'Livrée sable (opérations extérieures)', actif: 'Camouflage centre-Europe' },
  ];
  let fD = 0;
  racine.userData.animer = (t, api = {}) => {
    const camouflage = enMission ? camoufle : !api.sable;
    const tirer = !!api.tirCanon;
    fD += ((api.debarquer ? 1 : 0) - fD) * 0.02;
    engins.forEach((e, i) => {
      const sub = e.type === 'caesar' ? { camouflage, batterie: !!api.batterie, tirCanon: tirer }
        : e.type === 'griffon' ? { camouflage, porte: enMission && fD > 0.05 && i < 4, veille: enMission }
          : { camouflage, pivoter: enMission };
      e.objet.userData.animer?.(t + i * 700, sub);
    });
    if (tirer) api.tirCanon = false;
    for (const { s, depart, cible, rang } of sections) {
      const u = Math.min(1, Math.max(0, fD * 1.6 - rang * 0.07));
      s.visible = u > 0.02;
      s.position.set((depart[0] + (cible[0] - depart[0]) * u) * K, 0, (depart[1] + (cible[1] - depart[1]) * u) * K);
    }
    if (tigre) {
      const ang = t / 5200;
      tigre.objet.userData.animer?.(t, { tourelle: true });
      tigre.conteneur.position.set((-10 + Math.cos(ang) * 24) * K, (20 + Math.sin(t / 1300) * 0.6) * K, Math.sin(ang) * 24 * K);
      tigre.conteneur.rotation.set(-0.16, Math.PI / 2 - ang, 0.07);
    }
  };
  racine.userData.animer(0, {});
  return racine;
}

/** Deux hangarettes (abris en demi-cylindre) ouvertes vers x négatif, en mètres × K. */
function hangarettes(THREE, K, zs) {
  const g = new THREE.Group();
  const tole = mat(THREE, 0x8b9288, 0.7, { metalness: 0.2, side: THREE.DoubleSide });
  for (const z of zs) {
    const voute = new THREE.CylinderGeometry(9 * K, 9 * K, 20 * K, 22, 1, true, 0, Math.PI);
    voute.rotateZ(Math.PI / 2); // couchée le long de x, voûte vers le haut
    const arche = new THREE.Mesh(voute, tole);
    arche.scale.set(1, 0.62, 1);
    arche.position.set(6 * K, 0, z * K);
    arche.castShadow = true;
    g.add(arche);
  }
  return g;
}

/**
 * Police du ciel : interception d'un aéronef non identifié par deux Rafale
 * (mission), patrouille à deux, ou alerte au sol en métropole.
 */
export function construirePoliceDuCiel(THREE, { donnees = null } = {}) {
  const K = 0.21;
  const enMission = donnees?.deploye !== false;
  const interception = enMission && donnees?.interception !== false;
  const racine = new THREE.Group();
  const p = (x, y, z) => new THREE.Vector3(x * K, y * K, z * K);
  const legendes = [];
  const rafales = [0, 1].map(() => placer(THREE, 'rafale', K, { vol: enMission }));
  for (const r of rafales) { r.conteneur.rotation.order = 'YXZ'; racine.add(r.conteneur); }

  if (!enMission) {
    // Permanence opérationnelle : deux Rafale armés, train sorti, devant leurs hangarettes
    const sol = decor(THREE, K, 'garnison', { piste: false });
    const ligne = new THREE.Mesh(new THREE.PlaneGeometry(0.4 * K, 120 * K), mat(THREE, 0xe6c23a, 0.8));
    ligne.rotation.x = -Math.PI / 2;
    ligne.position.set(-26 * K, 0.006, 0);
    racine.add(sol, ligne, hangarettes(THREE, K, [11, -11]));
    rafales.forEach((r, i) => { r.objet.userData.basculer?.train(true); r.conteneur.position.set(-6 * K, 0, (i ? -11 : 11) * K); });
    legendes.push({ texte: 'Permanence opérationnelle : deux Rafale armés, en alerte au sol (métropole)', point: p(-6, 9, 0) });
    legendes.push({ texte: 'Hangarettes d\'alerte', point: p(8, 7, 11) });
    racine.userData.sol = true;
    racine.userData.brume = [BRUME, 42, 150];
    racine.userData.commandes = [{ id: 'alerte', type: 'action', libelle: '🚨 Décollage sur alerte' }];
    let depart = null;
    racine.userData.animer = (t, api = {}) => {
      if (api.alerte && depart === null) { depart = t; api.alerte = false; }
      const r = rafales[0];
      if (depart === null) { r.conteneur.position.set(-6 * K, 0, 11 * K); r.conteneur.rotation.set(0, 0, 0); return; }
      const d = (t - depart) / 1000;
      // Roulage, accélération, rotation puis montée ; retour à l'abri au bout de neuf secondes
      const x = -6 - 9 * d * d;
      const monte = Math.max(0, d - 2.6);
      r.conteneur.position.set(x * K, (monte * monte * 5) * K, 11 * K);
      r.conteneur.rotation.set(0, 0, -Math.min(0.3, monte * 0.25));
      r.objet.userData.basculer?.train(monte < 1.2);
      if (d > 9) { depart = null; r.objet.userData.basculer?.train(true); }
    };
    racine.userData.animer(0, {});
  } else {
    const ciel = nuages(THREE, { y: -4.2 });
    racine.add(ciel.groupe, fondLointain(THREE, donnees?.terrain === 'desert' ? 0xb9a47c : 0x3d6a8f));
    let intrus = null;
    if (interception) {
      intrus = aeronefInconnu(THREE);
      intrus.groupe.scale.setScalar(K);
      intrus.groupe.rotation.order = 'YXZ';
      racine.add(intrus.groupe);
      legendes.push({ texte: `Police du ciel · ${lieu(donnees, '')}`, point: p(0, 16, 0) });
      legendes.push({ texte: 'Aéronef non identifié : sans plan de vol, transpondeur coupé', point: p(0, 5, 0) });
      legendes.push({ texte: 'Rafale leader : identification visuelle, à gauche de l\'appareil intercepté', point: p(-13, 6, 22) });
      legendes.push({ texte: 'Rafale ailier : en couverture, en retrait', point: p(36, 12, -14) });
    } else {
      legendes.push({ texte: `Patrouille de deux Rafale · ${lieu(donnees, '')}`, point: p(0, 9, 0) });
      legendes.push({ texte: 'Rafale leader', point: p(-2, 4, 6) });
      legendes.push({ texte: 'Rafale ailier', point: p(14, 6, -10) });
    }
    racine.userData.ciel = true;
    racine.userData.brume = [0xbcd3ea, 40, 140];
    racine.userData.commandes = interception ? [
      { id: 'signal', libelle: 'Battre des ailes (« suivez-moi »)', actif: 'Arrêter le signal' },
      { id: 'detourner', libelle: 'Raccompagner hors de l\'espace aérien', actif: 'Reprendre l\'interception' },
    ] : [{ id: 'virage', libelle: 'Virage en patrouille serrée', actif: 'Vol en palier' }];
    let fV = 0;
    racine.userData.animer = (t, api = {}) => {
      ciel.animer(t);
      fV += (((api.detourner || api.virage) ? 1 : 0) - fV) * 0.015;
      const roulis = 0.32 * fV, cap = -0.3 * fV, derive = -10 * fV;
      if (intrus) {
        for (const h of intrus.helices) h.rotation.x = t / 22;
        intrus.groupe.position.set(0, Math.sin(t / 1700) * 0.25 * K, derive * K);
        intrus.groupe.rotation.set(roulis, cap, 0);
      }
      const [leader, ailier] = rafales;
      const signal = api.signal ? 0.45 * Math.sin(t / 260) : 0;
      const posL = interception ? [-13, 1.5, 22] : [-2, 0, 6];
      const posA = interception ? [36, 7, -13] : [14, 2.5, -10];
      leader.conteneur.position.set(posL[0] * K, (posL[1] + Math.sin(t / 1300) * 0.3) * K, (posL[2] + derive) * K);
      leader.conteneur.rotation.set(roulis + signal, cap, 0);
      ailier.conteneur.position.set(posA[0] * K, (posA[1] + Math.sin(t / 1500 + 1) * 0.4) * K, (posA[2] + derive) * K);
      ailier.conteneur.rotation.set(roulis, cap, 0);
    };
    racine.userData.animer(0, {});
  }
  racine.userData.legendes = legendes;
  racine.userData.taille = 16;
  return racine;
}

/**
 * Ravitaillement en vol : un A330 Phénix et deux Rafale aux paniers
 * (mission), ou le Phénix au parking avec un Rafale (métropole).
 */
export function construireRavitaillement(THREE, { donnees = null } = {}) {
  const K = 0.16;
  const enMission = donnees?.deploye !== false;
  const racine = new THREE.Group();
  const p = (x, y, z) => new THREE.Vector3(x * K, y * K, z * K);
  const legendes = [];
  const phenix = placer(THREE, 'phenix', K, { vol: enMission });
  racine.add(phenix.conteneur);
  const rafales = (enMission ? [1, -1] : [1]).map((cote) => ({ cote, ...placer(THREE, 'rafale', K, { vol: enMission }) }));
  for (const r of rafales) racine.add(r.conteneur);
  racine.userData.pieces = { phenix: phenix.conteneur, rafales: rafales.map((r) => r.conteneur) };
  racine.userData.echelle = K;

  if (!enMission) {
    racine.add(decor(THREE, K, 'garnison', { piste: false }));
    const h = hangar(THREE, K, { longueur: 80, profondeur: 30, hauteur: 16, couleur: 0xbfc3c4 });
    h.position.set(8 * K, 0, -58 * K);
    racine.add(h);
    rafales[0].objet.userData.basculer?.train(true);
    rafales[0].conteneur.position.set(-34 * K, 0, 34 * K);
    rafales[0].conteneur.rotation.y = -0.5;
    legendes.push({ texte: 'A330 Phénix au parking (métropole) : ravitaillement en vol et transport stratégique', point: p(0, 12, 0) });
    legendes.push({ texte: 'Rafale (même échelle)', point: p(-34, 6, 34) });
    racine.userData.sol = true;
    racine.userData.brume = [BRUME, 42, 150];
    racine.userData.commandes = [{ id: 'perche', libelle: 'Déployer la perche', actif: 'Rentrer la perche' }];
    racine.userData.animer = (t, api = {}) => { phenix.objet.userData.animer?.(t, { train: true, perche: !!api.perche }); };
  } else {
    const ciel = nuages(THREE, { y: -4.6, graine: 9 });
    racine.add(ciel.groupe, fondLointain(THREE, donnees?.terrain === 'desert' ? 0xb9a47c : 0x3d6a8f));
    legendes.push({ texte: `Ravitaillement en vol · ${lieu(donnees, '')}`, point: p(0, 14, 0) });
    legendes.push({ texte: 'A330 Phénix : jusqu\'à 111 tonnes de carburant', point: p(-24, 9, 0) });
    legendes.push({ texte: 'Rafale au contact : la perche dans le panier', point: p(26, 2, 23) });
    legendes.push({ texte: 'Nacelle de ravitaillement sous l\'aile', point: p(2, -3, -22.5) });
    racine.userData.ciel = true;
    racine.userData.brume = [0xbcd3ea, 40, 140];
    racine.userData.commandes = [{ id: 'attente', libelle: 'Rompre le contact', actif: 'Ravitailler' }];
    let f = 1;
    racine.userData.animer = (t, api = {}) => {
      ciel.animer(t, 0.004);
      f += ((api.attente ? 0 : 1) - f) * 0.015;
      phenix.objet.userData.animer?.(t, { paniers: f > 0.35 });
      phenix.conteneur.position.y = Math.sin(t / 2100) * 0.2 * K;
      // Contact : perche du Rafale (1,1 m du nez, 1,15 m au-dessus de l'axe, à droite) dans le panier (18,5 m derrière le centre du Phénix, 2,35 m sous l'axe)
      for (const { conteneur, cote } of rafales) {
        const x = 24.6 + (1 - f) * 16, y = -3.5 - (1 - f) * 5 + Math.sin(t / 1500 + cote) * 0.12;
        conteneur.position.set(x * K, y * K + phenix.conteneur.position.y, (cote * 22.5 + 0.42 + cote * (1 - f) * 5) * K);
      }
    };
    racine.userData.animer(0, {});
  }
  racine.userData.legendes = legendes;
  racine.userData.taille = 16;
  return racine;
}

/**
 * Forces spéciales : descente en corde lisse d'un Caïman sur un toit, Caracal
 * posé, véhicules légers, Tigre en appui (mission) ; ou le détachement sur sa
 * base, en métropole.
 */
export function construireForcesSpeciales(THREE, { donnees = null } = {}) {
  const K = 0.25;
  const enMission = donnees?.deploye !== false;
  const terrain = enMission ? (donnees?.terrain ?? 'desert') : 'garnison';
  const racine = new THREE.Group();
  const p = (x, y, z) => new THREE.Vector3(x * K, y * K, z * K);
  const legendes = [];
  racine.add(decor(THREE, K, terrain, { piste: false, libre: 46 }));
  const caiman = placer(THREE, 'caimanFS', K);
  const caracal = placer(THREE, 'caracal', K);
  const tigre = placer(THREE, 'tigre', K, { vol: enMission });
  tigre.conteneur.rotation.order = 'YXZ';
  racine.add(caiman.conteneur, caracal.conteneur, tigre.conteneur);
  const vehicules = [0, 1].map(() => { const v = vehiculeLeger(THREE); v.scale.setScalar(K); racine.add(v); return v; });
  const TOIT = 6.2;

  if (enMission) {
    // Objectif : un bâtiment à toit plat dans son enceinte
    const crepi = mat(THREE, terrain === 'desert' ? 0xd9c7a3 : 0xcfcabb, 0.95);
    const mur = mat(THREE, terrain === 'desert' ? 0xc4b08a : 0xb5b0a2, 0.95);
    racine.add(pieces(THREE, crepi, [[-10 * K, (TOIT / 2) * K, -2 * K, 12 * K, TOIT * K, 9 * K], [2.5 * K, 1.6 * K, 4 * K, 5 * K, 3.2 * K, 4 * K]]));
    racine.add(pieces(THREE, mat(THREE, 0x2a2a28, 0.8), [[-4.02 * K, 1.1 * K, -2 * K, 0.1 * K, 2.2 * K, 1.2 * K], [-10 * K, 4.2 * K, 2.52 * K, 1.4 * K, 1.1 * K, 0.1 * K], [-13 * K, 4.2 * K, 2.52 * K, 1.4 * K, 1.1 * K, 0.1 * K]]));
    racine.add(pieces(THREE, mur, [
      [-8 * K, 1.25 * K, -13 * K, 30 * K, 2.5 * K, 0.5 * K], [-8 * K, 1.25 * K, 11 * K, 30 * K, 2.5 * K, 0.5 * K], [-23 * K, 1.25 * K, -1 * K, 0.5 * K, 2.5 * K, 24 * K],
      [7 * K, 1.25 * K, -8.5 * K, 0.5 * K, 2.5 * K, 9 * K], [7 * K, 1.25 * K, 7.5 * K, 0.5 * K, 2.5 * K, 7 * K], // portail ouvert côté x positif
    ]));
    // Caïman en vol stationnaire au-dessus du toit : les cordes arrivent au ras du toit
    caiman.conteneur.position.set(-9.5 * K, (TOIT + 3.9) * K, -2 * K);
    // Caracal posé hors de l'enceinte, porte ouverte ; commandos en progression vers le portail
    caracal.conteneur.position.set(27 * K, 0, 12 * K);
    caracal.conteneur.rotation.y = 0.5;
    for (const s of fantassins(THREE, K, [[19, 6, Math.PI], [16.5, 3.5, Math.PI], [14, 5, Math.PI], [11.5, 2.2, Math.PI], [9.5, 1.2, Math.PI], [13, -0.5, Math.PI]], 0x5f5b47, 0x3d3e33)) racine.add(s);
    vehicules[0].position.set(17 * K, 0, -9 * K); vehicules[0].rotation.y = -0.25;
    vehicules[1].position.set(24 * K, 0, -15 * K); vehicules[1].rotation.y = -0.4;
    legendes.push({ texte: `Forces spéciales · ${lieu(donnees, '')}`, point: p(0, 24, 0) });
    legendes.push({ texte: 'Caïman : descente en corde lisse sur le toit de l\'objectif', point: p(-9.5, TOIT + 9, -2) });
    legendes.push({ texte: 'Caracal posé : groupe d\'assaut vers le portail', point: p(27, 6, 12) });
    legendes.push({ texte: 'Véhicules légers des forces spéciales', point: p(20, 3.5, -12) });
    legendes.push({ texte: 'Tigre : appui feu', point: p(-9, 31, 26) });
  } else {
    const h = hangar(THREE, K, { longueur: 70, profondeur: 18, hauteur: 8 });
    h.position.set(0, 0, -30 * K);
    const d = drapeau(THREE, K);
    d.position.set(-36 * K, 0, 14 * K);
    racine.add(h, d);
    caiman.conteneur.position.set(-22 * K, 0, -4 * K);
    caracal.conteneur.position.set(2 * K, 0, -4 * K);
    tigre.conteneur.position.set(24 * K, 0, -4 * K);
    for (const c of [caiman, caracal, tigre]) c.conteneur.rotation.y = Math.PI / 2;
    vehicules[0].position.set(-8 * K, 0, 14 * K); vehicules[0].rotation.y = Math.PI / 2;
    vehicules[1].position.set(-2 * K, 0, 14 * K); vehicules[1].rotation.y = Math.PI / 2;
    for (const s of fantassins(THREE, K, Array.from({ length: 10 }, (_, k) => [6 + k * 1.5, 14, -Math.PI / 2]), 0x5f5b47, 0x3d3e33)) racine.add(s);
    legendes.push({ texte: 'Détachement des forces spéciales sur sa base (métropole)', point: p(0, 16, 0) });
    legendes.push({ texte: 'Caïman des forces spéciales', point: p(-22, 7, -4) });
    legendes.push({ texte: 'Caracal', point: p(2, 7, -4) });
    legendes.push({ texte: 'Tigre', point: p(24, 6, -4) });
  }

  racine.userData.legendes = legendes;
  racine.userData.taille = 16;
  racine.userData.sol = true;
  racine.userData.brume = [BRUME, 42, 150];
  racine.userData.commandes = enMission
    ? [{ id: 'remonter', libelle: 'Remonter les cordes', actif: 'Descente en corde lisse' }, { id: 'fermer', libelle: 'Fermer la porte du Caracal', actif: 'Ouvrir la porte du Caracal' }]
    : [{ id: 'rotors', libelle: 'Mettre en route les rotors', actif: 'Couper les rotors' }];
  racine.userData.animer = (t, api = {}) => {
    if (enMission) {
      caiman.objet.userData.animer?.(t, { corde: !api.remonter });
      caiman.conteneur.position.y = (TOIT + 3.9 + Math.sin(t / 1100) * 0.12) * K;
      caracal.objet.userData.animer?.(t, { fermer: !!api.fermer });
      tigre.objet.userData.animer?.(t, { tourelle: true });
      const ang = t / 5600;
      tigre.conteneur.position.set((-9 + Math.cos(ang) * 28) * K, (26 + Math.sin(t / 1400) * 0.6) * K, (-2 + Math.sin(ang) * 28) * K);
      tigre.conteneur.rotation.set(-0.16, Math.PI / 2 - ang, 0.07);
    } else {
      // Au sol : rotors à l'arrêt, sauf mise en route
      const tt = api.rotors ? t : 0;
      caiman.objet.userData.animer?.(tt, {});
      caracal.objet.userData.animer?.(tt, { fermer: true });
      tigre.objet.userData.animer?.(tt, {});
    }
  };
  racine.userData.animer(0, {});
  return racine;
}

/**
 * Escadron de chars Leclerc : quatre chars montrés sur les treize d'un
 * escadron. En mission : déployés en ligne face à l'avant, tourelles en
 * chasse, tirs au canon de 120 mm sur des buttes lointaines, bond en avant ;
 * livrée selon le terrain (camouflage centre-Europe sur le flanc est, sable
 * ailleurs). En métropole : alignés devant le hangar du régiment, équipages
 * de trois hommes rassemblés devant leur char.
 */
export function construireEscadronLeclerc(THREE, { donnees = null } = {}) {
  const K = 0.34;
  const enMission = donnees?.deploye !== false;
  const terrain = enMission ? (donnees?.terrain ?? 'europe') : 'garnison';
  const racine = new THREE.Group();
  const p = (x, y, z) => new THREE.Vector3(x * K, y * K, z * K);
  const legendes = [];
  racine.add(decor(THREE, K, terrain, { piste: false, libre: 36, lointain: 110 }));

  // [x, z, cap] en mètres : ligne de chars (mission) ou alignement au quartier (garnison, face à z positif)
  const postes = enMission
    ? [[-4, -18, 0.06], [-10, -6, 0], [-8, 6, -0.03], [-3, 18, -0.07]]
    : [[-15, -3, Math.PI / 2], [-5, -3, Math.PI / 2], [5, -3, Math.PI / 2], [15, -3, Math.PI / 2]];
  // Cibles (mission) : buttes à environ 100 m devant (distances resserrées : en réalité 2 à 3 km)
  const cibles = [[-82, -26], [-88, -8], [-86, 10], [-80, 28]];
  const chars = postes.map(([x, z, cap]) => {
    const c = placer(THREE, 'leclerc', K);
    c.conteneur.position.set(x * K, 0, z * K);
    c.conteneur.rotation.y = cap;
    racine.add(c.conteneur);
    return { x, z, cap, ...c };
  });
  const mPoussiere = (couleur) => new THREE.MeshStandardMaterial({ color: couleur, roughness: 1, transparent: true, opacity: 0, depthWrite: false });
  const couleurSol = (SOLS[terrain] ?? SOLS.desert).sol;
  // Poussière soulevée au départ du coup, impacts sur les buttes, poussière de roulage
  const souffles = chars.map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), mPoussiere(0xcbbd9c)); m.visible = false; racine.add(m); return m; });
  const impacts = cibles.map(([x, z]) => {
    const g = new THREE.Group();
    const nuage = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 9), mPoussiere(0x8d7b60));
    const eclair = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.9, depthWrite: false }));
    g.add(nuage, eclair);
    g.position.set(x * K, 1.2 * K, z * K);
    g.visible = false;
    racine.add(g);
    return { g, nuage, eclair };
  });
  const roulage = chars.map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mPoussiere(couleurSol)); m.visible = false; racine.add(m); return m; });

  const lieuTexte = lieu(donnees, 'au quartier, en métropole');
  if (enMission) {
    legendes.push({ texte: `Escadron de chars Leclerc · ${lieuTexte}`, point: p(-15, 13, 0) });
    legendes.push({ texte: 'Char du capitaine, commandant d\'escadron', point: p(postes[1][0], 5.5, postes[1][1]) });
    legendes.push({ texte: 'Canon de 120 mm : tir en marche, environ 40 obus à bord', point: p(postes[2][0] - 6, 3.4, postes[2][1]) });
    legendes.push({ texte: 'Quatre chars montrés sur les treize d\'un escadron', point: p(postes[3][0], 5, postes[3][1]) });
    legendes.push({ texte: 'Objectifs (distances resserrées : 2 à 3 km en réalité)', point: p(-85, 6, 0) });
  } else {
    const h = hangar(THREE, K, { longueur: 66, profondeur: 16, hauteur: 7.5 });
    h.position.set(0, 0, -24 * K);
    const d = drapeau(THREE, K);
    d.position.set(-32 * K, 0, 10 * K);
    racine.add(h, d);
    const equipages = [];
    for (const [x] of postes) for (let k = 0; k < 3; k++) equipages.push([x - 1.6 + k * 1.6, 6.5, Math.PI / 2]);
    for (const s of fantassins(THREE, K, equipages, 0x5f6148, 0x2f3128)) racine.add(s);
    legendes.push({ texte: `Escadron de chars Leclerc · ${lieuTexte}`, point: p(0, 15, -10) });
    legendes.push({ texte: 'Équipage de trois : chef de char, tireur, pilote (chargement automatique)', point: p(postes[1][0], 3, 6.5) });
    legendes.push({ texte: 'Leclerc rénové (XLR) : combat collaboratif SCORPION', point: p(postes[2][0], 5.5, postes[2][1]) });
  }

  racine.userData.legendes = legendes;
  racine.userData.taille = 16;
  racine.userData.echelle = K;
  racine.userData.sol = true;
  racine.userData.brume = [BRUME, 42, 150];
  racine.userData.commandes = enMission ? [
    { id: 'tourelles', libelle: 'Tourelles en chasse (recherche de cibles)', actif: 'Tourelles dans l\'axe' },
    { id: 'progresser', libelle: 'Bond en avant', actif: 'Revenir en position' },
    { id: 'salve', type: 'action', libelle: '💥 Tir au canon (simulation)' },
  ] : [
    { id: 'sable', libelle: 'Livrée sable (opérations extérieures)', actif: 'Camouflage centre-Europe' },
    { id: 'tourelles', libelle: 'Faire pivoter les tourelles', actif: 'Tourelles dans l\'axe' },
  ];
  let fP = 0;
  let vitesse = 0;
  let salve = null;
  racine.userData.animer = (t, api = {}) => {
    const livree = enMission ? (terrain === 'europe' ? 'centreEurope' : 'sable') : (api.sable ? 'sable' : 'centreEurope');
    if (api.salve && salve === null) { salve = t; }
    api.salve = false;
    const avant = fP;
    fP += ((api.progresser ? 1 : 0) - fP) * 0.012;
    vitesse = Math.abs(fP - avant);
    const d = salve === null ? null : (t - salve) / 1000;
    chars.forEach((c, i) => {
      // Bond en avant : environ 30 m, de front
      const x = c.x - 30 * fP;
      c.conteneur.position.x = x * K;
      // Visée : vers sa cible pendant la salve, balayage en chasse, sinon dans l'axe
      let cap = 0;
      if (enMission && d !== null) {
        const [cx, cz] = cibles[i];
        cap = Math.atan2(cz - c.z, -(cx - x)) - c.cap;
      } else if (api.tourelles) cap = 0.65 * Math.sin(t / 1600 + i * 1.3);
      const depart = 0.35 + i * 0.55; // tirs l'un après l'autre, une fois la tourelle en place
      const tir = d !== null && d >= depart && d < depart + 0.05;
      c.objet.userData.animer?.(t, { cap, tir, livree });
      // Souffle au départ du coup
      const s = souffles[i];
      const u = d === null ? -1 : d - depart;
      s.visible = u >= 0 && u < 1.6;
      if (s.visible) {
        const r = (2 + u * 7) * K;
        s.scale.set(r * 1.6, r * 0.35, r * 1.6);
        s.position.set((x - 7.5) * K, 0.25 * K, c.z * K);
        s.material.opacity = 0.42 * (1 - u / 1.6);
      }
      // Impact une seconde plus tard (obus flèche : environ 1 700 m/s)
      const im = impacts[i];
      const v = u - 0.9;
      im.g.visible = enMission && v >= 0 && v < 3;
      if (im.g.visible) {
        im.nuage.scale.set((2 + v * 4) * K, (1.6 + v * 3.2) * K, (2 + v * 4) * K);
        im.nuage.position.y = v * 1.6 * K;
        im.nuage.material.opacity = 0.75 * (1 - v / 3);
        im.eclair.visible = v < 0.15;
        im.eclair.scale.setScalar((1.5 + v * 18) * K);
      }
      // Poussière de roulage derrière chaque char en mouvement
      const pr = roulage[i];
      pr.visible = vitesse > 0.0004;
      if (pr.visible) {
        const a = Math.min(1, vitesse * 900);
        pr.scale.set((4 + Math.sin(t / 300 + i) * 0.6) * K, 1.6 * K, 3.2 * K);
        pr.position.set((x + 6.5) * K, 1 * K, c.z * K);
        pr.material.opacity = 0.32 * a;
      }
    });
    if (d !== null && d > 0.35 + chars.length * 0.55 + 3.2) salve = null;
  };
  racine.userData.animer(0, {});
  return racine;
}
