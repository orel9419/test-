/**
 * Ravitailleur A330 MRTT Phénix et hélicoptères des armées (Caïman NH90,
 * Tigre, Puma, Caracal) en 3D, d'après des photos et les dimensions
 * publiées par les constructeurs.
 *
 * Repère : x du nez vers la queue (nez en x = 0), y vers le haut, z vers la
 * gauche de l'appareil (côté bâbord en z positif). Unité : le mètre, puis
 * mise à l'échelle de la scène.
 *
 * Fuselages : surfaces « loftées » dont la texture (camouflage, fenêtres,
 * inscriptions) est peinte dans un canevas : u le long de l'appareil,
 * v autour de la section, la couture étant placée sous l'appareil (0 et 1 :
 * dessous, 0,25 : flanc gauche à mi-hauteur, 0,5 : dessus, 0,75 : flanc droit).
 */
import { loft, surface, cocarde, pieces } from './modeles.js';

const TOUR = Math.PI * 2;

/** Hasard reproductible pour les motifs. */
function hasard(graine) {
  let g = graine;
  return () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
}

/**
 * Toile peinte d'un fuselage de longueur L : fond (uni ou camouflage),
 * puis fenêtres, portes et inscriptions placées en mètres (x) et en hauteur
 * relative sur la section (h de -1 en bas à 1 en haut).
 */
function toileFuselage(L, { largeur = 2048, hauteur = 512, perimetre = 7.6 } = {}) {
  const c = document.createElement('canvas');
  c.width = largeur; c.height = hauteur;
  const ctx = c.getContext('2d');
  const u = (x) => (x / L) * largeur;
  const vy = (v) => (1 - v) * hauteur; // v → ordonnée du canevas (la texture est retournée)
  const vGauche = (h) => (Math.asin(Math.max(-1, Math.min(1, h))) + Math.PI / 2) / TOUR;
  const vDroite = (h) => (Math.PI - Math.asin(Math.max(-1, Math.min(1, h))) + Math.PI / 2) / TOUR;
  /** Rectangle sur un flanc (« gauche », « droite » ou « deux »), entre les hauteurs relatives h1 < h2. */
  const rect = (x1, x2, h1, h2, couleur, cote = 'deux', rayon = 0) => {
    ctx.fillStyle = couleur;
    const dessiner = (va, vb) => {
      const y1 = vy(Math.max(va, vb)), y2 = vy(Math.min(va, vb));
      const X = u(x1), W = u(x2) - u(x1), Y = y1, H = y2 - y1;
      if (rayon > 0 && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(X, Y, W, H, Math.min(rayon, W / 2, H / 2)); ctx.fill(); } else ctx.fillRect(X, Y, W, H);
    };
    if (cote !== 'droite') dessiner(vGauche(h1), vGauche(h2));
    if (cote !== 'gauche') dessiner(vDroite(h2), vDroite(h1));
  };
  /** Bande sur le dessus, d'un flanc à l'autre (pare-brise). */
  const dessus = (x1, x2, h, couleur) => {
    ctx.fillStyle = couleur;
    ctx.fillRect(u(x1), vy(vDroite(h)), u(x2) - u(x1), vy(vGauche(h)) - vy(vDroite(h)));
  };
  /** Contour (porte) sur les deux flancs. */
  const contour = (x1, x2, h1, h2, couleur, epaisseur = 3, cote = 'deux') => {
    ctx.strokeStyle = couleur; ctx.lineWidth = epaisseur;
    const trace = (va, vb) => ctx.strokeRect(u(x1), vy(Math.max(va, vb)), u(x2) - u(x1), vy(Math.min(va, vb)) - vy(Math.max(va, vb)));
    if (cote !== 'droite') trace(vGauche(h1), vGauche(h2));
    if (cote !== 'gauche') trace(vDroite(h2), vDroite(h1));
  };
  // Les pixels ne mesurent pas la même longueur le long de l'appareil et autour de la section : on étire le texte
  const etirement = (largeur / L) / (hauteur / perimetre);
  /** Texte lisible sur les deux flancs (à droite, il est tourné d'un demi-tour) ; taille : hauteur des lettres en pixels. */
  const texte = (t, x, h, taille, couleur, police = 'bold') => {
    ctx.fillStyle = couleur;
    ctx.font = `${police} ${taille}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(u(x), vy(vGauche(h))); ctx.scale(etirement, 1); ctx.fillText(t, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(u(x), vy(vDroite(h))); ctx.rotate(Math.PI); ctx.scale(etirement, 1); ctx.fillText(t, 0, 0); ctx.restore();
  };
  /** Bande courbe sur les deux flancs : liste de points [x, hBas, hHaut], interpolée tous les 0,15 m. */
  const bande = (points, couleur) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [xa, ba, ha] = points[i], [xb, bb, hb] = points[i + 1];
      for (let x = xa; x < xb; x += 0.15) {
        const t = (x - xa) / (xb - xa);
        rect(x, Math.min(x + 0.2, xb + 0.05), ba + (bb - ba) * t, ha + (hb - ha) * t, couleur);
      }
    }
  };
  /** Cocarde peinte (rouge, blanc, bleu) sur les deux flancs, de rayon r mètres ; perimetreLocal : tour du fuselage à cet endroit. */
  const cocardePeinte = (x, h, r, perimetreLocal = perimetre, { ancre = false } = {}) => {
    const rx = r * (largeur / L), ry = r * (hauteur / perimetreLocal);
    for (const [v, sens] of [[vGauche(h), 1], [vDroite(h), -1]]) {
      for (const [k, coul] of [[1, '#c00323'], [0.62, '#ffffff'], [0.28, '#284290']]) {
        ctx.fillStyle = coul;
        ctx.beginPath(); ctx.ellipse(u(x), vy(v), rx * k, ry * k, 0, 0, TOUR); ctx.fill();
      }
      if (ancre) {
        // Ancre de marine noire sur la cocarde (aéronautique navale) ; à droite, la toile est retournée
        ctx.save(); ctx.translate(u(x), vy(v)); ctx.scale(rx, ry * sens); ctx.rotate(-0.35);
        ctx.strokeStyle = '#141414'; ctx.fillStyle = '#141414'; ctx.lineWidth = 0.09; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -0.62); ctx.lineTo(0, 0.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-0.28, -0.42); ctx.lineTo(0.28, -0.42); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -0.72, 0.1, 0, TOUR); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0.2, 0.42, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
        for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s2 * 0.3, 0.52); ctx.lineTo(s2 * 0.42, 0.42); ctx.lineTo(s2 * 0.26, 0.4); ctx.fill(); }
        ctx.restore();
      }
    }
  };
  return { c, ctx, u, vy, vGauche, vDroite, rect, dessus, contour, texte, bande, cocardePeinte, largeur, hauteur };
}

/** Camouflage en taches aux bords irréguliers (couleur de fond, puis taches). */
function camoufler(ctx, W, H, fond, couleurs, { graine = 7, taille = 90, nombre = 18 } = {}) {
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, W, H);
  const h = hasard(graine);
  for (const [couleur, n] of couleurs.map((c, i) => [c, Math.round(nombre * (i ? 0.7 : 1))])) {
    ctx.fillStyle = couleur;
    for (let k = 0; k < n; k++) {
      const x = h() * W, y = h() * H, r = taille * (0.6 + h() * 0.9);
      ctx.beginPath();
      for (let a = 0; a < 14; a++) {
        const t = (a / 14) * TOUR, rr = r * (0.55 + 0.6 * h());
        ctx.lineTo(x + Math.cos(t) * rr * 1.9, y + Math.sin(t) * rr * 0.75);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** Patine (salissures, rivets) légère sur une toile. */
function patiner(ctx, W, H, graine = 3, force = 0.05) {
  const h = hasard(graine);
  for (let k = 0; k < W * H / 700; k++) { ctx.fillStyle = `rgba(${h() > 0.5 ? '255,255,255' : '20,20,20'},${force})`; ctx.fillRect(h() * W, h() * H, 2 + h() * 9, 1 + h() * 3); }
}

function textureDe(THREE, canvas, repetition = null) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repetition) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repetition); }
  return t;
}

/** Rotor : moyeu, pales vrillées et disque de flou (tourne autour de son axe y). */
function rotor(THREE, { rayon, pales, corde = 0.55, mat, matMoyeu, epaisseur = 0.07, moyeu = 0.4, flou = 0.08, bout: couleurBout = 0xd9c25a, longueurBout = 0.25 }) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(moyeu * 0.8, moyeu, moyeu * 0.9, 16), matMoyeu);
  g.add(m);
  for (let i = 0; i < pales; i++) {
    const bras = new THREE.Group();
    bras.rotation.y = (i * TOUR) / pales;
    const p = new THREE.Mesh(new THREE.BoxGeometry(rayon - moyeu, epaisseur, corde), mat);
    p.position.x = moyeu + (rayon - moyeu) / 2;
    p.rotation.x = 0.08;
    const bout = new THREE.Mesh(new THREE.BoxGeometry(longueurBout, epaisseur * 1.05, corde * 1.02), new THREE.MeshStandardMaterial({ color: couleurBout, roughness: 0.6 }));
    bout.position.x = rayon - longueurBout / 2;
    bras.add(p, bout);
    g.add(bras);
  }
  if (flou) {
    const disque = new THREE.Mesh(new THREE.CircleGeometry(rayon, 48), new THREE.MeshBasicMaterial({ color: 0x2a2c2e, transparent: true, opacity: flou, side: THREE.DoubleSide, depthWrite: false }));
    disque.rotation.x = -Math.PI / 2;
    g.add(disque);
  }
  return g;
}

/** Roue simple (axe z). */
function roue(THREE, r, l, matPneu, matJante) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), matPneu);
  p.rotation.x = Math.PI / 2;
  const j = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, l + 0.02, 16), matJante);
  j.rotation.x = Math.PI / 2;
  g.add(p, j);
  return g;
}

/** Tube entre deux points (jambe de train, perche, câble). */
function tube(THREE, a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/** Soldat stylisé (tenue camouflée, casque), debout, bras levés vers la corde. */
function soldat(THREE, matTenue, matCasque, assis = false) {
  const g = new THREE.Group();
  const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 4, 8), matTenue);
  buste.position.y = assis ? 0.45 : 1.15;
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc8a07e, roughness: 0.8 }));
  tete.position.y = assis ? 0.92 : 1.62;
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, TOUR, 0, Math.PI / 2), matCasque);
  casque.position.y = tete.position.y + 0.02;
  g.add(buste, tete, casque);
  if (assis) {
    for (const z of [-0.1, 0.1]) {
      const cuisse = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 6), matTenue);
      cuisse.rotation.x = Math.PI / 2;
      cuisse.position.set(0, 0.18, z);
      g.add(cuisse);
    }
  } else {
    for (const z of [-0.1, 0.1]) {
      const jambe = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.55, 4, 6), matTenue);
      jambe.position.set(0, 0.42, z);
      const bras = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 4, 6), matTenue);
      bras.position.set(0, 1.62, z * 0.6);
      g.add(jambe, bras);
    }
  }
  return g;
}

/** Centre l'appareil, le met à l'échelle, active les ombres ; renvoie le groupe et la fonction de légende. */
function installer(THREE, objet, k, xMilieu, y0 = 0) {
  objet.scale.setScalar(k);
  objet.position.set(-xMilieu * k, y0, 0);
  objet.traverse((o) => { if (o.isMesh) { o.castShadow = !o.material?.transparent; o.receiveShadow = true; } });
  const groupe = new THREE.Group();
  groupe.add(objet);
  const p = (x, y, z) => new THREE.Vector3((x - xMilieu) * k, y * k + y0, z * k);
  return { groupe, p };
}

// ---------------------------------------------------------------------------
// A330 MRTT Phénix
// ---------------------------------------------------------------------------

/**
 * Airbus A330 MRTT « Phénix » de l'armée de l'Air et de l'Espace, d'après des
 * photos et un schéma de livrée (DRAW Decal) : gris moyen, bande gris foncé
 * en deux parties (avant sous les hublots, double filet arrière jusqu'à la
 * cocarde), « ARMEE DE L'AIR » au-dessus des hublots, portes cerclées de
 * jaune, feux de formation, barres de guidage et bande d'alignement sous le
 * ventre, dérive à trait sombre, badge et numéro, bords d'attaque en métal
 * nu, réacteurs Rolls-Royce Trent 772, winglets, nacelles de ravitaillement
 * à liseré, perche rigide à gouvernes noires sous la queue. 58,80 m de long, 60,30 m d'envergure, 17,40 m de haut (Airbus).
 * Commandes : perche, tuyaux et paniers, train d'atterrissage.
 */
export function construirePhenix(THREE) {
  const L = 58.8;
  const a = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: 0xbfc2c6, metalness: 0.3, roughness: 0.45, envMapIntensity: 0.8 });
  const grisMoyen = new THREE.MeshStandardMaterial({ color: 0xa9adb3, metalness: 0.35, roughness: 0.45 });
  const sombre = new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.3, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8c9096, metalness: 0.85, roughness: 0.3 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.8 });

  // Toile du fuselage, relevée sur un schéma de livrée (DRAW Decal, « France Armée de l'Air MRTTs ») :
  // tout en gris moyen, bande gris foncé en deux parties, hublots, portes cerclées de jaune, inscriptions
  const T = toileFuselage(L, { largeur: 4096, hauteur: 1024, perimetre: 17.7 });
  T.ctx.fillStyle = '#c3c6ca';
  T.ctx.fillRect(0, 0, T.largeur, T.hauteur);
  patiner(T.ctx, T.largeur, T.hauteur, 5, 0.02);
  // Bande avant : fine sous le poste, elle s'épaissit et monte jusque sous les hublots, puis s'effile au-dessus de l'aile
  T.bande([[6.0, -0.5, -0.42], [9.5, -0.37, -0.28], [12.6, -0.3, -0.11], [15.8, -0.18, 0.05], [18.9, -0.05, 0.18], [22.0, 0.03, 0.22], [26.5, 0.05, 0.22], [28.6, 0.08, 0.2], [30.6, 0.17, 0.2]], '#43464b');
  // Bande arrière : double filet (fin au-dessus, plus épais au-dessous) qui plonge derrière l'aile puis remonte vers la cocarde
  T.bande([[33.8, -0.3, -0.24], [37.5, -0.44, -0.35], [41.0, -0.38, -0.29], [44.0, -0.25, -0.16], [46.5, -0.1, -0.01], [48.5, 0.05, 0.14], [51.0, 0.2, 0.29], [53.5, 0.32, 0.38]], '#43464b');
  T.bande([[34.2, -0.2, -0.17], [37.5, -0.24, -0.21], [41.0, -0.19, -0.16], [44.0, -0.05, -0.02], [46.5, 0.1, 0.13], [47.6, 0.18, 0.21]], '#8a8e94');
  // Hublots (pas de 0,53 m) interrompus par les portes ; portes cerclées de jaune (sortie d'aile plus petite)
  const portes = [[5.2, 1.1, -0.42, 0.42], [15.0, 1.1, -0.42, 0.42], [31.2, 0.75, -0.12, 0.42], [45.8, 1.1, -0.42, 0.42]];
  for (let x = 7.0; x < 45.0; x += 0.53) {
    if (portes.some(([p, l]) => x > p - 0.5 && x < p + l + 0.35)) continue;
    T.rect(x, x + 0.25, 0.22, 0.34, '#2f353d', 'deux', 5);
  }
  for (const [p, l, b, h] of portes) T.contour(p, p + l, b, h, '#d8b329', 5);
  // Poste de pilotage : pare-brise et fenêtres latérales
  T.rect(1.6, 2.3, 0.24, 0.42, '#1d232b', 'deux', 8);
  T.rect(2.4, 3.3, 0.24, 0.4, '#1d232b', 'deux', 8);
  T.dessus(1.1, 1.62, 0.4, '#1d232b');
  // Feux de formation (barres sombres cerclées de jaune) à l'avant et à l'arrière
  for (const [x0, n] of [[7.9, 3], [41.9, 3]]) {
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 0.95;
      T.rect(x, x + 0.8, -0.04, 0.06, '#d8b329');
      T.rect(x + 0.05, x + 0.75, -0.02, 0.04, '#2b2d30');
    }
  }
  // Barres lumineuses de guidage sous l'avant du fuselage, et bande d'alignement (noir, jaune, noir) sur l'axe du ventre
  T.rect(8.6, 15.7, -0.97, -0.9, '#1c1d20');
  T.rect(11.5, 51.0, -1, -0.992, '#1c1d20');
  T.rect(11.5, 51.0, -0.992, -0.986, '#d8b329');
  T.rect(11.5, 51.0, -0.986, -0.978, '#1c1d20');
  // Barre de guidage noire sur le cône arrière
  T.rect(56.4, 57.3, -0.3, 0.3, '#1c1d20');
  // Inscriptions (d'après le schéma) : « ARMEE DE L'AIR » au-dessus des hublots, numéro et unité sur le nez, immatriculation
  T.texte('ARMEE DE L\'AIR', 23.5, 0.52, 66, '#686c72');
  T.texte('041', 4.05, -0.2, 30, '#3a3f46');
  T.texte('31 EARTS', 4.05, -0.42, 14, '#3a3f46');
  // Cocarde peinte sur l'arrière du fuselage, immatriculation dessous
  T.cocardePeinte(48.6, 0.42, 0.62, 13.5);
  T.texte('F-UJCG', 48.6, 0.08, 16, '#3a3f46');
  const peau = new THREE.MeshStandardMaterial({ map: textureDe(THREE, T.c), metalness: 0.3, roughness: 0.45, envMapIntensity: 0.8 });
  a.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0, h: 0, y: -0.75 },
    { x: 0.35, w: 1.25, hHaut: 0.62, hBas: 0.7, y: -0.78 },
    { x: 1.1, w: 2.6, hHaut: 1.35, hBas: 1.45, y: -0.62 },
    { x: 2.4, w: 4.0, hHaut: 2.2, hBas: 2.2, y: -0.32 },
    { x: 4.2, w: 5.1, hHaut: 2.7, hBas: 2.6, y: -0.1 },
    { x: 7.0, w: 5.64, hHaut: 2.82, hBas: 2.82, y: 0 },
    { x: 41.5, w: 5.64, hHaut: 2.82, hBas: 2.82, y: 0 },
    { x: 46.5, w: 5.0, hHaut: 2.62, hBas: 2.2, y: 0.38 },
    { x: 51.5, w: 3.3, hHaut: 1.95, hBas: 1.25, y: 1.15 },
    { x: 56.3, w: 1.4, hHaut: 0.9, hBas: 0.55, y: 1.9 },
    { x: 58.8, w: 0.35, hHaut: 0.3, hBas: 0.3, y: 2.1 },
  ], { segments: 64, parSegment: 8, debut: -Math.PI / 2 }), peau));
  // Carénage d'emplanture sous le fuselage
  a.add(new THREE.Mesh(loft(THREE, [
    { x: 16.5, w: 4.6, hHaut: 0.2, hBas: 0.2, y: -2.2 },
    { x: 20, w: 6.4, hHaut: 0.6, hBas: 0.95, y: -2.0 },
    { x: 30, w: 6.6, hHaut: 0.6, hBas: 1.0, y: -2.0 },
    { x: 35.5, w: 4.0, hHaut: 0.2, hBas: 0.3, y: -2.1 },
  ], { segments: 40, parSegment: 6 }), gris));

  // Ailes en flèche (30°), léger dièdre, winglets ; volets et cocardes
  const aile = surface(THREE, [[19.8, 2.6], [35.6, 30.0], [37.7, 30.0], [31.4, 9.6], [31.0, 2.6]], 0.42);
  const volet = surface(THREE, [[30.2, 3.0], [31.0, 9.4], [32.6, 9.4], [32.0, 3.0]], 0.2, { biseau: 0.02 });
  const nacelles = [];
  const paniers = [];
  for (const cote of [1, -1]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(aile, gris));
    g.add(tube(THREE, [19.8, 0, 2.6], [35.6, 0, 30.0], 0.2, metal));
    const v = new THREE.Mesh(volet, grisMoyen);
    v.position.y = -0.05;
    g.add(v);
    // Winglet
    const w = new THREE.Mesh(surface(THREE, [[35.4, 0], [37.4, 2.7], [38.3, 2.7], [37.9, 0]], 0.18, { plan: 'xy', biseau: 0.03 }), gris);
    w.position.z = 30.0;
    g.add(w);
    // Cocarde d'extrados vers le bout de l'aile
    const c = cocarde(THREE, 0.75);
    c.rotation.x = -Math.PI / 2;
    c.position.set(34.2, 0.24, 25.5);
    g.add(c);
    // Réacteur Trent 772 sur son mât
    const mat = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.0, 0.55), gris);
    mat.position.set(23.6, -0.6, 9.6);
    const nacelle = new THREE.Mesh(loft(THREE, [
      { x: 17.4, w: 2.95, h: 2.95, y: -2.3, z: 9.6 },
      { x: 18.4, w: 3.2, h: 3.2, y: -2.3, z: 9.6 },
      { x: 21.5, w: 3.05, h: 3.0, y: -2.3, z: 9.6 },
      { x: 23.8, w: 2.2, h: 2.2, y: -2.15, z: 9.6 },
      { x: 25.0, w: 1.4, h: 1.4, y: -2.1, z: 9.6 },
    ], { segments: 36, parSegment: 6, fermer: false }), gris);
    const entree = new THREE.Mesh(new THREE.CircleGeometry(1.42, 32), noir);
    entree.rotation.y = -Math.PI / 2;
    entree.position.set(17.5, -2.3, 9.6);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 20), metal);
    cone.rotation.z = Math.PI / 2;
    cone.position.set(17.9, -2.3, 9.6);
    const tuyere = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 20), metal);
    tuyere.rotation.z = -Math.PI / 2;
    tuyere.position.set(25.6, -2.1, 9.6);
    g.add(mat, nacelle, entree, cone, tuyere);
    // Nacelle de ravitaillement (tuyau et panier) sous l'aile extérieure
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 3.4, 6, 14), gris);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(31.0, -1.15, 22.5);
    const pyl = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.2), gris);
    pyl.position.set(31.2, -0.55, 22.5);
    const helice = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 3), sombre);
    helice.rotation.z = Math.PI / 2;
    helice.position.set(28.6, -1.15, 22.5);
    g.add(pod, pyl, helice);
    // Liseré noir et blanc sous la nacelle (repère pour l'avion ravitaillé)
    g.add(pieces(THREE, noir, [[31.0, -1.58, 22.5, 2.6, 0.04, 0.16]]), pieces(THREE, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), [[31.0, -1.575, 22.33, 2.6, 0.04, 0.1], [31.0, -1.575, 22.67, 2.6, 0.04, 0.1]]));
    const tuyau = new THREE.Group();
    tuyau.position.set(33.0, -1.15, 22.5);
    const flexible = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), sombre);
    flexible.rotation.z = Math.PI / 2;
    const panier = new THREE.Group();
    const corolle = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: 0.7, side: THREE.DoubleSide }));
    corolle.rotation.z = Math.PI / 2;
    panier.add(corolle);
    tuyau.add(flexible, panier);
    tuyau.visible = false;
    g.add(tuyau);
    paniers.push({ tuyau, flexible, panier });
    g.scale.z = cote;
    g.rotation.x = cote * 0.06;
    g.position.y = -2.05;
    a.add(g);
    nacelles.push(g);
  }
  // Empennage horizontal (bord d'attaque en métal nu)
  for (const cote of [1, -1]) {
    const gS = new THREE.Group();
    gS.add(new THREE.Mesh(surface(THREE, [[49.6, 1.2], [54.7, 9.7], [56.5, 9.7], [55.4, 1.2]], 0.25), gris));
    gS.add(tube(THREE, [49.6, 0, 1.2], [54.7, 0, 9.7], 0.13, metal));
    gS.scale.z = cote;
    gS.position.y = 1.1;
    gS.rotation.x = cote * 0.1;
    a.add(gS);
  }
  // Dérive relevée sur le schéma : bord d'attaque de 44,6 m (pied) à 57 m (sommet), saumon jusqu'à 59,3 m, 9,4 m au-dessus du dos ; filet dorsal
  const piedDerive = 2.6;
  const derive = new THREE.Mesh(surface(THREE, [[44.6, 0.4], [57.0, 9.8], [59.3, 9.8], [56.6, 0.4]], 0.38, { plan: 'xy' }), gris);
  derive.position.y = piedDerive;
  const filet = new THREE.Mesh(surface(THREE, [[41.2, 0.3], [47.0, 2.25], [47.6, 0.3]], 0.3, { plan: 'xy', biseau: 0.05 }), gris);
  filet.position.y = piedDerive;
  a.add(derive, filet, tube(THREE, [44.6, piedDerive + 0.4, 0], [57.0, piedDerive + 9.8, 0], 0.2, metal));
  // Marques de la dérive : trait sombre le long du bord d'attaque, feu de formation, badge d'escadron, numéro
  const barre = (x1, y1, x2, y2, larg, mat, z) => {
    const L2 = Math.hypot(x2 - x1, y2 - y1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(L2, larg, 0.02), mat);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
    m.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    return m;
  };
  const jauneMat = new THREE.MeshStandardMaterial({ color: 0xd8b329, roughness: 0.5 });
  const traitMat = new THREE.MeshStandardMaterial({ color: 0x46494e, roughness: 0.6 });
  const numero = new THREE.MeshBasicMaterial({ map: textureNumero(THREE, '041'), transparent: true, depthWrite: false });
  const badge = new THREE.MeshBasicMaterial({ map: textureBadge(THREE), transparent: true });
  for (const cote of [1, -1]) {
    const z = cote * 0.25;
    a.add(barre(50.4, 3.85, 54.3, 6.3, 0.22, traitMat, z), barre(50.4, 3.85, 52.4, 3.85, 0.22, traitMat, z));
    a.add(barre(55.3, 6.8, 56.1, 8.2, 0.34, jauneMat, z), barre(55.3, 6.8, 56.1, 8.2, 0.22, sombre, z + cote * 0.005));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), badge);
    b.position.set(57.4, 10.6, z + cote * 0.005);
    b.rotation.y = cote > 0 ? 0 : Math.PI;
    const n = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.5), numero);
    n.position.set(57.6, 11.6, z + cote * 0.005);
    n.rotation.y = cote > 0 ? 0 : Math.PI;
    a.add(b, n);
  }
  // Carénage de la perche sous la queue
  const carenagePerche = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 2.6, 6, 12), gris);
  carenagePerche.rotation.z = Math.PI / 2;
  carenagePerche.position.set(50.2, -0.75, 0);
  a.add(carenagePerche);
  // Perche de ravitaillement rigide (A3R) sous la queue : articulée, télescopique, avec ses gouvernes en V
  const perche = new THREE.Group();
  perche.position.set(50.5, -0.9, 0);
  const fourreau = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 8.5, 14), gris);
  fourreau.rotation.z = Math.PI / 2;
  fourreau.position.x = 4.25;
  const tele = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 6, 10), metal);
  tele.rotation.z = Math.PI / 2;
  tele.position.x = 6;
  // Embout au bout du télescope (dans le repère du tube, tourné : son extrémité arrière est en y négatif)
  const embout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.5, 10), sombre);
  embout.position.set(0, -3.1, 0);
  tele.add(embout);
  for (const s of [-1, 1]) {
    const gv = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 1.5), noir);
    gv.position.set(7.0, 0.25, s * 0.7);
    gv.rotation.x = s * 0.6;
    perche.add(gv);
  }
  perche.add(fourreau, tele);
  a.add(perche);
  // Train d'atterrissage (rentré en vol) : diabolo avant, deux boggies de quatre roues
  const train = new THREE.Group();
  const pneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 });
  const jambe = new THREE.MeshStandardMaterial({ color: 0xd6d8db, metalness: 0.6, roughness: 0.35 });
  train.add(tube(THREE, [5.2, -2.6, 0], [5.4, -4.6, 0], 0.13, jambe));
  for (const z of [-0.3, 0.3]) { const r = roue(THREE, 0.55, 0.32, pneu, jambe); r.position.set(5.4, -4.9, z); train.add(r); }
  for (const s of [-1, 1]) {
    train.add(tube(THREE, [29.0, -2.4, s * 5.3], [29.0, -4.7, s * 5.4], 0.2, jambe));
    for (const dx of [-0.75, 0.75]) for (const dz of [-0.45, 0.45]) { const r = roue(THREE, 0.62, 0.4, pneu, jambe); r.position.set(29.0 + dx, -5.0, s * 5.4 + dz); train.add(r); }
  }
  train.visible = false;
  a.add(train);

  const k = 0.26;
  const { groupe, p } = installer(THREE, a, k, 29.4, 0.6);
  groupe.userData.legendes = [
    { texte: 'Réacteurs Rolls-Royce Trent 772', point: p(17.6, -4.3, 9.6) },
    { texte: 'Nacelle de ravitaillement (tuyau et panier)', point: p(29.5, -3.2, -22.5) },
    { texte: 'Perche rigide (A3R)', point: p(56, -2.5, 0) },
    { texte: 'Winglet', point: p(37.5, 0.8, 30) },
    { texte: '110 t de carburant dans les ailes', point: p(28, -1.6, -14) },
    { texte: 'Poste de pilotage (2 pilotes)', point: p(2.6, 1.6, 0) },
  ];
  groupe.userData.commandes = [
    { id: 'perche', libelle: 'Déployer la perche', actif: 'Rentrer la perche' },
    { id: 'paniers', libelle: 'Dérouler les tuyaux', actif: 'Enrouler les tuyaux' },
    { id: 'train', libelle: 'Sortir le train', actif: 'Rentrer le train' },
  ];
  let fp = 0, fh = 0;
  groupe.userData.animer = (t, api) => {
    fp += ((api.perche ? 1 : 0) - fp) * 0.04;
    perche.rotation.z = 0.05 - fp * 0.55;
    tele.position.x = 6 + fp * 5.5;
    fh += ((api.paniers ? 1 : 0) - fh) * 0.03;
    for (const { tuyau, flexible, panier } of paniers) {
      tuyau.visible = fh > 0.02;
      const longueur = 0.5 + fh * 14;
      flexible.scale.y = longueur;
      flexible.position.x = longueur / 2;
      panier.position.set(longueur + 0.4, -fh * 1.2, 0);
      flexible.rotation.z = Math.PI / 2 + fh * 0.08;
    }
    train.visible = !!api.train;
  };
  groupe.userData.taille = 16;
  return groupe;
}

/** Numéro peint (gris foncé) pour la dérive. */
function textureNumero(THREE, texte) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a3f46'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texte, 64, 26);
  return textureDe(THREE, c);
}

/** Badge d'escadron (carré orange, motif) pour la dérive du Phénix. */
function textureBadge(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e0701c'; ctx.fillRect(4, 4, 56, 56);
  ctx.strokeStyle = '#f6d24a'; ctx.lineWidth = 4; ctx.strokeRect(10, 10, 44, 44);
  ctx.fillStyle = '#7a2a10'; ctx.beginPath(); ctx.arc(32, 32, 10, 0, TOUR); ctx.fill();
  return textureDe(THREE, c);
}

// ---------------------------------------------------------------------------
// Hélicoptères
// ---------------------------------------------------------------------------

/** Matériaux communs aux hélicoptères. */
function materiauxHelico(THREE) {
  return {
    sombre: new THREE.MeshStandardMaterial({ color: 0x222427, roughness: 0.7, metalness: 0.3 }),
    pale: new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.6, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x7d8288, metalness: 0.85, roughness: 0.35 }),
    verre: new THREE.MeshPhysicalMaterial({ color: 0x24313b, metalness: 0.4, roughness: 0.05, transparent: true, opacity: 0.75, clearcoat: 1 }),
    pneu: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.9 }),
    jambe: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 }),
    optique: new THREE.MeshStandardMaterial({ color: 0x0f1a24, metalness: 0.8, roughness: 0.1 }),
  };
}

/** Rotor de queue (axe le long de z), du côté donné (1 : bâbord, -1 : tribord). */
function rotorQueue(THREE, mats, { x, y, cote, rayon, pales, matPale = mats.pale, bout = 0xd9c25a, longueurBout = 0.25 }) {
  const support = new THREE.Group();
  support.position.set(x, y, cote * 0.35);
  support.rotation.x = Math.PI / 2;
  const r = rotor(THREE, { rayon, pales, corde: 0.22, mat: matPale, matMoyeu: mats.sombre, epaisseur: 0.05, moyeu: 0.18, flou: 0.1, bout, longueurBout });
  support.add(r);
  return { support, r };
}

/**
 * NH90 Caïman (TTH) de l'armée de Terre : camouflage centre-Europe, ou
 * forces spéciales (Caïman standard 2 du 4e RHFS : livrée sombre, boule
 * optronique Euroflir 410, mitrailleuses de sabord). 16,13 m de long
 * (fuselage), rotor de 16,30 m, environ 5,3 m de haut.
 * Commandes : descente en corde lisse, livrée.
 */
export function construireCaiman(THREE, { modele = 'caiman' } = {}) {
  const fs = modele === 'caimanFS';
  const marine = modele === 'caimanMarine';
  const L = 16.13;
  const h = new THREE.Group();
  const mats = materiauxHelico(THREE);
  // Toiles : camouflage centre-Europe (vert, brun, noir), livrée sombre des forces spéciales, ou gris deux tons de la Marine
  const peindre = (livree) => {
    const T = toileFuselage(L, { largeur: 2048, hauteur: 512, perimetre: 7.6 });
    if (livree === 'fs') { T.ctx.fillStyle = '#3d4441'; T.ctx.fillRect(0, 0, T.largeur, T.hauteur); patiner(T.ctx, T.largeur, T.hauteur, 9, 0.04); }
    else if (livree === 'marine') { camoufler(T.ctx, T.largeur, T.hauteur, '#c8cacb', ['#868b8d'], { graine: 13, taille: 120, nombre: 12 }); patiner(T.ctx, T.largeur, T.hauteur, 9, 0.03); }
    else { camoufler(T.ctx, T.largeur, T.hauteur, '#5d6b45', ['#6e4c33', '#262826'], { graine: 21, taille: 70, nombre: 22 }); patiner(T.ctx, T.largeur, T.hauteur, 9, 0.03); }
    // Pare-brise, fenêtres du poste et de plancher (sous le pare-brise), fenêtres de la cabine, portes coulissantes
    T.dessus(0.85, 2.1, 0.15, '#1c242c');
    T.rect(1.0, 2.6, -0.1, 0.62, '#1c242c', 'deux', 8);
    T.rect(0.75, 1.35, -0.72, -0.22, '#1c242c', 'deux', 14);
    T.rect(2.75, 3.4, -0.1, 0.55, '#1c242c', 'deux', 6);
    for (const x of [6.3, 7.3]) T.rect(x, x + 0.5, 0.05, 0.45, '#1c242c', 'deux', 8);
    T.contour(3.7, 5.9, -0.92, 0.75, 'rgba(15,15,15,0.55)', 3);
    T.rect(4.5, 5.1, 0.1, 0.5, '#1c242c', 'deux', 8);
    if (livree === 'marine') {
      // Hublot d'observation à cadre boulonné (côté gauche), cocarde de l'aéronavale, « MARINE », numéro, bandeau orange
      T.rect(3.45, 4.15, -0.12, 0.58, '#15181b', 'gauche', 4);
      T.rect(3.55, 4.05, -0.02, 0.48, '#2a3440', 'gauche', 4);
      T.cocardePeinte(9.5, 0.12, 0.34, 6.4, { ancre: true });
      T.texte('MARINE', 12.6, 0.05, 20, '#2d3236');
      T.rect(14.0, 14.6, -0.35, -0.25, '#e0702c');
    } else if (livree !== 'fs') T.texte('armée de TERRE', 11.5, 0.05, 22, '#f2f2ee', 'normal');
    return textureDe(THREE, T.c);
  };
  const textures = marine ? { marine: peindre('marine') } : { terre: peindre('terre'), fs: peindre('fs') };
  const peau = new THREE.MeshStandardMaterial({ map: marine ? textures.marine : fs ? textures.fs : textures.terre, roughness: marine ? 0.6 : 0.75, metalness: 0.15, envMapIntensity: 0.6 });
  const uni = new THREE.MeshStandardMaterial({ color: marine ? 0xa9adae : fs ? 0x3d4441 : 0x5d6b45, roughness: 0.75, metalness: 0.15 });
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.3, hHaut: 0.25, hBas: 0.25, y: 1.25 },
    { x: 0.5, w: 1.45, hHaut: 0.65, hBas: 0.6, y: 1.3 },
    { x: 1.5, w: 2.3, hHaut: 1.05, hBas: 0.9, y: 1.6 },
    { x: 3.0, w: 2.65, hHaut: 1.28, hBas: 1.0, y: 1.78, n: 2.8 },
    { x: 7.6, w: 2.7, hHaut: 1.3, hBas: 1.0, y: 1.8, n: 3.2 },
    { x: 9.1, w: 2.35, hHaut: 1.2, hBas: 0.65, y: 2.0, n: 3 },
    { x: 10.6, w: 1.25, hHaut: 0.72, hBas: 0.42, y: 2.45 },
    { x: 14.4, w: 0.62, hHaut: 0.42, hBas: 0.3, y: 2.75 },
    { x: 16.1, w: 0.38, hHaut: 0.3, hBas: 0.2, y: 2.95 },
  ], { segments: 48, parSegment: 8, debut: -Math.PI / 2 }), peau));
  // Capot moteurs et transmission, prises d'air, échappements
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 2.6, w: 1.2, hHaut: 0.05, hBas: 0.05, y: 3.0 },
    { x: 3.6, w: 2.05, hHaut: 0.5, hBas: 0.1, y: 3.0, n: 3 },
    { x: 7.4, w: 2.15, hHaut: 0.55, hBas: 0.1, y: 3.0, n: 3.2 },
    { x: 9.4, w: 1.6, hHaut: 0.35, hBas: 0.1, y: 2.95, n: 3 },
    { x: 10.5, w: 0.9, hHaut: 0.05, hBas: 0.05, y: 2.9 },
  ], { segments: 32, parSegment: 6 }), uni));
  h.add(pieces(THREE, mats.sombre, [[4.2, 3.2, 1.05, 0.9, 0.35, 0.05], [4.2, 3.2, -1.05, 0.9, 0.35, 0.05], [8.9, 3.25, 0.95, 0.7, 0.3, 0.05], [8.9, 3.25, -0.95, 0.7, 0.3, 0.05]]));
  // Sponsons du train principal, radôme et coupe-câbles
  for (const s of [-1, 1]) {
    const sponson = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.6, 6, 12), uni);
    sponson.rotation.z = Math.PI / 2;
    sponson.position.set(7.9, 1.05, s * 1.42);
    sponson.scale.set(1, 1, 0.8);
    h.add(sponson);
  }
  h.add(pieces(THREE, mats.sombre, [[1.2, 2.75, 0, 0.6, 0.05, 0.08], [0.9, 0.82, 0, 0.6, 0.05, 0.08]]));
  h.add(tube(THREE, [0.35, 1.55, 0.45], [-0.25, 1.75, 0.5], 0.025, mats.metal), tube(THREE, [-0.25, 1.75, 0.5], [-0.42, 1.62, 0.5], 0.02, mats.metal));
  // Dérive, plan horizontal (tribord), rotor de queue (bâbord)
  const derive = new THREE.Mesh(surface(THREE, [[14.0, 0], [15.2, 2.1], [16.0, 2.1], [16.2, 0]], 0.2, { plan: 'xy' }), peau);
  derive.position.y = 2.7;
  const stab = new THREE.Mesh(surface(THREE, [[14.6, -0.15], [14.9, -1.55], [15.5, -1.55], [15.5, -0.15]], 0.1), uni);
  stab.position.y = 3.6;
  h.add(derive, stab);
  const rq = rotorQueue(THREE, mats, marine
    ? { x: 15.65, y: 4.35, cote: 1, rayon: 1.6, pales: 4, matPale: new THREE.MeshStandardMaterial({ color: 0xc9cbcc, roughness: 0.6 }), bout: 0xd2412f, longueurBout: 0.4 }
    : { x: 15.65, y: 4.35, cote: 1, rayon: 1.6, pales: 4 });
  h.add(rq.support);
  // Rotor principal : quatre pales composites
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 12), mats.sombre);
  mat.position.set(5.6, 3.95, 0);
  h.add(mat);
  const rp = rotor(THREE, { rayon: 8.15, pales: 4, corde: 0.6, mat: mats.pale, matMoyeu: mats.sombre, moyeu: 0.55 });
  rp.position.set(5.6, 4.45, 0);
  h.add(rp);
  // Train : diabolo avant, roues principales sous les sponsons
  h.add(tube(THREE, [2.3, 0.85, 0], [2.3, 0.35, 0], 0.07, mats.jambe));
  for (const z of [-0.18, 0.18]) { const r = roue(THREE, 0.3, 0.16, mats.pneu, mats.jambe); r.position.set(2.3, 0.3, z); h.add(r); }
  for (const s of [-1, 1]) {
    h.add(tube(THREE, [7.9, 0.75, s * 1.45], [7.9, 0.4, s * 1.55], 0.08, mats.jambe));
    const r = roue(THREE, 0.38, 0.22, mats.pneu, mats.jambe); r.position.set(7.9, 0.38, s * 1.6); h.add(r);
  }
  // Boule optronique sous le nez (Euroflir 410 sur le standard 2), mitrailleuses de sabord
  const boule = new THREE.Group();
  boule.position.set(marine ? 0.45 : 0.9, marine ? 0.95 : 0.62, 0);
  const rBoule = fs || marine ? 0.3 : 0.22;
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(rBoule, 18, 12), marine ? new THREE.MeshStandardMaterial({ color: 0x9a9fa1, roughness: 0.5 }) : mats.sombre);
  const fenetre = new THREE.Mesh(new THREE.CircleGeometry(rBoule * 0.47, 16), mats.optique);
  fenetre.position.x = -rBoule + 0.005;
  fenetre.rotation.y = -Math.PI / 2;
  boule.add(sphere, fenetre);
  h.add(boule);
  const armes = new THREE.Group();
  for (const s of [-1, 1]) {
    armes.add(tube(THREE, [4.3, 1.9, s * 1.42], [3.3, 1.88, s * 1.7], 0.035, mats.sombre));
    armes.add(pieces(THREE, mats.sombre, [[4.5, 1.88, s * 1.4, 0.45, 0.16, 0.14]]));
  }
  armes.visible = fs;
  h.add(armes);
  const marineEquip = new THREE.Group();
  const treuil = new THREE.Group();
  const sonar = new THREE.Group();
  let cableTreuil = null, sauveteur = null, cableSonar = null, corpsSonar = null;
  if (marine) {
    const grisRadome = new THREE.MeshStandardMaterial({ color: 0x7a7f81, roughness: 0.55, metalness: 0.1 });
    const blanc = new THREE.MeshStandardMaterial({ color: 0xdfe1e0, roughness: 0.6 });
    // Radôme du radar sous le poste de pilotage (disque plat aux bords arrondis)
    const profil = [[0, -0.22], [0.82, -0.22], [0.95, -0.12], [0.97, 0.08], [0.88, 0.2], [0, 0.22]].map(([r, y]) => new THREE.Vector2(r, y));
    const radome = new THREE.Mesh(new THREE.LatheGeometry(profil, 48), grisRadome);
    radome.position.set(3.75, 0.5, 0);
    marineEquip.add(radome, tube(THREE, [3.75, 0.7, 0], [3.75, 0.85, 0], 0.25, grisRadome));
    // Flotteurs de secours : coffres le long des flancs (au-dessus des sponsons) et à l'avant
    for (const s2 of [-1, 1]) {
      const coffre = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.6, 6, 12), blanc);
      coffre.rotation.z = Math.PI / 2;
      coffre.position.set(7.6, 1.45, s2 * 1.5);
      coffre.scale.set(1, 1, 0.75);
      const avant = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.38, 0.22), blanc);
      avant.position.set(1.75, 1.3, s2 * 1.12);
      avant.rotation.y = s2 * 0.25;
      marineEquip.add(coffre, avant);
    }
    // Treuil de sauvetage au-dessus de la porte droite, sauveteur au bout du câble
    const bras = tube(THREE, [4.6, 3.05, -1.0], [4.6, 3.05, -1.75], 0.07, mats.metal);
    const boite = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), blanc);
    boite.position.set(4.6, 3.05, -1.85);
    treuil.add(bras, boite);
    cableTreuil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 6), mats.sombre);
    sauveteur = soldat(THREE, new THREE.MeshStandardMaterial({ color: 0xe8642c, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 }));
    sauveteur.scale.setScalar(0.9);
    treuil.add(cableTreuil, sauveteur);
    // Sonar trempé FLASH, descendu par une trappe du plancher au bout de son câble
    cableSonar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), mats.sombre);
    corpsSonar = new THREE.Group();
    const cylindre = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0xe0d64a, roughness: 0.5 }));
    const nez = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, TOUR, Math.PI / 2, Math.PI / 2), mats.sombre);
    nez.position.y = -0.45;
    corpsSonar.add(cylindre, nez);
    sonar.add(cableSonar, corpsSonar);
    sonar.position.set(6.6, 0.8, 0);
    h.add(marineEquip, treuil, sonar);
  }
  // Corde lisse : quatre commandos descendent des portes latérales
  const matTenue = new THREE.MeshStandardMaterial({ color: 0x6b6a4e, roughness: 0.9 });
  const matCasque = new THREE.MeshStandardMaterial({ color: 0x4a4b3c, roughness: 0.8 });
  const cordes = new THREE.Group();
  const descente = [];
  for (const [x, s, decalage] of [[4.3, 1, 0], [5.3, 1, 0.5], [4.3, -1, 0.25], [5.3, -1, 0.75]]) {
    const corde = tube(THREE, [x, 2.85, s * 1.6], [x, -3.0, s * 1.6], 0.03, new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1 }));
    const homme = soldat(THREE, matTenue, matCasque);
    homme.position.set(x - 0.12, 0, s * 1.6);
    cordes.add(corde, homme);
    descente.push({ homme, decalage });
  }
  cordes.visible = false;
  if (!marine) h.add(cordes);

  const k = 0.85;
  const { groupe, p } = installer(THREE, h, k, 8.0, -2.2 + 0.35);
  groupe.userData.legendes = marine ? [
    { texte: 'Radar de surveillance', point: p(3.75, 0.1, 0) },
    { texte: 'Boule optronique', point: p(0.45, 0.6, 0) },
    { texte: 'Treuil de sauvetage', point: p(4.6, 3.4, -1.85) },
    { texte: 'Flotteurs de secours', point: p(7.6, 1.5, 1.75) },
    { texte: 'Sonar trempé (dans la cabine)', point: p(6.6, 0.6, 0) },
    { texte: 'Cocarde de l\'aéronavale (ancre)', point: p(9.5, 2.3, 1.2) },
    { texte: 'Rotor de queue à bouts rouges', point: p(15.65, 4.4, 0.6) },
  ] : [
    { texte: 'Rotor de 16,3 m (4 pales composites)', point: p(5.6, 4.6, -7.5) },
    { texte: 'Porte coulissante : 20 soldats', point: p(4.8, 1.9, 1.45) },
    { texte: fs ? 'Boule optronique Euroflir 410' : 'Boule optronique', point: p(0.9, 0.4, 0) },
    { texte: 'Rotor de queue', point: p(15.65, 4.4, 0.6) },
    ...(fs ? [{ texte: 'Mitrailleuses de sabord', point: p(3.4, 1.9, 1.75) }] : []),
  ];
  groupe.userData.commandes = marine ? [
    { id: 'sonar', libelle: 'Tremper le sonar', actif: 'Remonter le sonar' },
    { id: 'treuil', libelle: 'Hélitreuiller un sauveteur', actif: 'Remonter le sauveteur' },
  ] : [
    { id: 'corde', libelle: 'Descente en corde lisse', actif: 'Remonter les commandos' },
    { id: 'livree', libelle: fs ? 'Livrée armée de Terre' : 'Livrée forces spéciales', actif: fs ? 'Livrée forces spéciales' : 'Livrée armée de Terre' },
  ];
  let fSonar = 0, fTreuil = 0;
  let livreeFS = fs;
  groupe.userData.animer = (t, api) => {
    rp.rotation.y = t / 70;
    rq.r.rotation.y = t / 22;
    cordes.visible = !!api.corde;
    if (api.corde) for (const { homme, decalage } of descente) {
      const u = ((t / 3200) + decalage) % 1;
      homme.position.y = (2.0 - u * 4.8) - 0.2;
    }
    if (marine) {
      // Sonar : descend jusqu'à 6 m sous l'hélicoptère ; treuil : le sauveteur descend de 4,5 m
      fSonar += ((api.sonar ? 1 : 0) - fSonar) * 0.02;
      const ds = 0.3 + fSonar * 6;
      cableSonar.scale.y = ds; cableSonar.position.y = -ds / 2;
      corpsSonar.position.y = -ds - 0.45;
      // Rentré, le sonar reste dans la cabine (invisible)
      corpsSonar.visible = cableSonar.visible = fSonar > 0.03;
      fTreuil += ((api.treuil ? 1 : 0) - fTreuil) * 0.025;
      const dt = 0.2 + fTreuil * 4.5;
      cableTreuil.scale.y = dt; cableTreuil.position.set(4.6, 3.0 - dt / 2, -1.95);
      sauveteur.position.set(4.6, 3.0 - dt - 1.55, -1.95);
      sauveteur.visible = fTreuil > 0.05;
      cableTreuil.visible = fTreuil > 0.02;
      return;
    }
    const voulue = api.livree ? !fs : fs;
    if (voulue !== livreeFS) {
      livreeFS = voulue;
      peau.map = voulue ? textures.fs : textures.terre;
      peau.needsUpdate = true;
      uni.color.set(voulue ? 0x3d4441 : 0x5d6b45);
      armes.visible = voulue;
      sphere.scale.setScalar(voulue ? 1.35 : 1);
    }
  };
  groupe.userData.taille = 15;
  return groupe;
}

/**
 * Tigre (hélicoptère d'appui et de destruction), d'après une photo : deux
 * pilotes en tandem sous des verrières étagées, viseur de toit, tourelle de
 * canon de 30 mm sous le nez, ailerons portant paniers de roquettes et
 * missiles, deux turbines MTR390 et leurs échappements, train classique,
 * empennage à deux dérives. 14,08 m de long, rotor de 13 m, 3,83 m de haut.
 * Livrée de la photo (sable, vert, noir) ou vert olive. Commandes : tourelle,
 * livrée.
 */
export function construireTigre(THREE) {
  const L = 14.08;
  const h = new THREE.Group();
  const mats = materiauxHelico(THREE);
  const peindre = (olive) => {
    const T = toileFuselage(L, { largeur: 2048, hauteur: 512, perimetre: 7.6 });
    if (olive) { T.ctx.fillStyle = '#4b5136'; T.ctx.fillRect(0, 0, T.largeur, T.hauteur); patiner(T.ctx, T.largeur, T.hauteur, 4, 0.04); }
    else camoufler(T.ctx, T.largeur, T.hauteur, '#b9ad7f', ['#5e5d43', '#2f302b'], { graine: 33, taille: 80, nombre: 16 });
    // Nez sombre, numéro
    T.ctx.fillStyle = '#26272a';
    T.ctx.fillRect(0, 0, T.u(0.9), T.hauteur);
    T.texte('TIGRE', 7.5, 0.0, 22, '#2a2b26');
    return textureDe(THREE, T.c);
  };
  const textures = { photo: peindre(false), olive: peindre(true) };
  const peau = new THREE.MeshStandardMaterial({ map: textures.photo, roughness: 0.75, metalness: 0.15, envMapIntensity: 0.6 });
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.25, hHaut: 0.2, hBas: 0.2, y: 1.35 },
    { x: 0.5, w: 0.75, hHaut: 0.42, hBas: 0.4, y: 1.35 },
    { x: 1.5, w: 0.98, hHaut: 0.55, hBas: 0.5, y: 1.4, n: 2.6 },
    { x: 3.2, w: 1.05, hHaut: 0.72, hBas: 0.55, y: 1.55, n: 2.6 },
    { x: 5.0, w: 1.15, hHaut: 0.82, hBas: 0.58, y: 1.7, n: 2.8 },
    { x: 7.0, w: 0.9, hHaut: 0.6, hBas: 0.42, y: 1.8, n: 2.6 },
    { x: 10.0, w: 0.5, hHaut: 0.35, hBas: 0.26, y: 1.95 },
    { x: 13.4, w: 0.34, hHaut: 0.25, hBas: 0.2, y: 2.05 },
  ], { segments: 40, parSegment: 8, debut: -Math.PI / 2 }), peau));
  // Verrières étagées (tireur devant, pilote derrière, plus haut)
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 0.95, w: 0.6, hHaut: 0.0, hBas: 0.02, y: 1.8 },
    { x: 1.4, w: 0.84, hHaut: 0.4, hBas: 0.02, y: 1.82 },
    { x: 2.4, w: 0.88, hHaut: 0.5, hBas: 0.02, y: 1.86 },
    { x: 2.75, w: 0.88, hHaut: 0.62, hBas: 0.02, y: 1.95 },
    { x: 3.7, w: 0.86, hHaut: 0.66, hBas: 0.02, y: 2.05 },
    { x: 4.2, w: 0.7, hHaut: 0.3, hBas: 0.02, y: 2.15 },
  ], { segments: 32, parSegment: 6 }), mats.verre));
  h.add(pieces(THREE, mats.sombre, [[2.45, 2.35, 0, 0.08, 0.06, 0.9], [2.5, 2.1, 0.45, 0.06, 0.5, 0.05], [2.5, 2.1, -0.45, 0.06, 0.5, 0.05]]));
  // Viseur de toit, capot moteurs, deux turbines et échappements, mât et rotor
  const viseur = new THREE.Group();
  viseur.position.set(3.95, 2.75, 0);
  viseur.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.5, 12), peau));
  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), peau);
  tete.position.y = 0.4;
  const oeil = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.32), mats.optique);
  oeil.position.set(-0.28, 0.4, 0);
  viseur.add(tete, oeil);
  h.add(viseur);
  for (const s of [-1, 1]) {
    const turbine = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.9, 6, 12), peau);
    turbine.rotation.z = Math.PI / 2;
    turbine.position.set(5.6, 2.42, s * 0.48);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), mats.sombre);
    grille.position.set(4.9, 2.42, s * 0.76);
    const echappement = tube(THREE, [6.7, 2.45, s * 0.5], [7.5, 2.75, s * 0.95], 0.17, mats.sombre);
    h.add(turbine, grille, echappement);
  }
  h.add(tube(THREE, [4.75, 2.4, 0], [4.75, 3.45, 0], 0.18, mats.sombre));
  const rp = rotor(THREE, { rayon: 6.5, pales: 4, corde: 0.48, mat: mats.pale, matMoyeu: mats.sombre, moyeu: 0.42 });
  rp.position.set(4.75, 3.55, 0);
  h.add(rp);
  // Tourelle du canon de 30 mm sous le nez (orientable)
  const tourelle = new THREE.Group();
  tourelle.position.set(1.15, 0.85, 0);
  const berceau = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.42), mats.sombre);
  const canon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.9, 10), mats.sombre);
  canon.rotation.z = Math.PI / 2;
  canon.position.x = -1.05;
  const frein = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10), mats.sombre);
  frein.rotation.z = Math.PI / 2;
  frein.position.x = -2.0;
  tourelle.add(berceau, canon, frein);
  h.add(tourelle);
  const nez = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), mats.sombre);
  nez.position.set(0.25, 1.32, 0);
  const capteur = new THREE.Mesh(new THREE.CircleGeometry(0.08, 14), new THREE.MeshStandardMaterial({ color: 0x5b8de0, emissive: 0x1a2a55 }));
  capteur.position.set(0.06, 1.32, 0);
  capteur.rotation.y = -Math.PI / 2;
  h.add(nez, capteur);
  // Ailerons : panier de roquettes de 68 mm (intérieur) et missiles (extérieur)
  for (const s of [-1, 1]) {
    const aileron = new THREE.Mesh(surface(THREE, [[4.3, 0.5], [4.6, 2.15], [5.5, 2.15], [5.75, 0.5]].map(([x, z]) => [x, z * s]), 0.12, { biseau: 0.02 }), peau);
    aileron.position.y = 1.25;
    aileron.rotation.x = s * 0.12;
    h.add(aileron);
    const panier = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 1.6, 16), peau);
    panier.rotation.z = Math.PI / 2;
    panier.position.set(5.0, 0.82, s * 1.15);
    const tubes = pieces(THREE, mats.sombre, [0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * TOUR; return [4.19, 0.82 + Math.sin(a) * 0.16, s * 1.15 + Math.cos(a) * 0.16, 0.02, 0.08, 0.08]; }));
    h.add(panier, tubes, pieces(THREE, mats.sombre, [[5.0, 1.07, s * 1.15, 0.6, 0.18, 0.08], [5.05, 1.07, s * 1.85, 0.6, 0.18, 0.08]]));
    for (const [dy, dz] of [[0, -0.14], [0, 0.14], [-0.28, -0.14], [-0.28, 0.14]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0x55594a, roughness: 0.7 }));
      m.rotation.z = Math.PI / 2;
      m.position.set(4.95, 0.86 + dy, s * 1.85 + dz);
      h.add(m);
    }
  }
  // Train classique (deux roues principales, roulette de queue)
  for (const s of [-1, 1]) {
    h.add(tube(THREE, [4.1, 1.05, s * 0.5], [4.25, 0.3, s * 0.95], 0.06, mats.jambe));
    const r = roue(THREE, 0.3, 0.16, mats.pneu, mats.jambe); r.position.set(4.25, 0.3, s * 1.0); h.add(r);
  }
  h.add(tube(THREE, [11.6, 1.75, 0], [11.75, 1.2, 0], 0.04, mats.jambe));
  { const r = roue(THREE, 0.16, 0.1, mats.pneu, mats.jambe); r.position.set(11.8, 1.15, 0); h.add(r); }
  // Empennage : plan horizontal à deux dérives d'extrémité, dérive verticale, rotor de queue
  const stab = new THREE.Mesh(surface(THREE, [[12.1, -1.3], [12.5, -1.3], [12.75, 1.3], [12.35, 1.3]], 0.08), peau);
  stab.position.y = 2.05;
  h.add(stab);
  for (const s of [-1, 1]) {
    const d = new THREE.Mesh(surface(THREE, [[12.1, -0.35], [12.45, 0.45], [12.85, 0.45], [12.75, -0.35]], 0.06, { plan: 'xy' }), peau);
    d.position.set(0, 2.05, s * 1.3);
    h.add(d);
  }
  const derive = new THREE.Mesh(surface(THREE, [[12.7, 0], [13.6, 1.45], [14.1, 1.45], [14.15, 0]], 0.14, { plan: 'xy' }), peau);
  derive.position.y = 2.0;
  h.add(derive);
  const rq = rotorQueue(THREE, mats, { x: 13.75, y: 3.15, cote: 1, rayon: 1.35, pales: 3 });
  h.add(rq.support);

  const k = 1.0;
  const { groupe, p } = installer(THREE, h, k, 6.8, -2.2 + 0.0);
  groupe.userData.legendes = [
    { texte: 'Canon de 30 mm en tourelle', point: p(-0.8, 0.85, 0) },
    { texte: 'Viseur de toit', point: p(3.95, 3.3, 0) },
    { texte: 'Roquettes de 68 mm', point: p(4.2, 0.55, 1.15) },
    { texte: 'Missiles', point: p(5.0, 0.55, -1.85) },
    { texte: 'Deux pilotes en tandem', point: p(2.6, 2.6, 0.45) },
    { texte: 'Turbines MTR390', point: p(5.6, 2.8, 0.5) },
  ];
  groupe.userData.commandes = [
    { id: 'tourelle', libelle: 'Orienter le canon', actif: 'Canon dans l\'axe' },
    { id: 'olive', libelle: 'Livrée vert olive', actif: 'Livrée de la photo' },
  ];
  let angle = 0, olive = false;
  groupe.userData.animer = (t, api) => {
    rp.rotation.y = t / 60;
    rq.r.rotation.y = t / 18;
    angle += ((api.tourelle ? 0.7 * Math.sin(t / 1100) : 0) - angle) * 0.06;
    tourelle.rotation.y = angle;
    tourelle.rotation.z = api.tourelle ? 0.12 + 0.08 * Math.sin(t / 900) : 0;
    if (!!api.olive !== olive) { olive = !!api.olive; peau.map = olive ? textures.olive : textures.photo; peau.needsUpdate = true; }
  };
  groupe.userData.taille = 14;
  return groupe;
}

/**
 * SA330 Puma de l'armée de Terre, d'après une photo : camouflage vert, brun
 * et noir, « armée de TERRE » sur la poutre de queue, code « DDD », deux
 * grandes entrées d'air sur le toit, gros carénage de transmission, porte
 * coulissante vitrée, train à roues jumelées, rotor de queue à tribord.
 * Fuselage d'environ 14,1 m, rotor de 15 m (ordres de grandeur).
 */
export function construirePuma(THREE) {
  const L = 14.1;
  const h = new THREE.Group();
  const mats = materiauxHelico(THREE);
  const T = toileFuselage(L, { largeur: 2048, hauteur: 512, perimetre: 7.6 });
  camoufler(T.ctx, T.largeur, T.hauteur, '#5f7038', ['#7a4a26', '#2b2a27'], { graine: 45, taille: 85, nombre: 16 });
  patiner(T.ctx, T.largeur, T.hauteur, 6, 0.035);
  T.dessus(0.5, 1.75, 0.2, '#1b232b');
  T.rect(0.7, 1.9, -0.7, 0.6, '#1b232b', 'deux', 10);
  T.rect(2.05, 2.55, -0.1, 0.55, '#1b232b', 'deux', 6);
  for (const x of [3.6, 4.45, 5.25, 6.6]) T.rect(x, x + 0.48, 0.05, 0.45, '#1b232b', 'deux', 9);
  T.contour(3.35, 6.1, -0.95, 0.72, 'rgba(10,10,10,0.6)', 3);
  T.texte('armée de TERRE', 10.3, 0.05, 30, '#f4f4f0', 'normal');
  T.texte('DDD', 1.35, -0.62, 26, '#f4f4f0');
  const peau = new THREE.MeshStandardMaterial({ map: textureDe(THREE, T.c), roughness: 0.75, metalness: 0.15, envMapIntensity: 0.6 });
  const brun = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.75, metalness: 0.15 });
  const vert = new THREE.MeshStandardMaterial({ color: 0x5f7038, roughness: 0.75, metalness: 0.15 });
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.5, hHaut: 0.4, hBas: 0.4, y: 1.4 },
    { x: 0.5, w: 1.6, hHaut: 0.78, hBas: 0.85, y: 1.5 },
    { x: 1.5, w: 2.3, hHaut: 1.1, hBas: 1.05, y: 1.75, n: 2.4 },
    { x: 3.0, w: 2.45, hHaut: 1.22, hBas: 1.1, y: 1.85, n: 2.8 },
    { x: 6.8, w: 2.45, hHaut: 1.22, hBas: 1.05, y: 1.9, n: 2.9 },
    { x: 8.0, w: 2.0, hHaut: 1.1, hBas: 0.7, y: 2.2 },
    { x: 9.2, w: 1.1, hHaut: 0.7, hBas: 0.4, y: 2.55 },
    { x: 12.5, w: 0.6, hHaut: 0.42, hBas: 0.28, y: 2.85 },
    { x: 14.1, w: 0.35, hHaut: 0.3, hBas: 0.2, y: 3.0 },
  ], { segments: 48, parSegment: 8, debut: -Math.PI / 2 }), peau));
  // Carénage de transmission bombé (vert) et deux entrées d'air rondes à l'avant du toit (brun)
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 1.7, w: 1.0, hHaut: 0.05, hBas: 0.05, y: 3.05 },
    { x: 2.6, w: 1.9, hHaut: 0.75, hBas: 0.1, y: 3.05, n: 2.6 },
    { x: 6.0, w: 2.0, hHaut: 0.95, hBas: 0.1, y: 3.05, n: 2.6 },
    { x: 8.4, w: 1.4, hHaut: 0.45, hBas: 0.1, y: 3.0 },
    { x: 9.3, w: 0.7, hHaut: 0.05, hBas: 0.05, y: 2.95 },
  ], { segments: 32, parSegment: 6 }), vert));
  for (const s of [-1, 1]) {
    const entree = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 1.6, 20), brun);
    entree.rotation.z = Math.PI / 2;
    entree.position.set(2.35, 3.55, s * 0.42);
    const bouche = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), mats.sombre);
    bouche.rotation.y = -Math.PI / 2;
    bouche.position.set(1.54, 3.55, s * 0.42);
    const grilles = pieces(THREE, mats.sombre, [0, 1, 2, 3, 4, 5].map((i) => [2.4 + i * 0.1, 3.7, s * 0.8, 0.05, 0.22, 0.04]));
    h.add(entree, bouche, grilles);
    // Bouche ronde du refroidisseur sur le flanc du carénage
    const trou = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), mats.sombre);
    trou.position.set(5.2, 3.55, s * 0.98);
    trou.rotation.y = s > 0 ? 0 : Math.PI;
    h.add(trou);
    // Sponsons et train à roues jumelées
    const sponson = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.5, 6, 12), vert);
    sponson.rotation.z = Math.PI / 2;
    sponson.position.set(6.9, 0.95, s * 1.38);
    h.add(sponson, tube(THREE, [6.9, 0.85, s * 1.4], [6.9, 0.35, s * 1.5], 0.07, mats.jambe));
    for (const dz of [-0.16, 0.16]) { const r = roue(THREE, 0.33, 0.16, mats.pneu, mats.jambe); r.position.set(6.9, 0.33, s * 1.5 + dz); h.add(r); }
  }
  h.add(tube(THREE, [1.7, 0.8, 0], [1.7, 0.3, 0], 0.06, mats.jambe));
  for (const z of [-0.17, 0.17]) { const r = roue(THREE, 0.28, 0.14, mats.pneu, mats.jambe); r.position.set(1.7, 0.28, z); h.add(r); }
  // Dérive, plan horizontal (bâbord), quille ventrale, rotor de queue à cinq pales (tribord)
  const derive = new THREE.Mesh(surface(THREE, [[12.2, 0], [13.6, 1.9], [14.3, 1.9], [14.25, 0]], 0.16, { plan: 'xy' }), peau);
  derive.position.y = 2.85;
  const stab = new THREE.Mesh(surface(THREE, [[12.6, 0.15], [12.85, 1.35], [13.35, 1.35], [13.3, 0.15]], 0.08), vert);
  stab.position.y = 2.9;
  const quille = new THREE.Mesh(surface(THREE, [[12.6, 0], [13.4, -0.55], [13.9, -0.55], [13.9, 0]], 0.06, { plan: 'xy', biseau: 0.01 }), vert);
  quille.position.y = 2.75;
  h.add(derive, stab, quille);
  const rq = rotorQueue(THREE, mats, { x: 13.95, y: 4.15, cote: -1, rayon: 1.5, pales: 5 });
  h.add(rq.support);
  // Mât et rotor principal à quatre pales
  h.add(tube(THREE, [4.9, 3.9, 0], [4.9, 4.55, 0], 0.2, mats.sombre));
  const rp = rotor(THREE, { rayon: 7.5, pales: 4, corde: 0.6, mat: mats.pale, matMoyeu: mats.sombre, moyeu: 0.5 });
  rp.position.set(4.9, 4.6, 0);
  h.add(rp);
  // Cocardes de l'armée de Terre sur la poutre de queue
  for (const s of [-1, 1]) {
    const c = cocarde(THREE, 0.3);
    c.position.set(8.5, 2.6, s * 0.84);
    c.rotation.y = s > 0 ? 0.3 : Math.PI - 0.3;
    h.add(c);
  }

  const k = 0.9;
  const { groupe, p } = installer(THREE, h, k, 7.0, -2.2 + 0.2);
  groupe.userData.legendes = [
    { texte: 'Deux turbines Turbomeca Turmo', point: p(2.2, 4.0, 0.42) },
    { texte: 'Rotor de 15 m (4 pales)', point: p(4.9, 4.7, -7) },
    { texte: 'Porte coulissante : 16 à 20 soldats', point: p(4.8, 1.8, 1.25) },
    { texte: 'Rotor de queue (5 pales, à tribord)', point: p(13.95, 4.2, -0.6) },
    { texte: 'En service depuis les années 1970', point: p(10.5, 2.9, 0.6) },
  ];
  groupe.userData.animer = (t) => {
    rp.rotation.y = t / 65;
    rq.r.rotation.y = t / 20;
  };
  groupe.userData.taille = 14;
  return groupe;
}

/**
 * H225M Caracal, d'après une photo : livrée gris bleuté, carénage moteur
 * plus sombre, perche de ravitaillement en vol, gros sponsons, boule
 * optronique, porte ouverte avec deux tireurs assis, rotor à cinq pales,
 * rotor de queue à bâbord. Rotor de 16,20 m (Airbus).
 * Commande : porte ouverte et tireurs.
 */
export function construireCaracal(THREE) {
  const L = 16.4;
  const h = new THREE.Group();
  const mats = materiauxHelico(THREE);
  const T = toileFuselage(L, { largeur: 2048, hauteur: 512, perimetre: 7.6 });
  T.ctx.fillStyle = '#a9b1bc';
  T.ctx.fillRect(0, 0, T.largeur, T.hauteur);
  patiner(T.ctx, T.largeur, T.hauteur, 8, 0.03);
  T.dessus(0.45, 1.85, 0.2, '#1b232b');
  T.rect(0.6, 1.95, -0.65, 0.6, '#1b232b', 'deux', 10);
  T.rect(2.1, 2.6, -0.05, 0.55, '#1b232b', 'deux', 6);
  for (const x of [3.3, 6.6, 7.6, 9.0]) T.rect(x, x + 0.48, 0.0, 0.45, '#1b232b', 'deux', 10);
  T.contour(4.2, 6.2, -0.95, 0.72, 'rgba(30,30,35,0.55)', 3);
  T.texte('51', 10.0, 0.05, 30, '#6b7380');
  const peau = new THREE.MeshStandardMaterial({ map: textureDe(THREE, T.c), roughness: 0.6, metalness: 0.2, envMapIntensity: 0.7 });
  const grisClair = new THREE.MeshStandardMaterial({ color: 0xa9b1bc, roughness: 0.6, metalness: 0.2 });
  const grisFonce = new THREE.MeshStandardMaterial({ color: 0x5b6472, roughness: 0.6, metalness: 0.2 });
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 0, w: 0.45, hHaut: 0.35, hBas: 0.35, y: 1.35 },
    { x: 0.6, w: 1.55, hHaut: 0.72, hBas: 0.78, y: 1.45 },
    { x: 1.6, w: 2.2, hHaut: 1.0, hBas: 1.0, y: 1.7, n: 2.4 },
    { x: 3.0, w: 2.4, hHaut: 1.2, hBas: 1.05, y: 1.85, n: 2.7 },
    { x: 8.3, w: 2.45, hHaut: 1.2, hBas: 1.05, y: 1.9, n: 2.9 },
    { x: 9.6, w: 2.0, hHaut: 1.05, hBas: 0.65, y: 2.2 },
    { x: 10.8, w: 1.1, hHaut: 0.7, hBas: 0.4, y: 2.5 },
    { x: 14.8, w: 0.6, hHaut: 0.42, hBas: 0.3, y: 2.8 },
    { x: 16.4, w: 0.35, hHaut: 0.3, hBas: 0.2, y: 2.95 },
  ], { segments: 48, parSegment: 8, debut: -Math.PI / 2 }), peau));
  // Carénage moteurs et transmission, gris foncé, avec ses deux entrées d'air et la bouche du refroidisseur
  h.add(new THREE.Mesh(loft(THREE, [
    { x: 1.8, w: 1.0, hHaut: 0.05, hBas: 0.05, y: 3.0 },
    { x: 2.8, w: 1.95, hHaut: 0.65, hBas: 0.1, y: 3.0, n: 2.6 },
    { x: 7.2, w: 2.05, hHaut: 0.95, hBas: 0.1, y: 3.0, n: 2.6 },
    { x: 9.6, w: 1.3, hHaut: 0.4, hBas: 0.1, y: 2.95 },
    { x: 10.5, w: 0.7, hHaut: 0.05, hBas: 0.05, y: 2.9 },
  ], { segments: 32, parSegment: 6 }), grisFonce));
  for (const s of [-1, 1]) {
    const entree = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.2, 6, 14), grisClair);
    entree.rotation.z = Math.PI / 2;
    entree.position.set(2.7, 3.5, s * 0.55);
    const grille = pieces(THREE, mats.sombre, [0, 1, 2].map((i) => [2.6 + i * 0.16, 3.55, s * 0.86, 0.07, 0.2, 0.03]));
    const refroidisseur = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 24), grisClair);
    refroidisseur.rotation.x = Math.PI / 2;
    refroidisseur.position.set(6.4, 3.5, s * 1.0);
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), mats.sombre);
    fond.position.set(6.4, 3.5, s * 1.13);
    fond.rotation.y = s > 0 ? 0 : Math.PI;
    // Sponson (réservoir et logement du train)
    const sponson = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 2.2, 6, 14), grisClair);
    sponson.rotation.z = Math.PI / 2;
    sponson.position.set(7.9, 1.0, s * 1.45);
    sponson.scale.set(1, 1, 0.85);
    const feu = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: s > 0 ? 0xff2a2a : 0x2aff5a }));
    feu.position.set(7.9, 1.48, s * 1.62);
    h.add(entree, grille, refroidisseur, fond, sponson, feu);
    h.add(tube(THREE, [7.6, 0.6, s * 1.45], [7.6, 0.35, s * 1.45], 0.08, mats.jambe));
    const r = roue(THREE, 0.36, 0.2, mats.pneu, mats.jambe); r.position.set(7.6, 0.36, s * 1.45); h.add(r);
  }
  h.add(tube(THREE, [1.9, 0.75, 0], [1.9, 0.3, 0], 0.06, mats.jambe));
  for (const z of [-0.16, 0.16]) { const r = roue(THREE, 0.27, 0.14, mats.pneu, mats.jambe); r.position.set(1.9, 0.27, z); h.add(r); }
  // Perche de ravitaillement en vol (côté gauche, longue, vers l'avant), boule optronique
  h.add(tube(THREE, [3.2, 0.95, 1.05], [-2.4, 0.95, 1.05], 0.07, grisClair));
  h.add(pieces(THREE, mats.sombre, [[-2.45, 0.95, 1.05, 0.25, 0.12, 0.12]]));
  const boule = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), mats.sombre);
  boule.position.set(0.85, 0.72, -0.35);
  h.add(boule);
  // Dérive, plan horizontal (tribord) à dérive d'extrémité, rotor de queue (bâbord)
  const derive = new THREE.Mesh(surface(THREE, [[14.4, 0], [15.6, 1.95], [16.3, 1.95], [16.45, 0]], 0.16, { plan: 'xy' }), grisClair);
  derive.position.y = 2.8;
  const stab = new THREE.Mesh(surface(THREE, [[14.9, -0.15], [15.1, -1.45], [15.6, -1.45], [15.6, -0.15]], 0.08), grisClair);
  stab.position.y = 2.9;
  const bout = new THREE.Mesh(surface(THREE, [[14.95, -0.25], [15.2, 0.3], [15.6, 0.3], [15.6, -0.25]], 0.05, { plan: 'xy', biseau: 0.01 }), grisClair);
  bout.position.set(0, 2.9, -1.45);
  h.add(derive, stab, bout);
  const rq = rotorQueue(THREE, mats, { x: 16.2, y: 4.2, cote: 1, rayon: 1.55, pales: 4 });
  h.add(rq.support);
  // Rotor principal à cinq pales
  h.add(tube(THREE, [5.5, 3.9, 0], [5.5, 4.45, 0], 0.2, mats.sombre));
  const chapeau = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 8, 0, TOUR, 0, Math.PI / 2), grisClair);
  chapeau.position.set(5.5, 4.65, 0);
  chapeau.scale.y = 0.45;
  h.add(chapeau);
  const rp = rotor(THREE, { rayon: 8.1, pales: 5, corde: 0.58, mat: mats.pale, matMoyeu: mats.sombre, moyeu: 0.5 });
  rp.position.set(5.5, 4.5, 0);
  h.add(rp);
  // Porte coulissante ouverte et deux tireurs assis sur le plancher (côté gauche)
  const porte = new THREE.Group();
  const battant = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.65, 0.05), peau);
  battant.position.set(5.2, 1.85, 1.25);
  porte.add(battant);
  const ouverture = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 1.6), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 1 }));
  ouverture.position.set(5.2, 1.85, 1.255);
  const matTenue = new THREE.MeshStandardMaterial({ color: 0x6f6a4c, roughness: 0.9 });
  const matCasque = new THREE.MeshStandardMaterial({ color: 0x7b7556, roughness: 0.8 });
  const tireurs = new THREE.Group();
  for (const x of [4.75, 5.55]) {
    const t = soldat(THREE, matTenue, matCasque, true);
    t.position.set(x, 1.05, 1.15);
    t.rotation.y = Math.PI / 2;
    const fusil = tube(THREE, [x - 0.1, 1.6, 1.4], [x - 0.5, 1.45, 1.75], 0.025, mats.sombre);
    tireurs.add(t, fusil);
  }
  tireurs.add(ouverture);
  h.add(porte, tireurs);

  const k = 0.82;
  const { groupe, p } = installer(THREE, h, k, 7.5, -2.2 + 0.4);
  groupe.userData.legendes = [
    { texte: 'Perche de ravitaillement en vol', point: p(-2.4, 1.2, 1.05) },
    { texte: 'Rotor à cinq pales (16,2 m)', point: p(5.5, 4.6, -7.5) },
    { texte: 'Sponsons (carburant, train)', point: p(8.6, 0.7, 1.5) },
    { texte: 'Tireurs de sabord', point: p(5.2, 2.2, 1.6) },
    { texte: 'Boule optronique', point: p(0.85, 0.45, -0.35) },
  ];
  groupe.userData.commandes = [{ id: 'fermer', libelle: 'Fermer la porte', actif: 'Ouvrir la porte' }];
  let o = 1;
  groupe.userData.animer = (t, api) => {
    rp.rotation.y = t / 65;
    rq.r.rotation.y = t / 20;
    o += ((api.fermer ? 0 : 1) - o) * 0.06;
    battant.position.x = 5.2 + o * 2.1;
    tireurs.visible = o > 0.6;
  };
  groupe.userData.taille = 15;
  return groupe;
}
