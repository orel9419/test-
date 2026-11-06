/**
 * Les centres du pouvoir en 3D (three.js) : palais de l'Élysée, hôtel de
 * Matignon, palais Bourbon (Assemblée nationale), palais du Luxembourg
 * (Sénat), et les hémicycles colorés selon la composition de la partie.
 *
 * Proportions approximatives et façades simplifiées : cours, jardins,
 * colonnades, frontons, toitures, drapeaux. Unité : le mètre, puis mise à
 * l'échelle de la scène. Repère : x d'ouest en est le long de la façade
 * principale, y vers le haut, z vers le spectateur (la rue, la Seine ou le
 * jardin selon le palais).
 */
import { pieces, tronc } from './modeles.js';

const SOL = -1.6; // niveau du sol dans la scène

/** Façade : fenêtres hautes à petits bois, cordons entre les étages, bossages et arcades en option. */
function textureFacade(THREE, { travees, etages, fond = '#e9e0cc', arcades = false, bossages = false, pilastres = false, aveugle = false }) {
  const pas = 64, haut = 110;
  const W = Math.max(pas, travees * pas), H = etages * haut;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, W, H);
  let g = travees * 31 + etages;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for (let k = 0; k < W * H / 900; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '90,80,60'},0.05)`; ctx.fillRect(h() * W, h() * H, 3 + h() * 8, 2 + h() * 4); }
  if (bossages) {
    ctx.strokeStyle = 'rgba(80,70,55,0.22)'; ctx.lineWidth = 2;
    for (let y = 0; y < H; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  if (pilastres) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let j = 0; j <= travees; j++) ctx.fillRect(j * pas - 5, 0, 10, H);
  }
  // Cordons entre les étages et corniche
  ctx.fillStyle = 'rgba(70,60,45,0.28)';
  for (let e = 1; e < etages; e++) ctx.fillRect(0, H - e * haut - 3, W, 6);
  ctx.fillRect(0, 0, W, 7);
  for (let e = 0; e < etages; e++) {
    for (let j = 0; j < travees; j++) {
      const cx = (j + 0.5) * pas, fw = 26, fh = e === 0 ? 70 : 62;
      const bas = H - e * haut - 14, y0 = bas - fh;
      const arc = arcades && e === 0;
      // Encadrement, verre sombre, petits bois
      ctx.fillStyle = '#f6f2e8';
      ctx.beginPath();
      if (arc) { ctx.moveTo(cx - fw / 2 - 4, bas); ctx.lineTo(cx - fw / 2 - 4, y0 + fw / 2); ctx.arc(cx, y0 + fw / 2, fw / 2 + 4, Math.PI, 0); ctx.lineTo(cx + fw / 2 + 4, bas); }
      else ctx.rect(cx - fw / 2 - 4, y0 - 4, fw + 8, fh + 4);
      ctx.fill();
      const verre = ctx.createLinearGradient(0, y0, 0, bas);
      verre.addColorStop(0, aveugle ? '#cfc4ad' : '#4d6175'); verre.addColorStop(1, aveugle ? '#c4b89f' : '#273544');
      ctx.fillStyle = verre;
      ctx.beginPath();
      if (arc) { ctx.moveTo(cx - fw / 2, bas); ctx.lineTo(cx - fw / 2, y0 + fw / 2); ctx.arc(cx, y0 + fw / 2, fw / 2, Math.PI, 0); ctx.lineTo(cx + fw / 2, bas); }
      else ctx.rect(cx - fw / 2, y0, fw, fh - 4);
      ctx.fill();
      if (!aveugle) {
        ctx.strokeStyle = '#f6f2e8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, y0 + 2); ctx.lineTo(cx, bas); ctx.stroke();
        for (let k = 1; k < 4; k++) { const y = y0 + (k * (bas - y0)) / 4; ctx.beginPath(); ctx.moveTo(cx - fw / 2, y); ctx.lineTo(cx + fw / 2, y); ctx.stroke(); }
      }
      // Clef ou fronton de fenêtre
      ctx.fillStyle = 'rgba(70,60,45,0.25)';
      if (!arc) ctx.fillRect(cx - fw / 2 - 6, y0 - 9, fw + 12, 4);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Fabrique de matériaux partagés pour un palais. */
function atelier(THREE, fond = '#e9e0cc') {
  const cache = new Map();
  const pierre = new THREE.MeshStandardMaterial({ color: fond, roughness: 0.85, metalness: 0 });
  const ardoise = new THREE.MeshStandardMaterial({ color: 0x4d5560, roughness: 0.7, metalness: 0.2 });
  const facade = (opts) => {
    const cle = JSON.stringify({ fond, ...opts });
    if (!cache.has(cle)) cache.set(cle, new THREE.MeshStandardMaterial({ map: textureFacade(THREE, { fond, ...opts }), roughness: 0.85 }));
    return cache.get(cle);
  };
  return { pierre, ardoise, facade };
}

/**
 * Corps de bâtiment : bloc aux façades fenêtrées, corniche, toiture
 * (mansarde à lucarnes, terrasse à balustrade, pavillon ou aucune).
 */
function corps(THREE, a, { l, h, p, travees, traveesCote, etages, toit = 'mansarde', hToit = 4, arcades = false, bossages = false, pilastres = false, aveugle = false, lucarnes = true }) {
  const g = new THREE.Group();
  const optF = { etages, arcades, bossages, pilastres, aveugle };
  const avant = a.facade({ travees, ...optF });
  const cote = a.facade({ travees: traveesCote ?? Math.max(1, Math.round(p / 4)), ...optF });
  const bloc = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), [cote, cote, a.pierre, a.pierre, avant, avant]);
  bloc.position.y = h / 2;
  g.add(bloc);
  const corniche = new THREE.Mesh(new THREE.BoxGeometry(l + 0.8, 0.7, p + 0.8), a.pierre);
  corniche.position.y = h + 0.35;
  g.add(corniche);
  const y0 = h + 0.7;
  if (toit === 'mansarde' || toit === 'pavillon') {
    const r = toit === 'pavillon' ? Math.min(l, p) * 0.38 : Math.min(2.6, p * 0.18);
    const t = tronc(THREE, l, hToit, p, Math.max(0.6, l - 2 * r), Math.max(0.6, p - 2 * r), a.ardoise);
    t.position.y = y0 + hToit / 2;
    g.add(t);
    if (toit === 'mansarde' && lucarnes) {
      const liste = [];
      for (let j = 0; j < travees; j++) {
        const x = -l / 2 + (j + 0.5) * (l / travees);
        for (const s of [-1, 1]) liste.push([x, y0 + hToit * 0.42, s * (p / 2 - r * 0.55), 1.1, 1.5, 0.8]);
      }
      g.add(pieces(THREE, a.pierre, liste));
      g.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0x33414f, roughness: 0.3 }), liste.map(([x, y, z]) => [x, y, z + Math.sign(z) * 0.42, 0.6, 0.9, 0.04])));
    }
    // Souches de cheminée
    g.add(pieces(THREE, a.pierre, [[-l * 0.3, y0 + hToit + 0.6, 0, 1.2, 1.6, 0.8], [l * 0.3, y0 + hToit + 0.6, 0, 1.2, 1.6, 0.8]]));
  } else if (toit === 'terrasse') {
    g.add(balustrade(THREE, a.pierre, l, p, y0));
    const bas = tronc(THREE, l - 2, 2.2, p - 2, l - 6, Math.max(1, p - 7), a.ardoise);
    bas.position.y = y0 + 1.1;
    g.add(bas);
  }
  return g;
}

/** Balustrade sur le pourtour d'un rectangle l × p, posée en y. */
function balustrade(THREE, materiau, l, p, y, { pas = 0.55, hauteur = 1.0 } = {}) {
  const liste = [];
  const cotes = [[-l / 2, -p / 2, l / 2, -p / 2], [-l / 2, p / 2, l / 2, p / 2], [-l / 2, -p / 2, -l / 2, p / 2], [l / 2, -p / 2, l / 2, p / 2]];
  for (const [x1, z1, x2, z2] of cotes) {
    const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / pas));
    for (let i = 0; i <= n; i++) liste.push([x1 + ((x2 - x1) * i) / n, y + hauteur * 0.45, z1 + ((z2 - z1) * i) / n, 0.22, hauteur * 0.9, 0.22]);
    liste.push([(x1 + x2) / 2, y + hauteur, (z1 + z2) / 2, Math.abs(x2 - x1) + 0.3, 0.18, Math.abs(z2 - z1) + 0.3]);
  }
  return pieces(THREE, materiau, liste);
}

/** Colonne : base, fût, chapiteau corinthien (corbeille évasée) ou ionique (volutes). */
function colonne(THREE, materiau, hauteur, rayon, ordre = 'corinthien') {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(rayon * 2.6, 0.45, rayon * 2.6), materiau);
  base.position.y = 0.22;
  const tore = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 1.2, rayon * 1.25, 0.35, 18), materiau);
  tore.position.y = 0.6;
  const hChap = ordre === 'corinthien' ? rayon * 1.6 : rayon * 0.8;
  const fut = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 0.88, rayon, hauteur - 1.0 - hChap, 18), materiau);
  fut.position.y = 0.78 + (hauteur - 1.0 - hChap) / 2;
  g.add(base, tore, fut);
  const yc = hauteur - hChap - 0.22;
  if (ordre === 'corinthien') {
    const corbeille = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 1.35, rayon * 0.9, hChap, 16), materiau);
    corbeille.position.y = yc + hChap / 2;
    g.add(corbeille);
  } else {
    const echine = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 1.05, rayon * 0.9, hChap, 16), materiau);
    echine.position.y = yc + hChap / 2;
    g.add(echine);
    for (const s of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 0.42, rayon * 0.42, rayon * 2.2, 14), materiau);
      volute.rotation.x = Math.PI / 2;
      volute.position.set(s * rayon * 1.15, yc + hChap * 0.45, 0);
      g.add(volute);
    }
  }
  const abaque = new THREE.Mesh(new THREE.BoxGeometry(rayon * 2.9, 0.3, rayon * 2.9), materiau);
  abaque.position.y = hauteur - 0.15;
  g.add(abaque);
  return g;
}

/** Fronton triangulaire (largeur × hauteur × profondeur), tympan en retrait. */
function fronton(THREE, materiau, largeur, hauteur, profondeur, tympan = null) {
  const g = new THREE.Group();
  const forme = new THREE.Shape([new THREE.Vector2(-largeur / 2, 0), new THREE.Vector2(largeur / 2, 0), new THREE.Vector2(0, hauteur)]);
  const geo = new THREE.ExtrudeGeometry(forme, { depth: profondeur, bevelEnabled: false });
  geo.translate(0, 0, -profondeur / 2);
  g.add(new THREE.Mesh(geo, materiau));
  const base = new THREE.Mesh(new THREE.BoxGeometry(largeur + 0.6, 0.5, profondeur + 0.4), materiau);
  base.position.y = 0.1;
  g.add(base);
  if (tympan) {
    const f2 = new THREE.Shape([new THREE.Vector2(-largeur / 2 + 1.6, 0.6), new THREE.Vector2(largeur / 2 - 1.6, 0.6), new THREE.Vector2(0, hauteur - 0.9)]);
    const t = new THREE.Mesh(new THREE.ShapeGeometry(f2), tympan);
    t.position.z = profondeur / 2 + 0.03;
    g.add(t);
  }
  return g;
}

/** Bas-relief stylisé pour un tympan (figures claires sur fond légèrement ombré). */
function textureTympan(THREE) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9cfb9';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#efe7d6';
  for (let i = 0; i < 11; i++) {
    const x = 60 + i * 40, hh = 40 + 50 * (1 - Math.abs(i - 5) / 6);
    ctx.beginPath(); ctx.ellipse(x, 128 - hh * 0.55, 11, hh * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, 128 - hh - 4, 8, 0, Math.PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Drapeau sur sa hampe : français ou européen, qui flotte au vent (userData.onduler). */
function drapeau(THREE, type = 'fr', { hampe = 6, l = 3, h = 2 } = {}) {
  const c = document.createElement('canvas');
  c.width = 192; c.height = 128;
  const ctx = c.getContext('2d');
  if (type === 'fr') {
    ['#002654', '#ffffff', '#ce1126'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(i * 64, 0, 64, 128); });
  } else {
    ctx.fillStyle = '#003399'; ctx.fillRect(0, 0, 192, 128);
    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, x = 96 + Math.cos(a) * 40, y = 64 + Math.sin(a) * 40;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) { const r = k % 2 ? 3 : 7.5, b = -Math.PI / 2 + (k * Math.PI) / 5; ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, hampe, 8), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.6, roughness: 0.3 }));
  mat.position.y = hampe / 2;
  const geo = new THREE.PlaneGeometry(l, h, 16, 4);
  geo.translate(l / 2, 0, 0);
  const tissu = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
  tissu.position.y = hampe - h / 2 - 0.1;
  g.add(mat, tissu);
  const base = Float32Array.from(geo.attributes.position.array);
  g.userData.onduler = (t) => {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      pos.setZ(i, Math.sin(x * 1.6 - t / 260) * 0.12 * x);
      pos.setY(i, base[i * 3 + 1] - 0.04 * x * x / l);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return g;
}

/** Arbres (tronc et houppier) en deux maillages instanciés : [x, z, hauteur]. */
function arbres(THREE, liste, { teinte = 0x5f8a3d, forme = 'rond' } = {}) {
  const g = new THREE.Group();
  const troncs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 }), liste.length);
  const geoH = forme === 'cone' ? new THREE.ConeGeometry(1, 2.2, 8) : new THREE.IcosahedronGeometry(1, 1);
  const houppiers = new THREE.InstancedMesh(geoH, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), liste.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), e = new THREE.Vector3();
  const base = new THREE.Color(teinte), col = new THREE.Color();
  liste.forEach(([x, z, hh], i) => {
    troncs.setMatrixAt(i, m.compose(v.set(x, hh * 0.22, z), q, e.set(1, hh * 0.45, 1)));
    const r = hh * 0.32;
    houppiers.setMatrixAt(i, m.compose(v.set(x, hh * 0.62, z), q, e.set(r, forme === 'cone' ? r * 1.1 : r * 1.05, r)));
    col.copy(base).offsetHSL(((i * 37) % 10) / 300, 0, ((i * 53) % 10) / 120 - 0.04);
    houppiers.setColorAt(i, col);
  });
  troncs.castShadow = houppiers.castShadow = true;
  g.add(troncs, houppiers);
  return g;
}

/** Surface au sol (pelouse, gravier, pavés, chaussée, eau). */
function sol(THREE, [x1, z1, x2, z2], couleur, y = 0.02, { rugosite = 0.95, metal = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: metal }));
  m.rotation.x = -Math.PI / 2;
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.receiveShadow = true;
  return m;
}

/** Statue sur piédestal (assise ou debout). */
function statue(THREE, materiau, assise = true) {
  const g = new THREE.Group();
  const socle = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 2.2), materiau);
  socle.position.y = 1.2;
  const siege = new THREE.Mesh(new THREE.BoxGeometry(1.3, assise ? 1.0 : 0.2, 1.2), materiau);
  siege.position.y = 2.4 + (assise ? 0.5 : 0.1);
  const corpsS = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, assise ? 1.0 : 1.8, 4, 10), materiau);
  corpsS.position.set(0, assise ? 3.7 : 3.8, assise ? -0.1 : 0);
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), materiau);
  tete.position.set(0, assise ? 4.7 : 5.3, 0);
  g.add(socle, siege, corpsS, tete);
  return g;
}

/** Place le palais dans la scène (échelle, sol), ombres, et animation des drapeaux. */
function installer(THREE, palais, s, drapeaux = []) {
  palais.scale.setScalar(s);
  palais.position.y = SOL;
  palais.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow || !o.material?.transparent; o.receiveShadow = true; } });
  const groupe = new THREE.Group();
  groupe.add(palais);
  const p = (x, y, z) => new THREE.Vector3(x * s, y * s + SOL, z * s);
  groupe.userData.animer = (t) => drapeaux.forEach((d) => d.userData.onduler(t));
  groupe.userData.taille = 16;
  return { groupe, p };
}

/** Grand sol urbain sous le palais. */
function sousSol(THREE, taille = 3000, couleur = 0xb3ada0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(taille, taille), new THREE.MeshStandardMaterial({ color: couleur, roughness: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/** Perron à marches (largeur × nombre de marches), descendant vers +z. */
function perron(THREE, materiau, largeur, n, { marche = 0.18, giron = 0.35, x = 0, y = 0, z = 0 } = {}) {
  const liste = [];
  for (let i = 0; i < n; i++) liste.push([x, y + marche * (i + 0.5), z - i * giron, largeur, marche, giron * (n - i)]);
  return pieces(THREE, materiau, liste.map(([a, b, c, l, hh, p]) => [a, b, c - p / 2 + giron / 2, l, hh, p]));
}

/**
 * Palais de l'Élysée : portail à colonnes ioniques sur la rue du
 * Faubourg-Saint-Honoré, cour d'honneur en gravier bordée d'ailes basses à
 * arcades et balustrade, corps de logis à deux niveaux, perron sous sa
 * marquise de verre, drapeaux français et européen, parc à l'arrière.
 */
export function construireElysee(THREE) {
  const p0 = new THREE.Group();
  const a = atelier(THREE, '#ece4d2');
  const fer = new THREE.MeshStandardMaterial({ color: 0x1d2124, roughness: 0.5, metalness: 0.6 });
  const verre = new THREE.MeshStandardMaterial({ color: 0xbfd6e6, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.3 });
  p0.add(sousSol(THREE));
  p0.add(sol(THREE, [-200, 40, 200, 54], 0x5d6166), sol(THREE, [-200, 37, 200, 40], 0xc9c2b4, 0.03), sol(THREE, [-200, 54, 200, 57], 0xc9c2b4, 0.03));
  // Cour d'honneur et parc
  p0.add(sol(THREE, [-34, -10, 34, 30], 0xdcd1b8, 0.03));
  p0.add(sol(THREE, [-62, -110, 62, -30], 0x6f9a48, 0.03), sol(THREE, [-5, -110, 5, -30], 0xd8ccb0, 0.05));
  p0.add(arbres(THREE, [...Array.from({ length: 9 }, (_, i) => [-55, -38 - i * 8.5, 13]), ...Array.from({ length: 9 }, (_, i) => [55, -38 - i * 8.5, 13]), [-25, -70, 15], [22, -82, 14], [-18, -98, 12], [30, -55, 12], ...Array.from({ length: 12 }, (_, i) => [-88 + i * 16, 58, 11])]));
  // Communs sur la rue et portail
  for (const s of [-1, 1]) {
    const c = corps(THREE, a, { l: 34, h: 8, p: 8, travees: 9, etages: 2, toit: 'mansarde', hToit: 2.6 });
    c.position.set(s * 27, 0, 34);
    p0.add(c);
  }
  for (const s of [-1, 1]) {
    const pile = new THREE.Mesh(new THREE.BoxGeometry(5, 12, 8.4), a.pierre);
    pile.position.set(s * 7.5, 6, 34);
    p0.add(pile);
    for (const x of [6.1, 8.9]) {
      const col = colonne(THREE, a.pierre, 10, 0.55, 'ionique');
      col.position.set(s * x, 0, 38.9);
      p0.add(col);
    }
  }
  p0.add(pieces(THREE, a.pierre, [[0, 10.8, 37, 22, 1.6, 4.6], [0, 13.2, 34, 13, 3.2, 8], [0, 9.6, 34, 10, 2.4, 8]]));
  const ecusson = new THREE.Mesh(new THREE.CircleGeometry(1.1, 20), new THREE.MeshStandardMaterial({ color: 0xc9a54a, metalness: 0.7, roughness: 0.3 }));
  ecusson.position.set(0, 13.4, 38.05);
  p0.add(ecusson);
  p0.add(pieces(THREE, fer, [...Array.from({ length: 13 }, (_, i) => [-4.5 + i * 0.75, 4.2, 34, 0.12, 8.4, 0.12]), [0, 8.3, 34, 10, 0.2, 0.2], [0, 1.2, 34, 10, 0.2, 0.2]]));
  // Ailes de la cour : un niveau, arcades aveugles, balustrade
  for (const s of [-1, 1]) {
    const aile = corps(THREE, a, { l: 8, h: 7, p: 40, travees: 2, traveesCote: 10, etages: 1, toit: 'terrasse', arcades: true, aveugle: true });
    aile.position.set(s * 32, 0, 10);
    p0.add(aile);
  }
  // Corps de logis, avant-corps central, perron et marquise
  const logis = corps(THREE, a, { l: 80, h: 15, p: 18, travees: 19, traveesCote: 4, etages: 2, toit: 'terrasse', pilastres: false });
  logis.position.set(0, 0, -19);
  p0.add(logis);
  const avantCorps = corps(THREE, a, { l: 16, h: 16, p: 3, travees: 3, traveesCote: 1, etages: 2, toit: 'terrasse', pilastres: true, arcades: true });
  avantCorps.position.set(0, 0, -9);
  p0.add(avantCorps);
  p0.add(pieces(THREE, a.pierre, [[0, 0.45, -7.0, 16, 0.9, 1.3]]));
  for (const x of [-6.5, -2.2, 2.2, 6.5]) {
    const col = colonne(THREE, a.pierre, 7, 0.42, 'ionique');
    col.position.set(x, 0.9, -7.0);
    p0.add(col);
  }
  p0.add(pieces(THREE, a.pierre, [[0, 8.1, -7.2, 16, 0.5, 2.8]]));
  p0.add(balustrade(THREE, a.pierre, 15.5, 2.4, 8.35, { hauteur: 0.9 }).translateZ(-7.2));
  p0.add(perron(THREE, a.pierre, 14, 5, { z: -6.2, marche: 0.18, giron: 0.45 }));
  const marquise = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 4.8), verre);
  marquise.position.set(0, 5.2, -4.4);
  marquise.rotation.x = 0.12;
  marquise.castShadow = false;
  p0.add(marquise);
  p0.add(pieces(THREE, fer, [[0, 5.3, -2.05, 11.2, 0.25, 0.15], [-5.5, 5.3, -4.4, 0.15, 0.25, 4.8], [5.5, 5.3, -4.4, 0.15, 0.25, 4.8], [-4, 5.6, -5.2, 0.08, 0.08, 4], [4, 5.6, -5.2, 0.08, 0.08, 4]]));
  // Drapeaux sur le toit
  const fr = drapeau(THREE, 'fr', { hampe: 7, l: 3.2, h: 2.1 });
  fr.position.set(-1.5, 16.2, -15);
  const ue = drapeau(THREE, 'ue', { hampe: 7, l: 3.2, h: 2.1 });
  ue.position.set(1.5, 16.2, -15);
  p0.add(fr, ue);

  const { groupe, p } = installer(THREE, p0, 0.135, [fr, ue]);
  groupe.userData.legendes = [
    { texte: 'Perron et marquise', point: p(0, 7, -2) },
    { texte: 'Cour d\'honneur', point: p(0, 1, 12) },
    { texte: 'Portail sur la rue du Faubourg-Saint-Honoré', point: p(0, 15, 40) },
    { texte: 'Drapeaux français et européen', point: p(0, 24, -13) },
    { texte: 'Corps de logis (salon Murat : Conseil des ministres)', point: p(-28, 16, -19) },
    { texte: 'Parc', point: p(0, 2, -70) },
  ];
  return groupe;
}

/**
 * Hôtel de Matignon : portail au fond d'un hémicycle sur la rue de Varenne,
 * cour d'honneur pavée, corps de logis à toit d'ardoise et lucarnes,
 * avant-corps à colonnes et fronton, perron, drapeau, et le grand parc
 * d'environ 3 hectares, avec ses allées d'arbres et son pavillon.
 */
export function construireMatignon(THREE) {
  const p0 = new THREE.Group();
  const a = atelier(THREE, '#ebe2cf');
  const fer = new THREE.MeshStandardMaterial({ color: 0x1d2124, roughness: 0.5, metalness: 0.6 });
  p0.add(sousSol(THREE));
  p0.add(sol(THREE, [-200, 34, 200, 44], 0x5d6166), sol(THREE, [-200, 32, 200, 34], 0xc9c2b4, 0.03), sol(THREE, [-200, 44, 200, 46], 0xc9c2b4, 0.03));
  p0.add(sol(THREE, [-20, -8, 20, 26], 0xc9c1ae, 0.03));
  // Parc : grande pelouse, allées d'arbres, pavillon au fond
  p0.add(sol(THREE, [-48, -250, 48, -28], 0x6f9a48, 0.03), sol(THREE, [-36, -232, 36, -40], 0x7aa651, 0.05));
  const rangees = [];
  for (let i = 0; i < 22; i++) for (const x of [-42, 42]) rangees.push([x, -40 - i * 9.5, 12 + (i % 3)]);
  p0.add(arbres(THREE, [...rangees, [-20, -150, 15], [18, -120, 14], [-14, -205, 13]]));
  const pavillon = corps(THREE, a, { l: 12, h: 6, p: 8, travees: 3, etages: 1, toit: 'pavillon', hToit: 3, arcades: true });
  pavillon.position.set(0, 0, -240);
  p0.add(pavillon);
  // Communs sur la rue et portail en hémicycle
  for (const s of [-1, 1]) {
    const c = corps(THREE, a, { l: 22, h: 10, p: 6, travees: 6, etages: 2, toit: 'mansarde', hToit: 2.8 });
    c.position.set(s * 20, 0, 29);
    p0.add(c);
  }
  const niche = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 10, 32, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ map: textureFacade(THREE, { travees: 6, etages: 2, fond: '#ebe2cf', aveugle: true }), side: THREE.DoubleSide, roughness: 0.85 }));
  niche.position.set(0, 5, 32);
  p0.add(niche);
  p0.add(pieces(THREE, a.pierre, [[0, 10.3, 27.5, 19, 0.6, 9.5], [-3.6, 4.8, 23.4, 1.6, 9.6, 1.6], [3.6, 4.8, 23.4, 1.6, 9.6, 1.6], [0, 8.5, 23.4, 8.8, 2.2, 1.8], [0, 10.4, 23.4, 4.5, 1.6, 1.4]]));
  for (const x of [-4.8, 4.8]) {
    const col = colonne(THREE, a.pierre, 7.6, 0.4, 'ionique');
    col.position.set(x, 0, 24.6);
    p0.add(col);
  }
  p0.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0x2b3a2e, roughness: 0.6 }), [[0, 3.7, 23.2, 5.6, 7.4, 0.3]]));
  // Ailes basses de la cour
  for (const s of [-1, 1]) {
    const aile = corps(THREE, a, { l: 6, h: 7, p: 34, travees: 1, traveesCote: 8, etages: 1, toit: 'mansarde', hToit: 2.4, arcades: true });
    aile.position.set(s * 23, 0, 9);
    p0.add(aile);
  }
  // Corps de logis, avant-corps à colonnes et fronton (sur la cour et sur le jardin)
  const logis = corps(THREE, a, { l: 54, h: 15, p: 18, travees: 13, traveesCote: 4, etages: 2, toit: 'mansarde', hToit: 4.5 });
  logis.position.set(0, 0, -17);
  p0.add(logis);
  for (const s of [-1, 1]) {
    const ac = corps(THREE, a, { l: 13, h: 15.4, p: 2.4, travees: 3, traveesCote: 1, etages: 2, toit: 'aucun', pilastres: true, arcades: s < 0 });
    ac.position.set(0, 0, s > 0 ? -6.8 : -27.2);
    p0.add(ac);
    const fr = fronton(THREE, a.pierre, 13.6, 3.2, 2.6, new THREE.MeshStandardMaterial({ map: textureTympan(THREE), roughness: 0.9 }));
    fr.position.set(0, 16.1, s > 0 ? -6.8 : -27.2);
    if (s < 0) fr.rotation.y = Math.PI;
    p0.add(fr);
  }
  p0.add(pieces(THREE, a.pierre, [[0, 0.36, -5.0, 12.5, 0.72, 1.2]]));
  for (const x of [-4.8, -1.6, 1.6, 4.8]) {
    const col = colonne(THREE, a.pierre, 6.6, 0.38, 'ionique');
    col.position.set(x, 0.72, -5.0);
    p0.add(col);
  }
  p0.add(pieces(THREE, a.pierre, [[0, 7.5, -5.2, 12, 0.45, 2.4]]));
  p0.add(perron(THREE, a.pierre, 10, 4, { z: -4.0, marche: 0.18, giron: 0.45 }));
  p0.add(pieces(THREE, fer, [[0, 8.6, -4.3, 11.5, 0.1, 0.08]]));
  const fr = drapeau(THREE, 'fr', { hampe: 6, l: 2.8, h: 1.9 });
  fr.position.set(-1.4, 20.2, -17);
  const ue = drapeau(THREE, 'ue', { hampe: 6, l: 2.8, h: 1.9 });
  ue.position.set(1.4, 20.2, -17);
  p0.add(fr, ue);

  const { groupe, p } = installer(THREE, p0, 0.14, [fr, ue]);
  groupe.userData.legendes = [
    { texte: 'Portail en hémicycle (rue de Varenne)', point: p(0, 12, 31) },
    { texte: 'Cour d\'honneur', point: p(0, 1, 13) },
    { texte: 'Avant-corps à colonnes et fronton', point: p(0, 19, -4) },
    { texte: 'Bureau du Premier ministre (corps de logis)', point: p(-20, 17, -17) },
    { texte: 'Parc d\'environ 3 hectares', point: p(0, 2, -90) },
  ];
  return groupe;
}

/**
 * Palais Bourbon, façade sur la Seine : grand escalier, péristyle de douze
 * colonnes corinthiennes, fronton sculpté, quatre statues de grands
 * serviteurs de l'État, ailes latérales, verrière de l'hémicycle, drapeau ;
 * le quai, la Seine et le pont de la Concorde.
 */
export function construireAssemblee(THREE) {
  const p0 = new THREE.Group();
  const a = atelier(THREE, '#ede6d6');
  const verre = new THREE.MeshStandardMaterial({ color: 0x9fbfd6, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.4 });
  p0.add(sol(THREE, [-1500, -1500, 1500, 42], 0xb3ada0, 0), sol(THREE, [-1500, 152, 1500, 1500], 0xb3ada0, 0));
  // Quai, la Seine en contrebas, pont de la Concorde
  p0.add(sol(THREE, [-260, 22, 260, 38], 0x5d6166, 0.03), sol(THREE, [-260, 38, 260, 42], 0xc9c2b4, 0.04));
  const seine = new THREE.Mesh(new THREE.PlaneGeometry(3000, 110), new THREE.MeshStandardMaterial({ color: 0x41708f, roughness: 0.25, metalness: 0.2 }));
  seine.rotation.x = -Math.PI / 2;
  seine.position.set(0, -5, 97);
  p0.add(seine);
  p0.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xcfc6b3, roughness: 0.9 }), [[0, -2.5, 42.5, 3000, 5, 1.2], [0, -2.5, 152, 3000, 5, 1.2]]));
  const pont = pieces(THREE, a.pierre, [[0, -0.6, 97, 30, 1.2, 110], [-14.6, 0.5, 97, 0.8, 1.0, 110], [14.6, 0.5, 97, 0.8, 1.0, 110], ...[60, 80, 97, 114, 134].map((z) => [0, -3.2, z, 26, 4.4, 4])]);
  p0.add(pont);
  p0.add(sol(THREE, [-13, 42, 13, 152], 0x5d6166, 0.06));
  p0.add(arbres(THREE, Array.from({ length: 26 }, (_, i) => [-235 + i * 18.8, 40, 12]).filter(([x]) => Math.abs(x) > 18)));
  // Grand escalier (trente marches) et socle du péristyle
  p0.add(pieces(THREE, a.pierre, Array.from({ length: 30 }, (_, i) => [0, (i + 1) * 0.1, 21.8 - i * 0.33 - 0.165, 46, (i + 1) * 0.2, 0.33])));
  p0.add(pieces(THREE, a.pierre, [[0, 3, 4.45, 50, 6, 14.9]]));
  // Murs d'échiffre et statues assises des quatre grands serviteurs de l'État
  p0.add(pieces(THREE, a.pierre, [[-24.5, 3, 16.5, 3, 6, 11], [24.5, 3, 16.5, 3, 6, 11]]));
  for (const [x, z] of [[-24.5, 20], [24.5, 20], [-24.5, 14], [24.5, 14]]) {
    const st = statue(THREE, a.pierre, true);
    st.position.set(x, 6, z);
    p0.add(st);
  }
  // Péristyle : douze colonnes corinthiennes, entablement, fronton
  for (let i = 0; i < 12; i++) {
    const col = colonne(THREE, a.pierre, 16, 0.85, 'corinthien');
    col.position.set(-20.35 + i * 3.7, 6, 9.5);
    p0.add(col);
  }
  p0.add(pieces(THREE, a.pierre, [[0, 23.1, 6.5, 47, 2.2, 8]]));
  const fr = fronton(THREE, a.pierre, 47, 6.5, 8, new THREE.MeshStandardMaterial({ map: textureTympan(THREE), roughness: 0.9 }));
  fr.position.set(0, 24.2, 6.5);
  p0.add(fr);
  // Corps du temple, ailes, verrière de l'hémicycle
  const temple = corps(THREE, a, { l: 46, h: 24, p: 30, travees: 7, traveesCote: 7, etages: 2, toit: 'aucun', aveugle: false });
  temple.position.set(0, 0, -13);
  p0.add(temple);
  for (const s of [-1, 1]) {
    const aile = corps(THREE, a, { l: 38, h: 17, p: 40, travees: 9, traveesCote: 9, etages: 2, toit: 'terrasse', arcades: true });
    aile.position.set(s * 42, 0, -10);
    p0.add(aile);
  }
  const verriere = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 30, 32, 1, true, 0, Math.PI), verre);
  verriere.rotation.z = Math.PI / 2;
  verriere.scale.set(0.3, 1, 1);
  verriere.position.set(0, 24.7, -14);
  verriere.castShadow = false;
  p0.add(verriere);
  const drap = drapeau(THREE, 'fr', { hampe: 6, l: 3.4, h: 2.3 });
  drap.position.set(0, 30.6, 6.5);
  p0.add(drap);

  const { groupe, p } = installer(THREE, p0, 0.13, [drap]);
  groupe.userData.legendes = [
    { texte: 'Péristyle de douze colonnes corinthiennes', point: p(-12, 18, 10) },
    { texte: 'Fronton', point: p(0, 28, 11) },
    { texte: 'Grand escalier', point: p(0, 4, 19) },
    { texte: 'Statues : Sully, Colbert, L\'Hospital, d\'Aguesseau', point: p(24.5, 11, 20) },
    { texte: 'Verrière de l\'hémicycle', point: p(0, 30, -14) },
    { texte: 'La Seine et le pont de la Concorde', point: p(0, 1, 70) },
  ];
  return groupe;
}

/**
 * Palais du Luxembourg, côté jardin : corps de logis à bossages, pavillon
 * central coiffé d'un dôme à lanterne, pavillons d'angle à hauts toits,
 * ailes et pavillon d'entrée à coupole sur la rue de Vaugirard, cour
 * d'honneur ; jardin à la française et grand bassin octogonal.
 */
export function construireSenat(THREE) {
  const p0 = new THREE.Group();
  const a = atelier(THREE, '#e8dcc2');
  const or = new THREE.MeshStandardMaterial({ color: 0xc9a54a, metalness: 0.8, roughness: 0.3 });
  p0.add(sousSol(THREE, 3000, 0xb8b09d));
  // Jardin : terrasse sablée, pelouses, grand bassin octogonal, arbres
  p0.add(sol(THREE, [-90, 8, 90, 170], 0xd9cdb0, 0.03));
  for (const [x1, z1, x2, z2] of [[-60, 40, -22, 100], [22, 40, 60, 100], [-60, 110, -10, 160], [10, 110, 60, 160]]) p0.add(sol(THREE, [x1, z1, x2, z2], 0x6f9a48, 0.05));
  const bassin = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x4f7f9f, roughness: 0.2, metalness: 0.2 }));
  bassin.position.set(0, 0.2, 72);
  bassin.rotation.y = Math.PI / 8;
  const margelle = new THREE.Mesh(new THREE.TorusGeometry(15.4, 0.5, 6, 8), a.pierre);
  margelle.rotation.x = Math.PI / 2;
  margelle.rotation.z = Math.PI / 8;
  margelle.position.set(0, 0.5, 72);
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.6, 5, 10), new THREE.MeshStandardMaterial({ color: 0xe8f3fa, transparent: true, opacity: 0.7 }));
  jet.position.set(0, 2.8, 72);
  p0.add(bassin, margelle, jet);
  const allees = [];
  for (let i = 0; i < 16; i++) for (const x of [-75, -84, 75, 84]) allees.push([x, 20 + i * 9.5, 12 + (i % 3)]);
  p0.add(arbres(THREE, allees));
  // Corps de logis à bossages et pavillon central à dôme
  const logis = corps(THREE, a, { l: 82, h: 16, p: 18, travees: 19, traveesCote: 4, etages: 2, toit: 'mansarde', hToit: 5, bossages: true });
  logis.position.set(0, 0, -1);
  p0.add(logis);
  const central = corps(THREE, a, { l: 22, h: 20, p: 24, travees: 5, traveesCote: 5, etages: 3, toit: 'aucun', bossages: true, pilastres: true });
  central.position.set(0, 0, 2);
  p0.add(central);
  const tambour = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 3.4, 8), a.pierre);
  tambour.position.set(0, 22.4, 2);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(7.5, 8, 10, 0, Math.PI * 2, 0, Math.PI / 2), a.ardoise);
  dome.scale.y = 1.15;
  dome.position.set(0, 24.1, 2);
  const lanterne = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 3, 8), a.pierre);
  lanterne.position.set(0, 33.9, 2);
  const fleche = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.4, 8), a.ardoise);
  fleche.position.set(0, 36.6, 2);
  const boule = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), or);
  boule.position.set(0, 38.1, 2);
  p0.add(tambour, dome, lanterne, fleche, boule);
  // Côtes dorées du dôme
  for (let i = 0; i < 8; i++) {
    const cote = new THREE.Mesh(new THREE.TorusGeometry(7.55, 0.12, 4, 24, Math.PI / 2), or);
    cote.scale.y = 1.15;
    cote.rotation.y = (i * Math.PI) / 4;
    cote.position.set(0, 24.1, 2);
    p0.add(cote);
  }
  // Horloge du pavillon central
  const cadran = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshStandardMaterial({ color: 0xf4f1e6 }));
  cadran.position.set(0, 18.3, 14.06);
  p0.add(cadran, pieces(THREE, new THREE.MeshStandardMaterial({ color: 0x1b1b1b }), [[0, 18.6, 14.1, 0.12, 0.8, 0.02], [0.3, 18.3, 14.1, 0.7, 0.1, 0.02]]));
  // Pavillons d'angle à hauts toits
  for (const s of [-1, 1]) {
    const pav = corps(THREE, a, { l: 16, h: 20, p: 26, travees: 3, traveesCote: 5, etages: 3, toit: 'pavillon', hToit: 8, bossages: true });
    pav.position.set(s * 48, 0, -2);
    p0.add(pav);
  }
  // Ailes vers la cour, pavillon d'entrée à coupole, galeries sur la rue de Vaugirard
  for (const s of [-1, 1]) {
    const aile = corps(THREE, a, { l: 12, h: 15, p: 46, travees: 2, traveesCote: 10, etages: 2, toit: 'mansarde', hToit: 4, bossages: true });
    aile.position.set(s * 48, 0, -38);
    p0.add(aile);
    const galerie = corps(THREE, a, { l: 30, h: 8, p: 8, travees: 7, etages: 1, toit: 'terrasse', arcades: true, bossages: true });
    galerie.position.set(s * 27, 0, -64);
    p0.add(galerie);
  }
  p0.add(sol(THREE, [-42, -60, 42, -10], 0xcfc6b2, 0.03));
  const entree = corps(THREE, a, { l: 24, h: 16, p: 16, travees: 5, traveesCote: 3, etages: 2, toit: 'aucun', bossages: true, arcades: true });
  entree.position.set(0, 0, -66);
  p0.add(entree);
  const coupole = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), a.ardoise);
  coupole.position.set(0, 16.7, -66);
  coupole.scale.y = 1.2;
  const tambour2 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 1.2, 8), a.pierre);
  tambour2.position.set(0, 16.4, -66);
  const lanterne2 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 2.2, 8), a.pierre);
  lanterne2.position.set(0, 24.9, -66);
  p0.add(tambour2, coupole, lanterne2);
  const drap = drapeau(THREE, 'fr', { hampe: 6, l: 3.2, h: 2.1 });
  drap.position.set(0, 26, -66);
  p0.add(drap);

  const { groupe, p } = installer(THREE, p0, 0.12, [drap]);
  groupe.userData.legendes = [
    { texte: 'Pavillon central à dôme', point: p(0, 36, 6) },
    { texte: 'Pavillons d\'angle', point: p(48, 26, 13) },
    { texte: 'Façades à bossages (style florentin)', point: p(-25, 10, 12) },
    { texte: 'Grand bassin du jardin du Luxembourg', point: p(0, 2, 76) },
    { texte: 'Entrée rue de Vaugirard', point: p(0, 30, -62) },
  ];
  return groupe;
}

/** Ordre et couleurs par défaut si la partie ne fournit pas la composition. */
const PAR_DEFAUT = {
  hemicycleAN: { total: 577, groupes: [{ id: 'G', nom: 'Gauche', sieges: 190, couleur: '#d6336c' }, { id: 'C', nom: 'Centre', sieges: 170, couleur: '#f2b630' }, { id: 'D', nom: 'Droite', sieges: 217, couleur: '#1b2a6b' }] },
  hemicycleSenat: { total: 348, groupes: [{ id: 'G', nom: 'Gauche', sieges: 95, couleur: '#d6336c' }, { id: 'C', nom: 'Centre', sieges: 82, couleur: '#4f8fd6' }, { id: 'D', nom: 'Droite', sieges: 171, couleur: '#1b2a6b' }] },
};

/**
 * Hémicycle : un fauteuil par élu, coloré selon son groupe, de la gauche à
 * la droite vues du fauteuil du président ; gradins, pupitres, tribune,
 * « perchoir », banc du Gouvernement, colonnade et tribunes du public.
 * donnees : { groupes: [{ id, nom, sieges, couleur }] } dans l'ordre gauche → droite.
 */
export function construireHemicycle(THREE, { modele = 'hemicycleAN', donnees = null } = {}) {
  const senat = modele === 'hemicycleSenat';
  const groupes = (donnees?.groupes?.length ? donnees.groupes : PAR_DEFAUT[modele].groupes).filter((g) => g.sieges > 0);
  const total = groupes.reduce((s, g) => s + g.sieges, 0);
  const h0 = new THREE.Group();
  const bois = new THREE.MeshStandardMaterial({ color: 0x7a4b2a, roughness: 0.6 });
  const tapis = new THREE.MeshStandardMaterial({ color: senat ? 0x8e2a2a : 0x7c1f24, roughness: 0.95 });
  const marbre = new THREE.MeshStandardMaterial({ color: 0xe9e2d4, roughness: 0.4 });
  const or = new THREE.MeshStandardMaterial({ color: 0xc9a54a, metalness: 0.75, roughness: 0.3 });

  // Rangées : plus de sièges sur les rangs extérieurs ; un siège par 0,9 m environ
  const rangs = senat ? 9 : 12, r0 = 5.6, pasR = 0.95, ouverture = Math.PI * 0.56;
  /** Secteur d'anneau (de ri à re, ouvert de ±demi autour de -z), extrudé vers le haut sur la hauteur h. */
  const gradin = (ri, re, demi, h) => {
    const f = new THREE.Shape();
    f.absarc(0, 0, re, -Math.PI / 2 - demi, -Math.PI / 2 + demi, false);
    f.absarc(0, 0, ri, -Math.PI / 2 + demi, -Math.PI / 2 - demi, true);
    const geo = new THREE.ExtrudeGeometry(f, { depth: h, bevelEnabled: false, curveSegments: 48 });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, h, 0);
    return geo;
  };
  const rayons = Array.from({ length: rangs }, (_, i) => r0 + i * pasR);
  const somme = rayons.reduce((s, r) => s + r, 0);
  const parRang = rayons.map((r) => Math.round((total * r) / somme));
  parRang[rangs - 1] += total - parRang.reduce((s, x) => s + x, 0);
  const sieges = [];
  rayons.forEach((r, i) => {
    const n = parRang[i];
    for (let j = 0; j < n; j++) {
      const phi = -ouverture + ((j + 0.5) / n) * 2 * ouverture;
      sieges.push({ r, i, phi });
    }
  });
  sieges.sort((u, v) => u.phi - v.phi);
  // Gradins (secteurs d'anneau extrudés), moquette
  rayons.forEach((r, i) => {
    const forme = new THREE.Shape();
    const ri = r - pasR / 2, re = r + pasR / 2;
    h0.add(new THREE.Mesh(gradin(ri, re, ouverture + 0.04, 0.35 * (i + 1)), tapis));
  });
  // Fauteuils colorés et pupitres
  const fauteuils = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.85, 0.55), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), total);
  const pupitres = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 0.75, 0.32), bois, total);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), e = new THREE.Vector3(1, 1, 1), axe = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  let k = 0;
  const secteurs = [];
  for (const g of groupes) {
    const debut = k;
    for (let n = 0; n < g.sieges; n++, k++) {
      const s = sieges[k];
      const y = 0.35 * (s.i + 1);
      q.setFromAxisAngle(axe, -s.phi);
      fauteuils.setMatrixAt(k, m.compose(v.set(Math.sin(s.phi) * (s.r + 0.12), y + 0.42, -Math.cos(s.phi) * (s.r + 0.12)), q, e));
      pupitres.setMatrixAt(k, m.compose(v.set(Math.sin(s.phi) * (s.r - 0.32), y + 0.37, -Math.cos(s.phi) * (s.r - 0.32)), q, e));
      fauteuils.setColorAt(k, col.set(g.couleur));
    }
    const milieu = sieges[Math.floor((debut + k - 1) / 2)] ?? sieges[debut];
    secteurs.push({ g, phi: milieu?.phi ?? 0 });
  }
  h0.add(fauteuils, pupitres);
  // Sol de l'hémicycle, tribune des orateurs, perchoir, banc du Gouvernement
  const parquet = new THREE.Mesh(new THREE.CircleGeometry(r0 - 0.4, 48), new THREE.MeshStandardMaterial({ color: 0xa7774b, roughness: 0.6 }));
  parquet.rotation.x = -Math.PI / 2;
  parquet.position.y = 0.01;
  h0.add(parquet);
  h0.add(pieces(THREE, marbre, [[0, 0.65, 2.6, 2.4, 1.3, 1.2], [0, 1.6, 4.4, 7, 3.2, 1.6], [0, 2.4, 5.6, 12, 4.8, 1.2]]));
  h0.add(pieces(THREE, or, [[0, 1.32, 2.0, 2.5, 0.08, 0.05], [0, 3.22, 3.6, 7.1, 0.1, 0.05]]));
  h0.add(pieces(THREE, new THREE.MeshStandardMaterial({ color: 0x5b1f24, roughness: 0.8 }), [[0, 3.6, 4.6, 0.9, 1.0, 0.8]]));
  const banc = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.85, 0.55), new THREE.MeshStandardMaterial({ color: 0x24344a, roughness: 0.6 }), 12);
  for (let i = 0; i < 12; i++) {
    const phi = -0.55 + (i / 11) * 1.1, r = r0 - 1.7;
    q.setFromAxisAngle(axe, -phi);
    banc.setMatrixAt(i, m.compose(v.set(Math.sin(phi) * r, 0.42, -Math.cos(phi) * r), q, e));
  }
  h0.add(banc);
  // Mur du fond derrière le perchoir (tapisserie), colonnade et tribunes du public
  const tapisserie = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.2), new THREE.MeshStandardMaterial({ color: senat ? 0x6b5a3a : 0x7a6a4a, roughness: 0.9 }));
  tapisserie.position.set(0, 5.6, 6.25);
  tapisserie.rotation.y = Math.PI;
  const mur = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 0.6), marbre);
  mur.position.set(0, 4, 6.6);
  h0.add(mur, tapisserie, pieces(THREE, or, [[0, 7.8, 6.2, 13.4, 0.25, 0.1], [0, 3.4, 6.2, 13.4, 0.25, 0.1], [-6.6, 5.6, 6.2, 0.25, 4.6, 0.1], [6.6, 5.6, 6.2, 0.25, 4.6, 0.1]]));
  const rExt = rayons[rangs - 1] + 1.4;
  const colonnes = [];
  for (let i = 0; i <= 16; i++) {
    const phi = -ouverture - 0.05 + (i / 16) * (2 * ouverture + 0.1);
    colonnes.push([Math.sin(phi) * rExt, 0, -Math.cos(phi) * rExt]);
  }
  const hHaut = 0.35 * rangs;
  h0.add(new THREE.Mesh(gradin(rayons[rangs - 1] + pasR / 2, rExt + 0.9, ouverture + 0.1, hHaut), marbre));
  const fut = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.32, 9, 12), marbre, colonnes.length);
  colonnes.forEach(([x, , z], i) => fut.setMatrixAt(i, m.compose(v.set(x, hHaut + 4.5, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1))));
  h0.add(fut);
  const tribune = new THREE.Mesh(gradin(rExt - 0.6, rExt + 0.9, ouverture + 0.1, 0.5), marbre);
  tribune.position.y = hHaut + 9;
  h0.add(tribune);
  const sol0 = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 1 }));
  sol0.rotation.x = -Math.PI / 2;
  h0.add(sol0);

  const s = 0.5;
  h0.scale.setScalar(s);
  h0.position.set(0, SOL, 1.2);
  h0.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const groupe = new THREE.Group();
  groupe.add(h0);
  const p = (x, y, z) => new THREE.Vector3(x * s, y * s + SOL, z * s + 1.2);
  const rL = rayons[rangs - 1] + 0.6;
  groupe.userData.legendes = [
    ...secteurs.filter((x) => x.g.sieges >= Math.max(6, total * 0.012)).map((x) => ({ texte: `${x.g.nom} · ${x.g.sieges}`, point: p(Math.sin(x.phi) * rL, 0.35 * rangs + 1.6, -Math.cos(x.phi) * rL) })),
    { texte: senat ? 'Fauteuil du président du Sénat' : 'Perchoir (président de l\'Assemblée)', point: p(0, 4.4, 4.6) },
    { texte: 'Tribune des orateurs', point: p(0, 1.6, 2.4) },
    { texte: 'Banc du Gouvernement', point: p(0, 1.2, -(r0 - 1.7)) },
  ];
  groupe.userData.taille = 14;
  groupe.userData.sieges = total;
  return groupe;
}
