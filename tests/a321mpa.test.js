/**
 * A321 MPA : modèle 3D (soute, torpille, bouées) et programme de patrouille maritime.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { installerFauxDocument } from './outils/faux-document.js';
import { PROGRAMMES_DEFENSE, SOURCES_DEFENSE } from '../src/data/defense.js';
import { creerPartie, jouerTour, resumeDefense } from '../src/engine/index.js';

installerFauxDocument();
const { construireA321Mpa } = await import('../src/ui/3d/aeronefs.js');
const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));

describe('A321 MPA', () => {
  it('se construit aux bonnes dimensions, avec ses commandes de mission', () => {
    const g = construireA321Mpa(THREE);
    g.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(g);
    const k = 0.32;
    expect((b.max.x - b.min.x) / k).toBeGreaterThan(43);
    expect((b.max.x - b.min.x) / k).toBeLessThan(47);
    expect((b.max.z - b.min.z) / k).toBeGreaterThan(34);
    expect((b.max.z - b.min.z) / k).toBeLessThan(37);
    expect(g.userData.commandes.map((c) => c.id)).toEqual(['soute', 'torpille', 'bouees', 'train']);
  });

  it('largue une torpille seulement soute ouverte', () => {
    const g = construireA321Mpa(THREE);
    const torpille = () => { let t = null; g.traverse((o) => { if (!t && o.isGroup && o.children.some((c) => c.geometry?.type === 'CylinderGeometry' && c.geometry.parameters.height === 2.6)) t = o; }); return t; };
    const t = torpille();
    const y0 = t.position.y;
    g.userData.animer(0, { torpille: true });
    g.userData.animer(1500, {});
    expect(t.position.y).toBe(y0); // soute fermée : rien ne tombe
    const api = { soute: true, torpille: true };
    g.userData.animer(2000, api);
    g.userData.animer(3200, api);
    expect(t.position.y).toBeLessThan(y0 - 1);
  });

  it('programme de patrouille maritime : sourcé, trois options, un modèle 3D', () => {
    const p = PROGRAMMES_DEFENSE.france.find((x) => x.id === 'patmar');
    expect(p.options.map((o) => o.id)).toEqual(['nominal', 'lancer', 'renoncer']);
    for (const s of p.sources) expect(SOURCES_DEFENSE[s]?.url).toMatch(/^https:/);
    const e = creerPartie({ pays: 'france', donnees: lire('france'), contexte: lire('_contexte-mondial'), graine: 5, mode: 'facile', calendrier: 'horizon2050', role: 'president' });
    const x = jouerTour(e, { defense: { programmes: { patmar: 'lancer' } } }, { evenementsActifs: false });
    expect(resumeDefense(x).programmes.find((q) => q.id === 'patmar').etat.option).toBe('lancer');
  });
});
