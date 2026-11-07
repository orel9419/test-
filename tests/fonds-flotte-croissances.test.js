/**
 * Fonds souverain, deux groupes aéronavals, croissance annuelle des pays
 * dans les classements.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, flotte, resumeGeopolitique, resumeFonds } from '../src/engine/index.js';
import { deplacerGroupe } from '../src/engine/geopolitique.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const nouvelle = (graine = 4) => creerPartie({ pays: 'france', donnees: lire('france'), contexte: lire('_contexte-mondial'), graine, mode: 'facile', calendrier: 'horizon2050' });
const SANS = { evenementsActifs: false, forcerReformes: true };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, SANS); for (let k = 1; k < n; k++) x = jouerTour(x, {}, SANS); return x; };
const fonds = (e) => e.reformes.actives.find((a) => a.id === 'fonds_souverain')?.pilotage;

describe('Fonds souverain', () => {
  it('le capital s\'accumule (apports et rendement réinvesti)', () => {
    const e = jouer(nouvelle(), 16, { reformes: [{ id: 'fonds_souverain', option: 'emprunt' }] });
    expect(fonds(e).capital).toBeGreaterThan(60);
    expect(fonds(e).flux).toBeGreaterThan(19);
  });

  it('financé par l\'emprunt, il augmente la dette mais pas le déficit', () => {
    const sans = jouer(nouvelle(), 12);
    const avec = jouer(nouvelle(), 12, { reformes: [{ id: 'fonds_souverain', option: 'emprunt' }] });
    expect(avec.finances.dette).toBeGreaterThan(sans.finances.dette + 30);
    expect(Math.abs(avec.finances.deficitRatio - sans.finances.deficitRatio)).toBeLessThan(0.5);
  });

  it('réinvestir une partie des économies amortit la perte de PIB, d\'autant plus que le fonds investit en France', () => {
    const plafond = { id: 'plafond_depense_pib', option: '47_43' };
    const seul = jouer(nouvelle(), 16, { reformes: [plafond] });
    const france = jouer(nouvelle(), 16, { reformes: [plafond, { id: 'fonds_souverain', option: 'economies' }], fondsAllocation: 'france' });
    const monde = jouer(nouvelle(), 16, { reformes: [plafond, { id: 'fonds_souverain', option: 'economies' }], fondsAllocation: 'monde' });
    expect(france.macro.pibReel).toBeGreaterThan(seul.macro.pibReel + 1.5);
    expect(france.macro.chomage).toBeLessThan(seul.macro.chomage);
    expect(monde.macro.pibReel).toBeLessThan(france.macro.pibReel);
    expect(fonds(france).capital).toBeGreaterThan(100);
  });

  it('sans plafond de dépense, l\'option « économies » n\'investit rien', () => {
    const e = jouer(nouvelle(), 8, { reformes: [{ id: 'fonds_souverain', option: 'economies' }] });
    expect(fonds(e).capital).toBe(0);
  });
});

describe('Portefeuille du fonds souverain', () => {
  it('investit dans le CAC 40, le S&P 500, le STOXX Europe 600 et les marchés émergents, avec un historique depuis sa création', () => {
    let e = jouer(nouvelle(), 1, { reformes: [{ id: 'fonds_souverain', option: 'emprunt' }] });
    expect(resumeFonds(e).actif).toBe(false); // loi votée, le fonds démarre après le délai d'application
    e = jouer(e, 12);
    const r = resumeFonds(e);
    expect(r.actif).toBe(true);
    expect(r.poches.map((p) => p.id)).toEqual(['cac40', 'sp500', 'stoxx600', 'emergents']);
    expect(r.historique[0].niveaux).toEqual({ cac40: 100, sp500: 100, stoxx600: 100, emergents: 100 });
    expect(r.historique.length).toBeGreaterThan(8);
    // Répartition équilibrée par défaut : 30 / 30 / 25 / 15 % des apports
    const premier = r.historique[0];
    expect(premier.poches.cac40 / premier.capital).toBeCloseTo(0.3, 5);
    expect(premier.poches.emergents / premier.capital).toBeCloseTo(0.15, 5);
    // Le capital suit les apports et les marchés ; les dividendes sont réinvestis
    expect(r.apports).toBeGreaterThan(40);
    expect(r.dividendes).toBeGreaterThan(0);
    expect(r.capital).toBeCloseTo(r.poches.reduce((s, p) => s + p.valeur, 0), 6);
    expect(Math.abs(r.capital - r.apports)).toBeLessThan(r.apports * 0.6);
  });

  it('changer de répartition rééquilibre le portefeuille au trimestre suivant', () => {
    let e = jouer(nouvelle(), 8, { reformes: [{ id: 'fonds_souverain', option: 'emprunt' }] });
    e = jouerTour(e, { fondsAllocation: 'monde' }, SANS);
    const r = resumeFonds(e);
    expect(r.allocation).toBe('monde');
    expect(r.poches.find((p) => p.id === 'sp500').part).toBeCloseTo(0.45, 5);
    expect(r.partFrance).toBeLessThan(0.2);
    expect(e.journal.some((j) => j.texte.includes('nouvelle répartition'))).toBe(true);
  });
});

describe('Deux groupes aéronavals', () => {
  it('« France Libre » accéléré et Charles-de-Gaulle gardé : deux groupes de 2032 à 2040', () => {
    let e = jouer(nouvelle(3), 1, { reformes: [{ id: 'porte_avions_2032', option: 'acceleration_2032' }], defense: { programmes: { cdg: 'prolonger' } } });
    expect(deplacerGroupe(e, 'mediterranee', 2).erreur).toMatch(/deux porte-avions/);
    const parAnnee = {};
    for (let k = 0; k < 64; k++) {
      e = jouerTour(e, {}, SANS);
      parAnnee[e.trimestre.annee] = !!e.geopolitique.gan2;
      if (e.trimestre.annee === 2034 && e.trimestre.t === 1) {
        expect(flotte(e).map((x) => x.id)).toEqual(['france_libre', 'cdg']);
        expect(deplacerGroupe(e, 'mediterranee', 2).texte).toMatch(/Charles-de-Gaulle/);
        expect(resumeGeopolitique(e).theatres.find((t) => t.id === 'mediterranee').present).toBe(true);
      }
    }
    expect(parAnnee[2033]).toBe(true);
    expect(parAnnee[2039]).toBe(true);
    expect(parAnnee[2042]).toBe(false);
  });

  it('deux porte-avions de nouvelle génération : deux groupes à partir de 2042', () => {
    const e = jouer(nouvelle(3), 66, { reformes: [{ id: 'porte_avions', option: 'deux' }] });
    expect(flotte(e).map((x) => x.id)).toEqual(['france_libre', 'pang2']);
    expect(e.geopolitique.gan2).toBeTruthy();
  });

  it('sans décision : un seul groupe, le France Libre remplace le Charles-de-Gaulle', () => {
    const e = jouer(nouvelle(3), 50);
    expect(flotte(e).map((x) => x.id)).toEqual(['france_libre']);
    expect(e.geopolitique.gan2 ?? null).toBeNull();
  });
});

describe('Croissance annuelle des pays', () => {
  it('une valeur par pays et par année, pour le monde et la zone euro', () => {
    const e = jouer(nouvelle(), 13);
    const cr = e.classements.croissances;
    expect(cr.annees).toEqual([2026, 2027, 2028, 2029]);
    for (const id of ['US', 'CN', 'IN', 'FR']) expect(cr.monde[id]).toHaveLength(4);
    expect(cr.euro.DE.every((v) => Number.isFinite(v) && v > -10 && v < 20)).toBe(true);
    // La France suit la simulation : même croissance dans les deux listes (change constant)
    expect(cr.monde.FR.at(-1)).toBeCloseTo(cr.euro.FR.at(-1), 6);
  });
});
