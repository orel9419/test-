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
import { loft, surface, pieces, tronc, texturePeinte, texturePanneaux, construireCharlesDeGaulle, construirePorteAvions, construireRafale, construireSnle, construireSnle3G, construireLeclerc } from './modeles.js';
import { construireCaiman, construireA321Mpa } from './aeronefs.js';
import { construireTigre } from './tigre.js';
import { construireGriffon } from './materiels.js';

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
function coqueNavire(THREE, stations, { gris = GRIS, couleurPont = 0x6b7075, bombe = 0.25, segBas = 7, ouvertureArriere = null } = {}) {
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
    if (sens < 0 && ouvertureArriere) continue; // tableau arrière percé, construit à part
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
  const tableau = ouvertureArriere ? tableauPerce(THREE, flanc(stations.at(-1)), stations.at(-1).x, ouvertureArriere, gris) : null;
  return { coque, pont, tableau };
}

/**
 * Tableau arrière percé d'une ouverture rectangulaire (porte du radier d'un PHA) : trois bandes
 * (gris au-dessus de la flottaison, liseré noir, carène rouge), découpées dans le contour de la
 * dernière section. flanc : points [z ≥ 0, y] du haut vers la quille ; ouverture : { demi, bas, haut }.
 */
function tableauPerce(THREE, flanc, x, { demi, bas, haut }, gris) {
  const g = new THREE.Group();
  // Portion du flanc entre deux hauteurs (le flanc descend : y décroissant), bornes interpolées
  const couper = (y1, y2) => {
    const out = [];
    flanc.forEach(([z, y], i) => {
      if (i > 0) {
        const [zp, yp] = flanc[i - 1];
        for (const yc of [y2, y1]) if ((yp - yc) * (y - yc) < 0) out.push([zp + ((z - zp) * (yc - yp)) / (y - yp), yc]);
      }
      if (y <= y2 + 1e-9 && y >= y1 - 1e-9) out.push([z, y]);
    });
    return out;
  };
  // Repère de la forme : u = −z, v = y, normale vers +x (vers l'arrière)
  const bande = (y1, y2, couleur, trou = false) => {
    const cote = couper(y1, y2);
    const contour = [...cote.map(([z, y]) => [z, y]), ...cote.slice().reverse().map(([z, y]) => [-z, y])]
      .filter((q, i, l) => i === 0 || Math.hypot(q[0] - l[i - 1][0], q[1] - l[i - 1][1]) > 1e-6);
    const forme = new THREE.Shape(contour.map(([u, v]) => new THREE.Vector2(u, v)));
    if (trou) forme.holes.push(new THREE.Path([[-demi, bas], [demi, bas], [demi, haut], [-demi, haut]].map(([u, v]) => new THREE.Vector2(u, v))));
    const geo = new THREE.ShapeGeometry(forme);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); p.setXYZ(i, x, v, -u); }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...couleur), metalness: 0.12, roughness: 0.68, envMapIntensity: 0.5 })));
  };
  const D = flanc[0][1], T = -flanc.at(-1)[1];
  bande(0.7, D, gris, true);
  bande(-0.6, 0.7, LISERE);
  bande(-T, -0.6, CARENE);
  return g;
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
// Hélicoptères embarqués, véhicules, fumées et tirs depuis les lanceurs verticaux
// ---------------------------------------------------------------------------

const TOUR = Math.PI * 2;
/** Lissage de 0 à 1, et avancement de f dans l'intervalle [a, b] (borné à 0 et 1). */
const lisse = (u) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); };
const dans = (f, a, b) => Math.min(1, Math.max(0, (f - a) / (b - a)));
/** Ramène un angle dans ]−π, π]. */
const angleNormal = (a) => a - TOUR * Math.round(a / TOUR);
/** Direction horizontale du nez pour un cap (cap 0 : vers x négatif, l'étrave ; cap π/2 : vers bâbord). */
const nez = (cap) => [-Math.cos(cap), Math.sin(cap)];
/** Générateur pseudo-aléatoire reproductible. */
function alea(graine) {
  let g = graine;
  return () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
}

/**
 * Hélicoptère embarqué à l'échelle 1 (mètres), tiré des modèles détaillés : Caïman Marine (NH90 NFH,
 * repliage automatique des pales) ou Tigre HAD de l'ALAT. Origine au niveau des roues, sous le mât du
 * rotor ; nez vers x négatif. userData.helico : régime du rotor et repliage des pales.
 */
function helicoEmbarque(THREE, type) {
  const g = type === 'tigre' ? construireTigre(THREE) : construireCaiman(THREE, { modele: 'caimanMarine' });
  const h = g.children[0];
  h.scale.setScalar(1);
  h.position.set(type === 'tigre' ? -5.05 : -5.6, 0, 0);
  g.rotation.order = 'YXZ'; // cap, puis roulis, puis assiette
  return g;
}

/**
 * Décollage et appontage d'un hélicoptère embarqué, réglés par une progression f (0 : posé, rotor
 * arrêté ; 1 : à son poste en vol) qui avance ou recule à vitesse constante : on peut inverser à tout
 * moment. Étapes : dépliage des pales (si l'appareil est replié), mise en route du rotor, décollage
 * vertical, dégagement sur le côté, vol jusqu'au poste. Repère du navire, en mètres.
 * pose : [x, y, z] des roues sur le pont ; degagement : décalage du point de dégagement ;
 * poste(t) : { position: [x, y, z], cap } du poste en vol (fixe ou en orbite).
 */
function volEmbarque(helico, { pose, cap = 0, degagement, poste, replie = false, duree = 20, retard = 0 }) {
  const ctrl = helico.userData.helico;
  const repliable = 'repli' in ctrl; // Caïman Marine : pales repliables ; Tigre : non
  ctrl.regime = 0;
  if (repliable) ctrl.repli = replie ? 1 : 0;
  const a = replie ? 0.12 : 0; // fin du dépliage des pales
  const b = a + 0.16, c = b + 0.12; // fin de la mise en route, fin du décollage vertical
  let f = 0, avant = null, attente = 0;
  helico.position.set(...pose);
  helico.rotation.set(0, cap, 0);
  const position = (u, cible) => {
    // Courbe de Bézier : stationnaire au-dessus du pont, point de dégagement, poste
    const A = [pose[0], pose[1] + 6, pose[2]];
    const B = [pose[0] + degagement[0], pose[1] + degagement[1], pose[2] + degagement[2]];
    return A.map((v, i) => (1 - u) * (1 - u) * v + 2 * u * (1 - u) * B[i] + u * u * cible[i]);
  };
  return {
    get f() { return f; },
    animer(t, voulu) {
      const dt = avant === null ? 0 : Math.min(0.1, Math.max(0, (t - avant) / 1000));
      avant = t;
      // Un retard au départ (deuxième appareil d'une patrouille), aucun au retour
      attente = voulu ? attente + dt : 0;
      const sens = voulu ? (attente >= retard ? 1 : 0) : -1;
      f = Math.min(1, Math.max(0, f + (sens * dt) / duree));
      if (repliable) ctrl.repli = replie ? 1 - dans(f, 0, a) : 0;
      ctrl.regime = lisse(dans(f, a, b));
      const u = lisse(dans(f, c, 1));
      const p = poste(t);
      if (f <= c) {
        helico.position.set(pose[0], pose[1] + 6 * lisse(dans(f, b, c)), pose[2]);
        helico.rotation.set(0, cap, 0);
      } else {
        const q = position(u, p.position);
        helico.position.set(q[0], q[1] + Math.sin(t / 900) * 0.4 * u, q[2]);
        const enRoute = Math.sin(Math.PI * Math.min(1, u * 1.15)); // translation : nez bas, roulis dans le virage
        const virage = angleNormal(p.cap - cap);
        helico.rotation.set(0.12 * Math.sign(virage) * enRoute, cap + virage * lisse(u * 1.25), 0.12 * enRoute + (p.assiette ?? 0) * u);
      }
      helico.userData.animer?.(t, {});
    },
  };
}

/** Véhicule de l'armée de Terre à l'échelle 1 (mètres), roues ou chenilles au sol en y = 0 ; nez vers x négatif. */
function vehicule(THREE, type) {
  const [construire, s] = type === 'leclerc' ? [construireLeclerc, 1.35] : [construireGriffon, 1.45];
  const objet = construire(THREE);
  objet.position.y += 2.2; // sol de ces modèles en y = −2,2
  const c = new THREE.Group();
  c.add(objet);
  c.scale.setScalar(1 / s);
  return c;
}

/** Texture de bouffée de fumée : disque blanc aux bords fondus. */
function textureFumee(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Fumée des accélérateurs : réserve de bouffées (sprites aux bords fondus, toujours face à la caméra)
 * qui grossissent, montent lentement, dérivent vers l'arrière (vent relatif du navire en route) et
 * s'estompent.
 */
function fumees(THREE, n = 450) {
  const groupe = new THREE.Group();
  const carte = textureFumee(THREE);
  const hasard = alea(31);
  const bouffees = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: carte, color: 0xe9e9e4, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    m.renderOrder = 3;
    groupe.add(m);
    bouffees.push({ m, age: 0, vie: 1, r0: 1, r1: 4, o: 0.5, v: new THREE.Vector3() });
  }
  let suivante = 0;
  return {
    groupe,
    emettre(x, y, z, { r0 = 0.8, r1 = 5, vie = 5, opacite = 0.5, vent = [6, 0.8, 0], teinte = 0xe9e9e4 } = {}) {
      const b = bouffees[suivante];
      suivante = (suivante + 1) % n;
      b.m.position.set(x + (hasard() - 0.5) * 0.6, y + (hasard() - 0.5) * 0.6, z + (hasard() - 0.5) * 0.6);
      b.age = 0;
      b.vie = vie * (0.75 + hasard() * 0.5);
      b.r0 = r0; b.r1 = r1 * (0.75 + hasard() * 0.5); b.o = opacite;
      b.v.set(vent[0] + (hasard() - 0.5) * 2, vent[1] + hasard() * 0.8, vent[2] + (hasard() - 0.5) * 2);
      b.m.material.rotation = hasard() * TOUR;
      b.m.material.color.setHex(teinte);
      b.m.visible = true;
    },
    animer(dt) {
      for (const b of bouffees) {
        if (!b.m.visible) continue;
        b.age += dt;
        const u = b.age / b.vie;
        if (u >= 1) { b.m.visible = false; continue; }
        b.m.position.addScaledVector(b.v, dt);
        const r = b.r0 + (b.r1 - b.r0) * Math.sqrt(u);
        b.m.scale.set(2 * r, 2 * r, 1);
        b.m.material.opacity = b.o * (1 - u) * Math.min(1, b.age * 8);
      }
    },
  };
}

/** Flamme d'accélérateur (deux cônes lumineux) pointée vers −y, et sa lueur sur le pont. */
function flammeMissile(THREE, rayon, longueur) {
  const g = new THREE.Group();
  const coeur = new THREE.Mesh(new THREE.ConeGeometry(rayon * 0.7, longueur * 0.55, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3c8, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
  const halo = new THREE.Mesh(new THREE.ConeGeometry(rayon * 1.3, longueur, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xff9440, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  coeur.rotation.x = halo.rotation.x = Math.PI;
  coeur.position.y = -longueur * 0.27;
  halo.position.y = -longueur * 0.5;
  const lueur = new THREE.PointLight(0xffb066, 0, 0, 2);
  lueur.position.y = -longueur * 0.4;
  g.add(halo, coeur, lueur);
  g.userData.lueur = lueur;
  return g;
}

/**
 * Missile de croisière naval (MdCN, MBDA), en mètres, pointe vers +y, culot de l'accélérateur en y = 0 :
 * environ 6,3 m et 1,4 t au lancement, corps de 0,5 m de diamètre (ordres de grandeur). Accélérateur à
 * poudre à l'arrière (largué après le basculement), ailes, empennages et entrée d'air déployés ensuite.
 * Le dessus du missile (côté des ailes) est vers +x.
 */
function missileMdcn(THREE) {
  const g = new THREE.Group();
  const blanc = new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.42, metalness: 0.25 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x8c9298, roughness: 0.5, metalness: 0.3 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2c3035, roughness: 0.6, metalness: 0.3 });
  const R = 0.25;
  const corps = new THREE.Group();
  corps.position.y = 1.25;
  const fut = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.92, 4.4, 20), blanc);
  fut.position.y = 2.2;
  const ogive = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 12, 0, TOUR, 0, Math.PI / 2), blanc);
  ogive.scale.y = 2.6;
  ogive.position.y = 4.4;
  const fenetre = new THREE.Mesh(new THREE.SphereGeometry(R * 0.42, 12, 8), new THREE.MeshStandardMaterial({ color: 0x14202b, metalness: 0.8, roughness: 0.1 }));
  fenetre.position.y = 4.95;
  fenetre.scale.y = 0.8;
  corps.add(fut, ogive, fenetre);
  // Ailes repliées sur le dos, déployées en vol (envergure d'environ 2,5 m)
  const ailes = [];
  for (const c of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(R * 0.95, 2.6, 0);
    const aile = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 1.25), gris);
    aile.position.z = c * 0.62;
    pivot.add(aile);
    pivot.userData.cote = c;
    corps.add(pivot);
    ailes.push(pivot);
  }
  // Empennages en X et entrée d'air ventrale, qui sortent après le largage de l'accélérateur
  const empennages = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.03), gris);
    e.position.set(Math.cos(a) * (R + 0.18), 0.25, Math.sin(a) * (R + 0.18));
    e.rotation.y = -a;
    empennages.add(e);
  }
  const entree = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.26), sombre);
  entree.position.set(-R - 0.08, 0.9, 0);
  empennages.add(entree);
  corps.add(empennages);
  const tuyereCroisiere = new THREE.Mesh(new THREE.CircleGeometry(R * 0.55, 14), new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0, depthWrite: false }));
  tuyereCroisiere.rotation.x = Math.PI / 2;
  tuyereCroisiere.position.y = -0.01;
  corps.add(tuyereCroisiere);
  // Accélérateur : bloc à poudre gris foncé, tuyère, flamme
  const accelerateur = new THREE.Group();
  const bloc = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.96, 1.25, 20), sombre);
  bloc.position.y = 0.62;
  const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.45, R * 0.7, 0.3, 16, 1, true), sombre);
  tuyere.position.y = -0.12;
  const flamme = flammeMissile(THREE, 0.32, 3.2);
  flamme.position.y = -0.2;
  accelerateur.add(bloc, tuyere, flamme);
  g.add(corps, accelerateur);
  return {
    groupe: g, accelerateur, flamme,
    deployer(u) {
      for (const p of ailes) p.rotation.x = p.userData.cote * (1 - u) * (Math.PI / 2) * -1;
      empennages.scale.setScalar(0.25 + 0.75 * u);
      tuyereCroisiere.material.opacity = 0.8 * u;
    },
  };
}

/**
 * Missile Aster (MBDA), en mètres, pointe vers +y : flèche fine à longues ailettes (0,18 m de diamètre)
 * sur un accélérateur plus gros à quatre ailerons. Aster 30 : 4,9 m ; Aster 15 : 4,2 m (accélérateur
 * plus court).
 */
function missileAster(THREE, version = 30) {
  const g = new THREE.Group();
  const blanc = new THREE.MeshStandardMaterial({ color: 0xe6e8ea, roughness: 0.4, metalness: 0.2 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.55, metalness: 0.3 });
  const lb = version === 30 ? 2.35 : 1.65; // longueur de l'accélérateur
  const fleche = new THREE.Group();
  fleche.position.y = lb;
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.1, 14), blanc);
  corps.position.y = 1.05;
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 14), sombre);
  pointe.position.y = 2.32;
  fleche.add(corps, pointe);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const ailette = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.015), blanc);
    ailette.position.set(Math.cos(a) * 0.15, 1.0, Math.sin(a) * 0.15);
    ailette.rotation.y = -a;
    const gouverne = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.015), blanc);
    gouverne.position.set(Math.cos(a) * 0.17, 0.12, Math.sin(a) * 0.17);
    gouverne.rotation.y = -a;
    fleche.add(ailette, gouverne);
  }
  const accelerateur = new THREE.Group();
  const bloc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, lb, 16), blanc);
  bloc.position.y = lb / 2;
  const jupe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.3, 16), sombre);
  jupe.position.y = lb + 0.1;
  accelerateur.add(bloc, jupe);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const aileron = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.02), sombre);
    aileron.position.set(Math.cos(a) * 0.27, 0.3, Math.sin(a) * 0.27);
    aileron.rotation.y = -a;
    accelerateur.add(aileron);
  }
  const flamme = flammeMissile(THREE, 0.2, 2.6);
  flamme.position.y = -0.05;
  accelerateur.add(flamme);
  g.add(fleche, accelerateur);
  return { groupe: g, accelerateur, flamme, deployer() {} };
}

/**
 * Tir vertical depuis une cellule Sylver (repère du navire, en mètres) : la trappe s'ouvre,
 * l'accélérateur sort le missile de sa cellule dans un nuage de fumée, puis
 *  - missile de croisière naval : basculement vers l'horizontale, largage de l'accélérateur qui
 *    retombe à la mer, ailes, empennages et entrée d'air déployés, turboréacteur, vol au ras de l'eau
 *    vers sa cible (en réalité à plus de 1 000 km) ;
 *  - Aster : montée presque verticale très rapide, largage de l'accélérateur, virage vers la menace.
 * Une cellule différente à chaque tir. Altitudes de croisière et distances resserrées.
 */
function tirVertical(THREE, parent, { type, cellules, fumee, cap = 0 }) {
  const m = type === 'mdcn' ? missileMdcn(THREE) : missileAster(THREE, type === 'aster15' ? 15 : 30);
  m.groupe.visible = false;
  m.groupe.userData.missile = type;
  m.accelerateur.userData.accelerateur = type;
  parent.add(m.groupe);
  const chute = { actif: false, p: new THREE.Vector3(), v: new THREE.Vector3(), w: new THREE.Vector3() };
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), D = new THREE.Vector3(), H = new THREE.Vector3(), U = new THREE.Vector3(), S = new THREE.Vector3();
  const base = new THREE.Matrix4();
  const [hx, hz] = nez(cap);
  let debut = null, avant = null, n = 0, cellule = null, theta = 0, v = 0, largue = false, emission = 0;
  const orienter = (objet, pos, th) => {
    // Axe du missile (+y) vers la direction de vol ; son dos (+x) vers le haut une fois à l'horizontale
    D.set(Math.sin(th) * hx, Math.cos(th), Math.sin(th) * hz);
    U.set(-Math.cos(th) * hx, Math.sin(th), -Math.cos(th) * hz);
    S.crossVectors(U, D);
    base.makeBasis(U, D, S);
    objet.quaternion.setFromRotationMatrix(base);
    objet.position.copy(pos);
  };
  return {
    get enVol() { return debut !== null; },
    tirer(t) {
      if (debut !== null) return;
      cellule = cellules[n % cellules.length];
      n += 1;
      debut = t; largue = false; chute.actif = false; theta = 0; v = 6; emission = 0;
      P.set(cellule.x, cellule.y - 1.2, cellule.z);
      m.accelerateur.visible = true;
      m.groupe.add(m.accelerateur);
      m.accelerateur.position.set(0, 0, 0);
      m.accelerateur.quaternion.identity();
      m.deployer(0);
    },
    animer(t) {
      const dt = avant === null ? 0 : Math.min(0.05, Math.max(0, (t - avant) / 1000));
      avant = t;
      if (chute.actif) {
        // Accélérateur largué : retombe en tournoyant, gerbe d'eau à l'impact
        chute.v.y -= 9.81 * dt;
        chute.p.addScaledVector(chute.v, dt);
        m.accelerateur.position.copy(chute.p);
        m.accelerateur.rotation.x += chute.w.x * dt;
        m.accelerateur.rotation.z += chute.w.z * dt;
        if (chute.p.y < 0) {
          chute.actif = false;
          m.accelerateur.visible = false;
          for (let i = 0; i < 6; i++) fumee.emettre(chute.p.x, 0.5, chute.p.z, { r0: 1, r1: 5, vie: 2.5, opacite: 0.7, vent: [0, 3, 0], teinte: 0xffffff });
        }
      }
      if (debut === null || !cellule) return;
      const tau = (t - debut) / 1000 - 0.9; // 0,9 s d'ouverture de la trappe avant la mise à feu
      cellule.trappe.rotation.z = 1.75 * (tau < 2.5 ? lisse((tau + 0.9) / 0.6) : 1 - lisse((tau - 2.5) / 1.5));
      if (tau < 0) { m.groupe.visible = false; return; }
      m.groupe.visible = true;
      const mdcn = type === 'mdcn';
      const finAcc = mdcn ? 3.8 : type === 'aster15' ? 1.9 : 2.4;
      // Vitesse et assiette (theta : 0 à la verticale, π/2 à l'horizontale, au-delà en piqué)
      if (mdcn) {
        v = tau < finAcc ? 8 + 18 * tau : 76 + 150 * lisse((tau - finAcc) / 5);
        const arc = (Math.PI / 2 + 0.12) * lisse((tau - 1.5) / 2.7);
        const tenue = Math.PI / 2 + Math.max(-0.04, Math.min(0.14, (P.y - 12) * 0.006));
        theta = tau < 4.2 ? arc : theta + (tenue - theta) * Math.min(1, dt * 2);
      } else {
        v = tau < finAcc ? 15 + 95 * tau : 15 + 95 * finAcc + 120 * (tau - finAcc);
        theta = 0.75 * lisse((tau - finAcc) / 1.5);
      }
      orienter(m.groupe, P, theta);
      Q.copy(P);
      P.addScaledVector(D, v * dt);
      // Flamme, lueur et fumée pendant la combustion de l'accélérateur
      const brule = tau < finAcc && !largue;
      m.flamme.visible = brule;
      m.flamme.userData.lueur.intensity = brule ? (tau < 0.6 ? 0.35 : 0.18) * (0.85 + 0.3 * Math.sin(t / 23)) : 0;
      m.flamme.scale.setScalar(0.9 + 0.2 * Math.sin(t / 17));
      if (brule) {
        // Bouffées réparties le long du trajet parcouru pendant l'image (au moins une tous les 1,5 m
        // et tous les centièmes de seconde), pour une traînée continue quelle que soit la cadence
        emission += dt;
        const n = Math.min(14, Math.max(Math.ceil((v * dt) / 1.5), Math.floor(emission / 0.012)));
        if (n > 0) emission = 0;
        for (let k = 1; k <= n; k++) {
          H.copy(Q).lerp(P, k / n).addScaledVector(D, -0.5);
          fumee.emettre(H.x, H.y, H.z, { r0: mdcn ? 1 : 0.6, r1: mdcn ? 6.5 : 4.5, vie: mdcn ? 6 : 6.5, opacite: 0.45 });
          // Gaz rejetés par le conduit du lanceur : gros nuage au ras du pont au départ
          if (tau < 1 && k % 2 === 1) fumee.emettre(cellule.x + 1.2, cellule.y + 1, cellule.z, { r0: 1.5, r1: 10, vie: 5, opacite: 0.55, vent: [7, 1.8, 0] });
        }
      }
      if (!largue && tau >= finAcc) {
        // Largage : l'accélérateur continue sur sa lancée et retombe
        largue = true;
        m.accelerateur.getWorldPosition(H);
        parent.worldToLocal(H);
        chute.p.copy(H);
        chute.v.copy(D).multiplyScalar(v * 0.85);
        chute.w.set(1.5, 0, 2.2);
        const q = m.accelerateur.getWorldQuaternion(new THREE.Quaternion());
        const qp = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        parent.add(m.accelerateur);
        m.accelerateur.position.copy(chute.p);
        m.accelerateur.quaternion.copy(qp.multiply(q));
        chute.actif = true;
      }
      if (mdcn) m.deployer(lisse((tau - finAcc - 0.15) / 0.6));
      const loin = Math.hypot(P.x - cellule.x, P.z - cellule.z);
      if (loin > 1400 || P.y > 1500 || tau > 16) { debut = null; m.groupe.visible = false; }
    },
  };
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

/**
 * Engin de débarquement amphibie rapide (EDA-R, catamaran L-CAT de CNIM), en mètres : environ 30 m de
 * long, deux coques latérales, plateforme centrale de 126 m² (80 t, un char Leclerc) relevée en transit
 * et abaissée pour s'échouer, rampe avant, timonerie sur la coque tribord. Origine au centre, à la
 * flottaison ; quille en y = −0,95 ; nez vers x négatif.
 * userData : plateforme(u) (0 relevée, 1 abaissée), rampe(u) (0 levée, 1 posée), pont(u) (hauteur du
 * plateau), charge (véhicules), sillage.
 */
function construireEdaR(THREE, charge = []) {
  const g = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0x8b9196, roughness: 0.62, metalness: 0.15 });
  const clair = new THREE.MeshStandardMaterial({ color: 0xa9aeb2, roughness: 0.6, metalness: 0.12 });
  const fonce = new THREE.MeshStandardMaterial({ color: 0x4d5257, roughness: 0.75, metalness: 0.2 });
  const vitres = new THREE.MeshStandardMaterial({ color: 0x1b2631, metalness: 0.6, roughness: 0.18 });
  const carene = new THREE.MeshStandardMaterial({ color: 0x6e1b16, roughness: 0.7 });
  for (const c of [-1, 1]) {
    // Coque latérale : étrave relevée à l'avant, flancs droits, carène rouge sous la flottaison
    const cles = [
      { x: -14.7, w: 0.5, hHaut: 0.7, hBas: 0.1, y: 1.4, z: c * 5.2, n: 2 },
      { x: -13.7, w: 1.8, hHaut: 1.2, hBas: 0.9, y: 0.9, z: c * 5.2, n: 3 },
      { x: -11.8, w: 2.4, hHaut: 1.35, hBas: 1.5, y: 0.6, z: c * 5.2, n: 4 },
      { x: 14.3, w: 2.4, hHaut: 1.35, hBas: 1.5, y: 0.6, z: c * 5.2, n: 4 },
      { x: 14.7, w: 2.2, hHaut: 1.3, hBas: 1.4, y: 0.6, z: c * 5.2, n: 4 },
    ];
    g.add(new THREE.Mesh(loft(THREE, cles, { segments: 24, parSegment: 3 }), gris));
    const immerge = cles.map((k) => {
      const b = k.y - k.hBas, h = -b;
      return b >= 0 ? { ...k, w: 0.01, y: 0, hHaut: 0.01, hBas: 0.01 } : { ...k, w: k.w + 0.04, y: b / 2, hHaut: h / 2 + 0.02, hBas: h / 2 + 0.02 };
    });
    g.add(new THREE.Mesh(loft(THREE, immerge, { segments: 24, parSegment: 3 }), carene));
    // Pavois et passavant sur chaque coque
    g.add(bloc(THREE, gris, 25, 1.3, 0.25, 0.8, 1.95, c * 6.28));
    g.add(bloc(THREE, fonce, 25, 0.12, 2.2, 0.8, 1.95, c * 5.2));
  }
  // Timonerie sur la coque tribord, à l'arrière : passerelle vitrée, mât radar
  g.add(bloc(THREE, clair, 4.6, 2.4, 2.6, 10.5, 2.0, -5.2));
  g.add(fenetres(THREE, vitres, { x1: 8.15, y: 3.65, z: -4.2, zMin: -6.2, n: 3, l: 0.6, h: 0.7, face: 'x' }));
  g.add(fenetres(THREE, vitres, { x1: 9, x2: 12, y: 3.65, z: 1.32, n: 3, l: 0.7, h: 0.6 }).translateZ(-5.2));
  g.add(matPoteau(THREE, fonce, 11, 4.4, -5.2, 1.4, { r: 0.08, vergues: [[1.1, 1.2]] }));
  // Plateforme centrale (environ 20 × 6,3 m) : relevée en transit, abaissée à l'échouage ; rampe avant
  const plateforme = new THREE.Group();
  plateforme.add(bloc(THREE, fonce, 20, 0.7, 6.4, 0, -0.7, 0));
  plateforme.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xd8b13a, roughness: 0.7 }), [[0, 0.01, -3.05, 20, 0.02, 0.15], [0, 0.01, 3.05, 20, 0.02, 0.15]]));
  const rampe = new THREE.Group();
  rampe.position.set(-10, 0, 0);
  rampe.add(bloc(THREE, gris, 5, 0.22, 6, -2.5, -0.22, 0));
  plateforme.add(rampe);
  g.add(plateforme);
  const haut = 2.1, basse = 1.0; // hauteur du plateau au-dessus de la flottaison
  for (const v of charge) plateforme.add(v.objet);
  const sl = sillage(THREE, 29.4, 12.8);
  sl.position.set(14.7, 0.05, 0);
  sl.material.opacity = 0;
  g.add(sl);
  g.userData.charge = charge;
  g.userData.sillage = sl;
  g.userData.pont = (u) => haut + (basse - haut) * u;
  g.userData.plateforme = (u) => { plateforme.position.y = haut + (basse - haut) * u; };
  g.userData.rampe = (u) => { rampe.rotation.z = -Math.PI / 2 + (Math.PI / 2 + Math.asin(basse / 5)) * u; };
  g.userData.plateforme(0);
  g.userData.rampe(0);
  return g;
}

/**
 * Côte de débarquement, en mètres dans le repère du navire : trait de côte perpendiculaire à l'axe x
 * en x = xc, plage de sable en pente douce (5 %), dunes et pins, collines. Distances resserrées.
 */
function plageDebarquement(THREE, xc) {
  const g = new THREE.Group();
  const sable = new THREE.MeshStandardMaterial({ color: 0xcdb98f, roughness: 0.95, metalness: 0 });
  sable.userData.sansDetails = true;
  const mouille = new THREE.MeshStandardMaterial({ color: 0xb09a6e, roughness: 0.55, metalness: 0 });
  mouille.userData.sansDetails = true;
  const quad = (mat, x0, y0, x1, y1, z0, z1) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, z0, x0, y0, z1, x1, y1, z1, x1, y1, z0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  };
  // Pente de 5 % : y = (x − xc) × 0,05, du fond (−2,5 m) au pied des dunes (+3,5 m)
  g.add(quad(sable, xc - 50, -2.5, xc + 70, 3.5, -520, 520));
  g.add(quad(mouille, xc - 4, -0.16, xc + 7, 0.39, -520, 520));
  const hasard = alea(77);
  const dune = new THREE.MeshStandardMaterial({ color: 0xbfb284, roughness: 1, flatShading: true });
  const herbe = new THREE.MeshStandardMaterial({ color: 0x8a8f5a, roughness: 1, flatShading: true });
  const garrigue = new THREE.MeshStandardMaterial({ color: 0x6f7650, roughness: 1, flatShading: true });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x5b6443, roughness: 1, flatShading: true });
  for (const m of [dune, herbe, garrigue, sombre]) m.userData.sansDetails = true;
  // Reliefs bosselés (icosaèdres déformés), pour éviter les dômes trop lisses
  const relief = (graine) => {
    const geo = new THREE.IcosahedronGeometry(1, 3);
    const h = alea(graine), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (h() - 0.5) * 0.22; p.setXYZ(i, p.getX(i) * k, Math.max(-0.2, p.getY(i)) * k, p.getZ(i) * k); }
    geo.computeVertexNormals();
    return geo;
  };
  const formes = [relief(3), relief(5), relief(9)];
  let n = 0;
  const mont = (mat, x, z, l, h, p) => { const o = new THREE.Mesh(formes[n++ % 3], mat); o.scale.set(p, h, l); o.position.set(x, 0.5, z); g.add(o); };
  for (let z = -500; z <= 500; z += 45) mont(hasard() > 0.45 ? dune : herbe, xc + 82 + hasard() * 18, z + hasard() * 20, 30 + hasard() * 25, 5 + hasard() * 6, 18 + hasard() * 10);
  for (const [dx, z, l, h, p, mat] of [[260, -430, 230, 60, 120, garrigue], [340, -150, 260, 85, 150, sombre], [240, 60, 150, 45, 90, garrigue], [300, 260, 200, 70, 120, sombre], [380, 470, 240, 80, 140, garrigue], [170, -270, 80, 22, 50, herbe], [180, 380, 90, 25, 55, herbe]]) mont(mat, xc + dx, z, l, h, p);
  // Pins sur les dunes
  const pin = new THREE.Mesh(new THREE.ConeGeometry(2.2, 9, 7), new THREE.MeshStandardMaterial({ color: 0x3e5a36, roughness: 0.95 }));
  pin.material.userData.sansDetails = true;
  const pins = new THREE.InstancedMesh(pin.geometry, pin.material, 70);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 70; i++) {
    const e = 0.8 + hasard() * 0.6;
    m4.compose(new THREE.Vector3(xc + 105 + hasard() * 80, 4 + hasard() * 6, -480 + hasard() * 960), new THREE.Quaternion(), new THREE.Vector3(e, e, e));
    pins.setMatrixAt(i, m4);
  }
  g.add(pins);
  return g;
}

/**
 * Suiveur de poste en vol : se déplace vers sa cible (fixe ou en orbite) à vitesse bornée, cap dans le
 * sens du déplacement, ou cap de la cible à l'arrêt. Sert à passer d'un poste à l'autre en douceur.
 */
function suiveur(depart, cap) {
  const etat = { position: [...depart], cap };
  return {
    etat,
    suivre(cible, capCible, dt, vmax = 40) {
      const d = cible.map((v, i) => v - etat.position[i]);
      const n = Math.hypot(...d);
      const pas = Math.min(n, vmax * dt);
      if (n > 1e-6) etat.position = etat.position.map((v, i) => v + (d[i] / n) * pas);
      const vise = n > 3 ? Math.atan2(d[2], -d[0]) : capCible;
      etat.cap += angleNormal(vise - etat.cap) * Math.min(1, dt * 1.5);
    },
  };
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
 * (passerelle, mât principal, radômes), ascenseurs, radier à la poupe.
 * Sur le pont : deux Tigre de l'ALAT et trois Caïman Marine (pales repliées,
 * dépliées au décollage). Mode amphibie : le navire ballaste pour noyer son
 * radier (57,5 × 15,4 × 8,2 m), abaisse sa porte, et les deux engins de
 * débarquement rapides (EDA-R) sortent en marche arrière, l'un avec un char
 * Leclerc, l'autre avec deux Griffon, filent vers la plage, s'y échouent et
 * débarquent leurs véhicules ; les hélicoptères en vol se portent sur la plage.
 * Commandes : décollage des Caïman, des Tigre, mode amphibie.
 * leger : version simplifiée pour les scènes de groupe (hélicoptères sommaires, sans radier ni plage).
 */
export function construirePha(THREE, { leger = false } = {}) {
  const L = 199, B = 32, D = 20;
  const s = 13 / L;
  const navire = new THREE.Group();
  // Coque, superstructures et hélicoptères forment un ensemble qui s'enfonce quand le navire ballaste
  // pour noyer son radier ; la mer, les engins de débarquement à flot et la côte n'en font pas partie.
  const corps = new THREE.Group();
  navire.add(corps);
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
  // Radier : 57,5 m × 15,4 m × 8,2 m, fond à 0,8 m au-dessus de la flottaison (navire non ballasté)
  const RADIER = { long: 57.5, demi: 7.7, bas: 0.8, haut: 9.0 };
  const { coque, pont, tableau } = coqueNavire(THREE, stations, { gris: [0.24, 0.26, 0.28], couleurPont: 0x4b4f54, bombe: 0.05, ouvertureArriere: leger ? null : RADIER });
  corps.add(coque, pont);
  if (tableau) corps.add(tableau);
  // Bulbe d'étrave
  const bulbe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: 0x6e1b16, roughness: 0.7 }));
  bulbe.scale.set(5.2, 2.1, 1.9);
  bulbe.position.set(7, -3.6, 0);
  corps.add(bulbe);
  // Marquages du pont d'envol
  const contour = [[0, -6], [6, -9.5], [15, -12.5], [30, -15.5], [45, -16], [L, -16], [L, 16], [45, 16], [30, 15.5], [15, 12.5], [6, 9.5], [0, 6]];
  const marquages = new THREE.Mesh(new THREE.PlaneGeometry(L, B), new THREE.MeshStandardMaterial({ map: texturePontPha(THREE, contour, L, B), transparent: true, alphaTest: 0.4, roughness: 0.85 }));
  marquages.rotation.x = -Math.PI / 2;
  marquages.position.set(L / 2, D + 0.08, 0);
  corps.add(marquages);
  // Coursive sombre sous la lisse du pont, ouvertures et portes latérales, numéro de coque
  const sombre = [];
  for (const c of [-1, 1]) {
    for (let x = 47; x < 196; x += 3) sombre.push([x, D - 1.4, c * 16.03, 1.6, 0.8, 0.1]);
    for (const x of [118, 150]) sombre.push([x, 5.5, c * 14.7, 7, 4.2, 0.1]);
    for (const x of [64, 66.5, 69, 71.5, 74]) sombre.push([x, D - 4.2, c * 16.03, 1.2, 0.9, 0.1]);
    for (const x of [170, 172.5, 175]) sombre.push([x, 9, c * 14.65, 1.2, 0.9, 0.1]);
  }
  corps.add(pieces(THREE, M.noir, sombre));
  corps.add(numeroCoque(THREE, 'L9013', { x: 34, y: 13.2, z: 15.25, hauteur: 3.6 }));

  // Île à tribord : deux niveaux de base, passerelle vitrée et ses ailerons, mât avant, mât principal
  // treillis portant le radar de veille, tour arrière à radôme, cheminée des diesels
  const zi = -11.3;
  corps.add(blocIncline(THREE, M.gris, 42, 6, 9.4, 41.5, 9.2, 71, D, zi));
  corps.add(blocIncline(THREE, M.gris, 37, 3.2, 9.2, 36, 8.8, 68.5, D + 6, zi));
  corps.add(blocIncline(THREE, M.gris, 16, 3.4, 9, 15.4, 8.6, 58, D + 9.2, zi));
  corps.add(bloc(THREE, M.gris, 4, 0.5, 13, 51.8, D + 11.6, zi));
  corps.add(fenetres(THREE, M.vitres, { x1: 49.95, y: D + 11.2, z: -5.2, zMin: -17.3, n: 7, l: 1.3, h: 1.2, face: 'x' }));
  corps.add(fenetres(THREE, M.vitres, { x1: 51, x2: 64, y: D + 11.2, z: 4.55, n: 6, l: 1.4, h: 1.1 }).translateZ(zi));
  corps.add(fenetres(THREE, M.vitres, { x1: 50.05, y: D + 7.6, z: -6.8, zMin: -15.8, n: 6, l: 1.1, h: 1.0, face: 'x' }));
  corps.add(blocIncline(THREE, M.gris, 10, 2.6, 7, 9, 6.4, 57, D + 12.6, zi));
  corps.add(fenetres(THREE, M.vitres, { x1: 52.4, y: D + 13.9, z: -8.4, zMin: -14.2, n: 4, l: 1.1, h: 0.9, face: 'x' }));
  corps.add(bloc(THREE, M.fonce, 11, 0.3, 7.6, 57, D + 15.2, zi));
  corps.add(matPoteau(THREE, M.fonce, 56, D + 15.5, zi, 10, { r: 0.4, vergues: [[5, 6], [8.5, 3]] }));
  corps.add(blocIncline(THREE, M.gris, 7, 9, 6, 4.8, 4.4, 69.5, D + 9.2, zi));
  corps.add(bloc(THREE, M.fonce, 6.5, 0.35, 6.5, 69.5, D + 18.2, zi));
  const treillis = [];
  for (let k = 0; k < 6; k++) treillis.push([69.5, D + 19.5 + k * 2.2, zi, 2.2 - k * 0.25, 0.15, 2.2 - k * 0.25]);
  for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) treillis.push([69.5 + dx * 0.75, D + 24.5, zi + dz * 0.75, 0.18, 10.5, 0.18]);
  corps.add(pieces(THREE, M.fonce, treillis));
  corps.add(matPoteau(THREE, M.fonce, 69.5, D + 29.5, zi, 7, { r: 0.25, vergues: [[1.5, 6.5]] }));
  const radar = bloc(THREE, M.fonce, 0.9, 1.8, 4.4, 69.5, D + 26.6, zi);
  corps.add(radar);
  corps.add(blocIncline(THREE, M.gris, 8, 6, 7.4, 6.6, 6.2, 82, D + 9.2, zi));
  corps.add(radome(THREE, M.blanc, M.gris, 1.9, 82, D + 15.2, zi, 1.0));
  corps.add(radome(THREE, M.blanc, M.gris, 1.7, 64.5, D + 12.6, zi - 3.4, 0.9));
  corps.add(radome(THREE, M.blanc, M.gris, 1.5, 75.5, D + 9.2, zi + 3.3, 0.8));
  corps.add(blocIncline(THREE, M.gris, 4, 3, 4.5, 3.4, 3.8, 89.5, D + 9.2, zi - 1.5));
  corps.add(bloc(THREE, M.noir, 3.4, 0.4, 3.8, 89.5, D + 12.2, zi - 1.5));
  // Postes de missiles Simbad et passavants
  for (const [x, z] of [[40, -15], [40, 15], [192, -15], [192, 15]]) corps.add(bloc(THREE, M.fonce, 1.4, 1.2, 1.4, x, D + 0.1, z));
  // Tracteurs de pont
  for (const [x, z, m] of [[95, -3.5, M.jaune], [99, -3.5, M.jaune], [104, -4.2, M.rouge], [45, -4, M.rouge], [150, -4, M.jaune]]) corps.add(bloc(THREE, m, 3, 1.4, 1.8, x, D, z));

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  const legendes = [
    { texte: 'Île à tribord : passerelle et mât radar', point: p(69.5, D + 27, zi) },
    { texte: 'Pont d\'envol : six spots d\'hélicoptères', point: p(30, D + 1, 3) },
    { texte: 'Radômes de télécommunications', point: p(86, D + 18, zi) },
    { texte: 'Ascenseur arrière (hangar à hélicoptères)', point: p(190, D + 0.5, 0) },
    { texte: 'Radier : porte des engins de débarquement', point: p(L, 7, 0) },
    { texte: 'Étrave à bulbe', point: p(4, -2, 0) },
  ];
  groupe.userData.legendes = legendes;

  if (leger) {
    // Scènes de groupe : deux hélicoptères sommaires et la porte du radier fermée
    corps.add(pieces(THREE, M.fonce, [[L + 0.05, 6.5, 0, 0.2, 11, 15.5]]));
    const helicos = [nh90(THREE, M.fonce, M.noir), nh90(THREE, M.fonce, M.noir)];
    helicos[0].position.set(105, D, 3); helicos[0].rotation.y = 0.02;
    helicos[1].position.set(135, D, 3); helicos[1].rotation.y = -0.02;
    corps.add(...helicos);
    legendes.splice(2, 0, { texte: 'Hélicoptères Caïman', point: p(110, D + 4, 3) });
    groupe.userData.commandes = [];
    return groupe;
  }

  // ---- Radier : caisson intérieur (vu par la porte ouverte), éclairage, marquages ; porte basculante
  const parois = new THREE.MeshStandardMaterial({ color: 0x6a6f74, roughness: 0.85, metalness: 0.1, side: THREE.BackSide });
  parois.userData.sansDetails = true;
  // Le caisson va un peu au-delà des 57,5 m du radier : rampe d'accès au garage, à l'avant
  const LC = 60.5;
  const caisson = new THREE.Mesh(new THREE.BoxGeometry(LC, RADIER.haut - RADIER.bas, 2 * RADIER.demi), parois);
  caisson.position.set(L - LC / 2 + 0.02, (RADIER.haut + RADIER.bas) / 2, 0);
  corps.add(caisson);
  const lampes = new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffe6b0, emissiveIntensity: 1.4, roughness: 0.5 });
  const lignes = [];
  for (let x = L - 54; x < L - 2; x += 6) lignes.push([x, RADIER.haut - 0.12, -4, 2.4, 0.12, 0.3], [x, RADIER.haut - 0.12, 4, 2.4, 0.12, 0.3]);
  corps.add(pieces(THREE, lampes, lignes));
  corps.add(pieces(THREE, M.jaune, [[L - RADIER.long / 2, RADIER.bas + 0.02, -RADIER.demi + 0.6, RADIER.long - 1, 0.03, 0.25], [L - RADIER.long / 2, RADIER.bas + 0.02, RADIER.demi - 0.6, RADIER.long - 1, 0.03, 0.25], [L - 0.8, RADIER.bas + 0.02, 0, 0.5, 0.03, 2 * RADIER.demi - 0.4]]));
  const porte = new THREE.Group();
  porte.position.set(L + 0.05, RADIER.bas, 0);
  const hPorte = RADIER.haut - RADIER.bas + 0.4;
  porte.add(bloc(THREE, M.gris, 0.5, hPorte, 2 * RADIER.demi + 0.6, 0.25, 0, 0));
  porte.add(pieces(THREE, M.fonce, [1.6, 3.6, 5.6, 7.6].map((y) => [0.53, y, 0, 0.08, 0.25, 2 * RADIER.demi + 0.2])));
  porte.add(pieces(THREE, M.metal, [-6, -2, 2, 6].map((z) => [0.3, 0.05, z, 0.7, 0.4, 0.8])));
  corps.add(porte);
  legendes.push({ texte: 'Radier noyé : 57,5 × 15,4 m, deux EDA-R', point: p(L - 20, RADIER.haut - 1, 0) });

  // ---- Hélicoptères : deux Tigre de l'ALAT (spots 1 et 2), trois Caïman Marine (spots 3, 4 et 6)
  const yPont = D + 0.1;
  const tigres = [helicoEmbarque(THREE, 'tigre'), helicoEmbarque(THREE, 'tigre')];
  const caimans = [helicoEmbarque(THREE, 'caiman'), helicoEmbarque(THREE, 'caiman'), helicoEmbarque(THREE, 'caiman')];
  corps.add(...tigres, ...caimans);
  caimans[2].position.set(172, yPont, 3);
  caimans[2].rotation.y = 0.05;
  Object.assign(caimans[2].userData.helico, { regime: 0, repli: 1 });
  // Postes en vol : Caïman en stationnaire sur le côté bâbord, Tigre en orbite d'escorte autour du
  // navire ; en mode amphibie, les uns au-dessus de la plage, les autres en appui en orbite sur la côte.
  const XC = L + 450; // trait de côte (resserré : un débarquement commence en réalité bien plus au large)
  const plage = plageDebarquement(THREE, XC);
  navire.add(plage);
  const postesCaiman = [[70, 42, 92], [118, 48, 108]];
  const plageCaiman = [[XC + 40, 12, -45], [XC + 55, 13, 30]];
  const suivis = {
    caimans: postesCaiman.map((q) => suiveur(q, 1.2)),
    tigres: [0, 1].map((i) => suiveur([100 + 175 * Math.cos(i * 0.5), 55, 175 * Math.sin(i * 0.5)], 0)),
  };
  const orbite = (cx, cz, r, h, phase, t) => {
    const a = t / 1000 * (40 / r) + phase;
    return { position: [cx + r * Math.cos(a), h, cz + r * Math.sin(a)], cap: Math.atan2(Math.cos(a), Math.sin(a)) };
  };
  const vols = {
    caimans: caimans.slice(0, 2).map((h, i) => volEmbarque(h, {
      pose: [82 + 30 * i, yPont, 3], cap: 0, degagement: [-8, 15, 30], replie: true, duree: 24, retard: i * 4,
      poste: () => ({ position: suivis.caimans[i].etat.position, cap: suivis.caimans[i].etat.cap }),
    })),
    tigres: tigres.map((h, i) => volEmbarque(h, {
      pose: [22 + 30 * i, yPont, 3], cap: 0, degagement: [-10, 14, 26], duree: 20, retard: i * 3,
      poste: () => ({ position: suivis.tigres[i].etat.position, cap: suivis.tigres[i].etat.cap, assiette: 0.08 }),
    })),
  };
  legendes.push(
    { texte: 'Tigre de l\'ALAT : appui-feu et escorte', point: new THREE.Vector3() },
    { texte: 'Caïman Marine : transport d\'assaut, sauvetage', point: new THREE.Vector3() },
    { texte: 'Caïman Marine, pales repliées pour le hangar', point: p(172, D + 5, 6) },
  );
  const [legTigre, legCaiman] = legendes.slice(-3);

  // ---- Engins de débarquement : EDA-R 1 (un Leclerc) à l'arrière du radier, EDA-R 2 (deux Griffon) devant
  const leclerc = vehicule(THREE, 'leclerc');
  const griffons = [vehicule(THREE, 'griffon'), vehicule(THREE, 'griffon')];
  const edas = [
    { objet: construireEdaR(THREE, [{ objet: leclerc, x: 0.5 }]), x0: L - 15.1, z: -18, debut: 9 },
    { objet: construireEdaR(THREE, [{ objet: griffons[0], x: -4.2 }, { objet: griffons[1], x: 4.2 }]), x0: L - 44.6, z: 18, debut: 21 },
  ];
  for (const e of edas) {
    navire.add(e.objet);
    for (const v of e.objet.userData.charge) v.objet.position.set(v.x, 0, 0);
  }
  legendes.push(
    { texte: 'EDA-R : un char Leclerc (80 t au plus)', point: new THREE.Vector3() },
    { texte: 'EDA-R : deux Griffon', point: new THREE.Vector3() },
    { texte: 'Plage de débarquement (distance resserrée)', point: p(XC + 30, 12, 0) },
  );
  const legEda = legendes.slice(-3, -1);

  groupe.userData.commandes = [
    { id: 'decoller', libelle: 'Faire décoller les Caïman Marine', actif: 'Apponter les Caïman Marine' },
    { id: 'tigres', libelle: 'Faire décoller les Tigre', actif: 'Apponter les Tigre' },
    { id: 'amphibie', libelle: '⚓ Mode amphibie : radier et EDA-R', actif: 'Rembarquer (fin du mode amphibie)' },
  ];

  // Ballastage : l'arrière s'enfonce de 2,8 m, l'avant de 0,6 m
  const ENF_AV = 0.6, ALPHA = (2.8 - ENF_AV) / L;
  const fondRadier = (x, b) => RADIER.bas - b * (ENF_AV + x * ALPHA);
  const T_AMPHI = 82;
  let A = 0, H = 0, avant = null;
  const mondeVersGroupe = (v, x, y, z) => v.copy(p(x, y, z));
  groupe.userData.animer = (t, api = {}) => {
    const dt = avant === null ? 0 : Math.min(0.1, Math.max(0, (t - avant) / 1000));
    avant = t;
    // Mode amphibie : progression réversible (le rembarquement rejoue la séquence à l'envers, plus vite)
    A = Math.min(1, Math.max(0, A + (api.amphibie ? dt / T_AMPHI : (-2.5 * dt) / T_AMPHI)));
    H = Math.min(1, Math.max(0, H + ((api.amphibie ? 1 : -1) * dt) / 12));
    const tau = A * T_AMPHI;
    const b = lisse(tau / 8);
    corps.position.y = -b * ENF_AV;
    corps.rotation.z = -b * ALPHA;
    porte.rotation.z = -(Math.PI / 2 + 0.06) * lisse((tau - 2) / 7);
    // Engins de débarquement : sortie en marche arrière, demi-tour, transit, échouage, débarquement
    edas.forEach((e, i) => {
      const o = e.objet, d0 = e.debut;
      const xs = L + 45;
      const tSortie = 10 + i * 2, tTour = 6, tTransit = 26;
      const u1 = lisse((tau - d0) / tSortie), u2 = lisse((tau - d0 - tSortie) / tTour), w3 = (tau - d0 - tSortie - tTour) / tTransit, u3 = lisse(w3);
      const tEch = d0 + tSortie + tTour + tTransit;
      // Transit : ligne droite vers la plage avec un décalage latéral progressif ; cap dans le sens de la marche
      const transit = (w) => [xs + (XC - 15 - xs) * lisse(w), e.z * lisse(Math.min(1, Math.max(0, w)) * 1.4)];
      let x = e.x0 + (xs - e.x0) * u1, z = 0, cap = Math.PI * u2;
      if (u3 > 0) {
        [x, z] = transit(w3);
        const [x2, z2] = transit(Math.min(1, w3 + 0.02));
        cap = Math.hypot(x2 - x, z2 - z) > 0.05 ? Math.atan2(z2 - z, -(x2 - x)) : Math.PI;
      }
      // À flot (quille à −0,95 m) ou posé sur le fond du radier tant qu'il n'est pas noyé
      const fond = x < L ? fondRadier(x, b) : -10;
      const pose = fond > -0.95;
      o.position.set(x, pose ? fond + 0.95 : 0, z);
      o.rotation.set(0, cap, pose ? -b * ALPHA : 0);
      const vitesse = (u3 > 0 && u3 < 1) ? Math.sin(Math.PI * u3) : 0;
      o.userData.sillage.material.opacity = 0.1 * vitesse;
      const ech = lisse((tau - tEch) / 3), rampe = lisse((tau - tEch - 1) / 3);
      o.userData.plateforme(ech);
      o.userData.rampe(rampe);
      // Véhicules : descendent la rampe et montent sur la plage (pente de 5 %)
      const pont = o.userData.pont(ech);
      o.userData.charge.forEach((v, j) => {
        const u = lisse((tau - tEch - 4 - j * 2) / 7);
        const xl = v.x + u * (-34 + j * 9 - v.x);
        const surRampe = xl < -10 && xl > -15;
        const yl = xl >= -10 ? 0 : surRampe ? -pont * ((-10 - xl) / 5) : -pont + (-15 - xl) * 0.05;
        v.objet.position.set(xl, yl, 0);
        v.objet.rotation.z = surRampe ? Math.asin(pont / 5) : 0;
      });
      mondeVersGroupe(legEda[i].point, o.position.x, 7, o.position.z);
    });
    // Postes en vol : sur le côté du navire, ou au-dessus de la plage en mode amphibie
    const h = lisse(H);
    suivis.caimans.forEach((sv, i) => {
      const cible = h > 0.5 ? plageCaiman[i] : postesCaiman[i];
      sv.suivre(cible, h > 0.5 ? Math.PI * 0.95 : 1.2, dt, 30);
    });
    suivis.tigres.forEach((sv, i) => {
      const o = h > 0.5 ? orbite(XC + 60, 0, 130, 45, i * 0.6, t) : orbite(100, 0, 175, 55, i * 0.5, t);
      sv.suivre(o.position, o.cap, dt, 50);
    });
    vols.caimans.forEach((v) => v.animer(t, !!api.decoller));
    vols.tigres.forEach((v) => v.animer(t, !!api.tigres));
    caimans[2].userData.animer?.(t, {});
    mondeVersGroupe(legTigre.point, tigres[0].position.x, tigres[0].position.y + 5, tigres[0].position.z);
    mondeVersGroupe(legCaiman.point, caimans[0].position.x, caimans[0].position.y + 5.5, caimans[0].position.z);
  };
  // Ombres de tout ce qui a été ajouté après l'installation ; le caisson du radier n'en projette pas
  navire.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material?.transparent; o.receiveShadow = true; } });
  caisson.castShadow = false;
  // Pose initiale (hélicoptères arrêtés, engins dans le radier)
  groupe.userData.animer(0, {});
  return groupe;
}

// ---------------------------------------------------------------------------
// Frégates : défense aérienne (Horizon) et multi-missions (FREMM)
// ---------------------------------------------------------------------------

/**
 * Plateforme hélicoptère : cercle, croix d'axe, bordure jaune et grille du harpon, où la sonde
 * placée sous le Caïman s'accroche à l'appontage (texture). bombe et demiPont : la plateforme épouse
 * le bombé du pont (bombé au centre, demi-largeur du pont), sans s'y enfoncer.
 */
function helipont(THREE, longueur, largeur, { bombe = 0, demiPont = largeur / 2, grille = true } = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round((512 * largeur) / longueur);
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#55595e'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(W * 0.45, H / 2, H * 0.33, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.05, H / 2); ctx.lineTo(W * 0.95, H / 2); ctx.stroke();
  ctx.strokeStyle = '#e8bf2a'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, W - 8, H - 8);
  if (grille) {
    // Grille du harpon : disque de 2,5 m environ, ajouré, au centre du cercle d'appontage
    const r = (1.25 / longueur) * W;
    ctx.save();
    ctx.beginPath(); ctx.arc(W * 0.45, H / 2, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#26292c'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#8d9296'; ctx.lineWidth = 1.5;
    for (let k = -r; k <= r; k += r / 6) {
      ctx.beginPath(); ctx.moveTo(W * 0.45 + k, H / 2 - r); ctx.lineTo(W * 0.45 + k, H / 2 + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.45 - r, H / 2 + k); ctx.lineTo(W * 0.45 + r, H / 2 + k); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#d9dcdf'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W * 0.45, H / 2, r, 0, Math.PI * 2); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(longueur, largeur, 1, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, bombe * (1 - Math.abs(pos.getY(i)) / demiPont) + 0.03);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/**
 * Cellules de lancement vertical Sylver (trappes carrées) : modules de 8 cellules (2 × 4), modules le
 * long du navire, rangées en travers. ouvrables : chaque trappe est articulée (tirs) ;
 * userData.cellules donne, pour chacune, sa position et sa trappe.
 */
function sylver(THREE, mat, matTrappe, { x, y, z = 0, modules = 4, rangees = 2, ouvrables = false }) {
  const g = new THREE.Group();
  const l = modules * 1.4, p = rangees * 2.9;
  g.add(bloc(THREE, mat, l + 0.6, 0.5, p + 0.6, x, y, z));
  const trappes = [], cellules = [];
  for (let i = 0; i < modules * 2; i++) for (let j = 0; j < rangees * 4; j++) {
    const xt = x - l / 2 + 0.35 + i * 0.7, zt = z - p / 2 + 0.36 + j * 0.72;
    if (!ouvrables) { trappes.push([xt, y + 0.52, zt, 0.58, 0.05, 0.6]); continue; }
    // Trappe articulée sur son bord avant, ouverte vers le haut
    const pivot = new THREE.Group();
    pivot.position.set(xt - 0.29, y + 0.545, zt);
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.6), matTrappe);
    plaque.position.x = 0.29;
    pivot.add(plaque);
    g.add(pivot);
    cellules.push({ x: xt, y: y + 0.5, z: zt, trappe: pivot });
  }
  if (trappes.length) g.add(pieces(THREE, matTrappe, trappes));
  g.userData.cellules = cellules;
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
 * Équipement commun des frégates : Caïman Marine sur la plateforme (pales repliées, harpon), son
 * décollage, et les tirs depuis les Sylver. En mode léger (scènes de groupe, navires minuscules) :
 * hélicoptère simplifié, pas de tirs. Renvoie les légendes et l'installation des commandes.
 */
function equipementFregate(THREE, navire, M, { leger, helico, pose, degagement, poste, tirs: defTirs }) {
  let vol = null, caiman = null, fumee = null;
  const tirs = [];
  if (helico && leger) {
    const h = nh90(THREE, M.fonce, M.noir);
    h.position.set(pose[0] - 5.6, pose[1] - 0.5, 0);
    navire.add(h);
  } else if (helico) {
    caiman = helicoEmbarque(THREE, 'caiman');
    navire.add(caiman);
    vol = volEmbarque(caiman, { pose, degagement, poste: () => ({ position: poste, cap: 1.0 }), replie: true, duree: 22 });
  }
  if (defTirs.length) {
    fumee = fumees(THREE);
    navire.add(fumee.groupe);
    for (const d of defTirs) tirs.push({ id: d.id, tir: tirVertical(THREE, navire, { type: d.type, cellules: d.cellules, fumee, cap: d.cap }) });
  }
  const legendeCaiman = { texte: 'Caïman Marine (NH90 NFH)', point: null };
  const NOMS = { mdcn: '🚀 Tir de missile de croisière naval (MdCN)', aster15: '🚀 Tir d\'Aster 15', aster30: '🚀 Tir d\'Aster 30' };
  return {
    legendes(p) {
      if (!caiman) return [];
      legendeCaiman.point = p(pose[0], pose[1] + 5, pose[2] - 1.5);
      return [legendeCaiman, { texte: 'Grille du harpon : le Caïman s\'y ancre à l\'appontage', point: p(pose[0], pose[1], pose[2] + 1) }];
    },
    installer(groupe, p, autre = null) {
      groupe.userData.commandes = [
        ...defTirs.map((d) => ({ id: d.id, type: 'action', libelle: NOMS[d.type] })),
        ...(vol ? [{ id: 'decoller', libelle: 'Faire décoller le Caïman Marine', actif: 'Apponter le Caïman Marine' }] : []),
      ];
      let avant = null;
      groupe.userData.animer = (t, api = {}) => {
        const dt = avant === null ? 0 : Math.min(0.05, Math.max(0, (t - avant) / 1000));
        avant = t;
        autre?.(t, api);
        for (const { id, tir } of tirs) {
          if (api[id]) { api[id] = false; tir.tirer(t); }
          tir.animer(t);
        }
        fumee?.animer(dt);
        if (vol) {
          vol.animer(t, !!api.decoller);
          const q = caiman.position;
          legendeCaiman.point.copy(p(q.x, q.y + 5, q.z - 1.5));
        }
      };
    },
  };
}

/**
 * Frégate de défense aérienne Chevalier Paul (D621, classe Horizon), d'après
 * des photos : 153 m, étrave très élancée, deux canons de 76 mm côte à côte
 * devant la passerelle, 48 cellules Sylver (missiles Aster), tour avant
 * portant le grand radôme du radar multifonction, mât treillis, cheminées,
 * mât arrière et son radar de veille à longue portée, hangar et plateforme.
 */
export function construireFda(THREE, { leger = false, helico = true } = {}) {
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
  const cellules = sylver(THREE, M.gris, M.fonce, { x: 29, y: 8.6, modules: 3, rangees: 2, ouvrables: !leger });
  navire.add(cellules);
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
  const pf = helipont(THREE, 21, 17, { bombe: 0.25, demiPont: 9.6 });
  pf.position.set(141.5, 7.1, 0);
  navire.add(pf);
  const embarque = equipementFregate(THREE, navire, M, {
    leger, helico, pose: [140.45, 7.38, 0], degagement: [-6, 14, 26], poste: [70, 44, 82],
    tirs: leger ? [] : [{ id: 'aster', type: 'aster30', cellules: cellules.userData.cellules, cap: 0.7 }],
  });
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
    ...embarque.legendes(p),
  ];
  embarque.installer(groupe, p, (t) => { antenne.rotation.y = t / 900; });
  return groupe;
}

/**
 * Frégate multi-missions (FREMM, classe Aquitaine), d'après un plan trois
 * vues (profil, dessus, face) : 142 m, étrave élancée, canon de 76 mm,
 * cellules Sylver (Aster et missile de croisière naval), passerelle sous le
 * mât intégré pyramidal (radar Herakles), mât de communications arrière,
 * cheminée à sommet noir, logement d'embarcation, hangar et plateforme.
 */
export function construireFremm(THREE, { leger = false, helico = true } = {}) {
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
  // Canon de 76 mm, puis Sylver devant la passerelle : deux modules A70 (16 missiles de croisière
  // naval) et deux modules A43 (16 Aster 15), soit 32 cellules
  navire.add(tourelle(THREE, M.clair, { x: 36, y: 6.7, r: 1.6, tube: 4.4 }));
  const a70 = sylver(THREE, M.gris, M.fonce, { x: 39.9, y: 6.25, modules: 1, rangees: 2, ouvrables: !leger });
  const a43 = sylver(THREE, M.gris, M.fonce, { x: 42.6, y: 6.25, modules: 1, rangees: 2, ouvrables: !leger });
  navire.add(a70, a43);
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
  const pf = helipont(THREE, 24, 17, { bombe: 0.25, demiPont: 9.6 });
  pf.position.set(129.5, 5.7, 0);
  navire.add(pf);
  navire.add(exocets(THREE, M.clair, 99, Dm + 6.2));
  // Caïman Marine sur la plateforme, pales repliées, ancré par son harpon sur la grille ; missiles
  const embarque = equipementFregate(THREE, navire, M, {
    leger, helico, pose: [128.3, 5.98, 0], degagement: [-6, 14, 26], poste: [62, 40, 78],
    tirs: leger ? [] : [
      { id: 'mdcn', type: 'mdcn', cellules: a70.userData.cellules, cap: -0.45 },
      { id: 'aster', type: 'aster15', cellules: a43.userData.cellules, cap: 0.7 },
    ],
  });

  const { groupe, p } = installerNavire(THREE, navire, { L, s });
  groupe.userData.legendes = [
    { texte: 'Mât intégré et radar Herakles', point: p(61, Dm + 17, 0) },
    { texte: 'Sylver A70 : 16 missiles de croisière naval', point: p(39.9, Dm + 1.2, -2.5) },
    { texte: 'Sylver A43 : 16 Aster 15', point: p(42.6, Dm + 1.2, 2.5) },
    { texte: 'Canon de 76 mm', point: p(34, 8.5, 0) },
    { texte: 'Cheminée', point: p(90.5, Dm + 14, 0) },
    { texte: 'Mât de communications', point: p(76.5, Dm + 27, 0) },
    { texte: 'Hangar et plateforme (Caïman Marine)', point: p(128, Dm + 0.5, 0) },
    ...embarque.legendes(p),
  ];
  embarque.installer(groupe, p);
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
function navireDuGroupe(THREE, type, k, options = {}) {
  const d = MODELES_GROUPE[type];
  // Version légère des bâtiments de surface (hélicoptères sommaires, ni tirs ni radier) : à cette échelle,
  // les détails ne se voient pas et alourdiraient la scène
  const objet = d.construire(THREE, ['fda', 'fremm', 'pha'].includes(type) ? { leger: true, ...options } : {});
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
        // La FREMM anti-sous-marine a son Caïman en vol (sonar trempé) : sa plateforme est vide
        const nav = navireDuGroupe(THREE, type, k, { helico: !(type === 'fremm' && j === 0 && enMer) });
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

  // A321 MPA : l'avion de patrouille maritime surveille les abords du groupe (sous-marins, navires
  // suspects) en orbite large et plus haute que les Rafale ; agrandi comme eux pour rester visible.
  // Son modèle est à 0,32 unité par mètre.
  const mpa = construireA321Mpa(THREE);
  mpa.scale.setScalar((k / 0.32) * 1.6);
  mpa.rotation.order = 'YXZ';
  racine.add(mpa);
  const legendeMpa = { texte: 'A321 MPA : avion de patrouille maritime (futur, agrandi)', point: new THREE.Vector3() };
  legendes.push(legendeMpa);
  const orbiteMpa = { rayon: deux ? 900 : 560, altitude: 320 };

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
    // Patrouille maritime : orbite lente, en sens inverse des Rafale, légère inclinaison
    const angM = -t / 9000 + 4.07; // départ dans le champ de la vue « 3/4 »
    mpa.position.set(Math.cos(angM) * orbiteMpa.rayon * k, orbiteMpa.altitude * k, Math.sin(angM) * orbiteMpa.rayon * k);
    mpa.rotation.set(0.22, -Math.PI / 2 - angM, 0);
    legendeMpa.point.set(mpa.position.x, mpa.position.y + 60 * k, mpa.position.z);
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
  legendes.push({ texte: `${nouveau ? 'SNLE de 3e génération' : 'SNLE'} ${nom.replace(' (SNLE 3G)', '')} en patrouille, à une trentaine de mètres de profondeur`, point: P(0, 4, 0) });
  legendes.push({ texte: '16 tubes de missiles M51, derrière le kiosque', point: P(nouveau ? 0 : -3, -12, 14) });

  // SNA d'escorte : il « nettoie » la zone et protège la patrouille
  const sna = navireDuGroupe(THREE, 'sna', k);
  sna.conteneur.position.set(-300 * k, sna.conteneur.position.y - 22 * k, 190 * k);
  racine.add(sna.conteneur);
  legendes.push({ texte: 'SNA (classe Suffren) : il protège la patrouille contre les sous-marins adverses', point: P(-300, 2, 190) });

  // FREMM anti-sous-marine, son sillage, son Caïman Marine
  const fremm = navireDuGroupe(THREE, 'fremm', k, { helico: false }); // son Caïman est en vol, sonar trempé
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
