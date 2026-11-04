/**
 * Modèles 3D procéduraux (three.js) du Rafale et d'un SNLE de la classe
 * Le Triomphant, construits aux proportions réelles :
 *  - Rafale : longueur 15,27 m, envergure 10,90 m (missiles en bout d'aile
 *    compris), hauteur 5,34 m ; aile delta, plans canard, deux réacteurs M88 ;
 *  - SNLE Le Triomphant : longueur 138 m, diamètre 12,5 m ; kiosque avec
 *    barres de plongée, 16 tubes de missiles M51, gouvernes en croix, hydrojet.
 * Formes simplifiées (pas des plans) : silhouette, proportions et éléments
 * caractéristiques fidèles.
 *
 * Repère : x de l'avant vers l'arrière (le nez en x = 0), y vers le haut,
 * z vers la gauche de l'appareil (tribord en z négatif).
 */

/** Interpolation cubique (Catmull-Rom) d'une suite de valeurs, pour lisser les sections. */
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Densifie des sections clés (interpolation de chaque paramètre). */
function densifier(cles, parSegment = 6) {
  const champs = ['x', 'w', 'hHaut', 'hBas', 'y', 'n', 'z'];
  const res = [];
  for (let i = 0; i < cles.length - 1; i++) {
    const p0 = cles[Math.max(0, i - 1)], p1 = cles[i], p2 = cles[i + 1], p3 = cles[Math.min(cles.length - 1, i + 2)];
    for (let k = 0; k < parSegment; k++) {
      const t = k / parSegment;
      const s = {};
      for (const c of champs) s[c] = catmull(p0[c] ?? 0, p1[c] ?? 0, p2[c] ?? 0, p3[c] ?? 0, t);
      s.w = Math.max(0, s.w); s.hHaut = Math.max(0, s.hHaut); s.hBas = Math.max(0, s.hBas); s.n = Math.max(1.6, s.n);
      res.push(s);
    }
  }
  res.push({ ...cles[cles.length - 1] });
  return res;
}

/**
 * Surface « loftée » : une suite de sections (super-ellipses) le long de x.
 * Section : { x, w (largeur), hHaut, hBas (demi-hauteurs), y (centre), z, n (exposant : 2 = ellipse, plus = plus carré) }.
 */
export function loft(THREE, cles, { segments = 48, parSegment = 6, fermer = true } = {}) {
  const sections = densifier(cles.map((s) => ({ hHaut: s.h / 2, hBas: s.h / 2, y: 0, z: 0, n: 2, ...s })), parSegment);
  const pos = [];
  const idx = [];
  for (const s of sections) {
    const e = 2 / s.n;
    for (let j = 0; j < segments; j++) {
      const t = (j / segments) * Math.PI * 2;
      const c = Math.cos(t), si = Math.sin(t);
      const dz = (s.w / 2) * Math.sign(c) * Math.pow(Math.abs(c), e);
      const dy = (si >= 0 ? s.hHaut : s.hBas) * Math.sign(si) * Math.pow(Math.abs(si), e);
      pos.push(s.x, s.y + dy, s.z + dz);
    }
  }
  const n = sections.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * segments + j, b = i * segments + ((j + 1) % segments);
      const c = (i + 1) * segments + j, d = (i + 1) * segments + ((j + 1) % segments);
      idx.push(a, b, c, b, d, c);
    }
  }
  if (fermer) {
    // Bouchons aux extrémités (si la section n'est pas réduite à un point)
    for (const [i, sens] of [[0, -1], [n - 1, 1]]) {
      const s = sections[i];
      if (s.w < 1e-3 && s.hHaut < 1e-3) continue;
      const centre = pos.length / 3;
      pos.push(s.x, s.y, s.z);
      for (let j = 0; j < segments; j++) {
        const a = i * segments + j, b = i * segments + ((j + 1) % segments);
        if (sens < 0) idx.push(centre, b, a); else idx.push(centre, a, b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Surface portante (aile, plan canard, dérive) extrudée à partir d'un contour, avec bords arrondis. */
function surface(THREE, points, epaisseur, { plan = 'xz', biseau = 0.035 } = {}) {
  const forme = new THREE.Shape(points.map(([a, b]) => new THREE.Vector2(a, b)));
  const g = new THREE.ExtrudeGeometry(forme, { depth: epaisseur, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau * 0.9, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -epaisseur / 2);
  // Contour dessiné dans le plan (x, z) : on couche la pièce (l'épaisseur devient verticale)
  if (plan === 'xz') g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/** Cocarde française (bleu, blanc, rouge du bord vers le centre), plaquée sur une surface. */
function cocarde(THREE, rayon) {
  const g = new THREE.Group();
  const couleurs = [[0x1d3f8f, 1], [0xffffff, 0.66], [0xd52b2b, 0.33]];
  couleurs.forEach(([c, r], i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(rayon * r, 40), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -1 - i, polygonOffsetUnits: -1 - i }));
    m.position.z = 0.002 * i;
    g.add(m);
  });
  return g;
}

/** Missile simple : corps, ogive, ailettes (MICA, Meteor). */
function missile(THREE, longueur, diametre, materiaux, ailettes = 0.18) {
  const g = new THREE.Group();
  const r = diametre / 2;
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(r, r, longueur * 0.84, 20), materiaux.missile);
  corps.rotation.z = Math.PI / 2;
  corps.position.x = longueur * 0.58;
  const ogive = new THREE.Mesh(new THREE.ConeGeometry(r, longueur * 0.16, 20), materiaux.missileOgive);
  ogive.rotation.z = Math.PI / 2;
  ogive.position.x = longueur * 0.08;
  g.add(corps, ogive);
  for (let k = 0; k < 4; k++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(longueur * 0.08, 0.008, ailettes), materiaux.missile);
    a.position.x = longueur * 0.95;
    a.rotation.x = (k * Math.PI) / 2 + Math.PI / 4;
    a.position.y = 0;
    g.add(a);
  }
  return g;
}

/**
 * Rafale (version monoplace C) en configuration air-air longue distance :
 * 2 MICA en bout d'aile, 2 Meteor, 2 réservoirs de 2 000 litres.
 * @returns {THREE.Group} centré, avec les points de légende dans userData.legendes
 */
export function construireRafale(THREE) {
  const avion = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0x8b9298, metalness: 0.35, roughness: 0.48 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x6e757b, metalness: 0.35, roughness: 0.55 });
  const radome = new THREE.MeshStandardMaterial({ color: 0x7d848a, metalness: 0.2, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x55585c, metalness: 0.9, roughness: 0.35 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x141618, metalness: 0.2, roughness: 0.8 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x6a5c38, metalness: 0.35, roughness: 0.04, transparent: true, opacity: 0.6, clearcoat: 1, clearcoatRoughness: 0.02 });
  const materiaux = { missile: new THREE.MeshStandardMaterial({ color: 0xd8dadb, metalness: 0.2, roughness: 0.5 }), missileOgive: new THREE.MeshStandardMaterial({ color: 0x9da3a8, metalness: 0.3, roughness: 0.4 }) };

  // Fuselage : nez effilé, poste de pilotage surélevé, dos qui descend vers les tuyères
  const fuselage = loft(THREE, [
    { x: 0.0, w: 0.0, h: 0.0, y: 0.02 },
    { x: 0.35, w: 0.24, hHaut: 0.12, hBas: 0.12, y: 0.03 },
    { x: 1.1, w: 0.56, hHaut: 0.29, hBas: 0.28, y: 0.05 },
    { x: 2.1, w: 0.82, hHaut: 0.44, hBas: 0.4, y: 0.07 },
    { x: 3.2, w: 0.98, hHaut: 0.55, hBas: 0.46, y: 0.1, n: 2.2 },
    { x: 4.6, w: 1.06, hHaut: 0.62, hBas: 0.5, y: 0.12, n: 2.3 },
    { x: 6.1, w: 1.24, hHaut: 0.63, hBas: 0.62, y: 0.12, n: 2.6 },
    { x: 8.0, w: 1.64, hHaut: 0.56, hBas: 0.68, y: 0.08, n: 3 },
    { x: 10.4, w: 1.9, hHaut: 0.5, hBas: 0.66, y: 0.04, n: 3.4 },
    { x: 12.6, w: 1.84, hHaut: 0.46, hBas: 0.56, y: 0.02, n: 3.4 },
    { x: 14.25, w: 1.56, hHaut: 0.4, hBas: 0.44, y: 0.0, n: 3 },
    { x: 14.55, w: 1.48, hHaut: 0.38, hBas: 0.42, y: 0.0, n: 3 },
  ], { segments: 56, parSegment: 8 });
  avion.add(new THREE.Mesh(fuselage, gris));
  // Radôme légèrement plus sombre
  const nez = loft(THREE, [
    { x: -0.005, w: 0, h: 0, y: 0.02 },
    { x: 0.35, w: 0.245, hHaut: 0.125, hBas: 0.125, y: 0.03 },
    { x: 1.1, w: 0.565, hHaut: 0.295, hBas: 0.285, y: 0.05 },
    { x: 1.6, w: 0.7, hHaut: 0.37, hBas: 0.345, y: 0.06 },
  ], { segments: 48, parSegment: 6, fermer: false });
  avion.add(new THREE.Mesh(nez, radome));

  // Entrées d'air, sous les plans canard, de part et d'autre du fuselage
  for (const cote of [1, -1]) {
    const conduit = loft(THREE, [
      { x: 5.55, w: 0.54, hHaut: 0.36, hBas: 0.46, y: -0.24, z: cote * 0.86, n: 2.4 },
      { x: 6.6, w: 0.6, hHaut: 0.38, hBas: 0.48, y: -0.24, z: cote * 0.84, n: 2.6 },
      { x: 8.6, w: 0.52, hHaut: 0.34, hBas: 0.44, y: -0.24, z: cote * 0.74, n: 2.6 },
      { x: 10.4, w: 0.3, hHaut: 0.2, hBas: 0.25, y: -0.18, z: cote * 0.62, n: 2.4 },
    ], { segments: 32, parSegment: 6 });
    avion.add(new THREE.Mesh(conduit, gris));
    const bouche = new THREE.Mesh(new THREE.CircleGeometry(1, 32), noir);
    bouche.scale.set(0.26, 0.4, 1);
    bouche.position.set(5.54, -0.27, cote * 0.86);
    bouche.rotation.y = -Math.PI / 2;
    avion.add(bouche);
  }

  // Aile delta (bord d'attaque très en flèche, bord de fuite presque droit)
  const aileDroite = surface(THREE, [[7.0, 0.65], [12.45, 5.2], [13.6, 5.2], [14.15, 0.65]], 0.11);
  const elevonDroit = surface(THREE, [[13.62, 0.9], [13.97, 5.05], [14.12, 5.05], [14.18, 0.9]], 0.075, { biseau: 0.015 });
  for (const cote of [1, -1]) {
    const aile = new THREE.Mesh(aileDroite, gris);
    aile.position.y = -0.18;
    aile.scale.z = cote;
    const elevon = new THREE.Mesh(elevonDroit, grisFonce);
    elevon.position.y = -0.18;
    elevon.scale.z = cote;
    avion.add(aile, elevon);
    // Plans canard (légère inclinaison vers le haut)
    const canard = new THREE.Mesh(surface(THREE, [[5.3, 0.82], [6.55, 2.32], [7.05, 2.32], [6.6, 0.82]], 0.05, { biseau: 0.02 }), gris);
    canard.position.y = 0.12;
    canard.rotation.x = cote * -0.07;
    canard.scale.z = cote;
    avion.add(canard);
    // Cocardes : dessus de l'aile et flancs du fuselage
    const c1 = cocarde(THREE, 0.42);
    c1.rotation.x = -Math.PI / 2;
    c1.position.set(11.7, -0.18 + 0.1, cote * 3.1);
    const c2 = cocarde(THREE, 0.3);
    c2.position.set(9.1, 0.12, cote * 0.89);
    c2.rotation.y = cote > 0 ? 0 : Math.PI;
    avion.add(c1, c2);
    // Tuyères des deux réacteurs M88
    const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.37, 0.75, 32, 1, true), metal);
    tuyere.rotation.z = Math.PI / 2;
    tuyere.position.set(14.85, -0.02, cote * 0.4);
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.36, 32), noir);
    fond.rotation.y = Math.PI / 2;
    fond.position.set(14.6, -0.02, cote * 0.4);
    avion.add(tuyere, fond);
    // Armement : MICA en bout d'aile, Meteor sous l'aile, réservoir de 2 000 litres
    const mica = missile(THREE, 3.1, 0.16, materiaux);
    mica.position.set(11.1, -0.18, cote * 5.38);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.08), grisFonce);
    rail.position.set(12.7, -0.18, cote * 5.26);
    const meteor = missile(THREE, 3.65, 0.18, materiaux);
    meteor.position.set(10.2, -0.62, cote * 3.85);
    const pylone1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.06), grisFonce);
    pylone1.position.set(11.6, -0.4, cote * 3.85);
    const reservoir = loft(THREE, [
      { x: 0, w: 0, h: 0 }, { x: 0.6, w: 0.42, h: 0.42 }, { x: 1.6, w: 0.62, h: 0.62 }, { x: 3.6, w: 0.62, h: 0.62 }, { x: 4.8, w: 0.3, h: 0.3 }, { x: 5.2, w: 0, h: 0 },
    ], { segments: 28, parSegment: 5 });
    const res = new THREE.Mesh(reservoir, gris);
    res.position.set(8.2, -0.92, cote * 2.05);
    const pylone2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 0.07), grisFonce);
    pylone2.position.set(10.6, -0.5, cote * 2.05);
    avion.add(mica, rail, meteor, pylone1, res, pylone2);
  }

  // Dérive unique, avec petit drapeau tricolore
  const derive = new THREE.Mesh(surface(THREE, [[10.7, 0.0], [13.15, 2.85], [14.05, 2.85], [14.55, 0.0]], 0.1, { plan: 'xy' }), gris);
  derive.position.y = 0.48;
  avion.add(derive);
  const gouverne = new THREE.Mesh(surface(THREE, [[13.72, 0.25], [14.05, 2.6], [14.14, 2.6], [14.5, 0.25]], 0.09, { plan: 'xy', biseau: 0.012 }), grisFonce);
  gouverne.position.y = 0.48;
  avion.add(gouverne);
  for (const cote of [1, -1]) {
    ['#1d3f8f', '#ffffff', '#d52b2b'].forEach((c, i) => {
      const bande = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.32), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
      bande.position.set(13.25 + i * 0.2, 2.95, cote * 0.095);
      bande.rotation.y = cote > 0 ? 0 : Math.PI;
      avion.add(bande);
    });
  }

  // Verrière en bulle et perche de ravitaillement (côté droit, devant la verrière)
  // Habitacle visible à travers la verrière : planche de bord, siège éjectable, casque
  const habitacle = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.9 }));
  habitacle.scale.set(1.25, 0.22, 0.36);
  habitacle.position.set(3.95, 0.62, 0);
  const siege = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.42), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 }));
  siege.position.set(4.55, 0.82, 0);
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.5, metalness: 0.2 }));
  casque.position.set(4.3, 0.98, 0);
  avion.add(habitacle, siege, casque);
  const bulle = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), verre);
  bulle.scale.set(1.4, 0.46, 0.43);
  bulle.position.set(3.9, 0.6, 0);
  avion.add(bulle);
  const arceau = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 8, 24, Math.PI), grisFonce);
  arceau.scale.set(1, 1.07, 1);
  arceau.position.set(3.15, 0.6, 0);
  arceau.rotation.y = Math.PI / 2;
  avion.add(arceau);
  const perche = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.7, 12), grisFonce);
  perche.rotation.z = Math.PI / 2 - 0.06;
  perche.position.set(2.55, 0.5, -0.4);
  const embout = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), metal);
  embout.position.set(1.7, 0.55, -0.4);
  avion.add(perche, embout);
  // Sonde de nez (tube de Pitot)
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.5, 8), metal);
  pitot.rotation.z = Math.PI / 2;
  pitot.position.set(-0.22, 0.02, 0);
  avion.add(pitot);

  avion.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // Centrage : le centre de l'avion à l'origine
  avion.position.set(-7.6, 0, 0);
  const groupe = new THREE.Group();
  groupe.add(avion);
  groupe.userData.legendes = [
    { texte: 'Plans canard', point: new THREE.Vector3(6.4 - 7.6, 0.2, 2.0) },
    { texte: 'Entrée d\'air', point: new THREE.Vector3(5.6 - 7.6, -0.25, 0.95) },
    { texte: 'Perche de ravitaillement', point: new THREE.Vector3(1.7 - 7.6, 0.55, -0.4) },
    { texte: 'Verrière', point: new THREE.Vector3(3.9 - 7.6, 1.05, 0) },
    { texte: 'Missile Meteor', point: new THREE.Vector3(11.5 - 7.6, -0.62, 3.85) },
    { texte: 'Missile MICA', point: new THREE.Vector3(12.0 - 7.6, -0.18, 5.4) },
    { texte: 'Réservoir 2 000 L', point: new THREE.Vector3(10.6 - 7.6, -0.92, -2.05) },
    { texte: 'Réacteurs M88', point: new THREE.Vector3(15.2 - 7.6, 0, 0.4) },
    { texte: 'Dérive', point: new THREE.Vector3(13.4 - 7.6, 3.2, 0) },
  ];
  groupe.userData.taille = 16;
  return groupe;
}

/**
 * SNLE de la classe Le Triomphant, à l'échelle 1/10 (138 m → 13,8 unités).
 * userData.trappes : couvercles des 16 tubes (animables), userData.missile : M51 pour le tir d'essai.
 */
export function construireSnle(THREE) {
  const s = 0.1;
  const sub = new THREE.Group();
  const coque = new THREE.MeshStandardMaterial({ color: 0x2b3036, metalness: 0.2, roughness: 0.7 });
  const coqueDos = new THREE.MeshStandardMaterial({ color: 0x323840, metalness: 0.2, roughness: 0.68 });
  const trappeMat = new THREE.MeshStandardMaterial({ color: 0x30353b, metalness: 0.3, roughness: 0.6 });
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4f55, metalness: 0.7, roughness: 0.4 });
  const missileMat = new THREE.MeshStandardMaterial({ color: 0xe6e8ea, metalness: 0.2, roughness: 0.45 });

  // Coque : corps de révolution de 138 m, 12,5 m de diamètre
  const R = 6.25;
  sub.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0, h: 0 },
    { x: 1.2, w: 4.6, h: 4.6 },
    { x: 4, w: 8.2, h: 8.2 },
    { x: 9, w: 11.0, h: 11.0 },
    { x: 16, w: 12.3, h: 12.3 },
    { x: 24, w: 2 * R, h: 2 * R },
    { x: 96, w: 2 * R, h: 2 * R },
    { x: 106, w: 11.6, h: 11.6 },
    { x: 116, w: 9.4, h: 9.4 },
    { x: 125, w: 6.6, h: 6.6 },
    { x: 131, w: 4.4, h: 4.4 },
    { x: 134.5, w: 3.4, h: 3.4 },
  ], { segments: 56, parSegment: 6 }).scale(s, s, s), coque));

  // « Dos » du compartiment missiles, derrière le kiosque
  sub.add(new THREE.Mesh(loft(THREE, [
    { x: 40, w: 3, hHaut: 0.2, hBas: 2.5, y: R - 0.3, n: 2.2 },
    { x: 45, w: 9.4, hHaut: 1.45, hBas: 3.5, y: R - 0.2, n: 3.2 },
    { x: 81, w: 9.4, hHaut: 1.45, hBas: 3.5, y: R - 0.2, n: 3.2 },
    { x: 88, w: 3, hHaut: 0.2, hBas: 2.5, y: R - 0.3, n: 2.2 },
  ], { segments: 40, parSegment: 6 }).scale(s, s, s), coqueDos));

  // 16 tubes (2 rangées de 8) et leurs trappes, articulées côté extérieur
  const trappes = [];
  const dessusDos = R - 0.2 + 1.45;
  for (let i = 0; i < 8; i++) {
    for (const cote of [1, -1]) {
      const x = 47.5 + i * 4.4;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.2, 24), tubeMat);
      tube.position.set(x * s, (dessusDos + 0.01) * s, cote * 2.0 * s);
      tube.scale.setScalar(s);
      sub.add(tube);
      const charniere = new THREE.Group();
      charniere.position.set(x * s, (dessusDos + 0.06) * s, cote * 3.45 * s);
      const trappe = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 2.9), trappeMat);
      trappe.position.set(0, 0, -cote * 1.45);
      trappe.scale.setScalar(1);
      const pivot = new THREE.Group();
      pivot.add(trappe);
      pivot.scale.setScalar(s);
      charniere.add(pivot);
      charniere.userData = { cote, angle: 0 };
      sub.add(charniere);
      trappes.push(charniere);
    }
  }

  // Kiosque (profil en goutte d'eau) et barres de plongée
  const contour = new THREE.Shape();
  contour.moveTo(0, 0);
  contour.bezierCurveTo(0, 1.35, 2.2, 1.45, 4.5, 1.4);
  contour.lineTo(11.5, 0.7);
  contour.quadraticCurveTo(13.2, 0.3, 13.4, 0);
  contour.quadraticCurveTo(13.2, -0.3, 11.5, -0.7);
  contour.lineTo(4.5, -1.4);
  contour.bezierCurveTo(2.2, -1.45, 0, -1.35, 0, 0);
  const kiosqueGeo = new THREE.ExtrudeGeometry(contour, { depth: 9.5, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.3, bevelSegments: 3, curveSegments: 16 });
  kiosqueGeo.rotateX(-Math.PI / 2);
  kiosqueGeo.translate(27, R - 1.2, 0);
  kiosqueGeo.scale(s, s, s);
  sub.add(new THREE.Mesh(kiosqueGeo, coqueDos));
  const barre = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 11.5), coqueDos);
  barre.position.set(31.2 * s, (R + 4.6) * s, 0);
  barre.scale.setScalar(s);
  sub.add(barre);
  // Mâts et périscopes
  [[29.5, 1.6], [31, 2.4], [32.6, 1.9], [34.4, 1.2]].forEach(([x, h]) => {
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, h, 12), metal);
    mat.position.set(x * s, (R + 8.6 + h / 2) * s, 0);
    mat.scale.setScalar(s);
    sub.add(mat);
  });

  // Gouvernes en croix (avec plaques d'extrémité) et hydrojet
  const gouverneV = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(5.2, 0), new THREE.Vector2(6.6, 5.4), new THREE.Vector2(3.0, 5.4)]);
  for (const sens of [1, -1]) {
    const g = new THREE.ExtrudeGeometry(gouverneV, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
    g.translate(119, 0, -0.25);
    const m = new THREE.Mesh(g, coque);
    m.scale.set(s, sens * s, s);
    m.position.y = sens * (R - 2.6) * s;
    sub.add(m);
    const h = new THREE.ExtrudeGeometry(gouverneV, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
    h.translate(119, 0, -0.25);
    h.rotateX(Math.PI / 2);
    const mh = new THREE.Mesh(h, coque);
    mh.scale.set(s, s, sens * s);
    mh.position.z = sens * (R - 2.6) * s;
    sub.add(mh);
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 0.4), coque);
    plaque.position.set(123.6 * s, 0, sens * (R - 2.6 + 5.4) * s);
    plaque.scale.setScalar(s);
    sub.add(plaque);
  }
  const carenage = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.0, 4.2, 40, 1, true), coque);
  carenage.material = coque.clone();
  carenage.material.side = THREE.DoubleSide;
  carenage.rotation.z = Math.PI / 2;
  carenage.position.set(135.6 * s, 0, 0);
  carenage.scale.setScalar(s);
  const moyeu = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.5, 24), metal);
  moyeu.rotation.z = -Math.PI / 2;
  moyeu.position.set(136.8 * s, 0, 0);
  moyeu.scale.setScalar(s);
  sub.add(carenage, moyeu);

  // Missile M51 pour le tir d'essai (caché au départ)
  const m51 = new THREE.Group();
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 11, 24), missileMat);
  corps.position.y = 5.5;
  const coiffe = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.2, 24), missileMat);
  coiffe.position.y = 12.6;
  m51.add(corps, coiffe);
  m51.scale.setScalar(s);
  m51.position.set(47.5 * s, (dessusDos - 12) * s, 2.0 * s);
  m51.visible = false;
  sub.add(m51);

  sub.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  sub.position.set(-69 * s, -1.5 * s, 0);
  const groupe = new THREE.Group();
  groupe.add(sub);
  const decal = (x, y, z) => new THREE.Vector3(x * s - 69 * s, y * s - 1.5 * s, z * s);
  groupe.userData.trappes = trappes;
  groupe.userData.missile = m51;
  groupe.userData.dessusDos = dessusDos * s;
  groupe.userData.legendes = [
    { texte: 'Kiosque', point: decal(33, R + 9.5, 0) },
    { texte: 'Barres de plongée', point: decal(31, R + 4.6, 5.8) },
    { texte: '16 tubes de missiles M51', point: decal(64, dessusDos + 0.5, 3.5) },
    { texte: 'Gouvernes', point: decal(124, R + 1, 0) },
    { texte: 'Hydrojet (propulsion)', point: decal(136.5, 2.4, 0) },
    { texte: 'Étrave (sonar)', point: decal(2, 0, 3) },
  ];
  groupe.userData.taille = 14;
  return groupe;
}
