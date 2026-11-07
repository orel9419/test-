/**
 * Mirage 2000-5F en 3D (three.js), d'après les photos de l'armée de l'Air
 * et de l'Espace : aile delta pure, entrées d'air latérales à demi-cônes
 * (« souris ») et petits plans fixes au-dessus, verrière en bulle, perche de
 * ravitaillement fixe, grande dérive, réacteur M53-P2, camouflage deux tons
 * de gris. Dimensions : 14,36 m de long, 9,13 m d'envergure, 5,20 m de haut.
 *
 * Repère : x du nez vers la queue, y vers le haut, z vers la gauche ; le
 * groupe renvoyé est centré, le nez vers -x.
 */
import { loft, surface, cocarde, missile, texturePeinte } from './modeles.js';

/** Camouflage deux tons de gris (gris bleuté clair et taches gris foncé aux bords adoucis). */
function canvasCamouflage() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#7b8899';
  ctx.fillRect(0, 0, 1024, 512);
  let g = 23;
  const h = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  ctx.filter = 'blur(10px)';
  ctx.fillStyle = '#4f5d6e';
  for (let k = 0; k < 16; k++) {
    const x = h() * 1024, y = h() * 512, r = 60 + h() * 90;
    ctx.beginPath();
    for (let a = 0; a < 10; a++) {
      const t = (a / 10) * Math.PI * 2, rr = r * (0.6 + 0.5 * h());
      ctx.lineTo(x + Math.cos(t) * rr * 1.7, y + Math.sin(t) * rr * 0.8);
    }
    ctx.fill();
  }
  ctx.filter = 'none';
  // Légère usure
  for (let k = 0; k < 900; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '30,40,50'},0.04)`; ctx.fillRect(h() * 1024, h() * 512, 2 + h() * 10, 1 + h() * 3); }
  return c;
}

/**
 * Mirage 2000-5F, relevé sur un plan trois vues coté (profil, dessous, face
 * et sections) et d'après les photos de l'armée de l'Air et de l'Espace :
 * long radôme conique, verrière en bulle, perche de ravitaillement fixe à
 * droite, entrées d'air latérales en « D » avec leurs demi-cônes (souris),
 * petits plans fixes au-dessus, aile delta pure (bord d'attaque à 58°, bord
 * de fuite droit) placée bas sur le fuselage, dérive en flèche, deux quilles
 * ventrales, tuyère du M53-P2, camouflage deux tons de gris.
 * 14,36 m de long, 9,13 m d'envergure, 5,20 m de haut. Repère : y = 0 sur
 * l'axe du fuselage arrière, sol à y = -1,9 (train sorti).
 */
export function construireMirage2000(THREE) {
  const avion = new THREE.Group();
  const toile = canvasCamouflage();
  const texF = new THREE.CanvasTexture(toile);
  texF.colorSpace = THREE.SRGBColorSpace;
  const texA = new THREE.CanvasTexture(toile);
  texA.colorSpace = THREE.SRGBColorSpace;
  texA.wrapS = texA.wrapT = THREE.RepeatWrapping;
  texA.repeat.set(0.1, 0.16);
  const camo = new THREE.MeshStandardMaterial({ map: texF, metalness: 0.25, roughness: 0.6, envMapIntensity: 0.6 });
  const camoAile = new THREE.MeshStandardMaterial({ map: texA, metalness: 0.25, roughness: 0.6, envMapIntensity: 0.6 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x737f8d, metalness: 0.25, roughness: 0.6, envMapIntensity: 0.6 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x5c6876, metalness: 0.3, roughness: 0.55 });
  const radome = new THREE.MeshStandardMaterial({ color: 0x6d7886, metalness: 0.2, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.9, roughness: 0.35 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.2, roughness: 0.85 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x3d4a52, metalness: 0.5, roughness: 0.04, transparent: true, opacity: 0.6, clearcoat: 1 });
  const materiaux = { missile: new THREE.MeshStandardMaterial({ color: 0xd9dcde, metalness: 0.2, roughness: 0.5 }), missileOgive: new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.3, roughness: 0.4 }) };

  // Fuselage relevé sur le profil du plan : nez plus bas que l'arrière, hauteur maximale au droit des entrées d'air
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 0.0, w: 0, h: 0, y: -0.41 },
    { x: 0.6, w: 0.32, hHaut: 0.16, hBas: 0.16, y: -0.4 },
    { x: 1.5, w: 0.62, hHaut: 0.31, hBas: 0.31, y: -0.35 },
    { x: 2.4, w: 0.92, hHaut: 0.5, hBas: 0.54, y: -0.27, n: 2.1 },
    { x: 3.6, w: 1.05, hHaut: 0.6, hBas: 0.6, y: -0.27, n: 2.3 },
    { x: 4.8, w: 1.1, hHaut: 0.7, hBas: 0.7, y: -0.12, n: 2.5 },
    { x: 6.5, w: 1.15, hHaut: 0.75, hBas: 0.75, y: 0, n: 2.6 },
    { x: 9.0, w: 1.15, hHaut: 0.7, hBas: 0.7, y: 0, n: 2.6 },
    { x: 11.5, w: 1.1, hHaut: 0.67, hBas: 0.67, y: 0.03, n: 2.4 },
    { x: 13.0, w: 1.05, hHaut: 0.62, hBas: 0.62, y: 0, n: 2.2 },
    { x: 14.0, w: 0.95, hHaut: 0.52, hBas: 0.52, y: 0.04, n: 2 },
  ], { segments: 56, parSegment: 8 }), camo));
  // Radôme du radar RDY, d'un gris légèrement différent
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: -0.005, w: 0, h: 0, y: -0.41 },
    { x: 0.6, w: 0.325, hHaut: 0.165, hBas: 0.165, y: -0.4 },
    { x: 1.5, w: 0.625, hHaut: 0.315, hBas: 0.315, y: -0.35 },
    { x: 1.9, w: 0.76, hHaut: 0.4, hBas: 0.41, y: -0.31 },
  ], { segments: 40, parSegment: 6, fermer: false }), radome));
  // Entrées d'air latérales en « D » (rayon d'environ 0,5 m), demi-cônes, petits plans fixes au-dessus
  for (const cote of [1, -1]) {
    avion.add(new THREE.Mesh(loft(THREE, [
      { x: 5.1, w: 0.62, hHaut: 0.5, hBas: 0.5, y: -0.2, z: cote * 0.72, n: 2.1 },
      { x: 6.5, w: 0.66, hHaut: 0.54, hBas: 0.54, y: -0.18, z: cote * 0.74, n: 2.2 },
      { x: 8.5, w: 0.5, hHaut: 0.48, hBas: 0.5, y: -0.16, z: cote * 0.66, n: 2.2 },
      { x: 10.5, w: 0.16, hHaut: 0.25, hBas: 0.26, y: -0.12, z: cote * 0.55, n: 2 },
    ], { segments: 36, parSegment: 6 }), camo));
    const bouche = new THREE.Mesh(new THREE.CircleGeometry(0.48, 28, -Math.PI / 2, Math.PI), noir);
    bouche.rotation.y = -Math.PI / 2;
    bouche.scale.set(cote, 1, 1);
    bouche.position.set(5.09, -0.2, cote * 0.74);
    const levre = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 6, 28, Math.PI), gris);
    levre.rotation.set(0, Math.PI / 2, cote > 0 ? -Math.PI / 2 : Math.PI / 2);
    levre.position.set(5.09, -0.2, cote * 0.74);
    const souris = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 20, 1, false, 0, Math.PI), grisFonce);
    souris.rotation.z = Math.PI / 2;
    souris.rotation.y = cote > 0 ? 0 : Math.PI;
    souris.position.set(4.75, -0.2, cote * 0.56);
    const plan = new THREE.Mesh(surface(THREE, [[5.4, 0.98], [6.25, 1.42], [6.7, 1.42], [6.55, 0.98]].map(([x, z]) => [x, z * cote]), 0.04, { biseau: 0.01 }), camo);
    plan.position.y = 0.22;
    avion.add(bouche, levre, souris, plan);
  }

  // Aile delta pure relevée sur la vue de dessous : bord d'attaque de (5,1 ; 0,75) à (11,2 ; 4,57), bord de fuite droit à 12,05 m
  const aileG = surface(THREE, [[5.1, 0.6], [11.2, 4.57], [12.07, 4.57], [12.05, 0.6]], 0.16);
  const elevonInt = surface(THREE, [[11.25, 0.75], [11.25, 2.55], [12.06, 2.55], [12.06, 0.75]], 0.08, { biseau: 0.015 });
  const elevonExt = surface(THREE, [[11.25, 2.65], [11.25, 4.4], [12.07, 4.4], [12.07, 2.65]], 0.08, { biseau: 0.015 });
  for (const cote of [1, -1]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(aileG, camoAile));
    const e1 = new THREE.Mesh(elevonInt, camoAile), e2 = new THREE.Mesh(elevonExt, camoAile);
    e1.position.y = e2.position.y = 0.012;
    g.add(e1, e2);
    const c = cocarde(THREE, 0.32);
    c.rotation.x = -Math.PI / 2;
    c.position.set(10.6, 0.09, 3.5);
    g.add(c);
    g.scale.z = cote;
    g.rotation.x = -cote * 0.015;
    g.position.y = -0.6;
    avion.add(g);
    // Cocarde sur le flanc arrière, quilles ventrales
    const cr = cocarde(THREE, 0.24);
    cr.position.set(12.4, 0.12, cote * 0.555);
    cr.rotation.y = cote > 0 ? 0.08 : Math.PI - 0.08;
    const quille = new THREE.Mesh(surface(THREE, [[11.9, 0], [12.9, -0.36], [13.3, -0.36], [13.3, 0]], 0.04, { plan: 'xy', biseau: 0.01 }), grisFonce);
    quille.position.set(0, -0.5, cote * 0.3);
    avion.add(cr, quille);
  }
  // Dérive relevée sur le profil : bord d'attaque de 9,5 m à 12,9 m, saumon jusqu'à 13,9 m, 2,37 m au-dessus du dos
  const derive = new THREE.Mesh(surface(THREE, [[9.5, 0.0], [12.9, 2.37], [13.9, 2.37], [13.4, 0.0]], 0.12, { plan: 'xy' }), camoAile);
  derive.position.y = 0.68;
  const gouverne = new THREE.Mesh(surface(THREE, [[13.0, 0.3], [13.55, 2.15], [13.82, 2.15], [13.38, 0.3]], 0.1, { plan: 'xy', biseau: 0.012 }), camoAile);
  gouverne.position.y = 0.68;
  const saumon = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.95, 4, 10), grisFonce);
  saumon.rotation.z = Math.PI / 2;
  saumon.position.set(13.35, 3.1, 0);
  avion.add(derive, gouverne, saumon);
  const ecriture = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, 'ARMÉE DE L\'AIR', { couleur: '#1d2733', largeur: 512, hauteur: 64 }), transparent: true, depthWrite: false });
  const code = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, '188-EF', { couleur: '#1d2733', largeur: 256, hauteur: 80 }), transparent: true, depthWrite: false });
  for (const cote of [1, -1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.2), ecriture);
    e.position.set(12.0, 1.35, cote * 0.075);
    e.rotation.set(0, cote > 0 ? 0 : Math.PI, 0);
    const k = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.26), code);
    k.position.set(3.3, -0.3, cote * 0.53);
    k.rotation.y = cote > 0 ? 0.08 : Math.PI - 0.08;
    const insigne = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshStandardMaterial({ color: 0x2b333d, roughness: 0.6 }));
    insigne.position.set(12.6, 2.0, cote * 0.075);
    insigne.rotation.y = cote > 0 ? 0 : Math.PI;
    avion.add(e, k, insigne);
  }
  // Tuyère du M53-P2 et ses volets
  const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.43, 0.7, 32, 1, true), metal);
  tuyere.rotation.z = Math.PI / 2;
  tuyere.position.set(14.2, 0.04, 0);
  const fond = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), noir);
  fond.rotation.y = Math.PI / 2;
  fond.position.set(14.0, 0.04, 0);
  avion.add(tuyere, fond);

  // Verrière en bulle (pare-brise de 2,45 m à 3,2 m, sommet à 3,8 m) et baquet, siège, casque
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 2.45, w: 0.55, hHaut: 0.0, hBas: 0.02, y: 0.25 },
    { x: 3.0, w: 0.72, hHaut: 0.38, hBas: 0.02, y: 0.27 },
    { x: 3.8, w: 0.78, hHaut: 0.68, hBas: 0.02, y: 0.28 },
    { x: 4.4, w: 0.76, hHaut: 0.58, hBas: 0.02, y: 0.3 },
    { x: 4.9, w: 0.62, hHaut: 0.32, hBas: 0.02, y: 0.36 },
    { x: 5.3, w: 0.42, hHaut: 0.06, hBas: 0.02, y: 0.42 },
  ], { segments: 36, parSegment: 6 }), verre));
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 2.7, w: 0.5, hHaut: 0.0, hBas: 0.02, y: 0.26 },
    { x: 3.2, w: 0.64, hHaut: 0.14, hBas: 0.02, y: 0.27 },
    { x: 4.8, w: 0.56, hHaut: 0.14, hBas: 0.02, y: 0.34 },
    { x: 5.2, w: 0.34, hHaut: 0.02, hBas: 0.02, y: 0.4 },
  ], { segments: 24, parSegment: 4 }), noir));
  const arceau = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.022, 8, 24, Math.PI), grisFonce);
  arceau.scale.set(1, 1.05, 1);
  arceau.position.set(3.05, 0.27, 0);
  arceau.rotation.y = Math.PI / 2;
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2f343a, roughness: 0.5 }));
  casque.position.set(3.95, 0.72, 0);
  const siege = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 }));
  siege.position.set(4.18, 0.6, 0);
  avion.add(arceau, casque, siege);
  // Perche de ravitaillement fixe, à droite devant le pare-brise (de 2,37 m à 1,53 m sur le plan)
  avion.add(tube(THREE, [2.45, 0.08, -0.32], [1.95, 0.42, -0.34], 0.05, grisFonce), tube(THREE, [1.95, 0.42, -0.34], [1.53, 0.66, -0.34], 0.04, grisFonce));
  const embout = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), metal);
  embout.position.set(1.5, 0.67, -0.34);
  avion.add(embout);
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.4, 8), metal);
  pitot.rotation.z = Math.PI / 2;
  pitot.position.set(-0.18, -0.41, 0);
  avion.add(pitot);

  // Charges : deux réservoirs de 1 700 L sous l'aile, deux MICA sur les pylônes extérieurs
  const reservoir = loft(THREE, [
    { x: 0, w: 0, h: 0 }, { x: 0.9, w: 0.58, h: 0.58 }, { x: 2.0, w: 0.86, h: 0.86 }, { x: 4.1, w: 0.86, h: 0.86 }, { x: 5.5, w: 0.4, h: 0.4 }, { x: 5.9, w: 0, h: 0 },
  ], { segments: 28, parSegment: 5 });
  for (const cote of [1, -1]) {
    const res = new THREE.Mesh(reservoir, gris);
    res.position.set(5.6, -1.2, cote * 2.35);
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.09), gris);
    pyl.position.set(8.4, -0.75, cote * 2.35);
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const ailette = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.26), grisFonce);
      ailette.position.set(10.95, -1.2 + Math.sin(a) * 0.3, cote * 2.35 + Math.cos(a) * 0.3);
      ailette.rotation.x = a;
      avion.add(ailette);
    }
    const mica = missile(THREE, 3.1, 0.16, materiaux);
    mica.position.set(9.6, -0.92, cote * 3.45);
    const pyl2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.06), gris);
    pyl2.position.set(11.0, -0.76, cote * 3.45);
    avion.add(res, pyl, mica, pyl2);
  }

  // Train d'atterrissage relevé sur le plan : roulette avant à 3,7 m, train principal à 8,4 m (voie de 3,4 m), sol à -1,9 m
  const train = new THREE.Group();
  const matJambe = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.6, roughness: 0.35 });
  const matPneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const roue = (r, l) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), matPneu); m.rotation.x = Math.PI / 2; return m; };
  train.add(tube(THREE, [3.55, -0.75, 0], [3.75, -1.65, 0], 0.06, matJambe));
  const ra1 = roue(0.22, 0.14); ra1.position.set(3.75, -1.68, 0.13);
  const ra2 = roue(0.22, 0.14); ra2.position.set(3.75, -1.68, -0.13);
  const trappeAv = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.03), gris);
  trappeAv.position.set(3.4, -0.92, 0.2);
  train.add(ra1, ra2, trappeAv);
  for (const cote of [1, -1]) {
    train.add(tube(THREE, [8.3, -0.7, cote * 1.3], [8.4, -1.55, cote * 1.62], 0.08, matJambe));
    const r = roue(0.33, 0.2); r.position.set(8.4, -1.57, cote * 1.72);
    const trappe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.03), gris);
    trappe.position.set(8.3, -0.95, cote * 1.2);
    train.add(r, trappe);
  }
  avion.add(train);

  avion.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  avion.position.set(-7.2, 0, 0);
  const groupe = new THREE.Group();
  groupe.add(avion);
  const p = (x, y, z) => new THREE.Vector3(x - 7.2, y, z);
  groupe.userData.legendes = [
    { texte: 'Entrée d\'air à demi-cône (« souris »)', point: p(5.0, 0.15, 0.95) },
    { texte: 'Perche de ravitaillement fixe', point: p(1.5, 0.8, -0.34) },
    { texte: 'Aile delta pure (flèche de 58°)', point: p(10.5, -0.45, 3.6) },
    { texte: 'Réservoirs de 1 700 L (les deux « bidons »)', point: p(8.5, -1.65, 2.35) },
    { texte: 'Missile MICA', point: p(11.2, -1.05, -3.45) },
    { texte: 'Réacteur M53-P2', point: p(14.3, 0.1, 0) },
    { texte: 'Verrière en bulle', point: p(3.8, 1.05, 0) },
  ];
  groupe.userData.commandes = [{ id: 'rentrer', libelle: 'Rentrer le train', actif: 'Sortir le train' }];
  groupe.userData.animer = (t, api) => { train.visible = !api.rentrer; };
  groupe.userData.taille = 15;
  return groupe;
}

/** Tube entre deux points (jambe de train, perche). */
function tube(THREE, a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
