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
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.9, roughness: 0.35 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.2, roughness: 0.85 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x3d4a52, metalness: 0.5, roughness: 0.04, transparent: true, opacity: 0.6, clearcoat: 1 });
  const materiaux = { missile: new THREE.MeshStandardMaterial({ color: 0xd9dcde, metalness: 0.2, roughness: 0.5 }), missileOgive: new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.3, roughness: 0.4 }) };

  // Fuselage : long radôme, poste de pilotage, taille de guêpe au droit de l'aile (règle des aires)
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 0.0, w: 0, h: 0, y: 0 },
    { x: 0.6, w: 0.3, hHaut: 0.15, hBas: 0.15, y: 0.0 },
    { x: 1.6, w: 0.62, hHaut: 0.31, hBas: 0.3, y: 0.02 },
    { x: 2.7, w: 0.86, hHaut: 0.43, hBas: 0.41, y: 0.04 },
    { x: 3.8, w: 0.98, hHaut: 0.5, hBas: 0.48, y: 0.06, n: 2.2 },
    { x: 5.2, w: 1.06, hHaut: 0.54, hBas: 0.52, y: 0.06, n: 2.4 },
    { x: 7.0, w: 1.3, hHaut: 0.56, hBas: 0.56, y: 0.04, n: 2.8 },
    { x: 9.5, w: 1.24, hHaut: 0.54, hBas: 0.56, y: 0.02, n: 2.8 },
    { x: 12.0, w: 1.18, hHaut: 0.52, hBas: 0.52, y: 0.0, n: 2.6 },
    { x: 13.7, w: 1.06, hHaut: 0.5, hBas: 0.48, y: -0.02, n: 2.3 },
  ], { segments: 56, parSegment: 8 }), camo));
  // Dorsale vers la dérive
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 5.3, w: 0.5, hHaut: 0.02, hBas: 0.02, y: 0.58 },
    { x: 6.5, w: 0.62, hHaut: 0.18, hBas: 0.04, y: 0.58 },
    { x: 9.5, w: 0.56, hHaut: 0.18, hBas: 0.04, y: 0.54 },
    { x: 12.8, w: 0.36, hHaut: 0.1, hBas: 0.04, y: 0.48 },
  ], { segments: 28, parSegment: 6 }), camo));
  // Entrées d'air latérales en demi-cercle, avec leur demi-cône (« souris ») et les petits plans fixes
  for (const cote of [1, -1]) {
    avion.add(new THREE.Mesh(loft(THREE, [
      { x: 5.0, w: 0.5, hHaut: 0.42, hBas: 0.42, y: -0.02, z: cote * 0.66, n: 2.1 },
      { x: 6.2, w: 0.56, hHaut: 0.44, hBas: 0.44, y: -0.03, z: cote * 0.68, n: 2.2 },
      { x: 8.2, w: 0.46, hHaut: 0.38, hBas: 0.4, y: -0.04, z: cote * 0.62, n: 2.2 },
      { x: 10.0, w: 0.2, hHaut: 0.2, hBas: 0.22, y: -0.05, z: cote * 0.56, n: 2 },
    ], { segments: 36, parSegment: 6 }), camo));
    const bouche = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28, -Math.PI / 2, Math.PI), noir);
    bouche.rotation.y = -Math.PI / 2;
    bouche.scale.set(cote, 1, 1);
    bouche.position.set(4.99, -0.02, cote * 0.66);
    const levre = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 28, Math.PI), gris);
    levre.rotation.set(0, Math.PI / 2, cote > 0 ? -Math.PI / 2 : Math.PI / 2);
    levre.position.set(4.99, -0.02, cote * 0.66);
    const souris = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 20, 1, false, 0, Math.PI), grisFonce);
    souris.rotation.z = Math.PI / 2;
    souris.rotation.y = cote > 0 ? 0 : Math.PI;
    souris.position.set(4.8, -0.02, cote * 0.5);
    const plan = new THREE.Mesh(surface(THREE, [[5.3, 0.9], [6.2, 1.3], [6.7, 1.3], [6.5, 0.9]].map(([x, z]) => [x, z * cote]), 0.04, { biseau: 0.01 }), camo);
    plan.position.y = 0.36;
    avion.add(bouche, levre, souris, plan);
  }

  // Aile delta pure (flèche de 58°), élevons ; cocardes sur l'extrados
  const aileG = surface(THREE, [[5.9, 0.62], [12.3, 4.56], [13.1, 4.56], [13.4, 0.62]], 0.14);
  const elevonG = surface(THREE, [[12.85, 0.9], [12.85, 4.4], [13.12, 4.4], [13.42, 0.9]], 0.08, { biseau: 0.015 });
  for (const cote of [1, -1]) {
    const aile = new THREE.Mesh(aileG, camoAile);
    aile.position.y = -0.3;
    aile.scale.z = cote;
    const elevon = new THREE.Mesh(elevonG, camoAile);
    elevon.position.y = -0.3;
    elevon.scale.z = cote;
    avion.add(aile, elevon);
    const c = cocarde(THREE, 0.32);
    c.rotation.x = -Math.PI / 2;
    c.position.set(11.4, -0.3 + 0.09, cote * 3.2);
    const cr = cocarde(THREE, 0.24);
    cr.position.set(12.6, 0.0, cote * 0.6);
    cr.rotation.y = cote > 0 ? 0.08 : Math.PI - 0.08;
    avion.add(c, cr);
    // Petites quilles ventrales
    const quille = new THREE.Mesh(surface(THREE, [[11.6, 0], [12.9, -0.32], [13.3, -0.32], [13.3, 0]], 0.04, { plan: 'xy', biseau: 0.01 }), grisFonce);
    quille.position.set(0, -0.4, cote * 0.32);
    avion.add(quille);
  }
  // Dérive, gouverne, saumon d'antennes ; inscriptions
  const derive = new THREE.Mesh(surface(THREE, [[9.3, 0.0], [12.55, 2.95], [13.55, 2.95], [13.95, 0.0]], 0.12, { plan: 'xy' }), camoAile);
  derive.position.y = 0.52;
  const gouverne = new THREE.Mesh(surface(THREE, [[13.3, 0.25], [13.55, 2.6], [13.68, 2.6], [13.9, 0.25]], 0.1, { plan: 'xy', biseau: 0.012 }), camoAile);
  gouverne.position.y = 0.52;
  const saumon = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.95, 4, 10), grisFonce);
  saumon.rotation.z = Math.PI / 2;
  saumon.position.set(13.05, 3.5, 0);
  avion.add(derive, gouverne, saumon);
  const ecriture = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, 'ARMÉE DE L\'AIR', { couleur: '#1d2733', largeur: 512, hauteur: 64 }), transparent: true, depthWrite: false });
  const code = new THREE.MeshBasicMaterial({ map: texturePeinte(THREE, '188-EF', { couleur: '#1d2733', largeur: 256, hauteur: 80 }), transparent: true, depthWrite: false });
  for (const cote of [1, -1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.21), ecriture);
    e.position.set(12.0, 1.35, cote * 0.075);
    e.rotation.set(0, cote > 0 ? 0 : Math.PI, 0);
    const k = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), code);
    k.position.set(3.6, 0.1, cote * 0.5);
    k.rotation.y = cote > 0 ? 0.1 : Math.PI - 0.1;
    const insigne = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshStandardMaterial({ color: 0x2b333d, roughness: 0.6 }));
    insigne.position.set(12.7, 2.05, cote * 0.075);
    insigne.rotation.y = cote > 0 ? 0 : Math.PI;
    avion.add(e, k, insigne);
  }
  // Tuyère du M53-P2
  const tuyere = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.44, 0.75, 32, 1, true), metal);
  tuyere.rotation.z = Math.PI / 2;
  tuyere.position.set(14.0, -0.02, 0);
  const fond = new THREE.Mesh(new THREE.CircleGeometry(0.43, 32), noir);
  fond.rotation.y = Math.PI / 2;
  fond.position.set(13.8, -0.02, 0);
  avion.add(tuyere, fond);

  // Verrière en bulle, arceau de pare-brise, baquet sombre, siège et casque
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 3.05, w: 0.5, hHaut: 0.0, hBas: 0.02, y: 0.5 },
    { x: 3.6, w: 0.78, hHaut: 0.38, hBas: 0.02, y: 0.52 },
    { x: 4.4, w: 0.84, hHaut: 0.56, hBas: 0.02, y: 0.54 },
    { x: 5.1, w: 0.8, hHaut: 0.5, hBas: 0.02, y: 0.56 },
    { x: 5.7, w: 0.56, hHaut: 0.2, hBas: 0.02, y: 0.58 },
    { x: 6.0, w: 0.4, hHaut: 0.04, hBas: 0.02, y: 0.58 },
  ], { segments: 36, parSegment: 6 }), verre));
  avion.add(new THREE.Mesh(loft(THREE, [
    { x: 3.3, w: 0.5, hHaut: 0.0, hBas: 0.02, y: 0.5 },
    { x: 3.8, w: 0.68, hHaut: 0.12, hBas: 0.02, y: 0.52 },
    { x: 5.4, w: 0.6, hHaut: 0.12, hBas: 0.02, y: 0.56 },
    { x: 5.8, w: 0.36, hHaut: 0.02, hBas: 0.02, y: 0.58 },
  ], { segments: 24, parSegment: 4 }), noir));
  const arceau = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.022, 8, 24, Math.PI), grisFonce);
  arceau.scale.set(1, 0.95, 1);
  arceau.position.set(3.62, 0.53, 0);
  arceau.rotation.y = Math.PI / 2;
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2f343a, roughness: 0.5 }));
  casque.position.set(4.6, 0.92, 0);
  const siege = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 }));
  siege.position.set(4.82, 0.8, 0);
  avion.add(arceau, casque, siege);
  // Perche de ravitaillement fixe, côté droit, devant le pare-brise
  const perche = new THREE.Group();
  for (const [x1, y1, x2, y2, r] of [[3.05, 0.42, 2.3, 0.85, 0.05], [2.3, 0.85, 1.35, 1.15, 0.04]]) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, L, 10), grisFonce);
    t.position.set((x1 + x2) / 2, (y1 + y2) / 2, -0.38);
    t.rotation.z = Math.atan2(x2 - x1, -(y2 - y1)) ;
    perche.add(t);
  }
  const embout = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), metal);
  embout.position.set(1.33, 1.16, -0.38);
  perche.add(embout);
  avion.add(perche);
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.4, 8), metal);
  pitot.rotation.z = Math.PI / 2;
  pitot.position.set(-0.18, 0, 0);
  avion.add(pitot);

  // Charges : deux réservoirs de 1 700 L sous l'aile, deux MICA sur les pylônes extérieurs
  const reservoir = loft(THREE, [
    { x: 0, w: 0, h: 0 }, { x: 0.8, w: 0.52, h: 0.52 }, { x: 1.9, w: 0.78, h: 0.78 }, { x: 3.9, w: 0.78, h: 0.78 }, { x: 5.2, w: 0.36, h: 0.36 }, { x: 5.6, w: 0, h: 0 },
  ], { segments: 28, parSegment: 5 });
  for (const cote of [1, -1]) {
    const res = new THREE.Mesh(reservoir, gris);
    res.position.set(6.0, -1.12, cote * 1.85);
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.08), gris);
    pyl.position.set(8.6, -0.6, cote * 1.85);
    const mica = missile(THREE, 3.1, 0.16, materiaux);
    mica.position.set(9.9, -0.66, cote * 3.15);
    const pyl2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.06), gris);
    pyl2.position.set(11.4, -0.46, cote * 3.15);
    avion.add(res, pyl, mica, pyl2);
  }

  // Train d'atterrissage : diabolo avant, deux atterrisseurs principaux à grande voie
  const train = new THREE.Group();
  const matJambe = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.6, roughness: 0.35 });
  const matPneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const roue = (r, l) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), matPneu); m.rotation.x = Math.PI / 2; return m; };
  const jambeAvant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.25, 12), matJambe);
  jambeAvant.position.set(3.4, -0.95, 0);
  const ra1 = roue(0.22, 0.14); ra1.position.set(3.45, -1.6, 0.13);
  const ra2 = roue(0.22, 0.14); ra2.position.set(3.45, -1.6, -0.13);
  const trappeAv = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.03), gris);
  trappeAv.position.set(3.5, -0.62, 0.22);
  train.add(jambeAvant, ra1, ra2, trappeAv);
  for (const cote of [1, -1]) {
    const jambe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.2, 12), matJambe);
    jambe.position.set(9.6, -0.95, cote * 1.62);
    jambe.rotation.x = cote * 0.1;
    const r = roue(0.33, 0.2); r.position.set(9.62, -1.52, cote * 1.72);
    const trappe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.03), gris);
    trappe.position.set(9.6, -0.7, cote * 1.4);
    train.add(jambe, r, trappe);
  }
  avion.add(train);

  avion.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  avion.position.set(-7.2, 0, 0);
  const groupe = new THREE.Group();
  groupe.add(avion);
  const p = (x, y, z) => new THREE.Vector3(x - 7.2, y, z);
  groupe.userData.legendes = [
    { texte: 'Entrée d\'air à demi-cône (« souris »)', point: p(5.0, 0.3, 0.9) },
    { texte: 'Perche de ravitaillement fixe', point: p(1.4, 1.2, -0.38) },
    { texte: 'Aile delta pure', point: p(11, -0.2, 3.6) },
    { texte: 'Réservoir de 1 700 L', point: p(8.5, -1.4, 1.85) },
    { texte: 'Missile MICA', point: p(11.2, -0.8, -3.15) },
    { texte: 'Réacteur M53-P2', point: p(14.2, 0.1, 0) },
    { texte: 'Camouflage deux tons de gris', point: p(9.5, 0.6, 0.6) },
  ];
  groupe.userData.commandes = [{ id: 'rentrer', libelle: 'Rentrer le train', actif: 'Sortir le train' }];
  groupe.userData.animer = (t, api) => { train.visible = !api.rentrer; };
  groupe.userData.taille = 15;
  return groupe;
}
