/**
 * Outils de formes partagés par les modèles d'aéronefs relevés sur plans
 * (F-35, Tigre) :
 *  - coque à arêtes vives (sections à dessus et dessous en arcs de Bézier) ;
 *  - prisme à facettes planes (entrées d'air, verrières à vitres planes) ;
 *  - voilure profilée et effilée (aile, dérive, gouverne) : épaisseur qui
 *    diminue de l'emplanture au saumon, profil biconvexe (bords vifs) ou
 *    NACA (bord d'attaque arrondi) ;
 *  - tubes et cadres (arêtes d'une géométrie matérialisées par des tubes).
 * Repère : x de l'avant vers l'arrière, y vers le haut, z vers la gauche.
 */

/** Interpolation cubique (Catmull-Rom) de sections clés : chaque champ numérique est lissé le long de x. */
export function densifierSections(cles, parSegment) {
  const champs = Object.keys(cles[0]);
  const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  const res = [];
  for (let i = 0; i < cles.length - 1; i++) {
    const p0 = cles[Math.max(0, i - 1)], p1 = cles[i], p2 = cles[i + 1], p3 = cles[Math.min(cles.length - 1, i + 2)];
    for (let k = 0; k < parSegment; k++) {
      const s = {};
      for (const c of champs) s[c] = cr(p0[c], p1[c], p2[c], p3[c], k / parSegment);
      s.zArete = Math.max(0, s.zArete);
      res.push(s);
    }
  }
  res.push({ ...cles[cles.length - 1] });
  return res;
}

/**
 * Coque à arêtes vives (« chines ») : chaque section a un dessus, du sommet à
 * l'arête latérale, et un dessous, de l'arête au bas, deux arcs de Bézier
 * quadratiques ; les sommets sont dédoublés sur l'arête pour la garder vive.
 * Section : { x, yHaut, yBas, zArete, yArete, zH, yH (contrôle du dessus), zB, yB (contrôle du dessous) }.
 * UV : u le long de x ; v par bandes (0-0,25 dessus gauche, 0,25-0,5 dessous gauche, 0,5-0,75 dessus droit, 0,75-1 dessous droit).
 */
export function coqueArretes(THREE, cles, { points = 10, parSegment = 6 } = {}) {
  const sections = densifierSections(cles, parSegment);
  const n = points;
  const x0 = sections[0].x, x1 = sections[sections.length - 1].x;
  const bez = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  const pos = [], uv = [], idx = [];
  const bandes = [[true, 1], [false, 1], [true, -1], [false, -1]];
  bandes.forEach(([dessus, cote], b) => {
    const debut = pos.length / 3;
    for (const s of sections) {
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const z = dessus ? bez(0, s.zH, s.zArete, t) : bez(s.zArete, s.zB, 0, t);
        const y = dessus ? bez(s.yHaut, s.yH, s.yArete, t) : bez(s.yArete, s.yB, s.yBas, t);
        pos.push(s.x, y, cote * z);
        uv.push((s.x - x0) / (x1 - x0), (b + t) / 4);
      }
    }
    for (let i = 0; i < sections.length - 1; i++) {
      for (let k = 0; k < n; k++) {
        const a = debut + i * (n + 1) + k, bb = a + 1, c = a + n + 1, d = c + 1;
        if (cote > 0) idx.push(a, bb, c, bb, d, c); else idx.push(a, c, bb, bb, c, d);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Prisme à facettes planes : sections polygonales (même nombre de sommets,
 * listés en tournant) reliées entre elles, sans bouchons. Option de
 * cisaillement de x selon (x, y), pour incliner une lèvre d'entrée d'air ;
 * « inverser » retourne les faces (polygones parcourus dans l'autre sens).
 */
export function prismeFacettes(THREE, sections, { cisaillement = null, inverser = false, fermer = false } = {}) {
  const pos = [];
  const m = sections[0][1].length;
  const point = (x, [z, y]) => [x + (cisaillement ? cisaillement(x, y) : 0), y, z];
  for (let i = 0; i < sections.length - 1; i++) {
    const [xa, pa] = sections[i], [xb, pb] = sections[i + 1];
    for (let k = 0; k < m; k++) {
      const k2 = (k + 1) % m;
      const a = point(xa, pa[k]), b = point(xa, pa[k2]), c = point(xb, pb[k]), d = point(xb, pb[k2]);
      if (inverser) pos.push(...a, ...b, ...c, ...b, ...d, ...c); else pos.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
  }
  if (fermer) {
    // Bouchons plans (éventail depuis le premier sommet)
    for (const [i, sens] of [[0, -1], [sections.length - 1, 1]]) {
      const [x, p] = sections[i];
      for (let k = 1; k < m - 1; k++) {
        const a = point(x, p[0]), b = point(x, p[k]), c = point(x, p[k + 1]);
        if ((sens > 0) === inverser) pos.push(...a, ...b, ...c); else pos.push(...a, ...c, ...b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Demi-épaisseur relative d'un profil à l'abscisse c (0 au bord d'attaque, 1 au bord de fuite). */
function demiEpaisseur(c, profil) {
  if (profil === 'naca') return 5 * (0.2969 * Math.sqrt(c) - 0.126 * c - 0.3516 * c * c + 0.2843 * c ** 3 - 0.1036 * c ** 4);
  return 2 * c * (1 - c); // biconvexe : arcs de parabole, bords vifs (avion furtif)
}

/**
 * Voilure profilée et effilée, à partir de son trapèze [BA emplanture, BA
 * saumon, BF saumon, BF emplanture] (même convention que surface()) :
 * plan « xz » (aile, gouverne de profondeur : épaisseur selon y) ou « xy »
 * (dérive : épaisseur selon z). « relative » : épaisseur maximale en
 * fraction de la corde (emplanture, saumon).
 */
export function voilure(THREE, trapeze, { plan = 'xz', relative = [0.06, 0.04], profil = 'biconvexe', points = 14 } = {}) {
  const [baR, baS, bfS, bfR] = trapeze;
  const stations = [[baR, bfR, relative[0]], [baS, bfS, relative[1]]];
  const pos = [];
  // Abscisses le long de la corde, resserrées au bord d'attaque
  const cs = Array.from({ length: points + 1 }, (_, i) => (1 - Math.cos((i / points) * Math.PI)) / 2);
  const sommet = ([ba, bf, r], c, signe) => {
    const corde = bf[0] - ba[0];
    const x = ba[0] + c * corde;
    const envergure = ba[1] + c * (bf[1] - ba[1]);
    const e = signe * demiEpaisseur(c, profil) * r * Math.abs(corde);
    return plan === 'xz' ? [x, e, envergure] : [x, envergure, e];
  };
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (const signe of [1, -1]) {
    for (let i = 0; i < points; i++) {
      const a = sommet(stations[0], cs[i], signe), b = sommet(stations[0], cs[i + 1], signe);
      const c = sommet(stations[1], cs[i], signe), d = sommet(stations[1], cs[i + 1], signe);
      // Sens des faces : normales vers l'extérieur (dessus vers +y pour une aile gauche dessinée en z > 0)
      const direct = (plan === 'xz') === (signe > 0) === (baS[1] > baR[1]);
      if (direct) { tri(a, c, b); tri(b, c, d); } else { tri(a, b, c); tri(b, d, c); }
    }
  }
  // Bouchons d'emplanture et de saumon
  for (const [j, sens] of [[0, -1], [1, 1]]) {
    for (let i = 0; i < points; i++) {
      const a = sommet(stations[j], cs[i], 1), b = sommet(stations[j], cs[i + 1], 1);
      const c = sommet(stations[j], cs[i], -1), d = sommet(stations[j], cs[i + 1], -1);
      const direct = (plan === 'xz') === (sens > 0) === (baS[1] > baR[1]);
      if (direct) { tri(a, c, b); tri(b, c, d); } else { tri(a, b, c); tri(b, d, c); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Tube entre deux points a et b ([x, y, z]). */
export function tubeEntre(THREE, a, b, r, mat, segments = 10) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), segments), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/** Cadres : chaque arête vive d'une géométrie (angle supérieur au seuil) devient un tube fin. */
export function cadres(THREE, geometrie, r, mat, seuil = 20) {
  const g = new THREE.Group();
  const aretes = new THREE.EdgesGeometry(geometrie, seuil).attributes.position;
  for (let i = 0; i < aretes.count; i += 2) {
    const a = [aretes.getX(i), aretes.getY(i), aretes.getZ(i)], b = [aretes.getX(i + 1), aretes.getY(i + 1), aretes.getZ(i + 1)];
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-3) continue;
    g.add(tubeEntre(THREE, a, b, r, mat, 6));
  }
  return g;
}
