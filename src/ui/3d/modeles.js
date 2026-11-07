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
export function loft(THREE, cles, { segments = 48, parSegment = 6, fermer = true, couleur = null, debut = 0 } = {}) {
  const sections = densifier(cles.map((s) => ({ hHaut: s.h / 2, hBas: s.h / 2, y: 0, z: 0, n: 2, ...s })), parSegment);
  const pos = [];
  const idx = [];
  const uv = [];
  const col = [];
  const x0 = sections[0].x, x1 = sections[sections.length - 1].x;
  const ajouterCouleur = (x, y, z) => { if (couleur) col.push(...couleur(x, y, z)); };
  // Chaque anneau compte segments + 1 sommets : le dernier double le premier (couture), pour que la
  // texture ne soit ni comprimée ni retournée à la jointure. « debut » place la couture (0 : flanc gauche).
  const S = segments + 1;
  for (const s of sections) {
    const e = 2 / s.n;
    for (let j = 0; j <= segments; j++) {
      const t = debut + (j / segments) * Math.PI * 2;
      const c = Math.cos(t), si = Math.sin(t);
      const dz = (s.w / 2) * Math.sign(c) * Math.pow(Math.abs(c), e);
      const dy = (si >= 0 ? s.hHaut : s.hBas) * Math.sign(si) * Math.pow(Math.abs(si), e);
      pos.push(s.x, s.y + dy, s.z + dz);
      uv.push((s.x - x0) / Math.max(1e-6, x1 - x0), j / segments);
      ajouterCouleur(s.x, s.y + dy, s.z + dz);
    }
  }
  const n = sections.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * S + j, b = a + 1;
      const c = (i + 1) * S + j, d = c + 1;
      idx.push(a, c, b, b, c, d); // sens direct vu de l'extérieur : normales vers l'extérieur
    }
  }
  if (fermer) {
    // Bouchons aux extrémités (si la section n'est pas réduite à un point)
    for (const [i, sens] of [[0, -1], [n - 1, 1]]) {
      const s = sections[i];
      if (s.w < 1e-3 && s.hHaut < 1e-3) continue;
      const centre = pos.length / 3;
      pos.push(s.x, s.y, s.z);
      uv.push(i === 0 ? 0 : 1, 0.5);
      ajouterCouleur(s.x, s.y, s.z);
      for (let j = 0; j < segments; j++) {
        const a = i * S + j, b = a + 1;
        if (sens < 0) idx.push(centre, a, b); else idx.push(centre, b, a);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (couleur) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Couture : même normale de part et d'autre, pour un ombrage continu
  const nor = g.attributes.normal;
  for (let i = 0; i < n; i++) {
    const a = i * S, b = i * S + segments;
    const v = new THREE.Vector3(nor.getX(a) + nor.getX(b), nor.getY(a) + nor.getY(b), nor.getZ(a) + nor.getZ(b)).normalize();
    nor.setXYZ(a, v.x, v.y, v.z);
    nor.setXYZ(b, v.x, v.y, v.z);
  }
  nor.needsUpdate = true;
  return g;
}

/**
 * Texture procédurale de panneaux (tuiles anéchoïques d'un sous-marin) :
 * fines lignes claires sur fond sombre, répétées le long de la coque.
 */
export function texturePanneaux(THREE, { fond = '#141618', trait = 'rgba(210,215,220,0.16)', repetition = [10, 3] } = {}) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = trait;
  ctx.lineWidth = 2;
  let graine = 7;
  const hasard = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
  for (let y = 0; y <= c.height; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    for (let x = hasard() * 120; x < c.width; x += 90 + hasard() * 160) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repetition);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Surface portante (aile, plan canard, dérive) extrudée à partir d'un contour, avec bords arrondis. */
export function surface(THREE, points, epaisseur, { plan = 'xz', biseau = 0.035 } = {}) {
  const forme = new THREE.Shape(points.map(([a, b]) => new THREE.Vector2(a, b)));
  const g = new THREE.ExtrudeGeometry(forme, { depth: epaisseur, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau * 0.9, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -epaisseur / 2);
  // Contour dessiné dans le plan (x, z) : on couche la pièce (l'épaisseur devient verticale)
  if (plan === 'xz') g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/**
 * Cocarde française des aéronefs militaires : anneau rouge à l'extérieur,
 * anneau blanc, disque bleu au centre (rayons 1 ; 0,62 ; 0,28), plaquée sur
 * une surface.
 */
export function cocarde(THREE, rayon) {
  const g = new THREE.Group();
  const couleurs = [[0xc00323, 1], [0xffffff, 0.62], [0x284290, 0.28]];
  couleurs.forEach(([c, r], i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(rayon * r, 40), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -1 - i, polygonOffsetUnits: -1 - i }));
    m.position.z = 0.002 * i;
    g.add(m);
  });
  return g;
}

/** Missile simple : corps, ogive, ailettes (MICA, Meteor). */
export function missile(THREE, longueur, diametre, materiaux, ailettes = 0.18) {
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
 * Rafale (monoplace C ou M, biplace B à basculer), relevé sur un plan trois
 * vues (dessus, profil, face) et des photos de l'armée de l'Air et de
 * l'Espace : nez conique, longue verrière teintée, entrées d'air
 * semi-ventrales sous des épaulements qui portent les plans canard, aile
 * delta (flèche de 46°, léger dièdre négatif) à bord de fuite droit et
 * élevons, dorsale jusqu'à la dérive (barre d'antennes Spectra près du
 * sommet), deux tuyères M88 bien écartées, carénage arrière entre elles.
 * Livrée gris Rafale. Configuration air-air longue distance : 2 MICA en bout
 * d'aile, 2 Meteor, 2 réservoirs de 2 000 L.
 * Dimensions : 15,27 m de long (perche de Pitot comprise), 10,80 m
 * d'envergure, 5,34 m de haut.
 * @returns {THREE.Group} centré, avec les points de légende dans userData.legendes
 */
export function construireRafale(THREE, { armement = true } = {}) {
  const avion = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0x4d5660, metalness: 0.35, roughness: 0.5, envMapIntensity: 0.7 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x3f474f, metalness: 0.35, roughness: 0.55, envMapIntensity: 0.7 });
  const radome = new THREE.MeshStandardMaterial({ color: 0x48505a, metalness: 0.2, roughness: 0.6, envMapIntensity: 0.7 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.9, roughness: 0.35 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.2, roughness: 0.85 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x4f4224, metalness: 0.55, roughness: 0.04, transparent: true, opacity: 0.68, clearcoat: 1, clearcoatRoughness: 0.02 });
  const capteur = new THREE.MeshStandardMaterial({ color: 0x1b2027, metalness: 0.6, roughness: 0.15 });
  const materiaux = { missile: new THREE.MeshStandardMaterial({ color: 0xd9dcde, metalness: 0.2, roughness: 0.5 }), missileOgive: new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.3, roughness: 0.4 }) };

  // Fuselage : nez conique, poste de pilotage, section des réacteurs (large à l'arrière)
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 0.0, w: 0.0, h: 0.0, y: 0.0 },
    { x: 0.5, w: 0.26, hHaut: 0.13, hBas: 0.13, y: 0.02 },
    { x: 1.2, w: 0.58, hHaut: 0.29, hBas: 0.28, y: 0.06 },
    { x: 2.0, w: 0.92, hHaut: 0.45, hBas: 0.43, y: 0.12 },
    { x: 2.9, w: 1.16, hHaut: 0.5, hBas: 0.54, y: 0.1, n: 2.4 },
    { x: 3.9, w: 1.3, hHaut: 0.5, hBas: 0.6, y: 0.1, n: 2.6 },
    { x: 5.0, w: 1.42, hHaut: 0.5, hBas: 0.76, y: 0.12, n: 3.0 },
    { x: 6.2, w: 1.66, hHaut: 0.56, hBas: 0.8, y: 0.1, n: 3.4 },
    { x: 8.0, w: 1.96, hHaut: 0.64, hBas: 0.76, y: 0.06, n: 3.6 },
    { x: 10.0, w: 2.12, hHaut: 0.66, hBas: 0.72, y: 0.05, n: 3.8 },
    { x: 12.0, w: 2.2, hHaut: 0.6, hBas: 0.62, y: 0.06, n: 3.8 },
    { x: 13.3, w: 2.08, hHaut: 0.52, hBas: 0.5, y: 0.08, n: 3.4 },
    { x: 13.75, w: 1.98, hHaut: 0.48, hBas: 0.46, y: 0.08, n: 3 },
  ], { segments: 64, parSegment: 8 }), gris));
  // Radôme du radar RBE2, d'une teinte légèrement différente
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: -0.005, w: 0, h: 0, y: 0 },
    { x: 0.5, w: 0.265, hHaut: 0.135, hBas: 0.135, y: 0.02 },
    { x: 1.2, w: 0.585, hHaut: 0.295, hBas: 0.285, y: 0.06 },
    { x: 1.75, w: 0.83, hHaut: 0.41, hBas: 0.39, y: 0.1 },
  ], { segments: 48, parSegment: 6, fermer: false }), radome));
  // Dorsale : de l'arrière de la verrière jusqu'à la dérive
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 5.7, w: 0.56, hHaut: 0.3, hBas: 0.05, y: 0.6 },
    { x: 7.0, w: 0.82, hHaut: 0.38, hBas: 0.05, y: 0.58 },
    { x: 10.0, w: 0.74, hHaut: 0.3, hBas: 0.05, y: 0.58 },
    { x: 12.8, w: 0.46, hHaut: 0.2, hBas: 0.05, y: 0.56 },
    { x: 13.7, w: 0.24, hHaut: 0.08, hBas: 0.05, y: 0.54 },
  ], { segments: 32, parSegment: 6 }), gris));
  // Épaulements : ils prolongent le dessus des entrées d'air et portent les plans canard
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 4.5, w: 1.3, hHaut: 0.12, hBas: 0.2, y: 0.24, n: 3 },
    { x: 5.1, w: 2.1, hHaut: 0.18, hBas: 0.26, y: 0.24, n: 4 },
    { x: 6.2, w: 2.42, hHaut: 0.2, hBas: 0.3, y: 0.24, n: 4.4 },
    { x: 7.2, w: 2.62, hHaut: 0.2, hBas: 0.3, y: 0.22, n: 4.4 },
    { x: 9.5, w: 2.5, hHaut: 0.18, hBas: 0.28, y: 0.18, n: 4.4 },
    { x: 12.4, w: 2.36, hHaut: 0.14, hBas: 0.24, y: 0.14, n: 4 },
    { x: 13.4, w: 2.12, hHaut: 0.1, hBas: 0.18, y: 0.12, n: 3.4 },
  ], { segments: 48, parSegment: 6 }), gris));

  // Entrées d'air semi-ventrales (bouche en « D » de 0,7 × 0,95 m), conduits fondus dans le fuselage
  for (const cote of [1, -1]) {
    avion.add(new THREE.Mesh(loft(THREE, [
      { x: 4.95, w: 0.7, hHaut: 0.45, hBas: 0.5, y: -0.25, z: cote * 0.78, n: 2.6 },
      { x: 6.0, w: 0.74, hHaut: 0.46, hBas: 0.5, y: -0.25, z: cote * 0.78, n: 2.8 },
      { x: 7.6, w: 0.64, hHaut: 0.42, hBas: 0.48, y: -0.22, z: cote * 0.72, n: 2.8 },
      { x: 9.2, w: 0.4, hHaut: 0.3, hBas: 0.35, y: -0.18, z: cote * 0.62, n: 2.6 },
      { x: 10.2, w: 0.12, hHaut: 0.1, hBas: 0.12, y: -0.15, z: cote * 0.55, n: 2.2 },
    ], { segments: 36, parSegment: 6 }), gris));
    const bouche = new THREE.Mesh(new THREE.CircleGeometry(1, 32), noir);
    bouche.scale.set(0.3, 0.44, 1);
    bouche.rotation.y = -Math.PI / 2;
    bouche.position.set(4.94, -0.27, cote * 0.78);
    const levre = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 6, 32), grisFonce);
    levre.scale.set(0.34, 0.47, 0.5);
    levre.rotation.y = -Math.PI / 2;
    levre.position.set(4.95, -0.27, cote * 0.78);
    avion.add(bouche, levre);
  }

  // Aile delta (bord d'attaque à 46°, bord de fuite droit), léger dièdre négatif, élevons
  const aileG = surface(THREE, [[6.73, 1.0], [10.98, 5.04], [12.65, 5.04], [12.65, 1.0]], 0.13);
  const elevonG = surface(THREE, [[11.78, 1.15], [11.78, 2.95], [12.68, 2.95], [12.68, 1.15]], 0.08, { biseau: 0.015 });
  const elevonG2 = surface(THREE, [[11.78, 3.05], [11.78, 4.95], [12.68, 4.95], [12.68, 3.05]], 0.08, { biseau: 0.015 });
  for (const cote of [1, -1]) {
    const aile = new THREE.Group();
    const peau = new THREE.Mesh(aileG, gris);
    const e1 = new THREE.Mesh(elevonG, grisFonce);
    const e2 = new THREE.Mesh(elevonG2, grisFonce);
    e1.position.y = e2.position.y = 0.012;
    aile.add(peau, e1, e2);
    // Rail de bout d'aile et cocarde d'extrados
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.09, 0.12), grisFonce);
    rail.position.set(11.6, 0, 5.1);
    const c2 = cocarde(THREE, 0.32);
    c2.rotation.x = -Math.PI / 2;
    c2.position.set(11.1, 0.085, 3.9);
    aile.add(rail, c2);
    if (armement) {
      const mica = missile(THREE, 3.1, 0.16, materiaux);
      mica.position.set(10.15, 0, 5.2);
      aile.add(mica);
    }
    aile.scale.z = cote;
    aile.rotation.x = cote * 0.07;
    aile.position.y = -0.02;
    avion.add(aile);
    // Plans canard, posés sur les épaulements
    const canard = new THREE.Mesh(surface(THREE, [[4.73, 0.9], [6.27, 2.3], [6.61, 2.3], [6.47, 0.9]], 0.06, { biseau: 0.02 }), gris);
    canard.position.y = 0.42;
    canard.scale.z = cote;
    avion.add(canard);
    // Cocarde sur le flanc, derrière le plan canard
    const c1 = cocarde(THREE, 0.24);
    c1.position.set(8.3, 0.34, cote * 1.32);
    c1.rotation.y = cote > 0 ? 0 : Math.PI;
    avion.add(c1);
    // Tuyères des deux réacteurs M88, bien écartées
    const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.37, 0.75, 32, 1, true), metal);
    tuyere.rotation.z = Math.PI / 2;
    tuyere.position.set(13.7, 0.06, cote * 0.6);
    const petales = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.35, 0.22, 16, 1, true), noir);
    petales.rotation.z = Math.PI / 2;
    petales.position.set(14.15, 0.06, cote * 0.6);
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), noir);
    fond.rotation.y = Math.PI / 2;
    fond.position.set(13.5, 0.06, cote * 0.6);
    avion.add(tuyere, petales, fond);
    // Meteor sous l'aile, réservoir de 2 000 litres sous l'emplanture
    if (armement) {
      const meteor = missile(THREE, 3.65, 0.18, materiaux);
      meteor.position.set(9.4, -0.75, cote * 3.5);
      const pylone1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.07), grisFonce);
      pylone1.position.set(10.8, -0.42, cote * 3.5);
      const res = new THREE.Mesh(loft(THREE, [
        { x: 0, w: 0, h: 0 }, { x: 0.7, w: 0.5, h: 0.5 }, { x: 1.7, w: 0.74, h: 0.74 }, { x: 3.7, w: 0.74, h: 0.74 }, { x: 4.9, w: 0.34, h: 0.34 }, { x: 5.3, w: 0, h: 0 },
      ], { segments: 28, parSegment: 5 }), gris);
      res.position.set(7.2, -1.1, cote * 2.1);
      const pylone2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.08), grisFonce);
      pylone2.position.set(9.8, -0.6, cote * 2.1);
      avion.add(meteor, pylone1, res, pylone2);
    }
  }

  // Dérive en flèche, gouverne de direction, barre d'antennes Spectra près du sommet, saumon arrondi
  const derive = new THREE.Mesh(surface(THREE, [[10.1, 0.0], [13.7, 2.5], [14.5, 2.5], [14.05, 0.0]], 0.13, { plan: 'xy' }), gris);
  derive.position.y = 0.85;
  const gouverne = new THREE.Mesh(surface(THREE, [[13.5, 0.25], [13.95, 2.1], [14.42, 2.1], [14.05, 0.25]], 0.11, { plan: 'xy', biseau: 0.012 }), grisFonce);
  gouverne.position.y = 0.85;
  const spectra = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.22, 0.22), grisFonce);
  spectra.position.set(13.85, 2.86, 0);
  const saumon = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.7, 4, 10), gris);
  saumon.rotation.z = Math.PI / 2;
  saumon.position.set(14.1, 3.35, 0);
  avion.add(derive, gouverne, spectra, saumon);
  // Carénage arrière entre les tuyères (au pied de la dérive)
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 13.2, w: 0.3, hHaut: 0.16, hBas: 0.16, y: 0.55 },
    { x: 14.2, w: 0.3, hHaut: 0.15, hBas: 0.15, y: 0.53 },
    { x: 14.65, w: 0.18, hHaut: 0.09, hBas: 0.09, y: 0.52 },
    { x: 14.76, w: 0.04, hHaut: 0.02, hBas: 0.02, y: 0.52 },
  ], { segments: 16, parSegment: 4 }), gris));
  // Optronique secteur frontal (OSF) devant le pare-brise
  const osf = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), capteur);
  osf.scale.set(1.6, 0.9, 1);
  osf.position.set(1.85, 0.56, 0);
  avion.add(osf);

  // Verrière teintée d'or (monoplace ou biplace en tandem), baquet, sièges et casques
  const matHabitacle = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.9 });
  const matSiege = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 });
  const matCasque = new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.5, metalness: 0.2 });
  const poste = (places) => {
    const g = new THREE.Group();
    const fin = places === 2 ? 6.5 : 6.1;
    g.add(new THREE.Mesh(loft(THREE, [
      { x: 2.0, w: 0.55, hHaut: 0.0, hBas: 0.02, y: 0.58 },
      { x: 2.6, w: 0.7, hHaut: 0.38, hBas: 0.02, y: 0.58 },
      { x: 3.3, w: 0.76, hHaut: 0.66, hBas: 0.02, y: 0.58 },
      { x: 3.9, w: 0.78, hHaut: 0.78, hBas: 0.02, y: 0.6 },
      { x: places === 2 ? 5.3 : 4.8, w: 0.76, hHaut: 0.72, hBas: 0.02, y: 0.6 },
      { x: fin - 0.6, w: 0.66, hHaut: 0.5, hBas: 0.02, y: 0.6 },
      { x: fin, w: 0.5, hHaut: 0.32, hBas: 0.02, y: 0.62 },
    ], { segments: 40, parSegment: 6 }), verre));
    g.add(new THREE.Mesh(loft(THREE, [
      { x: 2.3, w: 0.5, hHaut: 0.0, hBas: 0.02, y: 0.58 },
      { x: 2.9, w: 0.66, hHaut: 0.16, hBas: 0.02, y: 0.58 },
      { x: fin - 0.5, w: 0.62, hHaut: 0.16, hBas: 0.02, y: 0.6 },
      { x: fin - 0.1, w: 0.4, hHaut: 0.04, hBas: 0.02, y: 0.62 },
    ], { segments: 24, parSegment: 4 }), matHabitacle));
    // Arceau du pare-brise, arceau central (biplace)
    for (const x of places === 2 ? [3.25, 4.9] : [3.25]) {
      const arceau = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.022, 8, 24, Math.PI), grisFonce);
      arceau.scale.set(1, x < 4 ? 1.85 : 2.0, 1);
      arceau.position.set(x, 0.6, 0);
      arceau.rotation.y = Math.PI / 2;
      g.add(arceau);
    }
    [...Array(places).keys()].forEach((k) => {
      const x = places === 2 ? 3.9 + k * 1.3 : 4.1;
      const siege = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.42), matSiege);
      siege.position.set(x + 0.36, 1.0, 0);
      const casque = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), matCasque);
      casque.position.set(x + 0.14, 1.12, 0);
      g.add(siege, casque);
    });
    return g;
  };
  const monoplace = poste(1);
  const biplace = poste(2);
  biplace.visible = false;
  avion.add(monoplace, biplace);

  // Train d'atterrissage (rentré par défaut) : diabolo avant, deux atterrisseurs principaux
  const train = new THREE.Group();
  const matJambe = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.6, roughness: 0.35 });
  const matPneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const roue = (r, l) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), matPneu); m.rotation.x = Math.PI / 2; return m; };
  const jambeAvant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 12), matJambe);
  jambeAvant.position.set(3.82, -1.05, 0);
  const roueAvant1 = roue(0.22, 0.15); roueAvant1.position.set(3.86, -1.53, 0.13);
  const roueAvant2 = roue(0.22, 0.15); roueAvant2.position.set(3.86, -1.53, -0.13);
  train.add(jambeAvant, roueAvant1, roueAvant2);
  for (const cote of [1, -1]) {
    const jambe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.0, 12), matJambe);
    jambe.position.set(9.0, -1.0, cote * 1.3);
    jambe.rotation.x = cote * 0.08;
    const r = roue(0.3, 0.22); r.position.set(9.0, -1.45, cote * 1.39);
    const trappe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.03), grisFonce);
    trappe.position.set(9.0, -0.8, cote * 1.05);
    train.add(jambe, r, trappe);
  }
  train.visible = false;
  avion.add(train);

  // Perche de ravitaillement amovible (côté droit, devant la verrière) et tube de Pitot
  const perche = new THREE.Group();
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.5, 12), grisFonce);
  tige.rotation.z = Math.PI / 2 - 0.35;
  tige.position.set(1.8, 0.85, -0.42);
  const embout = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.045, 0.18, 12), metal);
  embout.rotation.z = Math.PI / 2 - 0.35;
  embout.position.set(1.08, 1.11, -0.42);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.12), grisFonce);
  base.position.set(2.45, 0.62, -0.42);
  perche.add(tige, embout, base);
  avion.add(perche);
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.51, 8), metal);
  pitot.rotation.z = Math.PI / 2;
  pitot.position.set(-0.25, 0, 0);
  avion.add(pitot);

  avion.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // Centrage : le milieu de l'avion à l'origine
  const ox = -7.1;
  avion.position.set(ox, 0, 0);
  const groupe = new THREE.Group();
  groupe.add(avion);
  const p = (x, y, z) => new THREE.Vector3(x + ox, y, z);
  groupe.userData.legendes = [
    { texte: 'Plans canard', point: p(6.2, 0.5, 2.2) },
    { texte: 'Entrée d\'air', point: p(4.95, -0.3, 1.0) },
    { texte: 'Perche de ravitaillement', point: p(1.1, 1.15, -0.42) },
    { texte: 'Verrière', point: p(3.9, 1.45, 0) },
    { texte: 'Optronique secteur frontal', point: p(1.85, 0.66, 0) },
    { texte: 'Missile Meteor', point: p(10.7, -0.75, 3.5) },
    { texte: 'Missile MICA', point: p(11.6, -0.3, 5.2) },
    { texte: 'Réservoir 2 000 L', point: p(9.8, -1.1, -2.1) },
    { texte: 'Réacteurs M88', point: p(14.1, 0.06, 0.6) },
    { texte: 'Dérive et antennes Spectra', point: p(13.9, 3.1, 0) },
  ];
  groupe.userData.taille = 16;
  groupe.userData.basculer = {
    biplace: (on) => { biplace.visible = on; monoplace.visible = !on; },
    train: (on) => { train.visible = on; },
  };
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
    { x: 45, w: 9.4, hHaut: 0.55, hBas: 3.5, y: R - 0.2, n: 3.2 },
    { x: 81, w: 9.4, hHaut: 0.55, hBas: 3.5, y: R - 0.2, n: 3.2 },
    { x: 88, w: 3, hHaut: 0.2, hBas: 2.5, y: R - 0.3, n: 2.2 },
  ], { segments: 40, parSegment: 6 }).scale(s, s, s), coqueDos));

  // 16 tubes (2 rangées de 8) et leurs trappes, articulées côté extérieur
  const trappes = [];
  const dessusDos = R - 0.2 + 0.55;
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
  const kiosqueGeo = new THREE.ExtrudeGeometry(contour, { depth: 7.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.3, bevelSegments: 3, curveSegments: 16 });
  kiosqueGeo.rotateX(-Math.PI / 2);
  kiosqueGeo.translate(31.5, R - 1.2, 0);
  kiosqueGeo.scale(s, s, s);
  sub.add(new THREE.Mesh(kiosqueGeo, coqueDos));
  const barre = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 11.5), coqueDos);
  barre.position.set(35.7 * s, (R + 3.6) * s, 0);
  barre.scale.setScalar(s);
  sub.add(barre);
  // Mâts et périscopes
  [[34, 1.6], [35.5, 2.4], [37.1, 1.9], [38.9, 1.2]].forEach(([x, h]) => {
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, h, 12), metal);
    mat.position.set(x * s, (R + 6.3 + h / 2) * s, 0);
    mat.scale.setScalar(s);
    sub.add(mat);
  });

  // Gouvernes en croix (avec plaques d'extrémité) et hydrojet
  // D'après le plan de profil (domaine public) : gouvernes en croix presque rectangulaires, envergure proche du diamètre
  const gouverneV = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(3.8, 0), new THREE.Vector2(4.2, 2.9), new THREE.Vector2(0.9, 2.9)]);
  for (const sens of [1, -1]) {
    const g = new THREE.ExtrudeGeometry(gouverneV, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
    g.translate(124.2, 0, -0.25);
    const m = new THREE.Mesh(g, coque);
    m.scale.set(s, sens * s, s);
    m.position.y = sens * 3.1 * s;
    sub.add(m);
    const h = new THREE.ExtrudeGeometry(gouverneV, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
    h.translate(124.2, 0, -0.25);
    h.rotateX(Math.PI / 2);
    const mh = new THREE.Mesh(h, coque);
    mh.scale.set(s, s, sens * s);
    mh.position.z = sens * 3.1 * s;
    sub.add(mh);
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.35), coque);
    plaque.position.set(126.4 * s, 0, sens * 6.0 * s);
    plaque.scale.setScalar(s);
    sub.add(plaque);
  }
  const carenage = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 2.7, 5.6, 40, 1, true), coque);
  carenage.material = coque.clone();
  carenage.material.side = THREE.DoubleSide;
  carenage.rotation.z = Math.PI / 2;
  carenage.position.set(135.4 * s, 0, 0);
  carenage.scale.setScalar(s);
  const moyeu = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.2, 24), metal);
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
    { texte: 'Kiosque', point: decal(37.5, R + 7, 0) },
    { texte: 'Barres de plongée', point: decal(35.7, R + 3.6, 5.8) },
    { texte: '16 tubes de missiles M51', point: decal(64, dessusDos + 0.5, 3.5) },
    { texte: 'Gouvernes en croix', point: decal(126, 6, 0) },
    { texte: 'Hydrojet (propulsion)', point: decal(136.5, 2.4, 0) },
    { texte: 'Étrave (sonar)', point: decal(2, 0, 3) },
  ];
  groupe.userData.taille = 14;
  return groupe;
}

/** Gouvernes et trappes communes aux sous-marins lanceurs d'engins. */
function trappesMissiles(THREE, { xDebut, pas, y, s, materiaux }) {
  const groupe = new THREE.Group();
  const trappes = [];
  for (let i = 0; i < 8; i++) {
    for (const cote of [1, -1]) {
      const x = xDebut + i * pas;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.2, 24), materiaux.tube);
      tube.position.set(x * s, (y + 0.01) * s, cote * 2.0 * s);
      tube.scale.setScalar(s);
      groupe.add(tube);
      const charniere = new THREE.Group();
      charniere.position.set(x * s, (y + 0.06) * s, cote * 3.45 * s);
      const trappe = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 2.9), materiaux.trappe);
      trappe.position.set(0, 0, -cote * 1.45);
      const pivot = new THREE.Group();
      pivot.add(trappe);
      pivot.scale.setScalar(s);
      charniere.add(pivot);
      charniere.userData = { cote, angle: 0 };
      groupe.add(charniere);
      trappes.push(charniere);
    }
  }
  return { groupe, trappes };
}

/**
 * SNLE de 3e génération (classe L'Invincible), d'après une image de
 * présentation du programme et les sources ouvertes (environ 150 m, environ
 * 15 000 t en plongée) : coque noire à tuiles anéchoïques, étrave arrondie,
 * kiosque avancé à grand congé de raccordement à l'avant et barres de
 * plongée en flèche à mi-hauteur, trappes des 16 missiles M51 au ras du pont
 * derrière le kiosque, longue antenne sonar sur chaque flanc, gouvernes
 * arrière en X complétées par un aileron vertical (sonar remorqué) et
 * hydrojet. Les plans définitifs ne sont pas publics : silhouette fidèle à
 * l'image, détails indicatifs. Échelle 1/10 (150 m → 15 unités).
 */
export function construireSnle3G(THREE) {
  const s = 0.1;
  const L = 150, R = 6.5;
  const sub = new THREE.Group();
  const coque = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#15171a', trait: 'rgba(210,215,220,0.13)', repetition: [16, 4] }), metalness: 0.15, roughness: 0.48 });
  const kiosqueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#17191c', trait: 'rgba(210,215,220,0.16)', repetition: [3, 2] }), metalness: 0.15, roughness: 0.48 });
  const uni = new THREE.MeshStandardMaterial({ color: 0x17191c, metalness: 0.15, roughness: 0.48 });
  const antenneMat = new THREE.MeshStandardMaterial({ color: 0x1d2125, metalness: 0.35, roughness: 0.25 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4f55, metalness: 0.7, roughness: 0.4 });
  const materiaux = { trappe: new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#15171a', trait: 'rgba(210,215,220,0.22)', repetition: [1, 1] }), metalness: 0.15, roughness: 0.48 }), tube: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.9 }) };
  // Pièces construites en mètres, mises à l'échelle d'un coup
  const m = new THREE.Group();
  m.scale.setScalar(s);
  sub.add(m);

  // Coque : étrave arrondie assez pleine, long cylindre, arrière effilé vers l'hydrojet
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0, h: 0 }, { x: 1.2, w: 5.6, h: 5.6 }, { x: 4, w: 9.8, h: 9.8 }, { x: 8, w: 12.0, h: 12.0 },
    { x: 14, w: 12.9, h: 12.9 }, { x: 20, w: 2 * R, h: 2 * R }, { x: 114, w: 2 * R, h: 2 * R }, { x: 123, w: 12.3, h: 12.3 },
    { x: 132, w: 10.2, h: 10.2 }, { x: 140, w: 7.4, h: 7.4 }, { x: 145.5, w: 5.0, h: 5.0 }, { x: 148.5, w: 3.8, h: 3.8 },
  ], { segments: 72, parSegment: 6 }), coque));
  // Pont très légèrement aplati au-dessus des 16 tubes, derrière le kiosque (trappes au ras du pont)
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 63, w: 2, hHaut: 0.1, hBas: 2, y: R - 0.4, n: 3 },
    { x: 66, w: 7.2, hHaut: 0.5, hBas: 2.6, y: R - 0.35, n: 3.4 },
    { x: 105, w: 7.2, hHaut: 0.5, hBas: 2.6, y: R - 0.35, n: 3.4 },
    { x: 109, w: 2, hHaut: 0.1, hBas: 2, y: R - 0.4, n: 3 },
  ], { segments: 40, parSegment: 5 }), coque));
  const { groupe: tubes, trappes } = trappesMissiles(THREE, { xDebut: 68.5, pas: 4.85, y: R + 0.12, s, materiaux });
  sub.add(tubes);

  // Kiosque : flancs droits, avant arrondi, sommet plat à coins arrondis ; 7 m au-dessus du dos
  const contour = new THREE.Shape();
  contour.moveTo(0, 0);
  contour.bezierCurveTo(0, 1.45, 1.4, 1.6, 3.2, 1.6);
  contour.lineTo(12.6, 1.4);
  contour.quadraticCurveTo(14.4, 1.1, 14.6, 0);
  contour.quadraticCurveTo(14.4, -1.1, 12.6, -1.4);
  contour.lineTo(3.2, -1.6);
  contour.bezierCurveTo(1.4, -1.6, 0, -1.45, 0, 0);
  const kiosqueGeo = new THREE.ExtrudeGeometry(contour, { depth: 8.5, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.4, bevelSegments: 5, curveSegments: 18 });
  kiosqueGeo.rotateX(-Math.PI / 2);
  kiosqueGeo.translate(50.6, R - 1.5, 0);
  m.add(new THREE.Mesh(kiosqueGeo, kiosqueMat));
  // Grand congé de raccordement à l'avant du kiosque (il adoucit l'écoulement de l'eau) et petit congé à l'arrière
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 42.5, w: 0.6, hHaut: 0.1, hBas: 0.3, y: R - 0.3, n: 2 },
    { x: 45.5, w: 2.0, hHaut: 1.2, hBas: 0.4, y: R - 0.3, n: 2.2 },
    { x: 48.5, w: 2.9, hHaut: 3.2, hBas: 0.4, y: R - 0.3, n: 2.4 },
    { x: 51.2, w: 3.25, hHaut: 5.6, hBas: 0.4, y: R - 0.3, n: 2.6 },
    { x: 52.4, w: 3.25, hHaut: 6.2, hBas: 0.4, y: R - 0.3, n: 2.6 },
  ], { segments: 28, parSegment: 6 }), kiosqueMat));
  m.add(new THREE.Mesh(loft(THREE, [
    { x: 63.5, w: 2.7, hHaut: 2.4, hBas: 0.3, y: R - 0.3, n: 2.4 },
    { x: 66.5, w: 1.6, hHaut: 0.8, hBas: 0.3, y: R - 0.3, n: 2.2 },
    { x: 68.5, w: 0.4, hHaut: 0.05, hBas: 0.1, y: R - 0.3, n: 2 },
  ], { segments: 24, parSegment: 5 }), kiosqueMat));
  // Barres de plongée en flèche, à mi-hauteur du kiosque, bout arrondi
  for (const cote of [1, -1]) {
    const barre = new THREE.Mesh(surface(THREE, [[52.6, 1.45], [56.4, 8.4], [58.9, 8.4], [57.8, 1.45]].map(([x, z]) => [x, z * cote]), 0.5, { biseau: 0.18 }), kiosqueMat);
    barre.position.y = R + 3.9;
    m.add(barre);
    const bout = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 2.1, 4, 10), uni);
    bout.rotation.z = Math.PI / 2;
    bout.position.set(57.65, R + 3.9, cote * 8.4);
    m.add(bout);
  }
  // Mâts escamotables, au ras du sommet du kiosque
  [[54, 0.2], [56.5, 0.3], [59, 0.25], [61, 0.2]].forEach(([x, h]) => {
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, h, 12), metal);
    mat.position.set(x, R + 7.6 + h / 2, 0);
    m.add(mat);
  });

  // Longue antenne sonar sur chaque flanc (carénage en relief, bords arrondis)
  for (const cote of [1, -1]) {
    m.add(new THREE.Mesh(loft(THREE, [
      { x: 37.5, w: 0.1, hHaut: 1.1, hBas: 1.1, y: -1.1, z: cote * (R - 0.15), n: 2.4 },
      { x: 39.5, w: 0.75, hHaut: 1.35, hBas: 1.35, y: -1.1, z: cote * (R - 0.08), n: 3.2 },
      { x: 107.5, w: 0.75, hHaut: 1.35, hBas: 1.35, y: -1.1, z: cote * (R - 0.08), n: 3.2 },
      { x: 109.5, w: 0.1, hHaut: 1.1, hBas: 1.1, y: -1.1, z: cote * (R - 0.15), n: 2.4 },
    ], { segments: 24, parSegment: 4 }), antenneMat));
    // Portes des tubes lance-torpilles à l'étrave
    m.add(pieces(THREE, uni, [[13.5, -1.4, cote * 6.45, 3.0, 0.9, 0.12], [13.5, -2.6, cote * 6.4, 3.0, 0.9, 0.12]]));
  }
  // Panneau d'évacuation circulaire sur le pont avant, feu de position
  const panneau = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 28), uni);
  panneau.position.set(34, R + 0.02, 0);
  const feu = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc8312a }));
  feu.position.set(82, R + 0.62, 0);
  m.add(panneau, feu);

  // Gouvernes arrière en X, aileron vertical supérieur (sonar remorqué) et hydrojet
  const forme = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(6.8, 0), new THREE.Vector2(7.6, 5.4), new THREE.Vector2(4.2, 5.4)]);
  for (const angle of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
    g.translate(135, 3.0, -0.25);
    const pivot = new THREE.Group();
    pivot.rotation.x = angle;
    pivot.add(new THREE.Mesh(g, coque));
    m.add(pivot);
  }
  const aileron = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(5.6, 0), new THREE.Vector2(5.4, 6.6), new THREE.Vector2(2.6, 6.6)]), { depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
  aileron.translate(131.5, 3.2, -0.3);
  m.add(new THREE.Mesh(aileron, coque));
  const distributeur = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 2.4, 4, 12), uni);
  distributeur.rotation.z = Math.PI / 2;
  distributeur.position.set(135.4, 9.9, 0);
  m.add(distributeur);
  const carenageMat = coque.clone();
  carenageMat.side = THREE.DoubleSide;
  const carenage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.1, 4.6, 40, 1, true), carenageMat);
  carenage.rotation.z = Math.PI / 2;
  carenage.position.set(150, 0, 0);
  const moyeu = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.6, 24), metal);
  moyeu.rotation.z = -Math.PI / 2;
  moyeu.position.set(151.2, 0, 0);
  // Stator : aubes entre le carénage et le moyeu
  const aubes = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    aubes.push([149.2, Math.sin(a) * 1.65, Math.cos(a) * 1.65, 0.6, 0.12, 1.0]);
  }
  m.add(carenage, moyeu, pieces(THREE, metal, aubes));

  // Missile M51 (tir d'essai)
  const m51 = new THREE.Group();
  const missileMat = new THREE.MeshStandardMaterial({ color: 0xe6e8ea, metalness: 0.2, roughness: 0.45 });
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 11, 24), missileMat);
  corps.position.y = 5.5;
  const coiffe = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.2, 24), missileMat);
  coiffe.position.y = 12.6;
  m51.add(corps, coiffe);
  m51.scale.setScalar(s);
  m51.position.set(68.5 * s, (R + 0.2 - 12) * s, 2.0 * s);
  m51.visible = false;
  sub.add(m51);

  sub.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  sub.position.set(-(L / 2) * s, -1.5 * s, 0);
  const groupe = new THREE.Group();
  groupe.add(sub);
  const decal = (x, y, z) => new THREE.Vector3(x * s - (L / 2) * s, y * s - 1.5 * s, z * s);
  groupe.userData.trappes = trappes;
  groupe.userData.missile = m51;
  groupe.userData.dessusDos = (R + 0.2) * s;
  groupe.userData.legendes = [
    { texte: 'Kiosque et son congé de raccordement', point: decal(52, R + 8, 0) },
    { texte: 'Barres de plongée', point: decal(57.6, R + 3.9, -8.4) },
    { texte: '16 missiles M51 (trappes au ras du pont)', point: decal(86, R + 0.8, -3.5) },
    { texte: 'Antenne sonar latérale', point: decal(75, -1.1, -(R + 0.4)) },
    { texte: 'Gouvernes en X', point: decal(140, -5, -5) },
    { texte: 'Aileron du sonar remorqué', point: decal(135, 10.6, 0) },
    { texte: 'Hydrojet (propulsion silencieuse)', point: decal(151, 2.6, 0) },
  ];
  groupe.userData.taille = 15;
  return groupe;
}

/** Texture du pont d'envol (marquages, catapultes, ascenseurs), transparente hors du pont. */
function texturePont(THREE, contour) {
  const W = 2048, H = 674; // 310 m × 102 m
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const px = (x) => (x / 310) * W;
  const py = (z) => ((z + 51) / 102) * H; // le haut de l'image = tribord
  ctx.beginPath();
  contour.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), py(z)) : ctx.moveTo(px(x), py(z))));
  ctx.closePath();
  ctx.fillStyle = '#45484d';
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Usure du revêtement
  let g = 3;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 2500; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '0,0,0'},0.035)`; ctx.fillRect(h() * W, h() * H, 6 + h() * 30, 2 + h() * 6); }
  const ligne = (x1, z1, x2, z2, couleur, largeur, tirets = null) => {
    ctx.strokeStyle = couleur; ctx.lineWidth = largeur; ctx.setLineDash(tirets ?? []);
    ctx.beginPath(); ctx.moveTo(px(x1), py(z1)); ctx.lineTo(px(x2), py(z2)); ctx.stroke(); ctx.setLineDash([]);
  };
  // Piste oblique (environ 9°) : bords, axe en tirets, zone d'appontage et brins d'arrêt
  const A = [306, 4], B = [135, 31];
  const dx = B[0] - A[0], dz = B[1] - A[1], n = Math.hypot(dx, dz), ox = -dz / n * 12, oz = dx / n * 12;
  ligne(A[0] + ox, A[1] + oz, B[0] + ox, B[1] + oz, '#f2f2f2', 4);
  ligne(A[0] - ox, A[1] - oz, B[0] - ox, B[1] - oz, '#f2f2f2', 4);
  ligne(A[0], A[1], B[0], B[1], '#f2f2f2', 3, [26, 22]);
  for (let k = 0; k < 3; k++) { const t = 0.12 + k * 0.06; const x = A[0] + dx * t, z = A[1] + dz * t; ligne(x + ox, z + oz, x - ox, z - oz, '#d9d9d9', 3); }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 8; k++) { const t = 0.32 + k * 0.012; const x = A[0] + dx * t, z = A[1] + dz * t; ctx.fillRect(px(x) - 3, py(z) - 26, 6, 52); }
  // Catapultes électromagnétiques : deux à l'avant, une sur la piste oblique
  ligne(14, 7, 95, 7, '#f5d94a', 3);
  ligne(18, -8, 100, -9, '#f5d94a', 3);
  ligne(130, 27, 205, 15, '#f5d94a', 3);
  // Ligne de sécurité (« foul line ») et axe avant
  ligne(310, -18, 120, 12, '#f5d94a', 2, [14, 10]);
  ligne(4, 0, 120, 0, '#f2f2f2', 2, [18, 18]);
  // Ascenseurs latéraux à tribord
  ctx.strokeStyle = '#d8c04a'; ctx.lineWidth = 5;
  for (const [x1, x2] of [[128, 150], [184, 206]]) ctx.strokeRect(px(x1), py(-43), px(x2) - px(x1), py(-31) - py(-43));
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Hélicoptère simplifié (NH90 Caïman Marine). */
function helicoptere(THREE, mat, matRotor) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.5, hHaut: 0.6, hBas: 0.6, y: 1.6 }, { x: 1.5, w: 2.6, hHaut: 1.5, hBas: 1.1, y: 1.8, n: 2.6 },
    { x: 7, w: 2.8, hHaut: 1.5, hBas: 1.2, y: 1.8, n: 3 }, { x: 10, w: 1.2, hHaut: 0.7, hBas: 0.3, y: 2.6 }, { x: 15, w: 0.5, hHaut: 0.4, hBas: 0.2, y: 3 },
  ], { segments: 24, parSegment: 4 }), mat));
  // Rotor principal : cinq pales repliées le long du fuselage, comme sur un pont d'envol
  const rotor = new THREE.Group();
  rotor.position.set(5, 4, 0);
  [0, 0.25, -0.25, 0.5, -0.5].forEach((a) => { const pale = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 0.5), matRotor); pale.position.x = 4; const pivot = new THREE.Group(); pivot.rotation.y = a; pivot.add(pale); rotor.add(pivot); });
  const deriv = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.2), mat);
  deriv.position.set(15, 4, 0);
  g.add(rotor, deriv);
  return g;
}

/** Avion de guet aérien simplifié (aile droite haute, radôme rotatif, quatre dérives). */
function avionDeGuet(THREE, mat, matSombre) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.4, h: 0.4, y: 1.9 }, { x: 2.5, w: 2.2, hHaut: 1.2, hBas: 1.1, y: 2.2 }, { x: 10, w: 2.4, hHaut: 1.2, hBas: 1.1, y: 2.4 }, { x: 17.5, w: 0.8, hHaut: 0.4, hBas: 0.3, y: 3 },
  ], { segments: 24, parSegment: 4 }), mat));
  const aile = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 24.6), mat);
  aile.position.set(6.5, 3.5, 0);
  const radome = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.65, 0.75, 40), matSombre);
  radome.position.set(9.5, 5.4, 0);
  const empennage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 8), mat);
  empennage.position.set(16.5, 3.2, 0);
  g.add(aile, radome, empennage);
  for (const z of [-4, -1.4, 1.4, 4]) { const d = new THREE.Mesh(new THREE.BoxGeometry(2, 2.6, 0.2), mat); d.position.set(16.6, 4.4, z); g.add(d); }
  for (const z of [-3.6, 3.6]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 1.4, 16), matSombre); h.rotation.z = Math.PI / 2; h.position.set(4.6, 3.3, z); g.add(h); }
  return g;
}

/**
 * Porte-avions « France Libre » (porte-avions de nouvelle génération), d'après
 * l'infographie de la Marine nationale : 310 m, île à tribord vers l'arrière,
 * piste oblique, deux ascenseurs latéraux, trois catapultes. Échelle 1/20.
 * userData.catapulte : Rafale en bout de catapulte (lancement animé).
 */
export function construirePorteAvions(THREE) {
  const s = 0.05;
  const navire = new THREE.Group();
  const flottaison = -20;
  const coque = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.1, roughness: 0.75, envMapIntensity: 0.45 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.2, roughness: 0.6 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x60666c, metalness: 0.25, roughness: 0.6 });
  const vitres = new THREE.MeshStandardMaterial({ color: 0x1c2733, metalness: 0.6, roughness: 0.15 });

  // Coque : gris au-dessus de la flottaison, liseré noir, carène rouge (peinture antisalissure)
  const couleur = (x, y) => (y < flottaison - 0.6 ? [0.5, 0.12, 0.1] : y < flottaison + 0.6 ? [0.1, 0.1, 0.11] : [0.47, 0.5, 0.53]);
  navire.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 2, hHaut: 1, hBas: 1, y: -1.5, n: 2.5 },
    { x: 6, w: 12, hHaut: 2, hBas: 9, y: -3, n: 2.5 },
    { x: 20, w: 26, hHaut: 3, hBas: 18, y: -5, n: 2.8 },
    { x: 50, w: 36, hHaut: 3, hBas: 24, y: -5, n: 3.2 },
    { x: 150, w: 41, hHaut: 3, hBas: 26, y: -5, n: 3.6 },
    { x: 262, w: 40, hHaut: 3, hBas: 25, y: -5, n: 3.6 },
    { x: 300, w: 36, hHaut: 3, hBas: 19, y: -5, n: 3.4 },
    { x: 309, w: 33, hHaut: 3, hBas: 13, y: -5, n: 3.2 },
  ], { segments: 56, parSegment: 6, couleur }), coque));

  // Pont d'envol (épaisseur 2 m) et ses marquages
  const contour = [[1, -6], [1, 6], [25, 18], [80, 24], [140, 27], [165, 45], [296, 46], [306, 40], [308, -30], [298, -36], [250, -36], [246, -43], [122, -43], [116, -36], [60, -31], [22, -20]];
  const forme = new THREE.Shape(contour.map(([x, z]) => new THREE.Vector2(x, z)));
  const pontGeo = new THREE.ExtrudeGeometry(forme, { depth: 2, bevelEnabled: false });
  pontGeo.rotateX(Math.PI / 2);
  pontGeo.translate(0, 0, 0);
  navire.add(new THREE.Mesh(pontGeo, gris));
  const marquages = new THREE.Mesh(new THREE.PlaneGeometry(310, 102), new THREE.MeshStandardMaterial({ map: texturePont(THREE, contour), transparent: true, alphaTest: 0.4, roughness: 0.85, metalness: 0.05 }));
  marquages.rotation.x = -Math.PI / 2;
  marquages.position.set(155, 0.06, 0);
  navire.add(marquages);
  // Sous le pont : flancs du débord (ombre) jusqu'à la coque
  const flancs = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 4, bevelEnabled: false }), grisFonce);
  flancs.geometry.rotateX(Math.PI / 2);
  flancs.position.y = -2;
  flancs.scale.set(0.985, 1, 0.94);
  flancs.position.x = 2;
  navire.add(flancs);

  // Île à tribord, vers l'arrière : passerelles, radars à faces planes, mât
  const base = new THREE.Mesh(new THREE.BoxGeometry(28, 14, 10), gris);
  base.position.set(229, 7, -35);
  const haut = new THREE.Mesh(new THREE.BoxGeometry(19, 9, 8), gris);
  haut.position.set(231, 18.5, -35);
  const passerelle = new THREE.Mesh(new THREE.BoxGeometry(19.3, 1.6, 8.3), vitres);
  passerelle.position.set(231, 20.5, -35);
  const radar = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.6, 7, 4), gris);
  radar.rotation.y = Math.PI / 4;
  radar.position.set(231, 26.5, -35);
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 16, 10), grisFonce);
  mat.position.set(231, 38, -35);
  const vergue = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 7), grisFonce);
  vergue.position.set(231, 40, -35);
  navire.add(base, haut, passerelle, radar, mat, vergue);

  // Groupe aérien sur le pont : Rafale Marine (train sorti), avion de guet, hélicoptères
  const rafale = construireRafale(THREE, { armement: false });
  rafale.userData.basculer.train(true);
  const hauteur = 2.0;
  const parques = [[60, -24, 0.8], [76, -24, 0.8], [92, -24, 0.8], [258, -27, 0.9], [274, -27, 0.9], [290, -26, 0.9]];
  for (const [x, z, r] of parques) {
    const a = rafale.clone(true);
    a.position.set(x, hauteur, z);
    a.rotation.y = r;
    navire.add(a);
  }
  const catapulte = rafale.clone(true);
  catapulte.position.set(88, hauteur, 7);
  navire.add(catapulte);
  const guet = avionDeGuet(THREE, gris, grisFonce);
  guet.position.set(35, 0, 12);
  guet.rotation.y = -2.5;
  navire.add(guet);
  const matRotor = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.7 });
  for (const [x, z, r] of [[112, -30, 1.3], [200, -30, 1.4]]) {
    const h = helicoptere(THREE, grisFonce, matRotor);
    h.position.set(x, 0, z);
    h.rotation.y = r;
    navire.add(h);
  }

  navire.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  marquages.castShadow = false;
  // Les petits appareils sur le pont ne projettent pas d'ombre (rendu plus fluide sur téléphone)
  navire.children.filter((o) => o.isGroup).forEach((g) => g.traverse((o) => { if (o.isMesh) o.castShadow = false; }));

  // Mer
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: 0x0e3a5f, roughness: 0.45, metalness: 0, envMapIntensity: 0.3, transparent: true, opacity: 0.86 }));
  mer.rotation.x = -Math.PI / 2;
  mer.position.y = flottaison;
  mer.receiveShadow = true;
  navire.add(mer);

  navire.scale.setScalar(s);
  navire.position.set(-155 * s, 0.4, 0);
  const groupe = new THREE.Group();
  groupe.add(navire);
  const p = (x, y, z) => new THREE.Vector3(x * s - 155 * s, y * s + 0.4, z * s);
  groupe.userData.catapulte = { avion: catapulte, x0: 88, y0: hauteur };
  groupe.userData.legendes = [
    { texte: 'Île', point: p(231, 30, -35) },
    { texte: 'Piste oblique', point: p(240, 1, 18) },
    { texte: 'Catapultes électromagnétiques', point: p(40, 1, 0) },
    { texte: 'Ascenseurs', point: p(140, 1, -40) },
    { texte: 'Rafale Marine', point: p(76, 4, -24) },
    { texte: 'Avion de guet aérien', point: p(32, 6, 12) },
    { texte: 'Hélicoptère', point: p(112, 4, -30) },
  ];
  groupe.userData.taille = 16;
  groupe.userData.mer = true;
  return groupe;
}

/**
 * Contour du pont d'envol du Charles-de-Gaulle, relevé sur le plan de
 * l'infographie de la Marine nationale (x : distance à l'étrave en mètres,
 * z : bâbord positif). Étrave large, bord bâbord dans l'axe de la piste
 * oblique, île et ascenseurs à tribord.
 */
const CONTOUR_CDG = [[0, -16.5], [2.5, -18.8], [57, -19.6], [61, -30.5], [244, -30.5], [249, -20], [261.5, -19], [261.5, 17.7], [72, 33.5], [66.5, 33], [60, 16.5], [3, 11.2], [0, 9.2]];

/** Pont du Charles-de-Gaulle (262 m × 70 m) : piste oblique sombre, brins d'arrêt, catapultes, lignes de sécurité, ascenseurs. */
function texturePontCdG(THREE, contour) {
  const L = 262, LARG = 70;
  const W = 2048, H = Math.round(W * LARG / L);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const px = (x) => (x / L) * W;
  const py = (z) => ((z + LARG / 2) / LARG) * H; // le haut de l'image = tribord
  const k = W / L; // pixels par mètre
  const chemin = (pts) => { ctx.beginPath(); pts.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), py(z)) : ctx.moveTo(px(x), py(z)))); ctx.closePath(); };
  chemin(contour);
  ctx.fillStyle = '#6b6e72';
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Piste oblique : revêtement antidérapant sombre
  const piste = [[260.5, 8.5], [260.5, -18.5], [67.5, 5.8], [67.5, 28.5]];
  chemin(piste);
  ctx.fillStyle = '#3c3e42';
  ctx.fill();
  let g = 7;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let n = 0; n < 2600; n++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '0,0,0'},0.04)`; ctx.fillRect(h() * W, h() * H, 6 + h() * 30, 2 + h() * 6); }
  const ligne = (x1, z1, x2, z2, couleur, largeur, tirets = null) => {
    ctx.strokeStyle = couleur; ctx.lineWidth = largeur * k; ctx.setLineDash((tirets ?? []).map((d) => d * k));
    ctx.beginPath(); ctx.moveTo(px(x1), py(z1)); ctx.lineTo(px(x2), py(z2)); ctx.stroke(); ctx.setLineDash([]);
  };
  const rouge = (x1, z1, x2, z2) => { ligne(x1, z1, x2, z2, '#f2f2f2', 0.55); ligne(x1, z1, x2, z2, '#d8343a', 0.55, [1.6, 1.6]); };
  // Bords de la piste, axe, extrémité avant
  const [A, B, C, D] = piste;
  ligne(A[0] - 1, A[1] - 0.6, D[0], D[1] - 0.6, '#f0f0f0', 0.9);
  ligne(B[0] - 1, B[1] + 0.6, C[0], C[1] + 0.6, '#f0f0f0', 0.9);
  ligne(C[0] + 0.4, C[1], D[0] + 0.4, D[1], '#f0f0f0', 0.9);
  const axe = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], axeAv = [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2];
  ligne(axe[0], axe[1], axeAv[0], axeAv[1], '#f0f0f0', 0.5, [7, 7]);
  // Trois brins d'arrêt
  for (const t of [0.17, 0.2, 0.23]) {
    const x = A[0] + (D[0] - A[0]) * t;
    const z1 = A[1] + (D[1] - A[1]) * t, z2 = B[1] + (C[1] - B[1]) * t;
    ligne(x, z1 - 0.8, x - 3 * (z1 - z2) / 27 * 0.1, z2 + 0.8, '#d4d4d4', 0.25);
  }
  // Zone hachurée à l'avant de la piste oblique (comme sur le plan de la Marine)
  const coin = [[122.7, 20.1], [76.8, 18.8], [76.8, 14.2], [122.7, 3.1]];
  chemin(coin);
  ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 0.7 * k; ctx.stroke();
  for (let n = 1; n < 12; n++) {
    const t = n / 12;
    const x = 122.7 + (76.8 - 122.7) * t;
    ligne(x, 20.1 + (18.8 - 20.1) * t, x, 3.1 + (14.2 - 3.1) * t, '#f2f2f2', 0.7);
  }
  ligne(122.7, 11.6, 76.8, 16.5, '#f2f2f2', 0.6);
  // Catapultes de 75 m : à l'avant et sur la piste oblique
  ligne(9, 3.6, 96, 3.6, '#d9d9d9', 0.6);
  ligne(150, 20.6, 78, 25.1, '#d9d9d9', 0.6);
  // Lignes de sécurité rouges et blanches
  rouge(247, -20.6, 23, 10.2);
  rouge(179, 10.2, 62, 15.9);
  rouge(161, 6.3, 43, 12);
  // Bande jaune du bord arrière
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(px(259.6), py(-18.5), px(261.5) - px(259.6), py(17.2) - py(-18.5));
  // Deux ascenseurs latéraux à tribord, en arrière de l'île : bordure hachurée jaune et noire
  for (const [x1, x2] of [[122, 141], [190, 209]]) {
    const z1 = -30.5, z2 = -18.5;
    ctx.fillStyle = '#55585c';
    ctx.fillRect(px(x1), py(z1), px(x2) - px(x1), py(z2) - py(z1));
    ctx.save();
    ctx.beginPath(); ctx.rect(px(x1), py(z1), px(x2) - px(x1), py(z2) - py(z1)); ctx.clip();
    ctx.lineWidth = 1.2 * k;
    for (let n = -20; n < 40; n++) {
      ctx.strokeStyle = n % 2 ? '#1d1d1d' : '#e8c21c';
      ctx.beginPath(); ctx.moveTo(px(x1 + n * 1.2), py(z1)); ctx.lineTo(px(x1 + n * 1.2 + 12), py(z2)); ctx.stroke();
    }
    ctx.fillStyle = '#55585c';
    ctx.fillRect(px(x1 + 1.3), py(z1 + 0.2), px(x2 - 1.3) - px(x1 + 1.3), py(z2 - 1.3) - py(z1 + 0.2));
    ctx.strokeStyle = '#c9504f'; ctx.lineWidth = 0.3 * k;
    ctx.strokeRect(px(x1 + 3), py(z1 + 2), px(x2 - 3) - px(x1 + 3), py(z2 - 3) - py(z1 + 2));
    ctx.restore();
    ctx.strokeStyle = '#2a2b2d'; ctx.lineWidth = 0.4 * k;
    ctx.strokeRect(px(x1), py(z1), px(x2) - px(x1), py(z2) - py(z1));
  }
  ctx.restore();
  // Liseré du bord du pont
  chemin(contour);
  ctx.strokeStyle = 'rgba(30,32,35,0.8)'; ctx.lineWidth = 0.6 * k; ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Texte peint (numéro de coque) sur fond transparent. */
export function texturePeinte(THREE, texte, { couleur = '#1b1d20', largeur = 256, hauteur = 96 } = {}) {
  const c = document.createElement('canvas');
  c.width = largeur; c.height = hauteur;
  const ctx = c.getContext('2d');
  ctx.fillStyle = couleur;
  ctx.font = `bold ${Math.round(hauteur * 0.8)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texte, largeur / 2, hauteur / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Bloc aux flancs inclinés (superstructures furtives) : base l × p, sommet réduit. */
export function tronc(THREE, l, h, p, lHaut, pHaut, materiau) {
  const geo = new THREE.BoxGeometry(l, h, p);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) { pos.setX(i, pos.getX(i) * lHaut / l); pos.setZ(i, pos.getZ(i) * pHaut / p); }
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, materiau);
}

/**
 * Porte-avions « Charles-de-Gaulle », d'après l'infographie de la Marine
 * nationale (profil, plan du pont, photographies) : 261,5 m × 64,4 m, île à
 * tribord vers l'avant (sans cheminée : propulsion nucléaire) avec ses
 * radômes et son mât, piste oblique sombre, deux catapultes de 75 m, deux
 * ascenseurs latéraux en arrière de l'île, Rafale Marine, avion de guet et
 * hélicoptère sur le pont. Échelle 1/20.
 */
export function construireCharlesDeGaulle(THREE) {
  const s = 0.05;
  const navire = new THREE.Group();
  const flottaison = -17.5;
  const coque = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.1, roughness: 0.72, envMapIntensity: 0.5 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x9da3a9, metalness: 0.2, roughness: 0.6 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x5f656b, metalness: 0.25, roughness: 0.6 });
  const blanc = new THREE.MeshStandardMaterial({ color: 0xf2f2ef, metalness: 0.05, roughness: 0.45 });
  const vitres = new THREE.MeshStandardMaterial({ color: 0x1c2733, metalness: 0.6, roughness: 0.15 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2b2f34, metalness: 0.2, roughness: 0.8 });
  const jaune = new THREE.MeshStandardMaterial({ color: 0xf2b705, metalness: 0.1, roughness: 0.6 });

  // Coque gris clair au-dessus de la flottaison, liseré noir, carène rouge ; franc-bord d'environ 17 m, tirant d'eau 9,4 m
  const couleur = (x, y) => (y < flottaison - 0.6 ? [0.48, 0.12, 0.1] : y < flottaison + 0.6 ? [0.1, 0.1, 0.11] : [0.47, 0.5, 0.53]);
  navire.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 2, hHaut: 1, hBas: 1, y: -1.5, n: 2.5 },
    { x: 5, w: 10, hHaut: 2, hBas: 9, y: -3, n: 2.5 },
    { x: 18, w: 22, hHaut: 3, hBas: 16.5, y: -5, n: 2.8 },
    { x: 45, w: 30, hHaut: 3, hBas: 21, y: -5, n: 3.2 },
    { x: 130, w: 33, hHaut: 3, hBas: 22, y: -5, n: 3.6 },
    { x: 215, w: 32, hHaut: 3, hBas: 21, y: -5, n: 3.6 },
    { x: 250, w: 29, hHaut: 3, hBas: 16.5, y: -5, n: 3.4 },
    { x: 261, w: 27, hHaut: 3, hBas: 11.5, y: -5, n: 3.2 },
  ], { segments: 56, parSegment: 6, couleur }), coque));

  // Pont d'envol et ses marquages
  const contour = CONTOUR_CDG;
  const forme = new THREE.Shape(contour.map(([x, z]) => new THREE.Vector2(x, z)));
  const pontGeo = new THREE.ExtrudeGeometry(forme, { depth: 2, bevelEnabled: false });
  pontGeo.rotateX(Math.PI / 2);
  navire.add(new THREE.Mesh(pontGeo, gris));
  const marquages = new THREE.Mesh(new THREE.PlaneGeometry(262, 70), new THREE.MeshStandardMaterial({ map: texturePontCdG(THREE, contour), transparent: true, alphaTest: 0.4, roughness: 0.85, metalness: 0.05 }));
  marquages.rotation.x = -Math.PI / 2;
  marquages.position.set(131, 0.06, 0);
  navire.add(marquages);
  // Encorbellements sous le pont (débords de la piste oblique, de l'étrave et des ascenseurs)
  const flancs = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 4.5, bevelEnabled: false }), gris);
  flancs.geometry.rotateX(Math.PI / 2);
  flancs.position.set(1.5, -2, 0);
  flancs.scale.set(0.988, 1, 0.95);
  navire.add(flancs);
  // Bande jaune du bord arrière et portes de la poupe
  const bande = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 35.5), jaune);
  bande.position.set(261.6, -0.7, -0.6);
  navire.add(bande);
  for (const [z, l] of [[-8, 9], [7, 7]]) {
    const porte = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, l), sombre);
    porte.position.set(261.2, -9, z);
    navire.add(porte);
  }
  // Radeaux de survie blancs alignés sous le bord du pont (tribord et bâbord)
  const radeau = new THREE.CylinderGeometry(0.6, 0.6, 1.6, 10);
  radeau.rotateX(Math.PI / 2);
  const radeaux = new THREE.InstancedMesh(radeau, blanc, 60);
  const m4 = new THREE.Matrix4();
  let nR = 0;
  for (const [x0, z, nb] of [[148, -30.9, 14], [216, -30.9, 10], [150, 30.2, 10]]) {
    for (let r = 0; r < 2; r++) for (let i = 0; i < nb / 2; i++) {
      m4.makeTranslation(x0 + i * 1.5, -3.2 - r * 1.3, z);
      radeaux.setMatrixAt(nR++, m4);
    }
  }
  radeaux.count = nR;
  navire.add(radeaux);

  // Île à tribord, vers l'avant (sans cheminée : propulsion nucléaire) : étages aux flancs inclinés,
  // passerelles vitrées, tour, mât treillis, radars et radômes blancs de télécommunications par satellite
  const ile = new THREE.MeshStandardMaterial({ color: 0xbfc4c8, metalness: 0.15, roughness: 0.55 });
  const zi = -24;
  const etage = (l, h, p, lH, pH, x, y, m = ile) => { const b = tronc(THREE, l, h, p, lH, pH, m); b.position.set(x, y + h / 2, zi); navire.add(b); return b; };
  const bloc = (l, h, p, x, y, z, m = ile) => { const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), m); b.position.set(x, y, z); navire.add(b); return b; };
  // Corps principal (deux ponts de hauteur), passerelle de navigation vitrée, étage supérieur, tour
  etage(46, 14.5, 12.4, 44, 11.2, 89, 0);
  etage(36, 3.8, 11.4, 35.4, 11, 88, 14.5);
  bloc(35.8, 2, 11.6, 88, 16.3, zi, vitres);
  bloc(37, 0.4, 12.2, 88, 18.5, zi, grisFonce);
  etage(23, 6, 8.5, 21, 7.6, 89.5, 18.7);
  etage(9, 9, 6, 7.5, 5, 91, 24.7);
  // Passerelle « aviation » vitrée tournée vers le pont (côté bâbord de l'île)
  const pev = tronc(THREE, 14, 3.4, 2.2, 14, 3, vitres);
  pev.position.set(90, 16.2, zi + 6.3);
  navire.add(pev);
  bloc(14.6, 0.35, 3.4, 90, 18.05, zi + 6.2, grisFonce);
  // Bloc arrière (radar de navigation) et bloc avant (mât d'antennes)
  etage(9, 7, 8, 8.4, 7.4, 108.5, 14.5);
  bloc(1.4, 0.8, 4.2, 108.5, 22.2, zi, grisFonce);
  etage(6, 5.5, 7, 5.4, 6.4, 69.5, 14.5);
  const matAvant = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 9, 6), grisFonce);
  matAvant.position.set(69.5, 24.5, zi);
  navire.add(matAvant);
  bloc(0.25, 0.25, 4, 69.5, 27, zi, grisFonce);
  // Coursives (galeries) et rangées de hublots
  for (const [l, p, x, y] of [[47, 13.6, 89, 7.2], [47.5, 12.6, 89, 14.5], [24, 9.4, 89.5, 18.7]]) bloc(l, 0.3, p, x, y, zi, grisFonce);
  for (const [l, x, y, p] of [[44, 89, 3.2, 12.25], [44, 89, 5.4, 12.15], [43, 89, 10, 11.7], [43, 89, 12.3, 11.55], [19, 89.5, 21.6, 8.05]]) {
    for (const c of [-1, 1]) bloc(l, 0.6, 0.1, x, y, zi + c * (p / 2 + 0.03), vitres);
  }
  // Échelles et gaines verticales sur le flanc tribord
  for (const x of [72, 80, 101, 107]) bloc(0.6, 14, 0.4, x, 7.2, zi - 6.3, grisFonce);
  // Numéro de coque « R91 » sur les deux flancs de l'île
  const numero = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, 'R91'), transparent: true, depthWrite: false });
  for (const c of [-1, 1]) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), numero);
    n.position.set(97, 7.9, zi + c * 6.2);
    n.rotation.y = c > 0 ? 0 : Math.PI;
    navire.add(n);
  }
  // Plate-forme de la tour, radôme sommital et mât treillis
  bloc(12, 0.6, 8, 91, 34, zi, grisFonce);
  const domeHaut = new THREE.Mesh(new THREE.SphereGeometry(2.7, 24, 16), blanc);
  domeHaut.position.set(90, 37, zi);
  navire.add(domeHaut);
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 15, 6), grisFonce);
  mat.position.set(90, 46.5, zi);
  navire.add(mat);
  for (let n = 0; n < 6; n++) {
    const entretoise = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), grisFonce);
    entretoise.position.set(90 + (n % 2 ? 0.5 : -0.5), 40.5 + n * 1.8, zi);
    entretoise.rotation.z = n % 2 ? 0.4 : -0.4;
    navire.add(entretoise);
  }
  bloc(0.3, 0.3, 9, 90, 44, zi, grisFonce);
  bloc(0.3, 0.3, 5.5, 90, 48.5, zi, grisFonce);
  bloc(1.6, 1.2, 1.6, 90, 45.4, zi, ile);
  // Radar tridimensionnel (antenne plane tournante) à l'arrière de la tour, radar de veille sur la vergue
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 2, 10), grisFonce);
  pied.position.set(99, 34.6, zi);
  const antenne3d = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 7.5), ile);
  antenne3d.position.set(99, 37.2, zi);
  antenne3d.rotation.y = 0.6;
  const veille = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 6), grisFonce);
  veille.position.set(90, 50.2, zi);
  veille.rotation.y = -0.5;
  navire.add(pied, antenne3d, veille);
  // Radômes de l'étage supérieur, de part et d'autre de la tour
  for (const [x, y, z, r] of [[81.5, 27, zi - 2.3, 2.4], [98.5, 26.8, zi + 2.1, 2.3], [108.5, 23.8, zi - 2, 1.2]]) {
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.6, 1.2, 12), ile);
    socle.position.set(x, y - r + 0.2, z);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 14), blanc);
    dome.position.set(x, y, z);
    navire.add(socle, dome);
  }
  // Pavillon national en tête de mât
  const pavillon = new THREE.Group();
  ['#1f3c88', '#f4f4f4', '#d6262e'].forEach((col, i) => {
    const bandeau = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.8 }));
    bandeau.position.set(0.6 + i * 1.2, 0, 0);
    pavillon.add(bandeau);
  });
  pavillon.position.set(90.3, 43.2, zi - 4.4);
  navire.add(pavillon);

  // Groupe aérien : Rafale Marine (24 à bord en pleine charge), avion de guet Hawkeye, hélicoptère
  const rafale = construireRafale(THREE, { armement: false });
  rafale.userData.basculer.train(true);
  const hauteur = 2.0;
  const parques = [
    // à tribord arrière, nez vers bâbord (dont un sur l'ascenseur arrière)
    [247, -23, 1.45], [233, -23, 1.45], [199.5, -23.5, 1.5], [168, -23, 1.45],
    // le long du bord bâbord arrière, nez vers tribord
    [247, 15.2, -1.5], [233, 16.4, -1.5], [219, 17.6, -1.5],
    // à l'avant tribord
    [11, -11.5, 1.4], [24, -11.5, 1.4], [37, -11.8, 1.4], [50, -12, 1.4],
  ];
  for (const [x, z, r] of parques) {
    const a = rafale.clone(true);
    a.position.set(x, hauteur, z);
    a.rotation.y = r;
    navire.add(a);
  }
  const catapulte = rafale.clone(true);
  catapulte.position.set(86, hauteur, 3.6);
  navire.add(catapulte);
  const guet = avionDeGuet(THREE, gris, grisFonce);
  guet.position.set(150, 0, -9);
  guet.rotation.y = 0.8;
  navire.add(guet);
  const matRotor = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.7 });
  const hel = helicoptere(THREE, grisFonce, matRotor);
  hel.position.set(119, 0, -6);
  hel.rotation.y = 1.5;
  navire.add(hel);

  navire.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  marquages.castShadow = false;
  navire.children.filter((o) => o.isGroup).forEach((gr) => gr.traverse((o) => { if (o.isMesh) o.castShadow = false; }));

  const mer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: 0x0e3a5f, roughness: 0.45, metalness: 0, envMapIntensity: 0.3, transparent: true, opacity: 0.86 }));
  mer.rotation.x = -Math.PI / 2;
  mer.position.y = flottaison;
  mer.receiveShadow = true;
  navire.add(mer);

  navire.scale.setScalar(s);
  navire.position.set(-131 * s, 0.4, 0);
  const groupe = new THREE.Group();
  groupe.add(navire);
  const p = (x, y, z) => new THREE.Vector3(x * s - 131 * s, y * s + 0.4, z * s);
  groupe.userData.catapulte = { avion: catapulte, x0: 86, y0: hauteur };
  groupe.userData.legendes = [
    { texte: 'Île (sans cheminée : propulsion nucléaire)', point: p(72, 14, -30) },
    { texte: 'Radômes (télécommunications par satellite)', point: p(90, 39, -24) },
    { texte: 'Piste oblique', point: p(200, 1, -2) },
    { texte: 'Catapultes de 75 m', point: p(45, 1, 3.6) },
    { texte: 'Ascenseurs', point: p(131, 1, -28) },
    { texte: 'Rafale Marine', point: p(24, 4, -11.5) },
    { texte: 'Avion de guet Hawkeye', point: p(150, 6, -9) },
    { texte: 'Hélicoptère', point: p(119, 4, -6) },
  ];
  groupe.userData.taille = 14;
  groupe.userData.mer = true;
  return groupe;
}

/** Camouflage centre-Europe (vert, brun, noir) en texture procédurale. */
export function textureCamouflage(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4c5530';
  ctx.fillRect(0, 0, 512, 512);
  let g = 11;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  const tache = (couleur, n, taille) => {
    ctx.fillStyle = couleur;
    for (let k = 0; k < n; k++) {
      const x = h() * 512, y = h() * 512, r = taille * (0.6 + h());
      ctx.beginPath();
      for (let a = 0; a < 9; a++) {
        const t = (a / 9) * Math.PI * 2, rr = r * (0.6 + 0.6 * h());
        const X = x + Math.cos(t) * rr * 1.6, Y = y + Math.sin(t) * rr;
        if (a) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.closePath();
      ctx.fill();
    }
  };
  tache('#5e4a2e', 14, 44);
  tache('#23251f', 10, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.25, 0.25);
  return t;
}

/** Livrée sable (opérations extérieures) : teinte unie, grain antidérapant et légère poussière. */
export function textureSable(THREE) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#a28c69';
  ctx.fillRect(0, 0, 256, 256);
  let g = 5;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 2600; k++) {
    const clair = h() > 0.5;
    ctx.fillStyle = clair ? 'rgba(235,222,195,0.18)' : 'rgba(90,72,48,0.14)';
    ctx.fillRect(h() * 256, h() * 256, 1 + h() * 2, 1 + h() * 2);
  }
  for (let k = 0; k < 18; k++) {
    ctx.fillStyle = `rgba(${h() > 0.5 ? '205,190,160' : '150,128,96'},0.08)`;
    ctx.beginPath(); ctx.arc(h() * 256, h() * 256, 10 + h() * 30, 0, Math.PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.5, 0.5);
  return t;
}

/** Profil latéral extrudé dans la largeur (x vers l'avant négatif, y vers le haut). */
export function profilExtrude(THREE, points, largeur, materiau, biseau = 0.04) {
  const forme = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(forme, { depth: largeur - 2 * biseau, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau, bevelSegments: 1 });
  geo.translate(0, 0, -(largeur - 2 * biseau) / 2);
  return new THREE.Mesh(geo, materiau);
}

/** Beaucoup de petites pièces parallélépipédiques (nervures, barreaux, rivets) en un seul maillage instancié : [x, y, z, lx, ly, lz]. */
export function pieces(THREE, materiau, liste) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materiau, liste.length);
  const mat = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), ech = new THREE.Vector3();
  liste.forEach(([x, y, z, lx, ly, lz], i) => { m.setMatrixAt(i, mat.compose(pos.set(x, y, z), q, ech.set(lx, ly, lz))); });
  return m;
}

/** Grille anti-roquettes (barreaux) dans un plan vertical : le long de x (plan = 'x') ou de z (plan = 'z'). */
export function grilleBarreaux(centre, longueur, hauteur, plan, { pasL = 0.16, pasH = 0.2, e = 0.03 } = {}) {
  const [cx, cy, cz] = centre;
  const liste = [];
  const nL = Math.round(longueur / pasL), nH = Math.round(hauteur / pasH);
  for (let i = 0; i <= nL; i++) {
    const d = -longueur / 2 + (i * longueur) / nL;
    liste.push(plan === 'x' ? [cx + d, cy, cz, e, hauteur, e] : [cx, cy, cz + d, e, hauteur, e]);
  }
  for (let j = 0; j <= nH; j++) {
    const y = cy - hauteur / 2 + (j * hauteur) / nH;
    liste.push(plan === 'x' ? [cx, y, cz, longueur, e, e] : [cx, y, cz, e, e, longueur]);
  }
  return liste;
}

/**
 * Char Leclerc rénové (XLR), d'après une maquette de référence : livrée sable
 * (ou camouflage centre-Europe), modules de blindage en pointe autour du masque,
 * canon de 120 mm à manchon thermique et housse de masque en toile verte,
 * tourelleau téléopéré, mitrailleuse, viseurs, antennes, briques de blindage
 * nervurées sur l'arrière des flancs, jupes à bavette noire, grilles
 * anti-roquettes à l'arrière de la caisse et de la tourelle, phares avant.
 * Dimensions réelles (9,87 m canon compris, 3,71 m de large), échelle 1,35.
 * userData.animer : rotation de la tourelle et changement de livrée.
 */
export function construireLeclerc(THREE) {
  const char = new THREE.Group();
  const textures = { sable: textureSable(THREE), centreEurope: textureCamouflage(THREE) };
  const peinture = new THREE.MeshStandardMaterial({ map: textures.sable, roughness: 0.9, metalness: 0.05, envMapIntensity: 0.7 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2a2c27, roughness: 0.8, metalness: 0.2 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x151615, roughness: 0.7, metalness: 0.3 });
  const chenille = new THREE.MeshStandardMaterial({ color: 0x1b1c1a, roughness: 0.95, metalness: 0.3 });
  const optique = new THREE.MeshStandardMaterial({ color: 0x0d1b26, roughness: 0.1, metalness: 0.8 });
  const toile = new THREE.MeshStandardMaterial({ color: 0x41603f, roughness: 0.95, metalness: 0 });
  const verre = new THREE.MeshStandardMaterial({ color: 0xf4f1e2, emissive: 0x2a2820, roughness: 0.2, metalness: 0.1 });

  // Caisse : partie basse entre les chenilles, partie haute au-dessus (glacis incliné à l'avant)
  char.add(profilExtrude(THREE, [[-3.3, 0.5], [3.3, 0.5], [3.44, 0.95], [3.44, 1.05], [-3.44, 1.05], [-3.44, 0.85]], 2.4, peinture));
  char.add(profilExtrude(THREE, [[-3.44, 1.02], [3.44, 1.02], [3.44, 1.5], [3.25, 1.58], [-2.3, 1.58], [-3.44, 1.22]], 3.5, peinture));
  // Grilles d'échappement à l'arrière du pont moteur, phares et crochets de remorquage à l'avant
  for (const z of [-0.8, 0.8]) { const gr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1), sombre); gr.position.set(2.5, 1.6, z); char.add(gr); }
  for (const cote of [-1, 1]) {
    const phare = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.42), noir);
    phare.position.set(-3.05, 1.42, cote * 1.42);
    phare.rotation.z = 0.3;
    char.add(phare);
    for (const [dz, m] of [[-0.09, verre], [0.09, verre]]) {
      const feu = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), m);
      feu.rotation.z = Math.PI / 2 + 0.3;
      feu.position.set(-3.17, 1.39, cote * 1.42 + dz);
      char.add(feu);
    }
    const crochet = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 6, 12), sombre);
    crochet.position.set(-3.47, 0.9, cote * 0.85);
    crochet.rotation.y = Math.PI / 2;
    char.add(crochet);
  }

  // Trains de roulement : six galets, barbotin à l'arrière, roue tendeuse à l'avant, chenille
  for (const cote of [-1, 1]) {
    const z = cote * 1.5;
    for (let k = 0; k < 6; k++) {
      const galet = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 20), noir);
      galet.rotation.x = Math.PI / 2;
      galet.position.set(-2.45 + k * 0.97, 0.38, z);
      char.add(galet);
    }
    for (const [x, y, r] of [[-3.15, 0.66, 0.3], [3.12, 0.7, 0.36]]) {
      const roue = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.52, 18), noir);
      roue.rotation.x = Math.PI / 2;
      roue.position.set(x, y, z);
      char.add(roue);
    }
    const piste = new THREE.Shape();
    piste.moveTo(-2.9, 0);
    piste.lineTo(2.9, 0);
    piste.absarc(3.12, 0.7, 0.42, -Math.PI / 2 - 0.3, Math.PI / 2, false);
    piste.lineTo(-3.15, 1.02);
    piste.absarc(-3.15, 0.66, 0.36, Math.PI / 2, Math.PI + 1.1, false);
    piste.lineTo(-2.9, 0);
    const trou = new THREE.Path();
    trou.moveTo(-2.85, 0.1);
    trou.lineTo(2.85, 0.1);
    trou.absarc(3.12, 0.7, 0.3, -Math.PI / 2 - 0.3, Math.PI / 2, false);
    trou.lineTo(-3.15, 0.9);
    trou.absarc(-3.15, 0.66, 0.24, Math.PI / 2, Math.PI + 1.1, false);
    trou.lineTo(-2.85, 0.1);
    piste.holes.push(trou);
    const geoPiste = new THREE.ExtrudeGeometry(piste, { depth: 0.63, bevelEnabled: false, curveSegments: 10 });
    geoPiste.translate(0, 0, z - 0.315);
    char.add(new THREE.Mesh(geoPiste, chenille));

    // Jupe avant (tôle sable) et bavette noire en caoutchouc sur toute la longueur
    const jupe = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.42, 0.07), peinture);
    jupe.position.set(-1.98, 0.86, cote * 1.85);
    char.add(jupe);
    const bavette = new THREE.Mesh(new THREE.BoxGeometry(6.25, 0.2, 0.06), noir);
    bavette.position.set(-0.12, 0.56, cote * 1.85);
    char.add(bavette);
    // Briques de blindage latéral nervurées (kit XLR), de la mi-longueur jusqu'à l'arrière
    const brique = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.88, 0.2), peinture);
    brique.position.set(1.0, 1.1, cote * 1.88);
    char.add(brique);
    const nervures = [];
    for (let k = 0; k < 24; k++) nervures.push([-0.6 + k * 0.138, 1.12, cote * 2.0, 0.05, 0.8, 0.05]);
    char.add(pieces(THREE, peinture, nervures));
    // Grilles anti-roquettes à l'arrière des flancs (elles dépassent l'arrière de la caisse)
    char.add(pieces(THREE, peinture, grilleBarreaux([3.25, 1.15, cote * 1.98], 0.9, 0.95, 'x', { pasL: 0.15, pasH: 0.16 })));
  }
  char.add(pieces(THREE, peinture, grilleBarreaux([3.7, 1.15, 0], 3.9, 0.95, 'z', { pasL: 0.16, pasH: 0.16 })));
  for (const cote of [-1, 1]) char.add(pieces(THREE, peinture, [[3.45, 1.15, cote * 1.97, 0.5, 0.04, 0.04], [3.45, 0.68, cote * 1.97, 0.5, 0.04, 0.04]]));

  // Tourelle (pivot sur la couronne) : flancs à facettes, toit antidérapant, nuque du chargeur automatique
  const tourelle = new THREE.Group();
  tourelle.position.set(0.3, 1.58, 0);
  const vueDessus = [[-2.3, -1.15], [-2.3, 1.15], [-1.55, 1.74], [1.4, 1.74], [2.75, 1.48], [2.75, -1.48], [1.4, -1.74], [-1.55, -1.74]];
  const formeTourelle = new THREE.Shape(vueDessus.map(([x, z]) => new THREE.Vector2(x, z)));
  const geoTourelle = new THREE.ExtrudeGeometry(formeTourelle, { depth: 0.66, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1 });
  geoTourelle.rotateX(-Math.PI / 2);
  const caisseTourelle = new THREE.Mesh(geoTourelle, peinture);
  caisseTourelle.position.y = 0.12;
  tourelle.add(caisseTourelle);
  // Modules de blindage avant, de part et d'autre du masque, avec rivets et joints en caoutchouc vert
  const rivets = [];
  for (const cote of [-1, 1]) {
    const module = profilExtrude(THREE, [[-2.85, 0.06], [-1.95, 0.06], [-1.95, 0.9], [-2.6, 0.9], [-2.85, 0.72]], 0.78, peinture, 0.03);
    module.position.z = cote * 0.82;
    tourelle.add(module);
    const joint = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.72), toile);
    joint.position.set(-1.93, 0.48, cote * 0.82);
    tourelle.add(joint);
    for (const y of [0.25, 0.45, 0.65]) for (const dz of [-0.25, 0, 0.25]) rivets.push([-2.86, y, cote * 0.82 + dz, 0.03, 0.04, 0.04]);
    for (const x of [-2.5, -2.25]) for (const y of [0.3, 0.6]) rivets.push([x, y, cote * 1.22, 0.04, 0.04, 0.03]);
  }
  tourelle.add(pieces(THREE, sombre, rivets));
  // Masque, housse de toile verte et canon de 120 mm (manchon thermique en segments, référence de bouche)
  const masque = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.84), peinture);
  masque.position.set(-2.55, 0.48, 0);
  const canon = new THREE.Group();
  canon.position.set(-2.75, 0.5, 0);
  const housse = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.55, 18), toile);
  housse.rotation.z = Math.PI / 2;
  housse.position.x = -0.2;
  canon.add(housse);
  const troncons = [[-0.47, -1.05, 0.15], [-1.08, -1.95, 0.14], [-1.98, -2.9, 0.13], [-2.93, -3.75, 0.12]];
  for (const [x1, x2, r] of troncons) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x2, 18), peinture);
    seg.rotation.z = Math.PI / 2;
    seg.position.x = (x1 + x2) / 2;
    const bague = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.012, r + 0.012, 0.03, 18), sombre);
    bague.rotation.z = Math.PI / 2;
    bague.position.x = x2 + 0.01;
    canon.add(seg, bague);
  }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.25, 18), peinture);
  tube.rotation.z = Math.PI / 2;
  tube.position.x = -3.88;
  const bouche = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.12, 18), peinture);
  bouche.rotation.z = Math.PI / 2;
  bouche.position.x = -4.04;
  const ame = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), noir);
  ame.rotation.z = Math.PI / 2;
  ame.position.x = -4.105;
  const reference = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.1), peinture);
  reference.position.set(-3.95, 0.15, 0);
  const coaxiale = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), noir);
  coaxiale.rotation.z = Math.PI / 2;
  coaxiale.position.set(-0.3, -0.18, 0.32);
  canon.add(tube, bouche, ame, reference, coaxiale);
  // Toit : viseur panoramique du chef, viseur du tireur, épiscopes
  const viseurChef = new THREE.Group();
  viseurChef.position.set(-0.85, 0.86, 1.0);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 16), peinture);
  pied.position.y = 0.15;
  const tete = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.38), peinture);
  tete.position.y = 0.44;
  const fenetre = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.26), optique);
  fenetre.position.set(-0.22, 0.46, 0);
  viseurChef.add(pied, tete, fenetre);
  const viseurTireur = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.55), peinture);
  viseurTireur.position.set(-1.45, 0.98, -0.95);
  const vitreTireur = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.4), optique);
  vitreTireur.position.set(-1.81, 0.98, -0.95);
  const episcopes = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.5), peinture);
  episcopes.position.set(-0.2, 0.97, 0.75);
  const vitresEpiscopes = pieces(THREE, optique, [[-0.66, 0.98, 0.65, 0.03, 0.1, 0.16], [-0.66, 0.98, 0.88, 0.03, 0.1, 0.16], [-0.35, 0.98, 1.01, 0.18, 0.1, 0.03], [-0.05, 0.98, 1.01, 0.18, 0.1, 0.03]]);
  // Tourelleau téléopéré (XLR) : socle, boîtier à fenêtre de visée, berceau, mitrailleuse et tête optronique
  const tourelleau = new THREE.Group();
  tourelleau.position.set(0.25, 0.86, 0.55);
  const couronne = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 20), peinture);
  couronne.position.y = 0.07;
  const fut = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.52), peinture);
  fut.position.y = 0.45;
  const visee = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.14), optique);
  visee.position.set(-0.29, 0.48, 0.05);
  const berceau = tronc(THREE, 0.7, 0.34, 0.7, 0.86, 0.8, peinture);
  berceau.position.y = 0.93;
  const teteOptro = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.26), peinture);
  teteOptro.position.set(-0.42, 1.04, 0.24);
  const objectif = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 14), optique);
  objectif.rotation.z = Math.PI / 2;
  objectif.position.set(-0.58, 1.04, 0.24);
  const mitrailleuse = new THREE.Group();
  const carter = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.13, 0.12), noir);
  const canonMg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), noir);
  canonMg.rotation.z = Math.PI / 2;
  canonMg.position.x = -0.55;
  const caisseMun = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.16), noir);
  caisseMun.position.set(0.05, -0.02, -0.16);
  mitrailleuse.add(carter, canonMg, caisseMun);
  mitrailleuse.position.set(-0.05, 1.18, -0.02);
  tourelleau.add(couronne, fut, visee, berceau, teteOptro, objectif, mitrailleuse);
  // Seconde mitrailleuse sur affût, vers l'avant
  const affut = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.26), peinture);
  affut.position.set(0.55, 0.99, -0.45);
  const mg2 = mitrailleuse.clone(true);
  mg2.position.set(0.5, 1.2, -0.45);
  mg2.scale.setScalar(0.8);
  tourelle.add(masque, canon, viseurChef, viseurTireur, vitreTireur, episcopes, vitresEpiscopes, tourelleau, affut, mg2);
  // Lance-pots fumigènes GALIX (orifices sur les flancs de la nuque) et grille anti-roquettes de la nuque
  const orifices = [];
  for (const cote of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const x = 1.35 + k * 0.24;
      const zBord = x < 1.4 ? 1.74 : 1.74 - (x - 1.4) * (0.26 / 1.35);
      const trou = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 12), noir);
      trou.rotation.x = Math.PI / 2;
      trou.position.set(x, 0.62, cote * (zBord + 0.1));
      orifices.push(trou);
    }
  }
  tourelle.add(...orifices);
  tourelle.add(pieces(THREE, peinture, [
    ...grilleBarreaux([3.05, 0.48, 0], 3.1, 0.75, 'z', { pasL: 0.15, pasH: 0.15 }),
    ...grilleBarreaux([2.55, 0.48, 1.66], 0.95, 0.75, 'x', { pasL: 0.15, pasH: 0.15 }),
    ...grilleBarreaux([2.55, 0.48, -1.66], 0.95, 0.75, 'x', { pasL: 0.15, pasH: 0.15 }),
  ]));
  // Antennes : mât épais (brouilleur), fouets, antenne courte, capteur météo
  const antennes = [
    [1.55, 1.0, 0.045, 0.05, 1.5, noir],
    [1.95, 0.55, 0.008, 0.012, 2.2, sombre],
    [2.55, -1.05, 0.035, 0.04, 0.75, noir],
    [1.25, 1.35, 0.06, 0.06, 0.4, peinture],
  ];
  for (const [x, z, r1, r2, h, m] of antennes) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 8), m);
    a.position.set(x, 0.9 + h / 2, z);
    tourelle.add(a);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 10), noir);
  cone.position.set(1.95, 1.0, 0.55);
  tourelle.add(cone);
  char.add(tourelle);

  char.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const k = 1.35;
  char.scale.setScalar(k);
  char.position.set(1.2, -2.2, 0);
  const groupe = new THREE.Group();
  groupe.add(char);
  const p = (x, y, z) => new THREE.Vector3(x * k + 1.2, y * k - 2.2, z * k);
  groupe.userData.legendes = [
    { texte: 'Canon de 120 mm (chargement automatique)', point: p(-5.4, 2.1, 0) },
    { texte: 'Viseur panoramique du chef de char', point: p(-0.55, 3.15, 1.0) },
    { texte: 'Blindage modulaire', point: p(-2.2, 2.3, 1.3) },
    { texte: 'Nuque : chargeur automatique', point: p(3, 2.2, 0) },
    { texte: 'Tourelleau téléopéré (XLR)', point: p(0.5, 3.8, 0.55) },
    { texte: 'Six galets par côté', point: p(-1, 0.4, 1.8) },
    { texte: 'Briques de blindage latéral (XLR)', point: p(1, 1.2, 2.0) },
    { texte: 'Grilles anti-roquettes (XLR)', point: p(3.3, 1.5, 2.0) },
  ];
  let angle = 0;
  let livree = 'sable';
  groupe.userData.animer = (t, api) => {
    const cible = api.tourelle ? 0.7 * Math.sin(t / 1400) : 0;
    angle += (cible - angle) * 0.06;
    tourelle.rotation.y = angle;
    const voulue = api.livree ?? 'sable';
    if (voulue !== livree && textures[voulue]) {
      livree = voulue;
      peinture.map = textures[voulue];
      peinture.needsUpdate = true;
    }
  };
  groupe.userData.taille = 14;
  return groupe;
}
