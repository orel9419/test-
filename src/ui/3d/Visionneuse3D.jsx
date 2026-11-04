import React, { useEffect, useRef, useState } from 'react';
import { partagerImage } from '../partage.js';

/** Fiches techniques affichées sous les modèles (sources publiques). */
const FICHES = {
  rafale: {
    titre: 'Rafale (monoplace C)',
    lignes: ['Longueur 15,27 m · envergure 10,90 m · hauteur 5,34 m', 'Deux réacteurs Safran M88 (7,5 t de poussée chacun avec postcombustion)', 'Vitesse maximale Mach 1,8 · 14 points d\'emport · 24,5 t au décollage au maximum', 'Configuration affichée : 2 MICA, 2 Meteor, 2 réservoirs de 2 000 litres'],
  },
  snle: {
    titre: 'SNLE de la classe Le Triomphant',
    lignes: ['Longueur 138 m · diamètre 12,5 m · environ 14 000 t en plongée', '16 missiles balistiques M51 · propulsion nucléaire, hydrojet silencieux', 'Deux équipages (bleu et rouge) d\'environ 110 marins qui se relaient', 'Au moins un SNLE en patrouille en permanence depuis 1972'],
  },
};

const VUES = {
  rafale: { '3/4': [12.5, 6.5, 15], Profil: [0, 1.2, 21], Dessus: [0, 27, 0.01], Face: [-20, 1.6, 0.01] },
  snle: { '3/4': [11, 6.5, 13], Profil: [0, 1.5, 19], Dessus: [0, 21, 0.01], Face: [-18, 2, 0.01] },
};
/** Recule la caméra sur les écrans étroits (téléphone en portrait) pour que l'appareil tienne dans le cadre. */
const recul = (aspect) => Math.max(1, 1.45 / Math.max(0.5, aspect));

/**
 * Visionneuse 3D interactive (three.js, chargé à la demande) : rotation au
 * doigt ou à la souris, vues prédéfinies, légendes, photo à partager ; pour le
 * SNLE, ouverture des trappes et tir d'essai.
 */
export default function Visionneuse3D({ modele = 'rafale', hauteur = 360 }) {
  const conteneur = useRef(null);
  const legendesRef = useRef(null);
  const api = useRef({});
  const [etat, setEtat] = useState('chargement'); // 'chargement' | 'pret' | 'indisponible'
  const [rotation, setRotation] = useState(true);
  const [legendes, setLegendes] = useState(false);
  const [trappes, setTrappes] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let annule = false;
    let nettoyer = () => {};
    (async () => {
      // WebGL disponible ?
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
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
      const sous = modele === 'snle';
      if (sous) scene.fog = new THREE.Fog(0x0d2a48, 18, 60);

      scene.add(new THREE.HemisphereLight(sous ? 0x9fc6ff : 0xeaf2ff, sous ? 0x0a1a2c : 0x6b6f75, sous ? 0.9 : 0.75));
      const soleil = new THREE.DirectionalLight(0xffffff, sous ? 1.4 : 2.2);
      soleil.position.set(6, 14, 8);
      soleil.castShadow = true;
      soleil.shadow.mapSize.set(2048, 2048);
      Object.assign(soleil.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
      scene.add(soleil);
      const contre = new THREE.DirectionalLight(0xbfd4ff, 0.6);
      contre.position.set(-8, 4, -10);
      scene.add(contre);

      const objet = sous ? modeles.construireSnle(THREE) : modeles.construireRafale(THREE);
      scene.add(objet);
      // Ombre portée douce sous l'appareil (sol invisible)
      const sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: sous ? 0.25 : 0.18 }));
      sol.rotation.x = -Math.PI / 2;
      sol.position.y = sous ? -1.6 : -2.2;
      sol.receiveShadow = true;
      scene.add(sol);

      const controles = new OrbitControls(camera, renderer.domElement);
      controles.enableDamping = true;
      controles.enablePan = false;
      controles.minDistance = 7;
      controles.maxDistance = 60;
      controles.autoRotate = true;
      controles.autoRotateSpeed = 0.9;
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

      // Animation : trappes, missile, légendes
      const trappesObj = objet.userData.trappes ?? [];
      const missile = objet.userData.missile;
      let tir = null;
      const v = new THREE.Vector3();
      let boucle = 0;
      // On ne calcule les images que lorsque la visionneuse est à l'écran (économie de batterie)
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
        controles.update();
        renderer.render(scene, camera);
        // Légendes HTML positionnées sur les points 3D
        const conteneurLegendes = legendesRef.current;
        if (conteneurLegendes) {
          const l = el.clientWidth;
          [...conteneurLegendes.children].forEach((n, i) => {
            const p = objet.userData.legendes[i];
            if (!p) return;
            v.copy(p.point).applyMatrix4(objet.matrixWorld).project(camera);
            const visible = api.current.legendes && v.z < 1;
            n.style.display = visible ? 'block' : 'none';
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
        photo: () => renderer.domElement.toDataURL('image/png'),
      };
      setEtat('pret');

      nettoyer = () => {
        cancelAnimationFrame(boucle);
        ro.disconnect();
        io.disconnect();
        controles.dispose();
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        });
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setEtat('indisponible'));
    return () => { annule = true; nettoyer(); };
  }, [modele, hauteur]);

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
          {etat === 'pret' && (FICHES[modele] ? (modele === 'snle' ? ['Kiosque', 'Barres de plongée', '16 tubes de missiles M51', 'Gouvernes', 'Hydrojet (propulsion)', 'Étrave (sonar)'] : ['Plans canard', 'Entrée d\'air', 'Perche de ravitaillement', 'Verrière', 'Missile Meteor', 'Missile MICA', 'Réservoir 2 000 L', 'Réacteurs M88', 'Dérive']) : []).map((t) => <span key={t} className="legende-3d">{t}</span>)}
        </div>
      </div>
      {etat === 'pret' && (
        <div className="visionneuse-commandes">
          {Object.keys(VUES[modele]).map((n) => <button key={n} type="button" className="puce" onClick={() => api.current.vue?.(n)}>{n}</button>)}
          <button type="button" className={`puce ${rotation ? 'active' : ''}`} aria-pressed={rotation} onClick={() => { api.current.rotation?.(!rotation); setRotation(!rotation); }}>⟳ Rotation</button>
          <button type="button" className={`puce ${legendes ? 'active' : ''}`} aria-pressed={legendes} onClick={() => { api.current.legendes = !legendes; setLegendes(!legendes); }}>Légendes</button>
          {modele === 'snle' && <button type="button" className={`puce ${trappes ? 'active' : ''}`} aria-pressed={trappes} onClick={() => { api.current.trappes = !trappes; setTrappes(!trappes); }}>{trappes ? 'Fermer les trappes' : 'Ouvrir les trappes'}</button>}
          {modele === 'snle' && <button type="button" className="puce" disabled={!trappes} onClick={() => { api.current.tir = true; }} title={trappes ? '' : 'Ouvrez d\'abord les trappes'}>🚀 Tir d'essai (simulation)</button>}
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
