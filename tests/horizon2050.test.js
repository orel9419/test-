/**
 * Partie longue jusqu'en 2050 : calendrier électoral prolongé, présidentielles
 * successives, remaniement après une censure, bac à sable après une défaite,
 * démographie, vieillissement et objectifs de long terme.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, continuerPartie } from '../src/engine/index.js';
import { projectionPresidentielleEtatsUnis } from '../src/engine/objectifs.js';
import { replanifier, nbToursJusqua } from '../src/engine/horizon.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays, options = {}) => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 5, calendrier: 'horizon2050', ...options });
const SANS = { evenementsActifs: false, sansPolitique: true };
const annees = (e, type) => e.statique.calendrier.echeances.filter((x) => x.type === type).map((x) => x.annee);
const jouerJusquA = (e, annee, decisions = {}, options = SANS) => {
  while (!e.termine && e.trimestre.annee < annee) e = jouerTour(e, decisions, options);
  return e;
};

describe('Calendrier jusqu\'en 2050', () => {
  it('97 trimestres, du T4 2026 au T4 2050', () => {
    const e = nouvelle('france');
    expect(e.nbTours).toBe(97);
    expect(nbToursJusqua({ annee: 2026, t: 4 })).toBe(97);
    expect(e.horizon).toBe(2050);
    expect(e.nbToursMandat).toBe(20);
  });
  it('France : présidentielles tous les 5 ans, municipales et régionales tous les 6 ans, européennes tous les 5 ans', () => {
    const e = nouvelle('france');
    expect(annees(e, 'presidentielle')).toEqual([2027, 2032, 2037, 2042, 2047]);
    expect(annees(e, 'municipales')).toEqual([2032, 2038, 2044, 2050]);
    expect(annees(e, 'regionales')).toEqual([2028, 2034, 2040, 2046]);
    expect(annees(e, 'europeennes')).toEqual([2029, 2034, 2039, 2044, 2049]);
  });
  it('Allemagne : Bundestag tous les 4 ans ; États-Unis : présidentielle tous les 4 ans et mi-mandat entre deux', () => {
    expect(annees(nouvelle('allemagne'), 'legislatives')).toEqual([2029, 2033, 2037, 2041, 2045, 2049]);
    const us = nouvelle('etatsUnis');
    expect(annees(us, 'presidentielle')).toEqual([2028, 2032, 2036, 2040, 2044, 2048]);
    expect(annees(us, 'mi_mandat')).toEqual([2026, 2030, 2034, 2038, 2042, 2046, 2050]);
  });
  it('une élection fédérale anticipée recale les suivantes de 4 ans', () => {
    const e = nouvelle('allemagne');
    e.trimestre = { annee: 2030, t: 2 };
    replanifier(e, 'legislatives', 4);
    expect(e.statique.calendrier.echeances.filter((x) => x.type === 'legislatives' && x.annee > 2030).map((x) => `${x.annee}T${x.t}`)).toEqual(['2034T2', '2038T2', '2042T2', '2046T2', '2050T2']);
  });
  it('le calendrier d\'un seul mandat reste inchangé', () => {
    const e = nouvelle('france', { calendrier: 'reel' });
    expect(e.nbTours).toBe(20);
    expect(e.horizon).toBeUndefined();
    expect(annees(e, 'presidentielle')).toEqual([2027]);
  });
});

describe('Politique sur le long terme', () => {
  it('France : une censure provoque un remaniement en partie longue, une défaite sinon', () => {
    const decisions = (e) => ({ procedureBudget: '49.3', budget: { protectionSociale: -8, sante: -8, education: -8 }, impots: { tva: e.impots.tva.taux + 2, csg: e.impots.csg.taux + 1 }, reformes: [{ id: 'retraites_age', option: 'age_65' }] });
    const court = nouvelle('france', { calendrier: 'reel', mode: 'intermediaire', graine: 11 });
    const long = nouvelle('france', { mode: 'intermediaire', graine: 11 });
    const a = jouerTour(court, decisions(court), { evenementsActifs: false });
    const b = jouerTour(long, decisions(long), { evenementsActifs: false });
    expect(a.resultatsTour.budget.censure.adoptee).toBe(true);
    expect(a.termine).toBe(true);
    expect(b.termine).toBe(false);
    expect(b.politique.gouvernementsRenverses).toBe(1);
    expect(b.politique.graceJusqua).toBeGreaterThan(b.tour - 1);
  });
  it('mode Facile : la France tient cinq présidentielles jusqu\'en 2050', () => {
    let e = nouvelle('france', { mode: 'facile' });
    while (!e.termine) e = jouerTour(e, { evenements: Object.fromEntries(e.evenements.enAttente.map((ev) => [ev.id, ev.choix[0].id])) });
    expect(e.issue.type).toBe('fin_mandat');
    expect(e.trimestre.annee).toBe(2051);
    expect(e.politique.presidentielles.map((p) => p.annee)).toEqual([2027, 2032, 2037, 2042, 2047]);
    expect(e.score.total).toBeGreaterThan(0);
  });
  it('États-Unis : usure du pouvoir pour un troisième mandat consécutif du même camp', () => {
    const e = nouvelle('etatsUnis');
    const avant = projectionPresidentielleEtatsUnis(e);
    e.politique.presidentielle.mandatsConsecutifs = 2;
    expect(projectionPresidentielleEtatsUnis(e)).toBeCloseTo(avant - 3, 5);
  });
  it('après une défaite, la partie peut continuer en bac à sable jusqu\'en 2050', () => {
    let e = nouvelle('etatsUnis', { mode: 'intermediaire', graine: 3 });
    while (!e.termine) e = jouerTour(e, { evenements: Object.fromEntries(e.evenements.enAttente.map((ev) => [ev.id, ev.choix[0].id])) });
    if (e.issue.type !== 'defaite') return; // trajectoire gagnante : rien à tester
    const scoreDefaite = e.score.total;
    e = continuerPartie(e);
    expect(e.termine).toBe(false);
    expect(e.bacASable).toBe(true);
    expect(e.defaites[0].score).toBe(scoreDefaite);
    while (!e.termine) e = jouerTour(e, { evenements: Object.fromEntries(e.evenements.enAttente.map((ev) => [ev.id, ev.choix[0].id])) });
    expect(e.issue.type).toBe('fin_mandat');
    expect(e.trimestre.annee).toBe(2051);
  });
});

describe('Démographie, vieillissement et objectifs de long terme', () => {
  it('trajectoires plausibles à politique inchangée dans les trois pays', () => {
    for (const pays of ['france', 'allemagne', 'etatsUnis']) {
      const e = jouerJusquA(nouvelle(pays), 2051);
      for (const v of [e.finances.detteRatio, e.finances.deficitRatio, e.macro.pibNominal, e.macro.chomage, e.finances.taux10]) expect(Number.isFinite(v)).toBe(true);
      expect(e.finances.detteRatio).toBeGreaterThan(50);
      expect(e.finances.detteRatio).toBeLessThan(220);
      expect(e.macro.chomage).toBeGreaterThan(2);
      expect(e.macro.chomage).toBeLessThan(15);
    }
  });
  it('France : la hausse du nombre de retraités ralentit après le baby-boom ; la dette dérive sans réforme', () => {
    const e = jouerJusquA(nouvelle('france'), 2051);
    expect(e.retraites.nbRetraites).toBeGreaterThan(19);
    expect(e.retraites.nbRetraites).toBeLessThan(23);
    expect(e.finances.detteRatio).toBeGreaterThan(130);
  });
  it('santé : à 0 %, la dépense suit les besoins liés au vieillissement', () => {
    const e = jouerJusquA(nouvelle('france'), 2036);
    const s = e.budget.sante;
    expect(s.facteurBesoins).toBeGreaterThan(1.07);
    const enVolume = s.montant / (s.montantInitial * e.macro.niveauPrix / 100);
    expect(enVolume).toBeGreaterThan(1.05);
  });
  it('États-Unis : épuisement du fonds de la Social Security vers 2034 et baisse automatique des pensions', () => {
    let e = nouvelle('etatsUnis');
    let pensionAvant = null;
    while (!e.retraites.fondsSS.epuise && e.trimestre.annee < 2040) { pensionAvant = e.retraites.pensionMoyenne; e = jouerTour(e, {}, SANS); }
    expect(e.retraites.fondsSS.epuise).toBeGreaterThanOrEqual(2033);
    expect(e.retraites.fondsSS.epuise).toBeLessThanOrEqual(2035);
    expect(e.retraites.pensionMoyenne / pensionAvant).toBeLessThan(0.85);
    expect(e.journal.some((j) => /Social Security est épuisé/.test(j.texte))).toBe(true);
  });
  it('objectifs : ceux du mandat sont jugés à sa fin, ceux de 2050 au dernier trimestre', () => {
    const e = nouvelle('france');
    const ids = e.objectifs.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['dette2050', 'climat2050', 'retraites2050', 'censures']));
    for (const o of e.objectifs.filter((x) => x.categorie === 'long_terme')) expect(o.echeanceTour).toBe(97);
    const deficit = e.objectifs.find((o) => o.id === 'deficit');
    if (deficit) expect(deficit.echeanceTour).toBe(20);
    const climat = e.objectifs.find((o) => o.id === 'climat2050');
    expect(climat.cible).toBe(80);
  });
});
