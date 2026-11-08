/**
 * F-35 en 3D : dimensions officielles des trois versions, particularités et
 * animations (construction hors navigateur, sans textures).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { construireF35 } from '../src/ui/3d/f35.js';

/** Boîte englobante des éléments visibles, en mètres. */
const taille = (g) => {
  g.updateMatrixWorld(true);
  const b = new THREE.Box3();
  g.traverseVisible((o) => { if (o.isMesh) b.expandByObject(o); });
  return b.getSize(new THREE.Vector3());
};
/** Fait tourner l'animation jusqu'à la fin des mouvements. */
const animer = (g, api) => { for (let k = 0; k < 200; k++) g.userData.animer(k * 16, api); };
const commandes = (g) => g.userData.commandes.map((c) => c.id);

describe('F-35 en 3D', () => {
  it('respecte les dimensions officielles (Lockheed Martin) à quelques centimètres près', () => {
    const officiel = { f35a: [15.67, 10.67, 4.38], f35b: [15.61, 10.67, 4.36], f35c: [15.7, 13.11, 4.48] };
    for (const [m, [L, E, H]] of Object.entries(officiel)) {
      const t = taille(construireF35(THREE, { modele: m }));
      expect(Math.abs(t.x - L), `${m} longueur`).toBeLessThan(0.08);
      expect(Math.abs(t.z - E), `${m} envergure`).toBeLessThan(0.1);
      expect(Math.abs(t.y - H), `${m} hauteur`).toBeLessThan(0.08);
    }
  });

  it('chaque version a ses commandes propres', () => {
    expect(commandes(construireF35(THREE, { modele: 'f35a' }))).toEqual(['rentrer', 'soutes', 'receptacle']);
    expect(commandes(construireF35(THREE, { modele: 'f35b' }))).toEqual(['rentrer', 'soutes', 'vertical', 'perche']);
    expect(commandes(construireF35(THREE, { modele: 'f35c' }))).toEqual(['rentrer', 'soutes', 'replier', 'crosse', 'perche']);
    const legendes = construireF35(THREE, { modele: 'f35a' }).userData.legendes.map((l) => l.texte);
    expect(legendes).toEqual(expect.arrayContaining(['Canon de 25 mm', 'Capteur optronique EOTS', 'Soutes à armement']));
  });

  it('F-35C : ailes repliées, envergure réduite d\'environ 3,5 m', () => {
    const c = construireF35(THREE, { modele: 'f35c' });
    const deplie = taille(c).z;
    animer(c, { replier: true });
    const replie = taille(c).z;
    expect(deplie - replie).toBeGreaterThan(3);
    expect(replie).toBeLessThan(10);
  });

  it('F-35B : en vol vertical, la trappe dorsale s\'ouvre et la tuyère pivote vers le sol', () => {
    const b = construireF35(THREE, { modele: 'f35b' });
    const { tuyere, porteSoufflante } = b.userData.pieces;
    const bas = () => { b.updateMatrixWorld(true); return new THREE.Box3().setFromObject(tuyere).min.y; };
    const avant = bas();
    animer(b, { vertical: true });
    expect(porteSoufflante.rotation.z).toBeLessThan(-1.2); // trappe levée à plus de 70°
    expect(avant).toBeGreaterThan(-0.65);
    expect(bas()).toBeLessThan(-0.9); // la sortie de la tuyère passe sous le ventre (au plus bas à -0,5 m)
    // Les autres versions n'ont ni soufflante ni tuyère orientable
    expect(construireF35(THREE, { modele: 'f35a' }).userData.pieces.porteSoufflante).toBeNull();
  });

  it('les soutes s\'ouvrent et dévoilent l\'armement ; le train se rentre', () => {
    const a = construireF35(THREE, { modele: 'f35a' });
    const h = taille(a).y;
    animer(a, { soutes: true, rentrer: true });
    expect(taille(a).y).toBeLessThan(h - 0.8); // plus de train sous l'avion
    let armes = 0;
    a.traverseVisible((o) => { if (o.isMesh && o.material?.color?.getHex() === 0x6b6f4e) armes++; });
    expect(armes).toBe(2); // une bombe guidée par soute
  });
});
