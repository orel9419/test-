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
export function loft(THREE, cles, { segments = 48, parSegment = 6, fermer = true, couleur = null } = {}) {
  const sections = densifier(cles.map((s) => ({ hHaut: s.h / 2, hBas: s.h / 2, y: 0, z: 0, n: 2, ...s })), parSegment);
  const pos = [];
  const idx = [];
  const uv = [];
  const col = [];
  const x0 = sections[0].x, x1 = sections[sections.length - 1].x;
  const ajouterCouleur = (x, y, z) => { if (couleur) col.push(...couleur(x, y, z)); };
  for (const s of sections) {
    const e = 2 / s.n;
    for (let j = 0; j < segments; j++) {
      const t = (j / segments) * Math.PI * 2;
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
      uv.push(i === 0 ? 0 : 1, 0.5);
      ajouterCouleur(s.x, s.y, s.z);
      for (let j = 0; j < segments; j++) {
        const a = i * segments + j, b = i * segments + ((j + 1) % segments);
        if (sens < 0) idx.push(centre, b, a); else idx.push(centre, a, b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (couleur) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Texture procédurale de panneaux (tuiles anéchoïques d'un sous-marin) :
 * fines lignes claires sur fond sombre, répétées le long de la coque.
 */
function texturePanneaux(THREE, { fond = '#141618', trait = 'rgba(210,215,220,0.16)', repetition = [10, 3] } = {}) {
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
export function construireRafale(THREE, { armement = true } = {}) {
  const avion = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0x7e878f, metalness: 0.3, roughness: 0.5 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x5f676f, metalness: 0.3, roughness: 0.55 });
  const radome = new THREE.MeshStandardMaterial({ color: 0x737b83, metalness: 0.2, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x55585c, metalness: 0.9, roughness: 0.35 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x141618, metalness: 0.2, roughness: 0.8 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x4b4a3e, metalness: 0.4, roughness: 0.03, transparent: true, opacity: 0.62, clearcoat: 1, clearcoatRoughness: 0.02 });
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
    avion.add(rail);
    if (armement) avion.add(mica, meteor, pylone1, res, pylone2);
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

  // Habitacle(s) et verrière : monoplace (C, M) ou biplace en tandem (B), à basculer
  const matHabitacle = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.9 });
  const matSiege = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 });
  const matCasque = new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.5, metalness: 0.2 });
  const poste = (places) => {
    const g = new THREE.Group();
    const longueur = places === 2 ? 1.95 : 1.4;
    const centre = places === 2 ? 4.3 : 3.9;
    const hab = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), matHabitacle);
    hab.scale.set(longueur * 0.9, 0.22, 0.36);
    hab.position.set(centre + 0.05, 0.62, 0);
    g.add(hab);
    [...Array(places).keys()].forEach((k) => {
      const x = places === 2 ? 3.85 + k * 1.05 : 4.3;
      const siege = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.42), matSiege);
      siege.position.set(x + 0.25, 0.82, 0);
      const casque = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), matCasque);
      casque.position.set(x, 0.98, 0);
      g.add(siege, casque);
    });
    const bulle = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), verre);
    bulle.scale.set(longueur, 0.46, 0.43);
    bulle.position.set(centre, 0.6, 0);
    const pareBrise = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 8, 24, Math.PI), grisFonce);
    pareBrise.scale.set(1, 1.07, 1);
    pareBrise.position.set(centre - longueur * 0.53, 0.6, 0);
    pareBrise.rotation.y = Math.PI / 2;
    g.add(bulle, pareBrise);
    if (places === 2) {
      const arceau = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.022, 8, 24, Math.PI), grisFonce);
      arceau.scale.set(1, 1.07, 1);
      arceau.position.set(centre + 0.05, 0.6, 0);
      arceau.rotation.y = Math.PI / 2;
      g.add(arceau);
    }
    return g;
  };
  const monoplace = poste(1);
  const biplace = poste(2);
  biplace.visible = false;
  avion.add(monoplace, biplace);

  // Carénage à la base de la dérive, qui dépasse au-dessus des tuyères
  const carenage = loft(THREE, [
    { x: 13.6, w: 0.05, hHaut: 0.02, hBas: 0.02, y: 0.6 },
    { x: 14.3, w: 0.28, hHaut: 0.12, hBas: 0.12, y: 0.58 },
    { x: 15.35, w: 0.22, hHaut: 0.1, hBas: 0.1, y: 0.56 },
    { x: 15.6, w: 0.12, hHaut: 0.06, hBas: 0.06, y: 0.56 },
  ], { segments: 16, parSegment: 4 });
  avion.add(new THREE.Mesh(carenage, gris));

  // Train d'atterrissage (rentré par défaut) : diabolo avant, deux atterrisseurs principaux
  const train = new THREE.Group();
  const matJambe = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.6, roughness: 0.35 });
  const matPneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const roue = (r, l) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), matPneu); m.rotation.x = Math.PI / 2; return m; };
  const jambeAvant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 12), matJambe);
  jambeAvant.position.set(3.0, -1.05, 0);
  const roueAvant1 = roue(0.24, 0.16); roueAvant1.position.set(3.05, -1.72, 0.14);
  const roueAvant2 = roue(0.24, 0.16); roueAvant2.position.set(3.05, -1.72, -0.14);
  train.add(jambeAvant, roueAvant1, roueAvant2);
  for (const cote of [1, -1]) {
    const jambe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.25, 12), matJambe);
    jambe.position.set(9.9, -1.0, cote * 1.32);
    jambe.rotation.x = cote * 0.08;
    const r = roue(0.36, 0.22); r.position.set(9.95, -1.6, cote * 1.42);
    const trappe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.03), grisFonce);
    trappe.position.set(9.9, -0.8, cote * 1.12);
    train.add(jambe, r, trappe);
  }
  train.visible = false;
  avion.add(train);

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
 * SNLE de 3e génération : silhouette indicative (coque lisse à tuiles
 * anéchoïques, kiosque avancé avec barres de plongée, antenne sonar latérale,
 * gouvernes en X, hydrojet). Plans définitifs non publics. Échelle 1/10.
 */
export function construireSnle3G(THREE) {
  const s = 0.1;
  const L = 150, R = 6.5;
  const sub = new THREE.Group();
  const coque = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#16181b', repetition: [14, 4] }), metalness: 0.15, roughness: 0.5 });
  const kiosqueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texturePanneaux(THREE, { fond: '#191b1e', repetition: [3, 2] }), metalness: 0.15, roughness: 0.5 });
  const antenneMat = new THREE.MeshStandardMaterial({ color: 0x23272b, metalness: 0.3, roughness: 0.32 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4f55, metalness: 0.7, roughness: 0.4 });
  const materiaux = { trappe: new THREE.MeshStandardMaterial({ color: 0x24282d, metalness: 0.3, roughness: 0.55 }), tube: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.9 }) };

  sub.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0, h: 0 }, { x: 1.5, w: 5.4, h: 5.4 }, { x: 4.5, w: 9.2, h: 9.2 }, { x: 9, w: 11.8, h: 11.8 },
    { x: 15, w: 12.8, h: 12.8 }, { x: 22, w: 2 * R, h: 2 * R }, { x: 112, w: 2 * R, h: 2 * R }, { x: 122, w: 12.2, h: 12.2 },
    { x: 131, w: 10, h: 10 }, { x: 139, w: 7.2, h: 7.2 }, { x: 145, w: 4.8, h: 4.8 }, { x: 148.5, w: 3.6, h: 3.6 },
  ], { segments: 64, parSegment: 6 }).scale(s, s, s), coque));

  // Pont légèrement aplati au-dessus des tubes, derrière le kiosque
  sub.add(new THREE.Mesh(loft(THREE, [
    { x: 62, w: 2, hHaut: 0.1, hBas: 2, y: R - 0.4, n: 3 },
    { x: 66, w: 7.4, hHaut: 0.55, hBas: 2.6, y: R - 0.35, n: 4 },
    { x: 101, w: 7.4, hHaut: 0.55, hBas: 2.6, y: R - 0.35, n: 4 },
    { x: 106, w: 2, hHaut: 0.1, hBas: 2, y: R - 0.4, n: 3 },
  ], { segments: 40, parSegment: 5 }).scale(s, s, s), coque));
  const { groupe: tubes, trappes } = trappesMissiles(THREE, { xDebut: 68.5, pas: 4.5, y: R + 0.2, s, materiaux });
  sub.add(tubes);

  // Kiosque avancé, profil droit, avec congé à l'arrière et barres de plongée à mi-hauteur
  const contour = new THREE.Shape();
  contour.moveTo(0, 0);
  contour.bezierCurveTo(0, 1.5, 1.6, 1.6, 3.5, 1.6);
  contour.lineTo(13, 1.45);
  contour.quadraticCurveTo(15.6, 1.2, 16, 0);
  contour.quadraticCurveTo(15.6, -1.2, 13, -1.45);
  contour.lineTo(3.5, -1.6);
  contour.bezierCurveTo(1.6, -1.6, 0, -1.5, 0, 0);
  const kiosqueGeo = new THREE.ExtrudeGeometry(contour, { depth: 10, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.35, bevelSegments: 4, curveSegments: 16 });
  kiosqueGeo.rotateX(-Math.PI / 2);
  kiosqueGeo.translate(44, R - 1.5, 0);
  kiosqueGeo.scale(s, s, s);
  sub.add(new THREE.Mesh(kiosqueGeo, kiosqueMat));
  sub.add(new THREE.Mesh(loft(THREE, [
    { x: 57, w: 3.1, hHaut: 3.2, hBas: 0.2, y: R - 0.4, n: 2.6 },
    { x: 62, w: 2.2, hHaut: 1.2, hBas: 0.2, y: R - 0.4, n: 2.4 },
    { x: 66, w: 0.6, hHaut: 0.1, hBas: 0.1, y: R - 0.4, n: 2 },
  ], { segments: 24, parSegment: 5 }).scale(s, s, s), kiosqueMat));
  const barre = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 13.5), kiosqueMat);
  barre.position.set(47.6 * s, (R + 5.2) * s, 0);
  barre.rotation.y = 0.06;
  barre.scale.setScalar(s);
  sub.add(barre);
  [[46.5, 1.4], [48, 2.2], [50, 1.7]].forEach(([x, h]) => {
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, h, 12), metal);
    mat.position.set(x * s, (R + 9 + h / 2) * s, 0);
    mat.scale.setScalar(s);
    sub.add(mat);
  });

  // Antennes sonar latérales (longs panneaux sur les flancs)
  for (const cote of [1, -1]) {
    const antenne = new THREE.Mesh(new THREE.BoxGeometry(62, 2.6, 0.4), antenneMat);
    antenne.position.set(70 * s, -0.9 * s, cote * (R + 0.02) * s);
    antenne.scale.setScalar(s);
    sub.add(antenne);
  }

  // Gouvernes en X et hydrojet
  const forme = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(7.5, 0), new THREE.Vector2(8.2, 5.6), new THREE.Vector2(4.6, 5.6)]);
  for (const angle of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 });
    g.translate(134, 3.2, -0.25);
    const m = new THREE.Mesh(g, coque);
    const pivot = new THREE.Group();
    pivot.rotation.x = angle;
    pivot.add(m);
    pivot.scale.setScalar(s);
    sub.add(pivot);
  }
  const carenageMat = coque.clone();
  carenageMat.side = THREE.DoubleSide;
  const carenage = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.05, 4.4, 40, 1, true), carenageMat);
  carenage.rotation.z = Math.PI / 2;
  carenage.position.set(150 * s, 0, 0);
  carenage.scale.setScalar(s);
  const moyeu = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.6, 24), metal);
  moyeu.rotation.z = -Math.PI / 2;
  moyeu.position.set(151.2 * s, 0, 0);
  moyeu.scale.setScalar(s);
  sub.add(carenage, moyeu);

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
    { texte: 'Kiosque', point: decal(52, R + 10, 0) },
    { texte: 'Barres de plongée', point: decal(47.6, R + 5.2, 6.8) },
    { texte: '16 tubes de missiles M51', point: decal(84, R + 0.8, 3.5) },
    { texte: 'Antenne sonar latérale', point: decal(70, -0.9, R + 0.3) },
    { texte: 'Gouvernes en X', point: decal(140, 7, 3) },
    { texte: 'Hydrojet (propulsion)', point: decal(151, 2.4, 0) },
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

/** Texture du pont d'envol du Charles-de-Gaulle (262 m × 70 m) : piste oblique, deux catapultes, ascenseurs. */
function texturePontCdG(THREE, contour) {
  const L = 262, LARG = 70;
  const W = 2048, H = Math.round(W * LARG / L);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const px = (x) => (x / L) * W;
  const py = (z) => ((z + LARG / 2) / LARG) * H; // le haut de l'image = tribord
  ctx.beginPath();
  contour.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), py(z)) : ctx.moveTo(px(x), py(z))));
  ctx.closePath();
  ctx.fillStyle = '#4a4c50';
  ctx.fill();
  ctx.save();
  ctx.clip();
  let g = 7;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < 2200; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '0,0,0'},0.035)`; ctx.fillRect(h() * W, h() * H, 6 + h() * 30, 2 + h() * 6); }
  const ligne = (x1, z1, x2, z2, couleur, largeur, tirets = null) => {
    ctx.strokeStyle = couleur; ctx.lineWidth = largeur; ctx.setLineDash(tirets ?? []);
    ctx.beginPath(); ctx.moveTo(px(x1), py(z1)); ctx.lineTo(px(x2), py(z2)); ctx.stroke(); ctx.setLineDash([]);
  };
  // Piste oblique (environ 8°) : bords, axe, brins d'arrêt et zone d'appontage
  const A = [258, 6], B = [100, 29];
  const dx = B[0] - A[0], dz = B[1] - A[1], n = Math.hypot(dx, dz), ox = -dz / n * 11, oz = dx / n * 11;
  ligne(A[0] + ox, A[1] + oz, B[0] + ox, B[1] + oz, '#f2f2f2', 4);
  ligne(A[0] - ox, A[1] - oz, B[0] - ox, B[1] - oz, '#f2f2f2', 4);
  ligne(A[0], A[1], B[0], B[1], '#f2f2f2', 3, [26, 22]);
  for (let k = 0; k < 3; k++) { const t = 0.14 + k * 0.06; const x = A[0] + dx * t, z = A[1] + dz * t; ligne(x + ox, z + oz, x - ox, z - oz, '#d9d9d9', 3); }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 7; k++) { const t = 0.33 + k * 0.013; const x = A[0] + dx * t, z = A[1] + dz * t; ctx.fillRect(px(x) - 3, py(z) - 22, 6, 44); }
  // Deux catapultes à vapeur de 75 m : à l'avant et sur la piste oblique
  ligne(10, 4, 85, 4, '#f5d94a', 3);
  ligne(180, 17.4, 105, 28.3, '#f5d94a', 3);
  // Ligne de sécurité et axe avant
  ligne(261, -12, 112, 12, '#f5d94a', 2, [14, 10]);
  ligne(3, -2, 68, -2, '#f2f2f2', 2, [18, 18]);
  // Deux ascenseurs latéraux à tribord, en arrière de l'île
  ctx.strokeStyle = '#d8c04a'; ctx.lineWidth = 5;
  for (const [x1, x2] of [[126, 147], [193, 214]]) ctx.strokeRect(px(x1), py(-30), px(x2) - px(x1), py(-23) - py(-30));
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Porte-avions « Charles-de-Gaulle », d'après l'infographie de la Marine
 * nationale : 261,5 m × 64,4 m, île à tribord vers l'avant (sans cheminée :
 * propulsion nucléaire), piste oblique, deux catapultes de 75 m, deux
 * ascenseurs latéraux en arrière de l'île, Rafale Marine, avion de guet et
 * hélicoptères sur le pont. Échelle 1/20.
 */
export function construireCharlesDeGaulle(THREE) {
  const s = 0.05;
  const navire = new THREE.Group();
  const flottaison = -16;
  const coque = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.1, roughness: 0.75, envMapIntensity: 0.45 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x9da3a9, metalness: 0.2, roughness: 0.6 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x5f656b, metalness: 0.25, roughness: 0.6 });
  const blanc = new THREE.MeshStandardMaterial({ color: 0xf2f2ef, metalness: 0.05, roughness: 0.5 });
  const vitres = new THREE.MeshStandardMaterial({ color: 0x1c2733, metalness: 0.6, roughness: 0.15 });

  // Coque : gris au-dessus de la flottaison, liseré noir, carène rouge ; tirant d'eau 9,4 m
  const couleur = (x, y) => (y < flottaison - 0.6 ? [0.48, 0.12, 0.1] : y < flottaison + 0.6 ? [0.1, 0.1, 0.11] : [0.39, 0.42, 0.45]);
  navire.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 2, hHaut: 1, hBas: 1, y: -1.5, n: 2.5 },
    { x: 5, w: 10, hHaut: 2, hBas: 8, y: -3, n: 2.5 },
    { x: 18, w: 22, hHaut: 3, hBas: 15, y: -5, n: 2.8 },
    { x: 45, w: 30, hHaut: 3, hBas: 19, y: -5, n: 3.2 },
    { x: 130, w: 33, hHaut: 3, hBas: 20.4, y: -5, n: 3.6 },
    { x: 215, w: 32, hHaut: 3, hBas: 19.5, y: -5, n: 3.6 },
    { x: 250, w: 29, hHaut: 3, hBas: 15, y: -5, n: 3.4 },
    { x: 261, w: 27, hHaut: 3, hBas: 10, y: -5, n: 3.2 },
  ], { segments: 56, parSegment: 6, couleur }), coque));

  // Pont d'envol : 261,5 m × 64,4 m (débord de la piste oblique à bâbord, île et ascenseurs à tribord)
  const contour = [[0, -7], [0, 6], [20, 15], [60, 22], [92, 26], [110, 33], [205, 34], [240, 30], [258, 24], [261.5, 18], [261.5, -19], [250, -22], [214, -23], [214, -30], [193, -30], [193, -23], [147, -23], [147, -30], [126, -30], [126, -23], [116, -23], [116, -30.5], [70, -30.5], [70, -24], [30, -19], [10, -12]];
  const forme = new THREE.Shape(contour.map(([x, z]) => new THREE.Vector2(x, z)));
  const pontGeo = new THREE.ExtrudeGeometry(forme, { depth: 2, bevelEnabled: false });
  pontGeo.rotateX(Math.PI / 2);
  navire.add(new THREE.Mesh(pontGeo, gris));
  const marquages = new THREE.Mesh(new THREE.PlaneGeometry(262, 70), new THREE.MeshStandardMaterial({ map: texturePontCdG(THREE, contour), transparent: true, alphaTest: 0.4, roughness: 0.85, metalness: 0.05 }));
  marquages.rotation.x = -Math.PI / 2;
  marquages.position.set(131, 0.06, 0);
  navire.add(marquages);
  const flancs = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 4, bevelEnabled: false }), grisFonce);
  flancs.geometry.rotateX(Math.PI / 2);
  flancs.position.set(2, -2, 0);
  flancs.scale.set(0.985, 1, 0.94);
  navire.add(flancs);

  // Île à tribord, vers l'avant (sans cheminée : propulsion nucléaire) : étages en gradins, passerelle vitrée,
  // mât principal et radars, radômes blancs de télécommunications par satellite
  const ile = new THREE.MeshStandardMaterial({ color: 0xb4b9be, metalness: 0.15, roughness: 0.55 });
  const bloc = (l, h, p, x, y, z, m = ile) => { const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), m); b.position.set(x, y, z); navire.add(b); return b; };
  const zi = -27;
  bloc(38, 8, 5.6, 93, 4, zi);
  bloc(34, 5, 5.2, 94, 10.5, zi);
  bloc(24, 2.4, 5.6, 87, 14.2, zi, vitres);
  bloc(24.4, 0.8, 5.9, 87, 15.8, zi);
  bloc(18, 4.5, 4.8, 97, 18.4, zi);
  bloc(9, 2, 5, 82, 16.6, zi, vitres);
  for (const y of [2.6, 5.6, 9.6]) bloc(36, 0.5, 0.12, 93, y, zi - 2.86, grisFonce);
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.3, 16, 8), grisFonce);
  mat.position.set(92, 28.6, zi);
  const plateforme = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.5, 16), grisFonce);
  plateforme.position.set(92, 21, zi);
  const radarVeille = new THREE.Mesh(new THREE.BoxGeometry(1, 2.8, 9), grisFonce);
  radarVeille.position.set(92, 30.5, zi);
  radarVeille.rotation.y = 0.5;
  const radar3d = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 5.5), ile);
  radar3d.position.set(92, 36.6, zi);
  radar3d.rotation.y = -0.4;
  const vergueAvant = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 7), grisFonce);
  vergueAvant.position.set(92, 34, zi);
  navire.add(mat, plateforme, radarVeille, radar3d, vergueAvant);
  for (const [x, y, r] of [[103, 22.6, 2.2], [107.5, 22.2, 1.8], [80, 19.3, 1.4]]) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), blanc);
    dome.position.set(x, y, zi);
    navire.add(dome);
  }
  const matArriere = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 8, 8), grisFonce);
  matArriere.position.set(100, 24.6, zi);
  const vergue = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 5), grisFonce);
  vergue.position.set(100, 27, zi);
  navire.add(matArriere, vergue);

  // Groupe aérien : Rafale Marine (24 à bord en pleine charge), avion de guet Hawkeye, hélicoptères
  const rafale = construireRafale(THREE, { armement: false });
  rafale.userData.basculer.train(true);
  const hauteur = 2.0;
  const parques = [[28, -10, 0.7], [42, -10, 0.7], [56, -12, 0.7], [158, -16, 0.9], [172, -16, 0.9], [226, -16, 0.9], [240, -15, 0.9], [130, 24, -2.6]];
  for (const [x, z, r] of parques) {
    const a = rafale.clone(true);
    a.position.set(x, hauteur, z);
    a.rotation.y = r;
    navire.add(a);
  }
  const catapulte = rafale.clone(true);
  catapulte.position.set(80, hauteur, 4);
  navire.add(catapulte);
  const guet = avionDeGuet(THREE, gris, grisFonce);
  guet.position.set(135, 0, -14);
  guet.rotation.y = 0.8;
  navire.add(guet);
  const matRotor = new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.7 });
  for (const [x, z, r] of [[246, -6, 1.5], [246, 9, 1.6]]) {
    const hel = helicoptere(THREE, grisFonce, matRotor);
    hel.position.set(x, 0, z);
    hel.rotation.y = r;
    navire.add(hel);
  }

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
  groupe.userData.catapulte = { avion: catapulte, x0: 80, y0: hauteur };
  groupe.userData.legendes = [
    { texte: 'Île (sans cheminée : propulsion nucléaire)', point: p(93, 26, -27) },
    { texte: 'Piste oblique', point: p(215, 1, 14) },
    { texte: 'Catapultes de 75 m', point: p(45, 1, 4) },
    { texte: 'Ascenseurs', point: p(136, 1, -27) },
    { texte: 'Rafale Marine', point: p(42, 4, -10) },
    { texte: 'Avion de guet Hawkeye', point: p(135, 6, -14) },
    { texte: 'Hélicoptères', point: p(246, 4, 2) },
  ];
  groupe.userData.taille = 14;
  groupe.userData.mer = true;
  return groupe;
}

/** Camouflage centre-Europe (vert, brun, noir) en texture procédurale. */
function textureCamouflage(THREE) {
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

/** Profil latéral extrudé dans la largeur (x vers l'avant négatif, y vers le haut). */
function profilExtrude(THREE, points, largeur, materiau, biseau = 0.04) {
  const forme = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(forme, { depth: largeur - 2 * biseau, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau, bevelSegments: 1 });
  geo.translate(0, 0, -(largeur - 2 * biseau) / 2);
  return new THREE.Mesh(geo, materiau);
}

/**
 * Char Leclerc rénové (XLR) : caisse et tourelle en blindage modulaire, canon
 * de 120 mm à chargement automatique, six galets par côté, viseur panoramique
 * du chef de char, tourelleau téléopéré, grilles anti-roquettes à l'arrière.
 * Dimensions réelles (9,87 m canon compris, 3,71 m de large), échelle 1,35.
 * userData.animer : rotation de la tourelle (bouton « Tourelle »).
 */
export function construireLeclerc(THREE) {
  const char = new THREE.Group();
  const camo = new THREE.MeshStandardMaterial({ map: textureCamouflage(THREE), roughness: 0.85, metalness: 0.08 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2a2c27, roughness: 0.8, metalness: 0.2 });
  const chenille = new THREE.MeshStandardMaterial({ color: 0x1d1e1c, roughness: 0.95, metalness: 0.3 });
  const optique = new THREE.MeshStandardMaterial({ color: 0x0d1b26, roughness: 0.1, metalness: 0.8 });

  // Caisse : partie basse entre les chenilles, partie haute au-dessus (glacis incliné à l'avant)
  char.add(profilExtrude(THREE, [[-3.3, 0.5], [3.3, 0.5], [3.44, 0.95], [3.44, 1.05], [-3.44, 1.05], [-3.44, 0.85]], 2.4, camo));
  char.add(profilExtrude(THREE, [[-3.44, 1.02], [3.44, 1.02], [3.44, 1.5], [3.25, 1.58], [-2.3, 1.58], [-3.44, 1.22]], 3.5, camo));
  // Grilles d'échappement à l'arrière du pont moteur
  for (const z of [-0.8, 0.8]) { const gr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1), sombre); gr.position.set(2.5, 1.6, z); char.add(gr); }

  // Trains de roulement : six galets, barbotin à l'arrière, roue tendeuse à l'avant, chenille, jupes latérales
  for (const cote of [-1, 1]) {
    const z = cote * 1.5;
    for (let k = 0; k < 6; k++) {
      const galet = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 20), sombre);
      galet.rotation.x = Math.PI / 2;
      galet.position.set(-2.45 + k * 0.97, 0.38, z);
      char.add(galet);
    }
    for (const [x, y, r] of [[-3.15, 0.66, 0.3], [3.12, 0.7, 0.36]]) {
      const roue = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.52, 18), sombre);
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
    const jupe = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.5, 0.07), camo);
    jupe.position.set(-0.1, 0.82, cote * 1.85);
    char.add(jupe);
    // Grilles anti-roquettes (kit XLR) à l'arrière de la caisse
    for (let k = 0; k < 7; k++) {
      const barre = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), sombre);
      barre.position.set(2.45 + k * 0.15, 1.3, cote * 1.92);
      char.add(barre);
    }
    const lisse = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.04), sombre);
    lisse.position.set(2.9, 1.55, cote * 1.92);
    char.add(lisse);
  }

  // Tourelle (pivot sur la couronne), blindage modulaire en pointe, nuque du chargeur automatique
  const tourelle = new THREE.Group();
  tourelle.position.set(0.3, 1.58, 0);
  const vueDessus = [[-1.95, -1.6], [-2.35, -0.7], [-2.35, 0.7], [-1.95, 1.6], [0.9, 1.72], [2.75, 1.4], [2.75, -1.4], [0.9, -1.72]];
  const formeTourelle = new THREE.Shape(vueDessus.map(([x, z]) => new THREE.Vector2(x, z)));
  const geoTourelle = new THREE.ExtrudeGeometry(formeTourelle, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 });
  geoTourelle.rotateX(-Math.PI / 2);
  const caisseTourelle = new THREE.Mesh(geoTourelle, camo);
  caisseTourelle.position.y = 0.08;
  tourelle.add(caisseTourelle);
  // Masque et canon de 120 mm (manchon thermique, système de référence de bouche)
  const masque = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.9), camo);
  masque.position.set(-2.4, 0.5, 0);
  const canon = new THREE.Group();
  canon.position.set(-2.55, 0.5, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 4.2, 18), camo);
  tube.rotation.z = Math.PI / 2;
  tube.position.x = -2.1;
  const manchon1 = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 1.4, 18), sombre);
  manchon1.rotation.z = Math.PI / 2;
  manchon1.position.x = -0.9;
  const manchon2 = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 1.0, 18), sombre);
  manchon2.rotation.z = Math.PI / 2;
  manchon2.position.x = -2.6;
  const reference = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.1), sombre);
  reference.position.set(-4.05, 0.15, 0);
  canon.add(tube, manchon1, manchon2, reference);
  // Viseur panoramique du chef (à gauche), viseur du tireur (à droite), tourelleau téléopéré
  const viseurChef = new THREE.Group();
  viseurChef.position.set(-0.3, 0.88, 0.75);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 16), sombre);
  pied.position.y = 0.17;
  const tete = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.36), sombre);
  tete.position.y = 0.48;
  const fenetre = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.26), optique);
  fenetre.position.set(-0.21, 0.5, 0);
  viseurChef.add(pied, tete, fenetre);
  const viseurTireur = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.5), sombre);
  viseurTireur.position.set(-1.5, 1.0, -0.95);
  const vitreTireur = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.36), optique);
  vitreTireur.position.set(-1.81, 1.0, -0.95);
  const tourelleau = new THREE.Group();
  tourelleau.position.set(0.7, 0.9, -0.75);
  const socle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.45), sombre);
  socle.position.y = 0.15;
  const mitrailleuse = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), sombre);
  mitrailleuse.rotation.z = Math.PI / 2;
  mitrailleuse.position.set(-0.6, 0.3, 0);
  tourelleau.add(socle, mitrailleuse);
  tourelle.add(masque, canon, viseurChef, viseurTireur, vitreTireur, tourelleau);
  // Lance-pots fumigènes GALIX et antennes
  for (const cote of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), sombre);
      pot.rotation.x = cote * 0.9;
      pot.position.set(1.0 + k * 0.17, 0.75, cote * 1.72);
      tourelle.add(pot);
    }
    const antenne = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 2.2, 6), sombre);
    antenne.position.set(2.5, 1.95, cote * 1.1);
    tourelle.add(antenne);
  }
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
    { texte: 'Viseur panoramique du chef de char', point: p(0, 3.1, 0.75) },
    { texte: 'Blindage modulaire', point: p(-1.9, 2.3, 1.3) },
    { texte: 'Nuque : chargeur automatique', point: p(3, 2.2, 0) },
    { texte: 'Tourelleau téléopéré (XLR)', point: p(1, 2.9, -0.75) },
    { texte: 'Six galets par côté', point: p(-1, 0.4, 1.8) },
    { texte: 'Grilles anti-roquettes (XLR)', point: p(2.9, 1.3, 1.95) },
  ];
  let angle = 0;
  groupe.userData.animer = (t, api) => {
    const cible = api.tourelle ? 0.7 * Math.sin(t / 1400) : 0;
    angle += (cible - angle) * 0.06;
    tourelle.rotation.y = angle;
  };
  groupe.userData.taille = 14;
  return groupe;
}
