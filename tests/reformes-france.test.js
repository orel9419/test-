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

describe('Retraite à 68 ans, semaine de 40 h, système mixte', () => {
  it('68 ans : l\'âge légal monte de 6 mois par an et la dépense de pensions baisse plus qu\'avec 65 ans', () => {
    const suivre = (option) => {
      let e = jouerTour(nouvelle(), { reformes: [{ id: 'retraites_age', option }] }, SANS);
      for (let k = 0; k < 15; k++) e = jouerTour(e, {}, SANS);
      return e;
    };
    const a65 = suivre('age_65');
    const a68 = suivre('age_68');
    const rapide = suivre('age_68_rapide');
    expect(a68.retraites.ageCible).toBe(68);
    expect(a68.retraites.ageLegal).toBeGreaterThanOrEqual(64.5);
    expect(a68.retraites.ageLegal).toBeLessThan(68);
    // À 6 mois par an, 65 et 68 ans coïncident pendant le quinquennat ; à 9 mois par an, l'effet est visible
    expect(a68.retraites.ageLegal).toBeCloseTo(a65.retraites.ageLegal, 5);
    expect(rapide.retraites.ageLegal).toBeGreaterThan(a65.retraites.ageLegal + 0.5);
    expect(rapide.retraites.depenses).toBeLessThan(a65.retraites.depenses - 5);
    // Plus clivant que 65 ans : rejeté à l'Assemblée sans 49.3
    expect(voterTexte(nouvelle(), [{ id: 'retraites_age', option: 'age_68' }]).adopte).toBe(false);
  });
  it('40 h : plus d\'heures qu\'à 39 h, et des exonérations plus coûteuses', () => {
    const suivre = (option) => {
      let e = jouerTour(nouvelle(), { reformes: [{ id: 'temps_travail', option }] }, SANS);
      for (let k = 0; k < 8; k++) e = jouerTour(e, {}, SANS);
      return e.travail;
    };
    const h39 = suivre('39h_normal'), h40 = suivre('40h_normal');
    expect(h40.dureeReference).toBe(40);
    expect(h40.deltaHeures).toBeGreaterThan(h39.deltaHeures);
    expect(suivre('40h_exo5').coutBudgetaire).toBeGreaterThan(suivre('39h_exo4').coutBudgetaire);
    expect(suivre('40h_non_payees').chomageStructurel).toBeLessThan(suivre('39h_non_payees').chomageStructurel);
  });
  it('système mixte : bascule progressive vers 14 points, double charge selon le financement', () => {
    const suivre = (option, n = 16) => {
      let e = jouerTour(nouvelle(), { reformes: [{ id: 'capi_mixte', option }] }, SANS);
      for (let k = 0; k < n; k++) e = jouerTour(e, {}, SANS);
      return e;
    };
    const dette = suivre('dette');
    const t = dette.capitalisation.transition;
    expect(t.cible).toBe(14);
    expect(t.points).toBeGreaterThan(2);
    expect(t.points).toBeLessThan(14);
    expect(fluxAnnuels(dette).transition).toBeGreaterThan(20);
    expect(doubleCharge(dette)).toBeGreaterThan(20);
    // Financée par la dette, la bascule creuse le déficit ; financée par les pensions, non
    const pensions = suivre('pensions');
    expect(dette.finances.deficit - pensions.finances.deficit).toBeGreaterThan(15);
    // La bascule lente avance deux fois moins vite
    expect(suivre('etale').capitalisation.transition.points).toBeCloseTo(t.points / 2, 5);
  });
  it('le système mixte remplace la transition partielle à 2 points', () => {
    let e = jouerTour(nouvelle(), { reformes: [{ id: 'capi_transition', option: 'dette' }] }, SANS);
    for (let k = 0; k < 4; k++) e = jouerTour(e, {}, SANS);
    expect(e.capitalisation.transition.points).toBe(2);
    e = jouerTour(e, { reformes: [{ id: 'capi_mixte', option: 'impots' }] }, SANS);
    const ids = e.reformes.actives.map((a) => a.id);
    expect(ids).toContain('capi_mixte');
    expect(ids).not.toContain('capi_transition');
    expect(e.capitalisation.transition).toBeNull();
  });
  it('la projection tient compte de la montée progressive des versements', () => {
    const base = { fluxAnnuel: 0, encours: 0, tauxIndividuel: 0, allocation: 'equilibree', annees: 30 };
    const sans = projeterCapitalisation(base);
    const avec = projeterCapitalisation({ ...base, montee: { flux: 100, taux: 14, annees: 14 } });
    expect(sans.pensionSmic.p50).toBe(0);
    expect(avec.pensionSmic.p50).toBeGreaterThan(100);
    expect(avec.parAn.at(-1).p50).toBeGreaterThan(1000);
  });
});
