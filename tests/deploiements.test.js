/**
 * Déploiements (forces terrestres et aériennes sur des bases françaises ou
 * alliées), principe de précaution, grand ménage des doublons.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeDeploiements, reformesDisponibles } from '../src/engine/index.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france') => creerPartie({ pays, donnees: lire(pays === 'france' ? 'france' : 'allemagne'), contexte, graine: 23, mode: 'facile', calendrier: 'horizon2050' });
const OPT = { evenementsActifs: false, forcerReformes: true };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, OPT); for (let k = 1; k < n; k++) x = jouerTour(x, {}, OPT); return x; };
const unite = (e, id) => resumeDeploiements(e).unites.find((u) => u.id === id);

describe('Déploiements de forces projetables', () => {
  it('une unité déployée à Abou Dhabi coûte, s\'use, apaise Ormuz et renforce les relations avec le Golfe', () => {
    const base = jouer(nouvelle(), 2);
    const e = jouer(nouvelle(), 2, { deploiements: { chasse_1: 'abou_dhabi', gtia: 'abou_dhabi' } });
    expect(unite(e, 'chasse_1').position).toBe('abou_dhabi');
    expect(unite(e, 'gtia').potentiel).toBeLessThan(100);
    expect(e.international.relations.golfe).toBeGreaterThan(base.international.relations.golfe);
    expect(e.geopolitique.tensions.ormuz).toBeLessThan(base.geopolitique.tensions.ormuz);
    expect(e.depensesTemporaires.some((d) => d.source === 'deploiement')).toBe(true);
    expect(resumeDeploiements(e).coutAnnuel).toBeGreaterThan(0.4);
  });

  it('une base n\'accueille que son type d\'unité, et l\'usure force le retour en métropole', () => {
    let e = jouer(nouvelle(), 1, { deploiements: { gtia: 'lituanie', forces_speciales: 'djibouti' } });
    expect(unite(e, 'gtia').position).toBe('metropole'); // la Lituanie n'accueille que l'aviation
    expect(e.resultatsTour.deploiements.find((x) => x.unite === 'gtia').erreur).toMatch(/troupes/);
    expect(unite(e, 'forces_speciales').position).toBe('djibouti');
    e = jouer(e, 6);
    const fs = unite(e, 'forces_speciales');
    expect(fs.position).toBe('metropole'); // potentiel épuisé
    expect(e.journal.some((j) => j.texte.includes('remise en condition'))).toBe(true);
  });

  it('quitter l\'OTAN ferme les missions de l\'Alliance et rapatrie les unités qui y sont', () => {
    let e = jouer(nouvelle(), 1, { deploiements: { gtia: 'estonie' } });
    expect(unite(e, 'gtia').position).toBe('estonie');
    e = jouer(e, 7, { reformes: [{ id: 'otan', option: 'alliance' }] });
    expect(resumeDeploiements(e).horsOtan).toBe(true);
    expect(unite(e, 'gtia').position).toBe('metropole');
    expect(resumeDeploiements(e).bases.find((b) => b.id === 'roumanie').acces.terre.ok).toBe(false);
  });

  it('n\'existe que pour la France ; les anciennes sauvegardes restent jouables', () => {
    expect(resumeDeploiements(nouvelle('allemagne'))).toBeNull();
    const e = nouvelle();
    delete e.geopolitique.forces;
    expect(() => jouer(e, 1, { deploiements: { chasse_2: 'jordanie' } })).not.toThrow();
  });
});

describe('Principe de précaution et doublons', () => {
  it('le principe de précaution est une révision constitutionnelle à trois options, sourcée', () => {
    const r = reformesDisponibles(nouvelle()).find((x) => x.id === 'principe_precaution');
    expect(r.vehicule).toBe('loi constitutionnelle');
    expect(r.majoriteRenforcee).toBe(true);
    expect(r.options.map((o) => o.id)).toEqual(['supprimer', 'innovation', 'encadrer']);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('supprimer le principe relève un peu la croissance potentielle', () => {
    // Effet économique seul (sans la vie politique, qui peut emporter un gouvernement après une révision contestée)
    const eco = (premier) => { let x = jouerTour(nouvelle(), premier, { ...OPT, sansPolitique: true }); for (let k = 1; k < 14; k++) x = jouerTour(x, {}, { ...OPT, sansPolitique: true }); return x; };
    const base = eco({});
    const e = eco({ reformes: [{ id: 'principe_precaution', option: 'supprimer' }] });
    expect(e.macro.pibPotentiel).toBeGreaterThan(base.macro.pibPotentiel);
  });

  it('le grand ménage des doublons économise davantage, à terme, que le programme de base', () => {
    const r = reformesDisponibles(nouvelle()).find((x) => x.id === 'agences_operateurs');
    expect(r.options.map((o) => o.id)).toContain('grand_menage');
    const menage = jouer(nouvelle(), 22, { reformes: [{ id: 'agences_operateurs', option: 'grand_menage' }] });
    const simple = jouer(nouvelle(), 22, { reformes: [{ id: 'agences_operateurs', option: 'oui' }] });
    expect(menage.budget.economieFinances.montant).toBeLessThan(simple.budget.economieFinances.montant);
  });
});
