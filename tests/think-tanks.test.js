/**
 * Réformes inspirées de la Fondation IFRAP et du Shift Project : catalogue,
 * étiquettes, effets (économies, émissions) et option IFRAP sur l'âge de départ.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, reformesDisponibles } from '../src/engine/index.js';
import { trouverReforme } from '../src/engine/reformes.js';
import { REFORMES_THINK_TANKS, THINK_TANKS, INSPIRATIONS_EXISTANTES } from '../src/data/reformesThinkTanks.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = () => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 11, mode: 'facile', calendrier: 'horizon2050' });
const SANS = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, SANS); for (let k = 1; k < n; k++) x = jouerTour(x, {}, SANS); return x; };
/** Somme des économies (dépenses négatives) d'une réforme à un âge donné, en Md€ courants. */
const economies = (e, id, option, age) => -Object.values(trouverReforme(id).effets(e, option, age, {}).depenses ?? {}).reduce((s, v) => s + v, 0);

describe('Catalogue des think tanks', () => {
  it('ajoute 7 réformes de l\'IFRAP et 8 du Shift Project, toutes sourcées', () => {
    const ifrap = REFORMES_THINK_TANKS.filter((r) => r.inspirations.includes('ifrap'));
    const shift = REFORMES_THINK_TANKS.filter((r) => r.inspirations.includes('shift'));
    expect(ifrap.length).toBe(7);
    expect(shift.length).toBe(8);
    for (const r of REFORMES_THINK_TANKS) {
      expect(r.sources.length).toBeGreaterThan(0);
      expect(r.chiffrage).toBeTruthy();
      expect(r.vehicule).toBeTruthy();
    }
    expect(Object.keys(THINK_TANKS)).toEqual(['ifrap', 'shift']);
  });

  it('étiquette les réformes existantes qui reprennent leurs propositions', () => {
    const liste = reformesDisponibles(nouvelle());
    for (const [source, notes] of Object.entries(INSPIRATIONS_EXISTANTES)) {
      for (const id of Object.keys(notes)) {
        const r = liste.find((x) => x.id === id);
        expect(r, id).toBeTruthy();
        expect(r.inspirations).toContain(source);
        expect(r.notesInspiration[source]).toBeTruthy();
      }
    }
    expect(liste.filter((r) => r.inspirations.includes('ifrap')).length).toBeGreaterThanOrEqual(20);
  });

  it('les nouvelles réformes s\'appliquent sans erreur pendant trois ans', () => {
    const toutes = REFORMES_THINK_TANKS.map((r) => ({ id: r.id, option: r.options[0].id }));
    const e = jouer(nouvelle(), 12, { reformes: toutes });
    expect(Number.isFinite(e.finances.deficitRatio)).toBe(true);
    expect(Number.isFinite(e.macro.pibNominal)).toBe(true);
  });
});

describe('Propositions de l\'IFRAP', () => {
  it('le plan 2035 suit la trajectoire de l\'IFRAP : ~30, ~105 puis ~180 Md€ d\'économies', () => {
    const e = nouvelle();
    const k = e.macro.niveauPrix / 100;
    expect(economies(e, 'ifrap_plan_2035', 'central', 0) / k).toBeCloseTo(29.7, 0);
    expect(economies(e, 'ifrap_plan_2035', 'central', 8) / k).toBeCloseTo(104.8, 0);
    expect(economies(e, 'ifrap_plan_2035', 'central', 32) / k).toBeCloseTo(180.2, 0);
    // Scénario alternatif : 100 % dépense, davantage d'économies
    expect(economies(e, 'ifrap_plan_2035', 'alternatif', 8) / k).toBeCloseTo(133.8, 0);
  });

  it('le plan réduit le déficit par rapport à une partie sans réforme', () => {
    const sans = jouer(nouvelle(), 12);
    const avec = jouer(nouvelle(), 12, { reformes: [{ id: 'ifrap_plan_2035', option: 'alternatif' }] });
    expect(avec.finances.deficitRatio).toBeLessThan(sans.finances.deficitRatio - 1);
  });

  it('l\'option IFRAP sur l\'âge de départ vise 66 ans', () => {
    const e = jouer(nouvelle(), 4, { reformes: [{ id: 'retraites_age', option: 'ifrap_66' }] });
    expect(e.retraites.ageCible).toBe(66);
    expect(e.retraites.rythme).toBe(0.5);
  });
});

describe('Propositions du Shift Project', () => {
  it('chaque chantier réduit les émissions à terme', () => {
    const e = nouvelle();
    for (const r of REFORMES_THINK_TANKS.filter((x) => x.inspirations.includes('shift'))) {
      const eff = r.effets(e, r.options[0].id, 40, {});
      expect(eff.emissionsEvitees, r.id).toBeGreaterThan(0);
    }
  });

  it('les émissions baissent davantage avec les chantiers du Shift Project', () => {
    const chantiers = REFORMES_THINK_TANKS.filter((r) => r.inspirations.includes('shift')).map((r) => ({ id: r.id, option: r.options[0].id }));
    const sans = jouer(nouvelle(), 20);
    const avec = jouer(nouvelle(), 20, { reformes: chantiers });
    expect(avec.climat.emissions).toBeLessThan(sans.climat.emissions - 10);
  });
});
