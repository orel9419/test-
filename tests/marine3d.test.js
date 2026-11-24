/**
 * Bâtiments de surface en 3D : frégates (missile de croisière naval, Aster, décollage du Caïman
 * Marine) et porte-hélicoptères amphibie (Caïman Marine, Tigre, mode amphibie). Construction hors
 * navigateur (textures factices), animations pas à pas.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { installerFauxDocument } from './outils/faux-document.js';

installerFauxDocument();
const { construireFremm, construireFda, construirePha } = await import('../src/ui/3d/marine.js');

const sansNaN = (g) => { let ok = true; g.updateMatrixWorld(true); g.traverse((o) => { if (o.matrixWorld.elements.some((v) => Number.isNaN(v))) ok = false; }); return ok; };
/** Joue l'animation de t0 à t1 (ms) par pas de 16 ms. */
const jouer = (g, api, t0, t1) => { for (let t = t0; t <= t1; t += 16) g.userData.animer(t, api); return t1; };
const ids = (g) => g.userData.commandes.map((c) => c.id);

describe('Frégates : tirs depuis les Sylver et Caïman Marine', () => {
  it('FREMM : 32 cellules (16 A70 pour le missile de croisière naval, 16 A43 pour l\'Aster 15) et trois commandes', () => {
    const g = construireFremm(THREE);
    expect(ids(g)).toEqual(['mdcn', 'aster', 'decoller']);
    expect(g.userData.legendes.some((l) => /A70 : 16 missiles de croisière naval/.test(l.texte))).toBe(true);
    expect(g.userData.legendes.some((l) => /A43 : 16 Aster 15/.test(l.texte))).toBe(true);
    expect(g.userData.legendes.some((l) => /harpon/.test(l.texte))).toBe(true);
  });

  it('FREMM : le missile de croisière sort de sa cellule, bascule, largue son accélérateur et part au ras de l\'eau', () => {
    const g = construireFremm(THREE);
    let missile = null, acc = null;
    g.traverse((o) => { if (o.userData.missile === 'mdcn') missile = o; if (o.userData.accelerateur === 'mdcn') acc = o; });
    const api = { mdcn: true };
    jouer(g, api, 0, 16);
    expect(api.mdcn).toBe(false); // commande consommée
    const y0 = 6.7; // pont de la plage avant
    // 0,9 s de trappe, puis montée verticale
    jouer(g, api, 32, 2400);
    expect(missile.visible).toBe(true);
    expect(missile.position.y).toBeGreaterThan(y0 + 8);
    const axe = () => new THREE.Vector3(0, 1, 0).applyQuaternion(missile.quaternion);
    expect(axe().y).toBeGreaterThan(0.9);
    // Après le basculement : accélérateur largué (rattaché au navire), vol presque horizontal, en avant
    jouer(g, api, 2416, 9000);
    expect(acc.parent).not.toBe(missile);
    expect(Math.abs(axe().y)).toBeLessThan(0.2);
    expect(missile.position.y).toBeLessThan(40);
    expect(missile.position.x).toBeLessThan(-150); // vers l'avant (étrave en x = 0)
    expect(sansNaN(g)).toBe(true);
    // Fin du tir : le missile est hors de vue, on peut tirer de nouveau depuis une autre cellule
    jouer(g, api, 9016, 20000);
    expect(missile.visible).toBe(false);
    api.mdcn = true;
    jouer(g, api, 20016, 21500);
    expect(missile.visible).toBe(true);
    expect(acc.parent).toBe(missile);
  });

  it('FREMM et FDA : le Caïman Marine déplie ses pales, décolle, s\'éloigne, puis revient apponter', () => {
    for (const construire of [construireFremm, construireFda]) {
      const g = construire(THREE);
      expect(ids(g)).toContain('decoller');
      // L'hélicoptère est le seul objet dont userData.helico existe
      let helico = null;
      g.traverse((o) => { if (o.userData.helico && !helico) helico = o; });
      expect(helico).toBeTruthy();
      const depart = helico.position.clone();
      jouer(g, {}, 0, 200);
      expect(helico.userData.helico.repli).toBe(1); // posé, pales repliées
      expect(helico.userData.helico.regime).toBe(0);
      const api = { decoller: true };
      let t = jouer(g, api, 216, 30000);
      expect(helico.userData.helico.repli).toBe(0);
      expect(helico.userData.helico.regime).toBeCloseTo(1, 5);
      expect(helico.position.y - depart.y).toBeGreaterThan(25); // en vol, à son poste
      expect(helico.position.z - depart.z).toBeGreaterThan(40); // sur le côté bâbord
      api.decoller = false;
      t = jouer(g, api, t + 16, 60000);
      expect(helico.position.distanceTo(depart)).toBeLessThan(0.01); // revenu sur la grille du harpon
      expect(helico.userData.helico.repli).toBe(1);
      expect(sansNaN(g)).toBe(true);
    }
  });

  it('FDA : tir d\'Aster 30 ; en mode léger (scènes de groupe), ni tirs ni commandes', () => {
    const g = construireFda(THREE);
    expect(ids(g)).toEqual(['aster', 'decoller']);
    jouer(g, { aster: true }, 0, 9000);
    expect(sansNaN(g)).toBe(true);
    for (const construire of [construireFda, construireFremm]) {
      const l = construire(THREE, { leger: true, helico: false });
      expect(l.userData.commandes).toEqual([]);
      expect(() => jouer(l, {}, 0, 100)).not.toThrow();
    }
  });
});

describe('Porte-hélicoptères amphibie : Caïman Marine, Tigre et mode amphibie', () => {
  const trouver = (g) => {
    const helicos = [];
    g.traverse((o) => { if (o.userData.helico) helicos.push(o); });
    return helicos;
  };

  it('deux Tigre et trois Caïman Marine sur le pont, trois commandes', () => {
    const g = construirePha(THREE);
    expect(ids(g)).toEqual(['decoller', 'tigres', 'amphibie']);
    const h = trouver(g);
    expect(h).toHaveLength(5);
    expect(h.filter((o) => 'repli' in o.userData.helico)).toHaveLength(3); // Caïman : pales repliables
    for (const o of h) expect(o.userData.helico.regime).toBe(0); // rotors arrêtés sur le pont
    const textes = g.userData.legendes.map((l) => l.texte);
    expect(new Set(textes).size).toBe(textes.length);
    expect(textes.some((x) => /Tigre/.test(x))).toBe(true);
    expect(textes.some((x) => /EDA-R/.test(x))).toBe(true);
  });

  it('les Tigre décollent et rejoignent leur orbite d\'escorte ; les Caïman déplient leurs pales et décollent', () => {
    const g = construirePha(THREE);
    const [t1, t2, c1, c2, c3] = trouver(g);
    const api = { tigres: true, decoller: true };
    const t = jouer(g, api, 16, 40000);
    for (const o of [t1, t2, c1, c2]) {
      expect(o.userData.helico.regime).toBeCloseTo(1, 5);
      expect(o.position.y).toBeGreaterThan(38);
    }
    expect(c1.userData.helico.repli).toBe(0);
    expect(c3.userData.helico.repli).toBe(1); // le troisième reste replié, prêt pour le hangar
    // Les Tigre tournent autour du navire (rayon de 175 m centré sur x = 100)
    expect(Math.hypot(t1.position.x - 100, t1.position.z)).toBeGreaterThan(120);
    api.tigres = false; api.decoller = false;
    jouer(g, api, t + 16, 80000);
    for (const o of [t1, t2, c1, c2]) expect(o.position.y).toBeLessThan(20.2);
    expect(sansNaN(g)).toBe(true);
  });

  it('mode amphibie : ballastage, porte abaissée, deux EDA-R qui s\'échouent et débarquent Leclerc et Griffon', () => {
    const g = construirePha(THREE);
    let corps = null, edas = [];
    g.traverse((o) => { if (o.userData.sillage) edas.push(o); });
    corps = g.children[0].children[0]; // navire > corps
    expect(edas).toHaveLength(2);
    const dans = edas.map((e) => e.position.x);
    for (const x of dans) expect(x).toBeLessThan(199); // dans le radier au départ
    const api = { amphibie: true };
    let t = jouer(g, api, 16, 9000);
    expect(corps.position.y).toBeLessThan(-0.5); // le navire s'est enfoncé
    expect(corps.rotation.z).toBeLessThan(0); // par l'arrière
    t = jouer(g, api, t + 16, 85000);
    for (const e of edas) {
      expect(e.position.x).toBeGreaterThan(199 + 400); // échoués sur la plage, loin à l'arrière
      for (const v of e.userData.charge) expect(v.objet.position.x).toBeLessThan(-22); // véhicules débarqués
    }
    api.amphibie = false;
    jouer(g, api, t + 16, 130000);
    edas.forEach((e, i) => expect(e.position.x).toBeCloseTo(dans[i], 3)); // rembarqués
    expect(corps.position.y).toBeCloseTo(0, 5);
    expect(sansNaN(g)).toBe(true);
  });

  it('version légère pour les scènes de groupe : pas de commandes, la scène du groupe aéronaval se construit', async () => {
    const l = construirePha(THREE, { leger: true });
    expect(l.userData.commandes).toEqual([]);
    const { construireGroupeAeronaval, construireDissuasion } = await import('../src/ui/3d/marine.js');
    const ga = construireGroupeAeronaval(THREE, {});
    expect(() => jouer(ga, { sonar: true, ravitailler: true }, 0, 500)).not.toThrow();
    const di = construireDissuasion(THREE, {});
    expect(() => jouer(di, {}, 0, 200)).not.toThrow();
  });
});

describe('Groupe aéronaval : combat et nouveautés', () => {
  it('raid aérien : la frégate tire des Aster (et un Rafale un Meteor), les trois chasseurs sont abattus', async () => {
    const { construireGroupeAeronaval } = await import('../src/ui/3d/marine.js');
    const g = construireGroupeAeronaval(THREE, {});
    expect(ids(g)).toEqual(expect.arrayContaining(['raid', 'frappe', 'helicos', 'amphibie', 'sonar', 'ravitailler']));
    const api = { raid: true };
    const textes = new Set();
    for (let t = 0; t <= 40000; t += 16) {
      g.userData.animer(t, api);
      if (g.userData.hud?.texte) textes.add(g.userData.hud.texte);
    }
    const tous = [...textes].join('\n');
    expect(tous).toMatch(/Raid détecté/);
    expect(tous).toMatch(/Aster 30 tiré/);
    expect(tous).toMatch(/Meteor tiré/);
    expect(tous).toMatch(/Aster manqué/);
    expect(tous).toMatch(/Raid repoussé : 3 chasseurs abattus/);
    expect(sansNaN(g)).toBe(true);
  });

  it('frappe de missiles de croisière, décollage des hélicoptères et mise à l\'eau des engins', async () => {
    const { construireGroupeAeronaval } = await import('../src/ui/3d/marine.js');
    const g = construireGroupeAeronaval(THREE, {});
    const missiles = [];
    g.traverse((o) => { if (o.userData.missile === 'mdcn') missiles.push(o); });
    expect(missiles.length).toBe(2);
    const api = { frappe: true, helicos: true, amphibie: true };
    jouer(g, api, 0, 5000);
    expect(missiles.every((m) => m.visible)).toBe(true);
    jouer(g, api, 5016, 30000);
    const helicos = [];
    g.traverse((o) => { if (o.userData.helico) helicos.push(o); });
    expect(helicos.some((h) => h.userData.helico.regime > 0.9)).toBe(true);
    expect(sansNaN(g)).toBe(true);
  });
});
