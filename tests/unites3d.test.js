/**
 * Scènes 3D des unités projetables (GTIA, forces spéciales, police du ciel,
 * ravitaillement en vol) : construction hors navigateur (textures factices),
 * deux états (en mission, en métropole), commandes et animations.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { installerFauxDocument } from './outils/faux-document.js';
import { UNITES, BASES } from '../src/data/deploiements.js';

installerFauxDocument();
const { construireGtia, construireForcesSpeciales, construirePoliceDuCiel, construireRavitaillement, construireEscadronLeclerc } = await import('../src/ui/3d/unites.js');
const { construireDissuasion } = await import('../src/ui/3d/marine.js');
const SCENES = { gtia: construireGtia, forcesSpeciales: construireForcesSpeciales, policeDuCiel: construirePoliceDuCiel, ravitaillement: construireRavitaillement, escadronLeclerc: construireEscadronLeclerc };

const boite = (o) => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); };
const animer = (g, api = {}, n = 60) => { for (let k = 0; k < n; k++) g.userData.animer(k * 16, api); };
const sansNaN = (g) => { let ok = true; g.updateMatrixWorld(true); g.traverse((o) => { if (o.isMesh && o.matrixWorld.elements.some((v) => Number.isNaN(v))) ok = false; }); return ok; };

describe('Scènes 3D des unités projetables', () => {
  it('chaque unité a sa scène, et chaque base extérieure son décor', () => {
    for (const u of Object.values(UNITES)) expect(SCENES[u.scene], u.nom).toBeTypeOf('function');
    for (const b of Object.values(BASES).filter((x) => !x.metropole)) expect(['desert', 'europe', 'tropical', 'levant']).toContain(b.terrain);
  });

  it('se construisent dans les deux états, avec légendes distinctes, commandes et animation', () => {
    for (const [nom, construire] of Object.entries(SCENES)) {
      for (const donnees of [null, { deploye: true, base: 'Estonie', terrain: 'europe', interception: false }, { deploye: false, base: 'Métropole' }]) {
        const g = construire(THREE, { donnees });
        const textes = g.userData.legendes.map((l) => l.texte);
        expect(textes.length, nom).toBeGreaterThan(1);
        expect(new Set(textes).size, `${nom} : légendes en double`).toBe(textes.length);
        expect(g.userData.commandes.length, nom).toBeGreaterThan(0);
        const api = Object.fromEntries(g.userData.commandes.map((c) => [c.id, true]));
        expect(() => { animer(g, {}); animer(g, api); }, nom).not.toThrow();
        expect(sansNaN(g), `${nom} : position invalide`).toBe(true);
        // Au sol ou en vol, jamais les deux
        expect(!!g.userData.sol !== !!g.userData.ciel, nom).toBe(true);
      }
    }
  });

  it('GTIA : huit engins posés au sol ; un Tigre en appui en mission seulement', () => {
    const mission = construireGtia(THREE, {});
    const K = mission.userData.echelle;
    const garnison = construireGtia(THREE, { donnees: { deploye: false } });
    const hauteur = (g) => boite(g).max.y / K;
    expect(hauteur(mission)).toBeGreaterThan(18); // le Tigre vole à une vingtaine de mètres
    expect(hauteur(garnison)).toBeLessThan(16);   // hangar et mât seulement
    expect(mission.userData.commandes.map((c) => c.id)).toEqual(['debarquer', 'batterie', 'tirCanon']);
    expect(mission.userData.legendes[0].texte).toMatch(/en mission/);
    expect(garnison.userData.legendes[0].texte).toMatch(/garnison/);
  });

  it('police du ciel : interception (trois appareils) ou patrouille ; en métropole, alerte au sol', () => {
    const interception = construirePoliceDuCiel(THREE, { donnees: { deploye: true, base: 'Lituanie', interception: true } });
    const patrouille = construirePoliceDuCiel(THREE, { donnees: { deploye: true, base: 'Jordanie', terrain: 'desert', interception: false } });
    const alerte = construirePoliceDuCiel(THREE, { donnees: { deploye: false } });
    expect(interception.userData.legendes.some((l) => /non identifié/.test(l.texte))).toBe(true);
    expect(patrouille.userData.legendes.some((l) => /non identifié/.test(l.texte))).toBe(false);
    expect(interception.userData.ciel).toBe(true);
    expect(alerte.userData.sol).toBe(true);
    expect(alerte.userData.commandes[0].id).toBe('alerte');
    // Décollage sur alerte : le leader quitte son abri puis y revient
    const api = { alerte: true };
    alerte.userData.animer(0, api);
    alerte.userData.animer(4000, api);
    expect(boite(alerte).min.x).toBeLessThan(-10);
    alerte.userData.animer(9500, api);
    alerte.userData.animer(9600, api);
    expect(api.alerte).toBe(false);
  });

  it('ravitaillement : au contact, la perche de chaque Rafale est dans un panier', () => {
    const g = construireRavitaillement(THREE, {});
    animer(g, {}, 400);
    expect(g.userData.legendes.some((l) => /panier/.test(l.texte))).toBe(true);
    // Au contact : chaque Rafale est derrière une nacelle d'aile (22,5 m de l'axe), un peu sous le Phénix
    const K = g.userData.echelle;
    const [gauche, droite] = g.userData.pieces.rafales;
    expect(gauche.position.z / K).toBeCloseTo(22.9, 0);
    expect(droite.position.z / K).toBeCloseTo(-22.1, 0);
    expect(gauche.position.y).toBeLessThan(g.userData.pieces.phenix.position.y);
    // Rompre le contact éloigne les chasseurs vers l'arrière
    const avant = gauche.position.x;
    animer(g, { attente: true }, 500);
    expect(gauche.position.x).toBeGreaterThan(avant + 0.5);
  });

  it('dissuasion : SNLE (ou SNLE 3G), escorte, tir d\'essai du M51 qui sort de l\'eau et monte', () => {
    for (const snle3g of [false, true]) {
      const g = construireDissuasion(THREE, { donnees: { snle3g } });
      expect(g.userData.commandes.map((c) => c.id)).toEqual(['trappes', 'tir', 'sonar']);
      expect(g.userData.legendes.some((l) => l.texte.includes('Monge'))).toBe(true);
      const api = { trappes: true, tir: true };
      g.userData.animer(1000, api);
      const missile = g.userData.m51;
      g.userData.animer(1000 + 6000, api);
      expect(missile.visible).toBe(true);
      expect(missile.position.y).toBeGreaterThan(1);
    }
  });
});
