/**
 * Régalien : programmes d'armement, capacités, opérations, exportations,
 * dissuasion (domaine réservé).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeDefense } from '../src/engine/index.js';
import { deciderDefense } from '../src/engine/defense.js';
import { depensesTemporairesActives } from '../src/engine/evenements.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 5, mode: 'facile', calendrier: 'horizon2050', ...options });
const SANS = { evenementsActifs: false };
const certain = { tirage: () => true, normale: () => 0, uniforme: () => 0 };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, SANS); for (let k = 1; k < n; k++) x = jouerTour(x, {}, SANS); return x; };

describe('Programmes d\'armement', () => {
  it('part de la situation réelle : environ 150 Rafale, SNLE 3G et porte-avions à venir', () => {
    const r = resumeDefense(nouvelle());
    expect(r.capacites.rafale).toBe(150);
    expect(r.programmes.map((p) => p.id)).toEqual(expect.arrayContaining(['rafale', 'snle3g', 'pang', 'successeur']));
    expect(r.pctPIB).toBeGreaterThan(1.5);
    expect(r.pctPIB).toBeLessThan(2.6);
  });

  it('suit la LPM (178 Rafale fin 2030), plus avec une tranche, moins avec un étalement', () => {
    const nominal = jouer(nouvelle(), 17);
    const tranche = jouer(nouvelle(), 17, { defense: { programmes: { rafale: 'tranche' } } });
    const etale = jouer(nouvelle(), 17, { defense: { programmes: { rafale: 'etaler' } } });
    expect(Math.round(resumeDefense(nominal).capacites.rafale)).toBe(178);
    expect(resumeDefense(tranche).capacites.rafale).toBeGreaterThan(185);
    expect(resumeDefense(etale).capacites.rafale).toBeLessThan(175);
  });

  it('un étalement économise d\'abord, puis coûte plus cher (rattrapage différé)', () => {
    const e = nouvelle();
    deciderDefense(e, { programmes: { rafale: 'etaler' } }, certain);
    expect(depensesTemporairesActives(e).defense).toBeLessThan(0);
    e.tour += 13;
    expect(depensesTemporairesActives(e).defense).toBeGreaterThan(0);
  });

  it('le premier SNLE 3G entre en service vers 2035 si le calendrier est sécurisé', () => {
    let e = jouer(nouvelle('france', { role: 'president' }), 1, { defense: { programmes: { snle3g: 'securiser' } } });
    while (e.trimestre.annee < 2036 && !e.termine) e = jouerTour(e, {}, SANS);
    expect(resumeDefense(e).capacites.snle3g).toBe(1);
    expect(e.journal.some((j) => j.texte.includes('L\'Invincible'))).toBe(true);
  });
});

describe('Opérations, exportations et dissuasion', () => {
  it('une opération renforcée coûte chaque année et remplace l\'option précédente', () => {
    const e = nouvelle();
    deciderDefense(e, { operations: { aigle: 'renforcer' } }, certain);
    expect(depensesTemporairesActives(e).defense).toBeCloseTo(0.4 * e.macro.niveauPrix / 100, 5);
    deciderDefense(e, { operations: { aigle: 'maintenir' } }, certain);
    expect(depensesTemporairesActives(e).defense ?? 0).toBeCloseTo(0, 5);
  });

  it('un contrat d\'exportation gagné fait monter Dassault Aviation et l\'influence', () => {
    const e = nouvelle();
    const avant = e.entreprises.fleurons.find((f) => f.id === 'dassault').valeur;
    const influence = e.international.bonusInfluence;
    const r = deciderDefense(e, { exports: ['inde_mrfa'] }, certain);
    expect(r[0].succes).toBe(true);
    expect(e.defense.exports.inde_mrfa.statut).toBe('gagne');
    expect(e.entreprises.fleurons.find((f) => f.id === 'dassault').valeur).toBeGreaterThan(avant);
    expect(e.international.bonusInfluence).toBeGreaterThan(influence);
  });

  it('la dissuasion relève du seul président de la République', () => {
    const pm = nouvelle('france', { role: 'chef_gouvernement' });
    deciderDefense(pm, { dissuasion: 'dialogue' }, certain);
    expect(pm.defense.dissuasion).toBe('statu_quo');
    const pr = nouvelle('france', { role: 'president' });
    const ue = pr.international.relations.ue;
    deciderDefense(pr, { dissuasion: 'dialogue' }, certain);
    expect(pr.defense.dissuasion).toBe('dialogue');
    expect(pr.international.relations.ue).toBeGreaterThan(ue);
  });

  it('les autres pays ont leurs propres programmes, et une ancienne sauvegarde reste jouable', () => {
    expect(resumeDefense(nouvelle('allemagne')).programmes.some((p) => p.id === 'f35')).toBe(true);
    expect(resumeDefense(nouvelle('etatsUnis')).programmes.some((p) => p.id === 'b21')).toBe(true);
    const e = nouvelle();
    delete e.defense;
    const x = jouerTour(e, {}, SANS);
    expect(resumeDefense(x).capacites.rafale).toBeGreaterThan(150);
  });
});
