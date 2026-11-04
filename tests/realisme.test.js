/**
 * Réalisme institutionnel : agences de notation et contrôle de
 * constitutionnalité des réformes.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeNotation, risqueConstitutionnel } from '../src/engine/index.js';
import { majNotation, pression } from '../src/engine/notation.js';
import { controleConstitutionnel } from '../src/engine/constitution.js';
import { adopterReforme, majReformes } from '../src/engine/reformes.js';
import { creerAleatoire } from '../src/engine/aleatoire.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 4, mode: 'facile', ...options });
const SANS = { evenementsActifs: false };
const certain = { tirage: () => true, normale: () => 0, uniforme: () => 0 };
const jamais = { tirage: () => false, normale: () => 0, uniforme: () => 0 };

describe('Agences de notation', () => {
  it('part des notes réelles de la France (novembre 2026)', () => {
    const r = resumeNotation(nouvelle());
    const par = Object.fromEntries(r.agences.map((a) => [a.id, a]));
    expect(par.moodys.note).toBe('Aa3');
    expect(par.moodys.perspective).toBe('negative');
    expect(par.fitch.note).toBe('A+');
    expect(par.fitch.perspective).toBe('negative');
    expect(par.sp.note).toBe('A+');
    // Seule S&P rend son avis au premier trimestre (Moody's et Fitch viennent de se prononcer)
    expect(par.sp.prochaineRevue).toBe('ce trimestre');
    expect(par.moodys.dans).toBeGreaterThan(0);
  });

  it('dégrade quand les fondamentaux se détériorent, et pas quand ils sont stables', () => {
    const e = nouvelle();
    e.trimestre = { annee: 2027, t: 2 }; e.tour = 3; // revues de Moody's et S&P
    const stable = structuredClone(e);
    expect(majNotation(stable, null).every((d) => d.action !== 'degradation')).toBe(true);
    e.finances.detteRatio += 12; // dérapage de la dette
    e.finances.credibilite -= 0.3;
    const decisions = majNotation(e, null);
    expect(decisions.some((d) => d.action === 'degradation')).toBe(true);
    expect(e.finances.chocTaux).toBeGreaterThan(0);
  });

  it('une perspective négative récente laisse du temps avant la dégradation', () => {
    const e = nouvelle();
    e.trimestre = { annee: 2027, t: 1 }; e.tour = 2; // revue de Fitch, perspective négative depuis octobre 2026
    e.finances.detteRatio += 8; // pression nette, mais inférieure au seuil d'une dégradation immédiate
    const fitch = e.notation.agences.find((a) => a.id === 'fitch');
    expect(pression(e, fitch)).toBeGreaterThan(0.5);
    expect(pression(e, fitch)).toBeLessThan(1);
    const d = majNotation(e, null).find((x) => x.agence === 'fitch');
    expect(d.action).not.toBe('degradation');
  });

  it('une politique crédible éloigne la menace (pression plus faible)', () => {
    const a = nouvelle(), b = nouvelle();
    b.finances.credibilite = Math.min(1, b.finances.credibilite + 0.5);
    const moodys = (x) => x.notation.agences.find((ag) => ag.id === 'moodys');
    expect(pression(b, moodys(b))).toBeLessThan(pression(a, moodys(a)));
  });

  it('l\'Allemagne reste notée AAA à politique inchangée sur deux ans', () => {
    let e = nouvelle('allemagne');
    for (let k = 0; k < 8; k++) e = jouerTour(e, {}, SANS);
    expect(resumeNotation(e).agences.every((a) => a.note === 'AAA' || a.note === 'Aaa')).toBe(true);
  });
});

describe('Contrôle de constitutionnalité', () => {
  it('connaît les réformes fragiles, selon l\'option et le pays', () => {
    expect(risqueConstitutionnel('france', 'taxe_hauts_patrimoines', 'oui')).toMatchObject({ type: 'totale', juridiction: 'Conseil constitutionnel' });
    expect(risqueConstitutionnel('etatsUnis', 'taxe_hauts_patrimoines', 'oui').juridiction).toBe('Cour suprême');
    expect(risqueConstitutionnel('france', 'oqtf', 'retention')).not.toBeNull();
    expect(risqueConstitutionnel('france', 'oqtf', 'visas')).toBeNull();
    expect(risqueConstitutionnel('france', 'retraites_age', 'age_65')).toBeNull();
  });

  it('censure totale, conformité, et pas de contrôle après un référendum', () => {
    const e = nouvelle();
    expect(controleConstitutionnel(e, 'taxe_hauts_patrimoines', 'oui', 'Impôt', certain).decision).toBe('totale');
    expect(controleConstitutionnel(e, 'taxe_hauts_patrimoines', 'oui', 'Impôt', jamais).decision).toBe('conforme');
    expect(controleConstitutionnel(e, 'taxe_hauts_patrimoines', 'oui', 'Impôt', certain, { referendum: true }).decision).toBe('non_controlee');
    expect(controleConstitutionnel(e, 'peines_planchers', 'retablir', 'Peines', certain)).toMatchObject({ decision: 'partielle', facteur: 0.6 });
  });

  it('une censure partielle réduit les effets de la réforme', () => {
    const a = nouvelle(), b = nouvelle();
    adopterReforme(a, 'taxe_hauts_patrimoines', 'oui', creerAleatoire(1));
    adopterReforme(b, 'taxe_hauts_patrimoines', 'oui', creerAleatoire(1), 0.6);
    for (const x of [a, b]) x.reformes.actives.at(-1).tourApplication = x.tour; // sans le délai de mise en œuvre
    const somme = (o) => Object.values(o).reduce((s, x) => s + x, 0);
    const ra = somme(majReformes(a, creerAleatoire(2)).recettes);
    const rb = somme(majReformes(b, creerAleatoire(2)).recettes);
    expect(ra).toBeGreaterThan(0);
    expect(rb).toBeCloseTo(ra * 0.6, 5);
  });

  it('dans une partie, une réforme censurée n\'entre pas en vigueur', () => {
    let censures = 0, adoptees = 0;
    for (let graine = 1; graine <= 12; graine++) {
      const e = jouerTour(nouvelle('france', { graine }), { reformes: [{ id: 'taxe_hauts_patrimoines', option: 'oui' }] }, { ...SANS, forcerReformes: true });
      const active = e.reformes.actives.some((x) => x.id === 'taxe_hauts_patrimoines');
      const decision = e.resultatsTour.constitution?.[0]?.decision;
      expect(decision).toBeDefined();
      if (decision === 'totale') { censures += 1; expect(active).toBe(false); } else { adoptees += 1; expect(active).toBe(true); }
    }
    expect(censures).toBeGreaterThan(0);
    expect(adoptees).toBeGreaterThan(0);
  });
});
