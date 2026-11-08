/**
 * Tigre HAD en 3D : dimensions, disposition relevée sur les plans, commandes
 * (construction hors navigateur, sans textures), et outils de formes.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { construireTigre } from '../src/ui/3d/tigre.js';
import { voilure, prismeFacettes } from '../src/ui/3d/formes.js';

/** Part des faces tournées vers l'extérieur d'une géométrie convexe. */
const exterieures = (g) => {
  const p = g.attributes.position; let ok = 0, n = 0;
  const c = new THREE.Vector3(); for (let i = 0; i < p.count; i++) c.add(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i))); c.divideScalar(p.count);
  for (let i = 0; i < p.count; i += 3) {
    const a = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)), b = new THREE.Vector3(p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)), d = new THREE.Vector3(p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    const nn = b.clone().sub(a).cross(d.clone().sub(a)); if (nn.length() < 1e-9) continue;
    n++; if (nn.dot(a.clone().add(b).add(d).divideScalar(3).sub(c)) > 0) ok++;
  }
  return ok / n;
};

describe('Outils de formes', () => {
  it('voilures et prismes ont leurs faces tournées vers l\'extérieur', () => {
    expect(exterieures(voilure(THREE, [[6, 1.2], [9, 5], [10, 5], [11, 1.2]], { relative: [0.08, 0.05] }))).toBe(1);
    expect(exterieures(voilure(THREE, [[12, 0], [13.6, 2], [14.6, 2], [14.7, 0]], { plan: 'xy', profil: 'naca', relative: [0.12, 0.1] }))).toBe(1);
    const nacelle = (s) => prismeFacettes(THREE, [[4.25, [[0.3, 2.95], [0.72, 2.92], [0.75, 2.5], [0.3, 2.45]]], [5.0, [[0.3, 3.08], [0.8, 3.02], [0.82, 2.42], [0.3, 2.38]]]].map(([x, p]) => [x, p.map(([z, y]) => [z * s, y])]), { inverser: s > 0, fermer: true });
    expect(exterieures(nacelle(1))).toBe(1);
    expect(exterieures(nacelle(-1))).toBe(1);
  });
});

describe('Tigre HAD en 3D', () => {
  const tigre = construireTigre(THREE);
  tigre.updateMatrixWorld(true);
  const boite = new THREE.Box3();
  tigre.traverseVisible((o) => { if (o.isMesh && !o.material.transparent) boite.expandByObject(o); });
  const t = boite.getSize(new THREE.Vector3());

  it('a les dimensions d\'Airbus Helicopters : rotor de 13 m, environ 15,5 m rotors compris', () => {
    expect(t.z).toBeCloseTo(13, 0); // diamètre du rotor principal
    expect(t.x).toBeGreaterThan(15);
    expect(t.x).toBeLessThan(16.4);
  });

  it('porte le rotor de queue à gauche et deux pilotes en tandem', () => {
    const legendes = tigre.userData.legendes.map((l) => l.texte);
    expect(legendes).toEqual(expect.arrayContaining(['Viseur de toit', 'Rotor de queue', 'Canon de 30 mm en tourelle', 'Pilote (devant) et tireur (derrière)']));
    const rotorQueue = tigre.userData.legendes.find((l) => l.texte === 'Rotor de queue').point;
    expect(rotorQueue.z).toBeGreaterThan(0); // côté gauche (z > 0)
  });

  it('garde ses commandes (canon orientable, livrée vert olive) et anime ses rotors', () => {
    expect(tigre.userData.commandes.map((c) => c.id)).toEqual(['tourelle', 'olive']);
    expect(() => { for (let k = 0; k < 50; k++) tigre.userData.animer(k * 16, { tourelle: true, olive: k > 20 }); }).not.toThrow();
  });
});
