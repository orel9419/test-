import React, { useEffect, useRef, useState } from 'react';
import { partagerImage } from '../partage.js';

/** Fiches techniques affichées sous les modèles (sources publiques). */
const FICHES = {
  rafale: {
    titre: 'Rafale',
    lignes: ['Longueur 15,27 m · envergure 10,90 m · hauteur 5,34 m', 'Deux réacteurs Safran M88 (7,5 t de poussée chacun avec postcombustion)', 'Vitesse maximale Mach 1,8 · 14 points d\'emport · 24,5 t au décollage au maximum', 'Versions : C (monoplace, armée de l\'Air et de l\'Espace), B (biplace), M (Marine)', 'Configuration affichée : 2 MICA, 2 Meteor, 2 réservoirs de 2 000 litres'],
  },
  snle: {
    titre: 'SNLE de la classe Le Triomphant',
    lignes: ['Longueur 138 m · diamètre 12,5 m · environ 14 000 t en plongée', '16 missiles balistiques M51 · propulsion nucléaire, hydrojet silencieux', 'Deux équipages (bleu et rouge) d\'environ 110 marins qui se relaient', 'Au moins un SNLE en patrouille en permanence depuis 1972'],
  },
  snle3g: {
    titre: 'SNLE de 3e génération (L\'Invincible)',
    lignes: ['Construction lancée le 20 mars 2024 à Cherbourg (Naval Group) · premier en service vers 2035', 'Quatre sous-marins prévus, environ un tous les cinq ans · 16 missiles M51', 'Le plus grand sous-marin jamais construit en France', 'Silhouette indicative (coque lisse, gouvernes en X, antenne sonar latérale) : les plans définitifs ne sont pas publics'],
  },
  porteAvions: {
    titre: 'Porte-avions « France Libre »',
    lignes: ['310 m · 78 000 t · 2 réacteurs nucléaires de 220 MW · 27 nœuds (50 km/h)', 'Environ 2 000 marins · mise en service prévue en 2038 · durée de vie estimée : 45 ans', 'Groupe aérien : jusqu\'à 30 avions de combat, 2 avions de guet aérien, 6 hélicoptères, des drones', '9e porte-avions français · construit à Saint-Nazaire (Chantiers de l\'Atlantique, avec Naval Group) · source : Marine nationale'],
  },
  charlesDeGaulle: {
    titre: 'Porte-avions « Charles-de-Gaulle »',
    lignes: ['261,5 m de long · 64,4 m de large · mis en service en mai 2001 · port d\'attache : base navale de Toulon', '2 réacteurs nucléaires et 2 groupes turbo-réducteurs : 61 MW (83 000 ch) · 27 nœuds (50 km/h)', 'Équipage : 1 900 marins · 40 aéronefs, dont 24 Rafale Marine · 2 catapultes de 75 m', '8e porte-avions français · seul bâtiment de combat de surface à propulsion nucléaire en Europe · source : Marine nationale'],
  },
  leclerc: {
    titre: 'Char Leclerc rénové (XLR)',
    lignes: ['Char de combat de l\'armée de Terre, en service depuis 1992 · 9,87 m canon compris · 3,71 m de large · environ 57 t', 'Canon de 120 mm à chargement automatique : trois hommes d\'équipage au lieu de quatre · 72 km/h sur route', 'Rénovation XLR : intégration au combat collaboratif SCORPION, protection renforcée, tourelleau téléopéré ; 160 chars rénovés fin 2030, 200 fin 2035', 'Camouflage centre-Europe · silhouette fidèle, détails simplifiés'],
  },
};

const VUES = {
  rafale: { '3/4': [12.5, 6.5, 15], Profil: [0, 1.2, 21], Dessus: [0, 27, 0.01], Face: [-20, 1.6, 0.01] },
  snle: { '3/4': [11, 6.5, 13], Profil: [0, 1.5, 19], Dessus: [0, 21, 0.01], Face: [-18, 2, 0.01] },
  snle3g: { '3/4': [12, 6.5, 14], Profil: [0, 1.5, 20], Dessus: [0, 22, 0.01], Face: [-19, 2, 0.01] },
  porteAvions: { '3/4': [-11, 7.5, -13], Profil: [0, 2.5, -21], Dessus: [0, 24, -0.01], Face: [-20, 4, -0.01] },
  charlesDeGaulle: { '3/4': [-10, 7, -12], Profil: [0, 2.3, -19], Dessus: [0, 21, -0.01], Face: [-18, 3.5, -0.01] },
  leclerc: { '3/4': [-11, 5.5, 13], Profil: [0, 1, 18], Dessus: [0, 21, 0.01], Face: [-18, 1.5, 0.01] },
};
/** Recule la caméra sur les écrans étroits (téléphone en portrait) pour que l'appareil tienne dans le cadre. */
const recul = (aspect) => Math.max(1, 1.45 / Math.max(0.5, aspect));
const CONSTRUCTEURS = { rafale: 'construireRafale', snle: 'construireSnle', snle3g: 'construireSnle3G', porteAvions: 'construirePorteAvions', charlesDeGaulle: 'construireCharlesDeGaulle', leclerc: 'construireLeclerc' };

/**
 * Visionneuse 3D interactive (three.js, chargé à la demande) : rotation au
 * doigt ou à la souris, vues prédéfinies, légendes, photo à partager ; options
 * propres à chaque modèle (biplace et train du Rafale, trappes et tir d'essai
 * des SNLE, catapultage depuis le porte-avions).
 */
export default function Visionneuse3D({ modele = 'rafale', hauteur = 360 }) {
  const conteneur = useRef(null);
  const legendesRef = useRef(null);
  const api = useRef({});
  const [etat, setEtat] = useState('chargement'); // 'chargement' | 'pret' | 'indisponible'
  const [noms, setNoms] = useState([]);
  const [rotation, setRotation] = useState(true);
  const [legendes, setLegendes] = useState(false);
  const [trappes, setTrappes] = useState(false);
  const [biplace, setBiplace] = useState(false);
  const [train, setTrain] = useState(false);
  const [tourelle, setTourelle] = useState(false);
  const [message, setMessage] = useState(null);
  const sous = modele === 'snle' || modele === 'snle3g';
  const navire = modele === 'porteAvions' || modele === 'charlesDeGaulle';

  useEffect(() => {
    let annule = false;
    let nettoyer = () => {};
    (async () => {
      try {
        const c = document.createElement('canvas');
        if (!(c.getContext('webgl2') || c.getContext('webgl'))) throw new Error('WebGL');
      } catch { setEtat('indisponible'); return; }
      const [THREE, { OrbitControls }, { RoomEnvironment }, modeles] = await Promise.all([
        import('three'),
        import('three/examples/jsm/controls/OrbitControls.js'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
        import('./modeles.js'),
      ]);
      if (annule || !conteneur.current) return;
      const el = conteneur.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 600);
      if (sous) scene.fog = new THREE.Fog(0x0d2a48, 18, 60);
      if (navire) scene.fog = new THREE.Fog(0xc9dcec, 120, 420);

      scene.add(new THREE.HemisphereLight(sous ? 0x9fc6ff : 0xeaf2ff, sous ? 0x0a1a2c : 0x6b6f75, sous ? 1.0 : 0.75));
      const soleil = new THREE.DirectionalLight(0xffffff, sous ? 1.5 : 2.2);
      soleil.position.set(6, 14, 8);
      soleil.castShadow = true;
      soleil.shadow.mapSize.set(2048, 2048);
      const borne = navire ? 14 : 12;
      Object.assign(soleil.shadow.camera, { left: -borne, right: borne, top: borne, bottom: -borne, near: 1, far: 60 });
      scene.add(soleil);
      const contre = new THREE.DirectionalLight(0xbfd4ff, 0.6);
      contre.position.set(-8, 4, -10);
      scene.add(contre);

      const objet = modeles[CONSTRUCTEURS[modele]](THREE);
      scene.add(objet);
      if (!navire) {
        // Ombre portée douce sous l'appareil (sol invisible)
        const sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: sous ? 0.25 : 0.18 }));
        sol.rotation.x = -Math.PI / 2;
        sol.position.y = sous ? -1.6 : -2.2;
        sol.receiveShadow = true;
        scene.add(sol);
      }

      const controles = new OrbitControls(camera, renderer.domElement);
      controles.enableDamping = true;
      controles.enablePan = false;
      controles.minDistance = 6;
      controles.maxDistance = 60;
      controles.autoRotate = true;
      controles.autoRotateSpeed = 0.9;
      if (navire) controles.maxPolarAngle = Math.PI / 2 - 0.06; // ne pas passer sous la mer
      controles.target.set(0, sous ? 0.3 : 0.2, 0);
      const placer = (nom) => {
        const k = recul(camera.aspect);
        const [x, y, z] = VUES[modele][nom];
        camera.position.set(x * k, y * k, z * k);
        controles.update();
      };
      const taille = () => {
        const l = el.clientWidth || 600;
        renderer.setSize(l, hauteur);
        camera.aspect = l / hauteur;
        camera.updateProjectionMatrix();
      };
      taille();
      placer('3/4');
      const ro = new ResizeObserver(taille);
      ro.observe(el);

      // Animations : trappes et missile (SNLE), catapultage (porte-avions), légendes
      const trappesObj = objet.userData.trappes ?? [];
      const missile = objet.userData.missile;
      const cat = objet.userData.catapulte;
      let tir = null;
      let lancement = null;
      const v = new THREE.Vector3();
      let boucle = 0;
      let visible = true;
      const io = new IntersectionObserver(([x]) => { visible = x.isIntersecting; }, { threshold: 0.05 });
      io.observe(el);
      const animer = (t) => {
        boucle = requestAnimationFrame(animer);
        if (!visible) return;
        const cible = api.current.trappes ? 1.75 : 0;
        for (const tr of trappesObj) {
          tr.userData.angle += (cible - tr.userData.angle) * 0.08;
          tr.rotation.x = tr.userData.cote * tr.userData.angle;
        }
        if (missile) {
          if (api.current.tir && !tir) { tir = t; missile.visible = true; api.current.tir = false; }
          if (tir) {
            const d = (t - tir) / 1000;
            missile.position.y = objet.userData.dessusDos - 1.2 + d * d * 1.6;
            if (d > 4.5) { tir = null; missile.visible = false; missile.position.y = objet.userData.dessusDos - 1.2; }
          }
        }
        if (cat) {
          // Catapulte électromagnétique : environ 3,8 g pendant 2,2 s, puis montée
          if (api.current.lancer && !lancement) { lancement = t; api.current.lancer = false; }
          if (lancement) {
            const d = (t - lancement) / 1000;
            const a = 37, tc = 2.2;
            const av = cat.avion;
            if (d < tc) { av.position.x = cat.x0 - 0.5 * a * d * d; av.position.y = cat.y0; av.rotation.z = 0; }
            else {
              const u = d - tc;
              av.position.x = cat.x0 - 0.5 * a * tc * tc - a * tc * u;
              av.position.y = cat.y0 + 6 * u * u + 4 * u;
              av.rotation.z = -Math.min(0.25, u * 0.2);
            }
            if (d > 6) { lancement = null; av.position.set(cat.x0, cat.y0, av.position.z); av.rotation.z = 0; }
          }
        }
        objet.userData.animer?.(t, api.current);
        controles.update();
        renderer.render(scene, camera);
        const conteneurLegendes = legendesRef.current;
        if (conteneurLegendes) {
          const l = el.clientWidth;
          [...conteneurLegendes.children].forEach((n, i) => {
            const p = objet.userData.legendes[i];
            if (!p) return;
            v.copy(p.point).applyMatrix4(objet.matrixWorld).project(camera);
            const montrer = api.current.legendes && v.z < 1;
            n.style.display = montrer ? 'block' : 'none';
            n.style.transform = `translate(${(v.x * 0.5 + 0.5) * l}px, ${(-v.y * 0.5 + 0.5) * hauteur}px)`;
          });
        }
      };
      boucle = requestAnimationFrame(animer);

      api.current = {
        ...api.current,
        legendes: false,
        rotation: (on) => { controles.autoRotate = on; },
        vue: placer,
        basculer: objet.userData.basculer ?? {},
        photo: () => renderer.domElement.toDataURL('image/png'),
      };
      setNoms(objet.userData.legendes.map((l) => l.texte));
      setEtat('pret');

      nettoyer = () => {
        cancelAnimationFrame(boucle);
        ro.disconnect();
        io.disconnect();
        controles.dispose();
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
        });
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setEtat('indisponible'));
    return () => { annule = true; nettoyer(); };
  }, [modele, hauteur, sous, navire]);

  const fiche = FICHES[modele];
  const photo = async () => {
    const url = api.current.photo?.();
    if (!url) return;
    setMessage(await partagerImage(url, `${modele}-chef-de-gouvernement.png`, `${fiche.titre} en 3D, dans le jeu « Chef de gouvernement »`));
  };
  return (
    <figure className={`visionneuse visionneuse-${modele}`}>
      <div className="visionneuse-scene" ref={conteneur} style={{ height: hauteur }}>
        {etat === 'chargement' && <div className="visionneuse-attente">Chargement du modèle 3D…</div>}
        {etat === 'indisponible' && <div className="visionneuse-attente">La 3D n'est pas disponible sur cet appareil (WebGL désactivé).</div>}
        <div className="visionneuse-legendes" ref={legendesRef} aria-hidden="true">
          {noms.map((t) => <span key={t} className="legende-3d">{t}</span>)}
        </div>
      </div>
      {etat === 'pret' && (
        <div className="visionneuse-commandes">
          {Object.keys(VUES[modele]).map((n) => <button key={n} type="button" className="puce" onClick={() => api.current.vue?.(n)}>{n}</button>)}
          <button type="button" className={`puce ${rotation ? 'active' : ''}`} aria-pressed={rotation} onClick={() => { api.current.rotation?.(!rotation); setRotation(!rotation); }}>⟳ Rotation</button>
          <button type="button" className={`puce ${legendes ? 'active' : ''}`} aria-pressed={legendes} onClick={() => { api.current.legendes = !legendes; setLegendes(!legendes); }}>Légendes</button>
          {modele === 'rafale' && <button type="button" className={`puce ${biplace ? 'active' : ''}`} aria-pressed={biplace} onClick={() => { api.current.basculer.biplace?.(!biplace); setBiplace(!biplace); }}>{biplace ? 'Biplace (B)' : 'Monoplace (C)'}</button>}
          {modele === 'rafale' && <button type="button" className={`puce ${train ? 'active' : ''}`} aria-pressed={train} onClick={() => { api.current.basculer.train?.(!train); setTrain(!train); }}>{train ? 'Train sorti' : 'Sortir le train'}</button>}
          {sous && <button type="button" className={`puce ${trappes ? 'active' : ''}`} aria-pressed={trappes} onClick={() => { api.current.trappes = !trappes; setTrappes(!trappes); }}>{trappes ? 'Fermer les trappes' : 'Ouvrir les trappes'}</button>}
          {sous && <button type="button" className="puce" disabled={!trappes} onClick={() => { api.current.tir = true; }} title={trappes ? '' : 'Ouvrez d\'abord les trappes'}>🚀 Tir d'essai (simulation)</button>}
          {navire && <button type="button" className="puce" onClick={() => { api.current.lancer = true; }}>🛫 Catapulter un Rafale</button>}
          {modele === 'leclerc' && <button type="button" className={`puce ${tourelle ? 'active' : ''}`} aria-pressed={tourelle} onClick={() => { api.current.tourelle = !tourelle; setTourelle(!tourelle); }}>{tourelle ? 'Tourelle en veille' : 'Faire pivoter la tourelle'}</button>}
          <button type="button" className="puce" onClick={photo}>📸 Photo</button>
        </div>
      )}
      <figcaption className="petit">
        <strong>{fiche.titre}</strong> <span className="tres-petit muet">· faites tourner le modèle au doigt ou à la souris, zoomez en pinçant</span>
        <ul className="tres-petit muet" style={{ margin: '0.2rem 0 0', paddingLeft: '1rem' }}>{fiche.lignes.map((l) => <li key={l}>{l}</li>)}</ul>
        {message && <span className="tres-petit" role="status">{message}</span>}
      </figcaption>
    </figure>
  );
}
