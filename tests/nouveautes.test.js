/**
 * Classements internationaux, rôle de président de la République et
 * réformes concrètes (nucléaire, défense, autoroutes, décentralisation).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, classementsTries, voterTexte, reformesDisponibles } from '../src/engine/index.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 9, ...options });
const SANS = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };
const jusqua = (e, annee, decisions = {}) => { e = jouerTour(e, decisions, SANS); while (e.trimestre.annee < annee && !e.termine) e = jouerTour(e, {}, SANS); return e; };

describe('Classements internationaux', () => {
  it('au départ : France 7e économie mondiale, 2e de la zone euro, 21 pays de l\'euro', () => {
    const e = nouvelle();
    const t = classementsTries(e);
    expect(e.classements.euro).toHaveLength(21);
    expect(t.monde[0].id).toBe('US');
    expect(t.monde[1].id).toBe('CN');
    expect(e.classements.depart.monde).toBe(7);
    expect(e.classements.depart.pibEuro).toBe(2);
    expect(t.dette.slice(0, 3).map((p) => p.id)).toEqual(expect.arrayContaining(['GR', 'IT', 'FR']));
  });
  it('le pays joué suit la simulation, les autres évoluent', () => {
    const e0 = nouvelle();
    const e = jusqua(e0, 2030);
    const fr = e.classements.euro.find((p) => p.id === 'FR');
    expect(fr.dette).toBeCloseTo(e.finances.detteRatio, 5);
    expect(fr.solde).toBeCloseTo(-e.finances.deficitRatio, 5);
    const inde0 = e0.classements.monde.find((p) => p.id === 'IN').pib;
    const inde = e.classements.monde.find((p) => p.id === 'IN').pib;
    expect(inde / inde0).toBeGreaterThan(1.25);
    expect(e.classements.historique.length).toBeGreaterThan(2);
  });
  it('les classements ne changent pas l\'aléa de la partie', () => {
    const a = jouerTour(nouvelle(), {});
    const b = jouerTour(nouvelle(), {});
    expect(a.graine).toBe(b.graine);
    expect(a.macro.pibNominal).toBe(b.macro.pibNominal);
  });
  it('fonctionne aussi pour les États-Unis (hors zone euro)', () => {
    const e = jusqua(nouvelle('etatsUnis'), 2028);
    expect(e.classements.dernier.monde).toBe(1);
    expect(e.classements.dernier.dette).toBeNull();
  });
});

describe('Président de la République', () => {
  it('nommer un Premier ministre de droite fait entrer LR au gouvernement et passer le PS dans l\'opposition', () => {
    const e = nouvelle('france', { role: 'president' });
    expect(e.statique.chefGouvernement.titre).toBe('Président de la République');
    const avant = voterTexte(e, [{ id: 'peines_planchers', option: 'retablir' }]);
    const apres = jouerTour(e, { nominationPM: 'droite' }, { evenementsActifs: false });
    expect(apres.politique.groupes.find((g) => g.id === 'DR').posture).toBe('gouvernement');
    expect(apres.politique.groupes.find((g) => g.id === 'SOC').posture).toBe('opposition');
    expect(apres.politique.premierMinistre.profil).toBe('droite');
    expect(avant.pour).toBeGreaterThan(0);
    // Un Premier ministre socialiste rend les mesures sociales plus faciles à faire voter
    const gauche = jouerTour(e, { nominationPM: 'gauche' }, { evenementsActifs: false });
    expect(gauche.politique.groupes.find((g) => g.id === 'SOC').posture).toBe('gouvernement');
    expect(voterTexte(gauche, [{ id: 'smic_hausse', option: gauche.politique && reformesDisponibles(gauche).find((r) => r.id === 'smic_hausse').options[0].id }]).pour)
      .toBeGreaterThanOrEqual(voterTexte(e, [{ id: 'smic_hausse', option: reformesDisponibles(e).find((r) => r.id === 'smic_hausse').options[0].id }]).pour);
  });
  it('une censure renverse le gouvernement, pas le président, même sur un seul mandat', () => {
    const decisions = (e) => ({ procedureBudget: '49.3', budget: { protectionSociale: -8, sante: -8, education: -8 }, impots: { tva: e.impots.tva.taux + 2, csg: e.impots.csg.taux + 1 }, reformes: [{ id: 'retraites_age', option: 'age_65' }] });
    const e = nouvelle('france', { role: 'president', calendrier: 'reel', mode: 'intermediaire', graine: 11 });
    const apres = jouerTour(e, decisions(e), { evenementsActifs: false });
    expect(apres.resultatsTour.budget.censure.adoptee).toBe(true);
    expect(apres.termine).toBe(false);
    expect(apres.politique.gouvernementsRenverses).toBe(1);
  });
});

describe('Réformes concrètes', () => {
  it('le catalogue français dépasse 110 réformes', () => {
    expect(reformesDisponibles(nouvelle()).length).toBeGreaterThanOrEqual(110);
  });
  it('EPR2 : la dette monte pendant la construction, les émissions baissent après 2038', () => {
    const sans = jusqua(nouvelle('france', { calendrier: 'horizon2050', mode: 'facile' }), 2045);
    const avec = jusqua(nouvelle('france', { calendrier: 'horizon2050', mode: 'facile' }), 2045, { reformes: [{ id: 'nucleaire_epr2', option: 'six' }] });
    expect(sans.climat.emissions - avec.climat.emissions).toBeGreaterThan(8);
    expect(avec.entreprises.souverainete).toBeGreaterThan(sans.entreprises.souverainete);
    const chantier = jusqua(nouvelle('france', { calendrier: 'horizon2050', mode: 'facile' }), 2032, { reformes: [{ id: 'nucleaire_epr2', option: 'six' }] });
    const temoin = jusqua(nouvelle('france', { calendrier: 'horizon2050', mode: 'facile' }), 2032);
    expect(chantier.finances.dette - temoin.finances.dette).toBeGreaterThan(10);
  });
  it('autoroutes : la régie publique rapporte à l\'échéance des concessions, le rachat coûte tout de suite', () => {
    const base = nouvelle('france', { calendrier: 'horizon2050', mode: 'facile' });
    const regie2029 = jusqua(base, 2029, { reformes: [{ id: 'autoroutes', option: 'regie' }] });
    const temoin2029 = jusqua(base, 2029);
    expect(Math.abs(regie2029.finances.deficit - temoin2029.finances.deficit)).toBeLessThan(0.5);
    const rachat = jusqua(base, 2028, { reformes: [{ id: 'autoroutes', option: 'racheter' }] });
    const temoin = jusqua(base, 2028);
    expect(rachat.finances.dette - temoin.finances.dette).toBeGreaterThan(25);
    expect(voterTexte(base, [{ id: 'autoroutes', option: 'regie' }]).adopte).toBe(true);
    expect(voterTexte(base, [{ id: 'autoroutes', option: 'racheter' }]).adopte).toBe(false);
  });
  it('défense : viser 3,5 % du PIB augmente le budget des armées et l\'influence', () => {
    const base = nouvelle('france', { calendrier: 'horizon2050', mode: 'facile' });
    const otan = jusqua(base, 2036, { reformes: [{ id: 'effort_defense', option: 'otan' }] });
    expect(otan.budget.defense.montant / otan.macro.pibNominal * 100).toBeGreaterThan(3.2);
    const temoin = jusqua(base, 2036);
    expect(otan.international.influence).toBeGreaterThan(temoin.international.influence);
  });
  it('la fusion régions-départements est une révision constitutionnelle (trois cinquièmes)', () => {
    const e = nouvelle();
    expect(reformesDisponibles(e).find((r) => r.id === 'provinces').majoriteRenforcee).toBe(true);
    expect(reformesDisponibles(e).find((r) => r.id === 'agences_operateurs').options.map((o) => o.id)).toContain('doublons');
  });
});
