/**
 * Négociations au G7 : rotation, domaine réservé, consensus, concessions,
 * bilatérales, préparation et effets du sommet.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, previsionG7, prochainSommet, peutNegocier } from '../src/engine/index.js';
import { hoteG7 } from '../src/engine/g7.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 8, mode: 'facile', calendrier: 'horizon2050', ...options });
const ambition = (ids, niveau = 'ambitieux') => Object.fromEntries(ids.map((i) => [i, niveau]));

describe('G7', () => {
  it('rotation de la présidence : États-Unis 2027, Royaume-Uni 2028, France 2033 et 2040', () => {
    expect(hoteG7(2026)).toBe('france');
    expect(hoteG7(2027)).toBe('etatsUnis');
    expect(hoteG7(2028)).toBe('royaumeUni');
    expect(hoteG7(2033)).toBe('france');
    expect(hoteG7(2040)).toBe('france');
    const s = prochainSommet(nouvelle());
    expect(s).toMatchObject({ annee: 2027, hote: 'etatsUnis', trimestresAvant: 2, ceTrimestre: false });
  });
  it('domaine réservé : le président négocie, pas le Premier ministre ; le chancelier et le président américain négocient', () => {
    expect(peutNegocier(nouvelle('france', { role: 'president' }))).toBe(true);
    expect(peutNegocier(nouvelle('france'))).toBe(false);
    expect(peutNegocier(nouvelle('allemagne'))).toBe(true);
    expect(peutNegocier(nouvelle('etatsUnis'))).toBe(true);
  });
  it('consensus : face à Washington, les bilatérales et les concessions débloquent un accord commercial', () => {
    const e = nouvelle('france', { role: 'president' });
    const base = { priorites: ['commerce'], ambition: ambition(['commerce']) };
    const seul = previsionG7(e, base).agenda.find((d) => d.id === 'commerce').probabilites;
    const aide = previsionG7(e, { ...base, bilaterales: ['etatsUnis'], concessions: ['gnl', 'numerique'] }).agenda.find((d) => d.id === 'commerce').probabilites;
    expect(seul.echec).toBeGreaterThan(0.8);
    expect(aide.echec).toBeLessThan(seul.echec - 0.5);
    expect(aide.ambitieux).toBeGreaterThan(seul.ambitieux);
    // Viser un compromis est plus sûr que viser un accord ambitieux
    const modeste = previsionG7(e, { priorites: ['commerce'], ambition: ambition(['commerce'], 'compromis') }).agenda.find((d) => d.id === 'commerce').probabilites;
    expect(modeste.echec).toBeLessThan(seul.echec);
  });
  it('préparation par les sherpas : coûte du capital diplomatique et améliore les chances', () => {
    let e = nouvelle('france', { role: 'president' });
    const dec = { priorites: ['energie'], ambition: ambition(['energie']) };
    const avant = previsionG7(e, dec).agenda.find((d) => d.id === 'energie').probabilites.ambitieux;
    e = jouerTour(e, { g7Preparation: true });
    expect(e.g7.preparation).toBe(1);
    e = jouerTour(e, { g7Preparation: true });
    expect(e.g7.preparation).toBe(2);
    expect(previsionG7(e, dec).agenda.find((d) => d.id === 'energie').probabilites.ambitieux).toBeGreaterThan(avant);
  });
  it('le sommet se tient au T2 : résultats, journal, effets (énergie), concessions appliquées', () => {
    let e = nouvelle('france', { role: 'president' });
    e = jouerTour(e, { g7Preparation: true });
    e = jouerTour(e, { g7Preparation: true });
    expect(prochainSommet(e).ceTrimestre).toBe(true);
    const relUE = e.international.relations.ue;
    e = jouerTour(e, { g7: { priorites: ['energie', 'commerce'], ambition: { energie: 'ambitieux', commerce: 'compromis' }, bilaterales: ['etatsUnis'], concessions: ['gnl'] } });
    const g = e.resultatsTour.g7;
    expect(g.annee).toBe(2027);
    expect(g.resultats).toHaveLength(4);
    expect(g.priorites).toEqual(['energie', 'commerce']);
    expect(e.g7.historique).toHaveLength(1);
    expect(e.g7.preparation).toBe(0);
    expect(e.journal.some((j) => /Sommet du G7 2027/.test(j.texte))).toBe(true);
    const energie = g.resultats.find((r) => r.id === 'energie');
    if (energie.niveau === 'ambitieux') expect(e.international.modificateurs.some((m) => m.type === 'facteurEnergie' && m.valeur < 0.9)).toBe(true);
    expect(e.international.relations.ue).toBeLessThan(relUE + 0.01); // concession GNL : relations européennes en baisse
  });
  it('un Premier ministre voit le sommet se tenir avec les priorités de l\'Élysée', () => {
    let e = nouvelle('france');
    for (let k = 0; k < 3; k++) e = jouerTour(e, { g7: { priorites: ['commerce'] } });
    expect(e.g7.historique[0].negocie).toBe(false);
    expect(e.g7.historique[0].priorites).not.toContain('commerce');
  });
  it('les anciens événements G7 du calendrier sont remplacés par le module de négociation', () => {
    let e = nouvelle('allemagne');
    for (let k = 0; k < 12; k++) {
      expect(e.evenements.enAttente.some((ev) => ev.id.startsWith('g7_'))).toBe(false);
      e = jouerTour(e, { evenements: Object.fromEntries(e.evenements.enAttente.map((ev) => [ev.id, ev.choix[0].id])) });
    }
    expect(e.g7.historique.map((h) => h.annee)).toEqual([2027, 2028, 2029]);
  });
});
