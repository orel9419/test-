/**
 * Rendu réaliste des modèles 3D de la visionneuse, commun à tous les
 * matériels :
 *  - éclairage par un ciel d'extérieur : la lumière d'ambiance et les reflets
 *    viennent du ciel en haut (bleu pâle au zénith, voile clair à l'horizon)
 *    et du sol ou de la mer en bas, au lieu d'un studio neutre. Teintes
 *    choisies pour garder les vraies couleurs des livrées ;
 *  - occlusion ambiante (GTAO) : recoins, emplantures, passages de roues et
 *    dessous des ailes s'assombrissent comme en vrai ;
 *  - mer animée (houle en deux couches) qui reflète le ciel ;
 *  - sol texturé sous les véhicules terrestres ;
 *  - joints de panneaux et légère usure des surfaces, calculés dans le
 *    shader à partir des coordonnées du modèle (en mètres).
 * Tout est procédural : aucune image n'est téléchargée.
 */

/** Modules three.js du rendu avancé (chargés à la demande, avec la visionneuse). */
export async function chargerRendu() {
  const [{ EffectComposer }, { RenderPass }, { GTAOPass }, { OutputPass }] = await Promise.all([
    import('three/examples/jsm/postprocessing/EffectComposer.js'),
    import('three/examples/jsm/postprocessing/RenderPass.js'),
    import('three/examples/jsm/postprocessing/GTAOPass.js'),
    import('three/examples/jsm/postprocessing/OutputPass.js'),
  ]);
  return { EffectComposer, RenderPass, GTAOPass, OutputPass };
}

/**
 * Carte d'environnement d'un ciel de beau temps : bleu pâle au zénith, voile
 * clair à l'horizon, halo chaud du côté du soleil, sol (ou mer) en bas. Un
 * dôme dessiné par un petit shader plutôt qu'un modèle atmosphérique : les
 * teintes restent neutres, les livrées gardent leurs couleurs.
 * Couleurs en sRGB (converties en valeurs linéaires).
 * @returns {THREE.WebGLRenderTarget} à libérer avec dispose()
 */
export function environnementCiel(THREE, renderer, soleil, { zenith = 0x9db4d2, horizon = 0xe8ecf0, sol = 0x8d8879, intensite = 1 } = {}) {
  const scene = new THREE.Scene();
  const lin = (h) => new THREE.Color(h).multiplyScalar(intensite);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      zenith: { value: lin(zenith) }, horizon: { value: lin(horizon) }, sol: { value: lin(sol) },
      halo: { value: lin(0xfff0d8) }, dirSoleil: { value: soleil.clone().normalize() },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 zenith, horizon, sol, halo, dirSoleil;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = d.y > 0.0 ? mix(horizon, zenith, pow(d.y, 0.55)) : mix(horizon, sol, pow(min(1.0, -d.y * 5.0), 0.6));
        c += halo * pow(max(dot(d, dirSoleil), 0.0), 6.0) * 0.5;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  scene.add(dome);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.02, 0.1, 100);
  pmrem.dispose();
  dome.geometry.dispose();
  dome.material.dispose();
  return rt;
}

/**
 * Chaîne de rendu : scène (anticrénelage 4×, 2× sur écran haute densité), occlusion ambiante GTAO, puis
 * tons ACES et espace sRGB. Le fond reste transparent (dégradé CSS).
 */
export function creerComposition(THREE, R, renderer, scene, camera, { largeur, hauteur, rayon = 0.45 }) {
  // Écrans haute densité (téléphones) : 2 échantillons suffisent et ménagent la mémoire graphique
  const rt = new THREE.WebGLRenderTarget(largeur, hauteur, { type: THREE.HalfFloatType, samples: renderer.getPixelRatio() > 1.5 ? 2 : 4 });
  const composer = new R.EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(largeur, hauteur);
  composer.addPass(new R.RenderPass(scene, camera));
  const ao = new R.GTAOPass(scene, camera, largeur, hauteur);
  ao.updateGtaoMaterial({ radius: rayon, distanceExponent: 2, thickness: 1, distanceFallOff: 1, scale: 1.15, samples: 16 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1, rings: 2, samples: 16 });
  ao.blendIntensity = 0.92;
  composer.addPass(ao);
  composer.addPass(new R.OutputPass());
  return {
    actif: true,
    rendre: () => composer.render(),
    taille: (l, h) => composer.setSize(l, h),
    liberer: () => { ao.dispose(); composer.dispose(); },
  };
}

/** Générateur pseudo-aléatoire reproductible. */
function hasard(graine) {
  let g = graine;
  return () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
}

/**
 * Carte de normales d'une mer du vent : somme de vagues de fréquences entières
 * (la texture se répète sans couture), surtout orientées dans le sens du vent
 * (crêtes allongées), les longues vagues plus marquées que les vaguelettes.
 */
function textureVagues(THREE, graine = 5) {
  const N = 512;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(N, N);
  const h = hasard(graine);
  const vagues = [];
  for (let i = 0; i < 28; i++) {
    const k = 1.5 + i * 0.42 + h() * 0.8; // 1,5 à 13 oscillations par motif
    const dir = (h() - 0.5) * 1.9 + (i % 5 === 0 ? Math.PI / 2 : 0); // vent dominant, quelques houles croisées
    const kx = Math.round(Math.cos(dir) * k), ky = Math.round(Math.sin(dir) * k);
    if (!kx && !ky) continue;
    vagues.push({ kx, ky, a: 1 / Math.hypot(kx, ky) ** 1.6, p: h() * Math.PI * 2 });
  }
  // cos(ax + by + p) = cos(ax)·cos(by + p) − sin(ax)·sin(by + p) : tables par vague, calcul rapide
  const pentes = new Float32Array(N * N * 2);
  for (const v of vagues) {
    const cx = new Float32Array(N), sx = new Float32Array(N);
    for (let x = 0; x < N; x++) { cx[x] = Math.cos((Math.PI * 2 * v.kx * x) / N); sx[x] = Math.sin((Math.PI * 2 * v.kx * x) / N); }
    for (let y = 0; y < N; y++) {
      const cy = Math.cos((Math.PI * 2 * v.ky * y) / N + v.p) * v.a, sy = Math.sin((Math.PI * 2 * v.ky * y) / N + v.p) * v.a;
      const ligne = y * N * 2;
      for (let x = 0; x < N; x++) {
        const c2 = cx[x] * cy - sx[x] * sy;
        pentes[ligne + x * 2] += c2 * v.kx;
        pentes[ligne + x * 2 + 1] += c2 * v.ky;
      }
    }
  }
  let somme = 0;
  for (let k = 0; k < N * N * 2; k++) somme += pentes[k] * pentes[k];
  const echelle = 0.35 / Math.sqrt(somme / (N * N) || 1); // pente moyenne d'environ 0,35 avant atténuation
  for (let k = 0; k < N * N; k++) {
    const nx = -pentes[k * 2] * echelle, ny = -pentes[k * 2 + 1] * echelle;
    const l = Math.hypot(nx, ny, 1);
    img.data[k * 4] = ((nx / l) * 0.5 + 0.5) * 255;
    img.data[k * 4 + 1] = ((ny / l) * 0.5 + 0.5) * 255;
    img.data[k * 4 + 2] = ((1 / l) * 0.5 + 0.5) * 255;
    img.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Deuxième lecture de la houle, plus fine, tournée et dérivant à part : le motif ne se voit plus. */
const GLSL_HOULE = /* glsl */`
  vec3 mapN1 = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
  vec2 uvHoule = mat2( uHoule.y, uHoule.z, -uHoule.z, uHoule.y ) * vNormalMapUv * uHoule.x + uDecalHoule;
  vec3 mapN2 = texture2D( normalMap, uvHoule ).xyz * 2.0 - 1.0;
  vec3 mapN = normalize( vec3( mapN1.xy + mapN2.xy * 0.65, mapN1.z * mapN2.z ) );
  mapN.xy *= mix( 1.0, 0.35, smoothstep( 10.0, 70.0, length( vViewPosition ) ) ); // au loin, la mer paraît plus lisse
`;

/** Taille d'un motif de houle (unités de la scène ; les scènes navales sont cadrées de la même façon). */
const MOTIF_HOULE = 5.2;

/**
 * Remplace les plans de mer d'un modèle (grands plans horizontaux) par une
 * mer animée : houle en deux couches qui dérivent, reflets du ciel (indice de
 * l'eau, plus forts en incidence rasante) et reflets du soleil, transparence
 * conservée (on devine les sous-marins).
 * @param {THREE.Texture} [reflets] carte d'environnement propre à l'eau (son intensité ne dépend alors
 *   plus de celle de la scène, qui éclaire les navires)
 * @returns {object|null} { animer(t), liberer() }
 */
export function oceaniser(THREE, objet, { reflets = null, intensiteReflets = 0.75 } = {}) {
  const mers = [];
  objet.updateMatrixWorld(true);
  objet.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.geometry.parameters.width >= 1000) mers.push(o); });
  if (!mers.length) return null;
  const base = textureVagues(THREE);
  const echelle = new THREE.Vector3();
  const couches = [];
  for (const o of mers) {
    o.getWorldScale(echelle);
    const largeur = o.geometry.parameters.width * Math.abs(echelle.x);
    const n = base.clone();
    n.repeat.set(largeur / MOTIF_HOULE, largeur / MOTIF_HOULE);
    n.needsUpdate = true;
    const uniformes = { uHoule: { value: new THREE.Vector3(2.9, Math.cos(0.9), Math.sin(0.9)) }, uDecalHoule: { value: new THREE.Vector2() } };
    const ancien = o.material;
    const m = new THREE.MeshPhysicalMaterial({
      color: ancien.color.clone().multiplyScalar(0.8), roughness: 0.13, metalness: 0, ior: 1.333,
      normalMap: n, normalScale: new THREE.Vector2(0.32, 0.32),
      transparent: ancien.transparent, opacity: ancien.opacity, depthWrite: ancien.depthWrite, envMap: reflets, envMapIntensity: intensiteReflets,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniformes);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uHoule;\nuniform vec2 uDecalHoule;')
        .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;', GLSL_HOULE);
    };
    m.customProgramCacheKey = () => 'houle-v4';
    m.userData.sansDetails = true;
    o.material = m;
    o.receiveShadow = true;
    ancien.dispose();
    couches.push([n, uniformes, m]);
  }
  return {
    animer(t) {
      for (const [n, u] of couches) {
        n.offset.set(t * 0.0000105, t * 0.0000041);
        u.uDecalHoule.value.set(-t * 0.0000062, t * 0.0000118);
      }
    },
    liberer() { base.dispose(); for (const [n, , m] of couches) { n.dispose(); m.dispose(); } },
  };
}

/**
 * Texture de sol (terre, gravillons) : variations douces de teinte (bruit à
 * plusieurs échelles, sans bord net) et grain fin ; se répète sans couture.
 * @param {string[]} teintes rampe du plus sombre au plus clair
 */
export function textureSol(THREE, { teintes = ['#6f6550', '#857a62', '#9a8e74'], graine = 11, taille = 512, repetition = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(taille, taille);
  const h = hasard(graine);
  const v = new Float32Array(taille * taille);
  // Bruit de valeur sur des grilles de 4 à 64 cases, raccordé sur les bords
  for (let o = 0, cases = 4, a = 1; o < 5; o++, cases *= 2, a *= 0.55) {
    const g = Float32Array.from({ length: cases * cases }, h);
    const pas = taille / cases;
    for (let y = 0; y < taille; y++) {
      const gy = y / pas, iy = Math.floor(gy), fy = gy - iy, sy = fy * fy * (3 - 2 * fy);
      const l0 = (iy % cases) * cases, l1 = ((iy + 1) % cases) * cases;
      for (let x = 0; x < taille; x++) {
        const gx = x / pas, ix = Math.floor(gx), fx = gx - ix, sx = fx * fx * (3 - 2 * fx);
        const c0 = ix % cases, c1 = (ix + 1) % cases;
        const haut = g[l0 + c0] + (g[l0 + c1] - g[l0 + c0]) * sx, bas = g[l1 + c0] + (g[l1 + c1] - g[l1 + c0]) * sx;
        v[y * taille + x] += (haut + (bas - haut) * sy) * a;
      }
    }
  }
  let min = Infinity, max = -Infinity;
  for (const x of v) { if (x < min) min = x; if (x > max) max = x; }
  const rgb = teintes.map((t) => [1, 3, 5].map((i) => parseInt(t.slice(i, i + 2), 16)));
  for (let k = 0; k < v.length; k++) {
    const u = ((v[k] - min) / (max - min || 1)) * (rgb.length - 1);
    const i = Math.min(rgb.length - 2, Math.floor(u)), f = u - i;
    const grain = (h() - 0.5) * 16 + (h() < 0.025 ? (h() - 0.5) * 70 : 0); // grain et gravillons
    for (let j = 0; j < 3; j++) img.data[k * 4 + j] = rgb[i][j] + (rgb[i + 1][j] - rgb[i][j]) * f + grain;
    img.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetition, repetition);
  t.anisotropy = 8;
  return t;
}

/** Terre sèche et gravillons, aux tons du sable des livrées et des fonds. */
const TERRE_SECHE = ['#5f5644', '#73694f', '#877b62'];

/** Disque de terrain sous un véhicule, qui se fond dans le fond de la visionneuse sur ses bords. */
export function plateauSol(THREE, rayon, y) {
  const fondu = document.createElement('canvas');
  fondu.width = fondu.height = 256;
  const ctx = fondu.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.36, '#ffffff');
  g.addColorStop(0.6, '#9e9e9e');
  g.addColorStop(0.8, '#383838');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const alpha = new THREE.CanvasTexture(fondu);
  const m = new THREE.Mesh(new THREE.CircleGeometry(rayon, 64), new THREE.MeshStandardMaterial({ map: textureSol(THREE, { teintes: TERRE_SECHE, repetition: rayon / 4 }), alphaMap: alpha, transparent: true, roughness: 1, metalness: 0, depthWrite: false }));
  m.material.userData.sansDetails = true;
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  m.renderOrder = -1;
  return m;
}

/* Joints de panneaux et usure : calculés à partir des coordonnées du modèle (en mètres). */
const GLSL_DETAILS = /* glsl */`
varying vec3 vPosDetail;
varying vec3 vNormDetail;
uniform vec3 uDetails; // x : pas des panneaux (m, 0 : pas de joints) ; y : contraste des joints ; z : usure
float hashDetail(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float bruitDetail(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hashDetail(i), hashDetail(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hashDetail(i + vec3(0.0, 1.0, 0.0)), hashDetail(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hashDetail(i + vec3(0.0, 0.0, 1.0)), hashDetail(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hashDetail(i + vec3(0.0, 1.0, 1.0)), hashDetail(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
// Joints en quinconce (les rangées de panneaux sont décalées), invisibles de loin
float jointsDetail(vec3 p, vec3 n) {
  float pas = uDetails.x;
  vec3 q = p / pas;
  q.x += 0.5 * hashDetail(vec3(0.0, floor(q.y), floor(q.z)));
  q.z += 0.5 * hashDetail(vec3(floor(q.x), floor(q.y), 0.0) + 7.7);
  q.y += 0.5 * hashDetail(vec3(floor(q.x), 0.0, floor(q.z)) + 3.1);
  vec3 d = min(fract(q), 1.0 - fract(q)) * pas;
  vec3 w = max(fwidth(p), vec3(1e-5));
  float demi = 0.007;
  vec3 l = 1.0 - smoothstep(vec3(demi), vec3(demi) + w, d);
  vec3 a = abs(n);
  float t = max(l.x * (1.0 - smoothstep(0.6, 0.92, a.x)), max(l.y * (1.0 - smoothstep(0.6, 0.92, a.y)), l.z * (1.0 - smoothstep(0.6, 0.92, a.z))));
  float wm = max(w.x, max(w.y, w.z));
  return t * clamp(demi * 3.0 / wm, 0.0, 1.0);
}
`;
const GLSL_COULEUR = /* glsl */`
float jointDetail = 0.0;
if (uDetails.x > 0.0 && dot(vNormDetail, vNormDetail) > 0.0) jointDetail = jointsDetail(vPosDetail, normalize(vNormDetail));
float usureDetail = bruitDetail(vPosDetail * 0.45) * 0.6 + bruitDetail(vPosDetail * 2.3) * 0.4;
diffuseColor.rgb *= (1.0 - uDetails.y * jointDetail) * (1.0 + uDetails.z * (usureDetail - 0.5) * 2.0);
`;
const GLSL_RUGOSITE = /* glsl */`
roughnessFactor = clamp(roughnessFactor + uDetails.z * 1.5 * (usureDetail - 0.5) + uDetails.y * 0.6 * jointDetail, 0.04, 1.0);
`;

/**
 * Ajoute joints de panneaux et usure aux matériaux opaques d'un modèle
 * (MeshStandardMaterial et MeshPhysicalMaterial) ; les vitrages, la mer et
 * les matériaux déjà personnalisés ne sont pas touchés.
 * pas : taille des panneaux en mètres (0 : pas de joints) ; joints : contraste ;
 * usure : variation de teinte et de brillance.
 */
export function detailler(THREE, objet, { pas = 1.3, joints = 0.08, usure = 0.05 } = {}) {
  const vus = new Set();
  const neutre = THREE.Material.prototype.onBeforeCompile;
  objet.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (vus.has(m) || !m.isMeshStandardMaterial || m.transparent || m.userData?.sansDetails || m.onBeforeCompile !== neutre) continue;
      vus.add(m);
      const reglage = new THREE.Vector3(pas, joints, usure);
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uDetails = { value: reglage };
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vPosDetail;\nvarying vec3 vNormDetail;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosDetail = position;\nvNormDetail = normal;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\n${GLSL_DETAILS}`)
          .replace('#include <map_fragment>', `#include <map_fragment>\n${GLSL_COULEUR}`)
          .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${GLSL_RUGOSITE}`);
      };
      m.customProgramCacheKey = () => 'details-v1';
      m.needsUpdate = true;
    }
  });
  return vus.size;
}
