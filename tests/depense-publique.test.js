/**
 * Plafond de dépense publique en part du PIB : trajectoires à cinq et dix ans,
 * pilotage trimestriel.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour } from '../src/engine/index.js';
import { cibleDepensePIB, TRAJECTOIRES_DEPENSE } from '../src/data/reformesEtat.js';
import { adopterReforme } from '../src/engine/reformes.js';
import { creerAleatoire } from '../src/engine/aleatoire.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const nouvelle = () => creerPartie({ pays: 'france', donnees: lire('france'), contexte: lire('_contexte-mondial'), graine: 4, mode: 'facile', calendrier: 'horizon2050' });
const ratio = (e) => (e.finances.depenses / e.macro.pibNominal) * 100;
const SANS = { evenementsActifs: false, forcerReformes: true };

describe('Plafond de dépense publique', () => {
  it('part d\'environ 57,3 % du PIB, comme l\'Insee pour 2025', () => {
    expect(ratio(nouvelle())).toBeCloseTo(57.3, 0);
  });

  it('trois trajectoires : cible à cinq ans, puis à dix ans', () => {
    expect(Object.keys(TRAJECTOIRES_DEPENSE)).toEqual(['47_43', '45_40', '43_38']);
    expect(cibleDepensePIB('47_43', 19, 57.3)).toBeCloseTo(47.5, 5);
    expect(cibleDepensePIB('47_43', 39, 57.3)).toBeCloseTo(43, 5);
    expect(cibleDepensePIB('43_38', 60, 57.3)).toBe(38);
    expect(cibleDepensePIB('45_40', 9, 57.3)).toBeCloseTo(51.15, 2); // à mi-chemin des cinq premières années
  });

  for (const [option, cinq, dix] of [['47_43', 47.5, 43], ['43_38', 43, 38]]) {
    it(`le pilotage suit la trajectoire ${cinq} % puis ${dix} %`, () => {
      let e = jouerTour(nouvelle(), { reformes: [{ id: 'plafond_depense_pib', option }] }, SANS);
      const releves = {};
      for (let k = 1; k <= 41; k++) {
        e = jouerTour(e, {}, SANS);
        releves[k] = ratio(e);
      }
      expect(Math.abs(releves[21] - cinq)).toBeLessThan(1.2);
      expect(Math.abs(releves[41] - dix)).toBeLessThan(1);
      const p = e.reformes.actives.find((a) => a.id === 'plafond_depense_pib').pilotage;
      expect(p.economie).toBeLessThanOrEqual(0.45 * (e.finances.depenses + p.economie) + 1e-6);
    });
  }

  it('remplace le « choc de baisse de la dépense » s\'il est en vigueur', () => {
    const e = nouvelle();
    adopterReforme(e, 'choc_depenses', 'quinquennat', creerAleatoire(1));
    adopterReforme(e, 'plafond_depense_pib', '45_40', creerAleatoire(2));
    expect(e.reformes.actives.some((a) => a.id === 'choc_depenses')).toBe(false);
    expect(e.reformes.actives.some((a) => a.id === 'plafond_depense_pib')).toBe(true);
  });
});
