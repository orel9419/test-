/**
 * Hémicycle 3D : un fauteuil par élu, groupes de la gauche vers la droite
 * vues du fauteuil du président.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { construireHemicycle } from '../src/ui/3d/palais.js';
import { groupesOrdonnes } from '../src/ui/composants/Hemicycle.jsx';

describe('Hémicycle 3D', () => {
  it('ordonne les groupes de la gauche vers la droite', () => {
    const g = groupesOrdonnes('france', [{ id: 'RN', sieges: 120, couleur: '#123' }, { id: 'LFI', sieges: 71, couleur: '#c21' }, { id: 'EPR', sieges: 91, couleur: '#fb3' }]);
    expect(g.map((x) => x.id)).toEqual(['LFI', 'EPR', 'RN']);
    expect(g[0].nom).toBe('LFI');
  });

  it('place un fauteuil par élu et légende chaque groupe significatif', () => {
    const groupes = [{ id: 'G', nom: 'Gauche', sieges: 200, couleur: '#ff0000' }, { id: 'C', nom: 'Centre', sieges: 150, couleur: '#ffcc00' }, { id: 'D', nom: 'Droite', sieges: 227, couleur: '#0000ff' }];
    const h = construireHemicycle(THREE, { modele: 'hemicycleAN', donnees: { groupes } });
    expect(h.userData.sieges).toBe(577);
    let fauteuils = null;
    h.traverse((o) => { if (o.isInstancedMesh && o.count === 577 && o.instanceColor) fauteuils = o; });
    expect(fauteuils).not.toBeNull();
    // Le premier fauteuil (le plus à gauche) est à la gauche du président (x négatif) et de la couleur du premier groupe
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), c = new THREE.Color();
    fauteuils.getMatrixAt(0, m); p.setFromMatrixPosition(m);
    fauteuils.getColorAt(0, c);
    expect(p.x).toBeLessThan(0);
    expect(c.getHexString()).toBe('ff0000');
    fauteuils.getMatrixAt(576, m); p.setFromMatrixPosition(m);
    expect(p.x).toBeGreaterThan(0);
    expect(h.userData.legendes.map((l) => l.texte)).toEqual(expect.arrayContaining(['Gauche · 200', 'Centre · 150', 'Droite · 227']));
  });

  it('Sénat : 348 sièges par défaut', () => {
    expect(construireHemicycle(THREE, { modele: 'hemicycleSenat' }).userData.sieges).toBe(348);
  });
});
