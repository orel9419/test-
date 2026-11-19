/**
 * Rendu réaliste de la visionneuse 3D : mer animée, joints de panneaux et
 * usure, sol texturé. Construit hors navigateur (textures factices).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { installerFauxDocument } from './outils/faux-document.js';

installerFauxDocument();
const { oceaniser, detailler, plateauSol, textureSol } = await import('../src/ui/3d/rendu.js');

const scene = () => {
  const g = new THREE.Group();
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: 0x0e3a5f, transparent: true, opacity: 0.86 }));
  mer.rotation.x = -Math.PI / 2;
  const coque = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 2), new THREE.MeshStandardMaterial({ color: 0x8a9096 }));
  const vitre = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.4 }));
  const peinte = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  peinte.material.onBeforeCompile = () => {};
  g.add(mer, coque, vitre, peinte);
  return { g, mer, coque, vitre, peinte };
};

describe('Rendu réaliste des modèles 3D', () => {
  it('la mer devient une surface d\'eau animée qui garde sa transparence', () => {
    const { g, mer } = scene();
    const m = oceaniser(THREE, g);
    expect(m).not.toBeNull();
    expect(mer.material.isMeshPhysicalMaterial).toBe(true);
    expect(mer.material.ior).toBeCloseTo(1.333, 3); // indice de réfraction de l'eau
    expect(mer.material.opacity).toBeCloseTo(0.86, 5);
    expect(mer.material.normalMap).toBeTruthy();
    const avant = mer.material.normalMap.offset.clone();
    m.animer(5000);
    expect(mer.material.normalMap.offset.equals(avant)).toBe(false); // la houle dérive
    m.liberer();
  });

  it('sans mer, rien n\'est remplacé', () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial()));
    expect(oceaniser(THREE, g)).toBeNull();
  });

  it('joints et usure : seulement sur les matériaux opaques qui n\'ont pas déjà leur propre shader', () => {
    const { g, mer, coque, vitre, peinte } = scene();
    oceaniser(THREE, g);
    detailler(THREE, g, { pas: 1.3, joints: 0.1, usure: 0.05 });
    expect(coque.material.customProgramCacheKey()).toMatch(/details/);
    expect(vitre.material.customProgramCacheKey()).not.toMatch(/details/);
    expect(peinte.material.customProgramCacheKey()).not.toMatch(/details/);
    expect(mer.material.customProgramCacheKey()).toMatch(/houle/);
    // Le shader reçoit le pas des panneaux et les intensités
    const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <map_fragment>\n#include <roughnessmap_fragment>' };
    coque.material.onBeforeCompile(shader);
    expect(shader.uniforms.uDetails.value.toArray()).toEqual([1.3, 0.1, 0.05]);
    expect(shader.fragmentShader).toMatch(/jointsDetail/);
  });

  it('sol des véhicules : disque texturé qui se fond dans le fond, sans écrire la profondeur', () => {
    const s = plateauSol(THREE, 15, -2.2);
    expect(s.geometry.parameters.radius).toBe(15);
    expect(s.position.y).toBe(-2.2);
    expect(s.material.map).toBeTruthy();
    expect(s.material.alphaMap).toBeTruthy();
    expect(s.material.depthWrite).toBe(false);
    expect(s.receiveShadow).toBe(true);
    const t = textureSol(THREE, { repetition: 4 });
    expect(t.repeat.x).toBe(4);
    expect(t.wrapS).toBe(THREE.RepeatWrapping);
  });
});
