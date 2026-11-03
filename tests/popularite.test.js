/**
 * Leviers de popularité (communication, mesures populaires), solidité du
 * pouvoir et nouvelles réformes de l'État.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, actionsCommunication, effetOpinionReforme, soliditePouvoir, reformesDisponibles, bilanReformes } from '../src/engine/index.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 4, mode: 'facile', ...options });
const SANS = { evenementsActifs: false };

describe('Communication', () => {
  it('une action par trimestre améliore la popularité, durablement en partie', () => {
    let a = nouvelle(), b = nouvelle();
    const plan = [{ id: 'cap' }, { id: 'terrain', option: 'retraites' }, { id: 'elus' }, { id: 'terrain', option: 'salaries' }];
    for (const c of plan) { a = jouerTour(a, { communication: c }, SANS); b = jouerTour(b, {}, SANS); }
    expect(a.social.popularite - b.social.popularite).toBeGreaterThan(3);
    for (let k = 0; k < 4; k++) { a = jouerTour(a, {}, SANS); b = jouerTour(b, {}, SANS); }
    expect(a.social.popularite).toBeGreaterThan(b.social.popularite); // il en reste quelque chose
  });
  it('l\'usure réduit l\'efficacité, et certaines actions ont un délai de recharge', () => {
    let e = nouvelle();
    e = jouerTour(e, { communication: { id: 'allocution' } }, SANS);
    e = jouerTour(e, { communication: { id: 'allocution' } }, SANS);
    expect(actionsCommunication(e)[0].efficacite).toBeLessThan(1);
    e = jouerTour(e, { communication: { id: 'grand_debat' } }, SANS);
    const gd = actionsCommunication(e).find((x) => x.id === 'grand_debat');
    expect(gd.disponible).toBe(false);
    expect(gd.disponibleDans).toBeGreaterThan(0);
    const refus = jouerTour(e, { communication: { id: 'grand_debat' } }, SANS);
    expect(refus.resultatsTour.communication.erreur).toMatch(/pas encore possible/);
  });
  it('le grand débat apaise les griefs laissés par une réforme', () => {
    let e = jouerTour(nouvelle(), { reformes: [{ id: 'retraites_age', option: 'age_65' }] }, { ...SANS, forcerReformes: true });
    const grief = () => e.reformes.actives.find((r) => r.id === 'retraites_age').grief.salaries;
    const avant = grief();
    e = jouerTour(e, { communication: { id: 'grand_debat' } }, SANS);
    expect(grief()).toBeLessThan(avant * 0.75);
  });
  it('la popularité se décompose en composantes', () => {
    const e = jouerTour(nouvelle(), {}, SANS);
    expect(Object.keys(e.social.composantes)).toEqual(expect.arrayContaining(['economie', 'pouvoirAchat', 'budget', 'fiscalite', 'reformes']));
  });
});

describe('Mesures populaires et solidité du pouvoir', () => {
  it('estimation de l\'effet d\'une réforme sur l\'opinion', () => {
    const e = nouvelle();
    expect(effetOpinionReforme(e, 'retraites_age', 'age_65')).toBeLessThan(-3);
    expect(effetOpinionReforme(e, 'train_de_vie', 'exemplarite')).toBeGreaterThan(2);
    expect(effetOpinionReforme(e, 'prime_partage_valeur', 'relever')).toBeGreaterThan(1);
  });
  it('solidité du pouvoir : score, prochaine élection et menace, dans les trois pays', () => {
    for (const pays of ['france', 'allemagne', 'etatsUnis']) {
      const s = soliditePouvoir(nouvelle(pays));
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(s.election).not.toBeNull();
      expect(s.menace).not.toBeNull();
    }
    const fr = soliditePouvoir(nouvelle());
    expect(fr.election.nom).toMatch(/présidentielle/i);
  });
});

describe('Réformes de l\'État', () => {
  it('IA dans la fonction publique : coût d\'abord, économies nettes ensuite', () => {
    let e = jouerTour(nouvelle(), { reformes: [{ id: 'ia_fonction_publique', option: 'etat' }] }, { ...SANS, forcerReformes: true });
    for (let k = 0; k < 3; k++) e = jouerTour(e, {}, SANS);
    const debut = bilanReformes(e).find((l) => l.id === 'ia_fonction_publique');
    expect(debut.solde).toBeLessThan(0);
    for (let k = 0; k < 16; k++) e = jouerTour(e, {}, SANS);
    const fin = bilanReformes(e).find((l) => l.id === 'ia_fonction_publique');
    expect(fin.solde).toBeGreaterThan(2);
  });
  it('règle de performance : crédibilité et économies ; train de vie unique ; fusion des opérateurs', () => {
    const e0 = nouvelle();
    const e = jouerTour(e0, { reformes: [{ id: 'regle_performance', option: 'norme' }, { id: 'train_de_vie', option: 'exemplarite' }] }, { ...SANS, forcerReformes: true });
    expect(e.finances.credibilite).toBeGreaterThan(e0.finances.credibilite);
    expect(reformesDisponibles(e).find((r) => r.id === 'train_de_vie').disponible).toBe(false);
    expect(reformesDisponibles(e).find((r) => r.id === 'agences_operateurs').options.map((o) => o.id)).toContain('fusion_poles');
  });
});
