/**
 * Tests du catalogue de réformes françaises, du vote sur le contenu des
 * textes, du 49.3 sur les textes financiers et de la retraite par
 * capitalisation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, reformesDisponibles, voterTexte, projeterCapitalisation } from '../src/engine/index.js';
import { validerReformes } from '../src/engine/politique.js';
import { siegesLegislativesFrance } from '../src/engine/elections.js';
import { projectionPresidentielle } from '../src/engine/objectifs.js';
import { fluxAnnuels, doubleCharge } from '../src/engine/capitalisation.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (options = {}) => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 11, ...options });
const SANS = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };

describe('Catalogue de réformes (France)', () => {
  it('propose au moins 80 réformes réparties en au moins 12 thèmes', () => {
    const liste = reformesDisponibles(nouvelle());
    expect(liste.length).toBeGreaterThanOrEqual(80);
    expect(new Set(liste.map((r) => r.categorie)).size).toBeGreaterThanOrEqual(12);
    for (const r of liste) {
      expect(r.vehicule).toBeTruthy();
      expect(r.options.length).toBeGreaterThan(0);
    }
  });
  it('toutes les réformes s\'appliquent sans erreur pendant un an', () => {
    let e = nouvelle({ mode: 'facile' });
    const toutes = reformesDisponibles(e).map((r) => ({ id: r.id, option: r.options[r.options.length - 1].id }));
    e = jouerTour(e, { reformes: toutes }, SANS);
    for (let k = 0; k < 3; k++) e = jouerTour(e, {}, SANS);
    expect(Number.isFinite(e.finances.deficitRatio)).toBe(true);
    expect(Number.isFinite(e.macro.pibNominal)).toBe(true);
  });
});

describe('Réformes libérales et sociales', () => {
  it('au moins 15 réformes de chaque orientation', () => {
    const liste = reformesDisponibles(nouvelle());
    expect(liste.filter((r) => r.orientation === 'liberale').length).toBeGreaterThanOrEqual(15);
    expect(liste.filter((r) => r.orientation === 'sociale').length).toBeGreaterThanOrEqual(15);
  });
  it('une révision constitutionnelle exige les trois cinquièmes des suffrages exprimés', () => {
    const e = nouvelle();
    const r = validerReformes(e, [{ id: 'regle_or', option: 'oui' }], '49.3');
    const v = voterTexte(e, [{ id: 'regle_or', option: 'oui' }]);
    if (v.pour < 0.6 * (v.pour + v.contre)) {
      expect(r.acceptees.length).toBe(0);
      expect(r.rejet.raison).toMatch(/trois cinquièmes/);
    } else expect(r.rejet).toBeNull();
  });
  it('les réformes sociales consensuelles trouvent une majorité, la flat tax non', () => {
    const e = nouvelle();
    expect(voterTexte(e, [{ id: 'grand_age', option: 'oui' }]).adopte).toBe(true);
    expect(voterTexte(e, [{ id: 'travailleurs_plateformes', option: 'oui' }]).adopte).toBe(true);
    expect(voterTexte(e, [{ id: 'flat_tax', option: 'vingt_cinq' }]).adopte).toBe(false);
  });
});

describe('Vote sur le contenu des textes (France)', () => {
  it('des majorités d\'idées : les mesures sociales passent, les 65 ans non', () => {
    const e = nouvelle();
    expect(voterTexte(e, [{ id: 'retraites_minimum', option: 'oui' }]).adopte).toBe(true);
    expect(voterTexte(e, [{ id: 'deserts_medicaux', option: 'regulation' }]).adopte).toBe(true);
    expect(voterTexte(e, [{ id: 'retraites_age', option: 'age_65' }]).adopte).toBe(false);
  });
  it('le 49.3 reste illimité pour les textes financiers, limité à un par session sinon', () => {
    const e = nouvelle();
    const r1 = validerReformes(e, [{ id: 'cdhr', option: 'prolonger' }], '49.3');
    const r2 = validerReformes(e, [{ id: 'taxe_holdings', option: 'oui' }], '49.3');
    expect(r1.rejet).toBeNull();
    expect(r2.rejet).toBeNull();
    validerReformes(e, [{ id: 'travail_dimanche', option: 'zones' }], '49.3');
    const r4 = validerReformes(e, [{ id: 'annualisation', option: 'accords' }], '49.3');
    expect(r4.rejet?.raison).toMatch(/déjà été utilisé/);
  });
  it('la proportionnelle intégrale donne des sièges proches des voix et supprime l\'effet des reports', () => {
    const e = nouvelle();
    const i = { RN: 33, centre: 20, LR: 9, gauche: 15, LFI: 12, ecolos: 5, autres: 6 };
    const majoritaire = siegesLegislativesFrance(e, i).blocs;
    e.politique.proportionnelle = 'integrale';
    const prop = siegesLegislativesFrance(e, i).blocs;
    expect(Math.abs(prop.RN / 577 - 0.33)).toBeLessThan(0.02);
    expect(Math.abs(prop.centre / 577 - 0.20)).toBeLessThan(0.02);
    // Au scrutin majoritaire, les reports de second tour favorisent le bloc central
    expect(majoritaire.centre).toBeGreaterThan(prop.centre);
  });
  it('la projection présidentielle part du point de départ sourcé', () => {
    const e = nouvelle();
    expect(projectionPresidentielle(e)).toBeCloseTo(e.politique.presidentielle.partCamp, 5);
  });
});

describe('Retraite par capitalisation', () => {
  it('le deuxième pilier alimente un fonds et crée une double charge', () => {
    let e = jouerTour(nouvelle(), { reformes: [{ id: 'capi_pilier', option: '2_2' }] }, SANS);
    for (let k = 0; k < 6; k++) e = jouerTour(e, {}, SANS);
    expect(e.capitalisation.pilier).toEqual({ employeur: 2, salarie: 2 });
    expect(fluxAnnuels(e).pilier).toBeGreaterThan(20);
    expect(doubleCharge(e)).toBeGreaterThan(20);
    expect(e.capitalisation.encours.pilier).toBeGreaterThan(30);
  });
  it('une transition financée par la dette creuse le déficit', () => {
    let avec = jouerTour(nouvelle(), { reformes: [{ id: 'capi_transition', option: 'dette' }] }, SANS);
    let sans = jouerTour(nouvelle(), {}, SANS);
    for (let k = 0; k < 6; k++) { avec = jouerTour(avec, {}, SANS); sans = jouerTour(sans, {}, SANS); }
    expect(avec.finances.deficit - sans.finances.deficit).toBeGreaterThan(8);
  });
  it('la projection est risquée : plus de volatilité élargit l\'éventail des pensions', () => {
    const base = { fluxAnnuel: 30, encours: 0, tauxIndividuel: 4, annees: 30 };
    const prudente = projeterCapitalisation({ ...base, allocation: 'prudente' });
    const dynamique = projeterCapitalisation({ ...base, allocation: 'dynamique' });
    const f = dynamique.parAn.at(-1);
    expect(f.p10).toBeLessThan(f.p50);
    expect(f.p50).toBeLessThan(f.p90);
    expect(dynamique.pensionSmic.p90 - dynamique.pensionSmic.p10).toBeGreaterThan(prudente.pensionSmic.p90 - prudente.pensionSmic.p10);
    expect(dynamique.pensionSmic.p50).toBeLessThan(dynamique.pensionCadre.p50);
  });
});
