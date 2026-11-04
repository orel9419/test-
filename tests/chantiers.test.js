/**
 * Chantiers des grands événements (JO 2030, Coupe du monde 2038, G7 2033) et
 * candidature à la Coupe du monde (scénario de jeu).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeChantiers } from '../src/engine/index.js';
import { attribuerLot, qualiteChantier } from '../src/engine/chantiers.js';
import { depensesTemporairesActives } from '../src/engine/evenements.js';
import { GRANDS_EVENEMENTS } from '../src/data/grandsEvenements.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (options = {}) => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 8, mode: 'facile', calendrier: 'horizon2050', ...options });
const SANS = { evenementsActifs: false };
const certain = { tirage: () => true, normale: () => 0, uniforme: () => 0.05 };

describe('Chantiers des grands événements', () => {
  it('propose les lots des JO 2030 avec les offres de grandes entreprises du CAC 40', () => {
    const jo = resumeChantiers(nouvelle()).find((c) => c.id === 'jo2030');
    expect(jo.lots.map((l) => l.id)).toEqual(expect.arrayContaining(['sites', 'securite', 'energie', 'accueil', 'numerique']));
    const sites = jo.lots.find((l) => l.id === 'sites');
    expect(sites.offres.find((o) => o.entreprise === 'vinci')).toMatchObject({ nom: 'Vinci', cac40: true });
    expect(sites.offres.some((o) => !o.francaise)).toBe(true);
    // La Coupe du monde n'apparaît que si la France l'obtient
    expect(resumeChantiers(nouvelle()).some((c) => c.id === 'cdm2038')).toBe(false);
  });

  it('attribuer un lot étale le coût public jusqu\'au jour J et soutient l\'entreprise', () => {
    const e = nouvelle();
    const avant = e.entreprises.fleurons.find((f) => f.id === 'vinci').valeur;
    const r = attribuerLot(e, 'jo2030', 'sites', 0);
    expect(r.texte).toContain('Vinci');
    expect(depensesTemporairesActives(e).transports).toBeGreaterThan(0);
    expect(e.entreprises.fleurons.find((f) => f.id === 'vinci').valeur).toBeGreaterThan(avant);
    expect(attribuerLot(e, 'jo2030', 'sites', 1).erreur).toBeDefined(); // déjà attribué
    expect(qualiteChantier(e, 'jo2030')).toBeCloseTo(0.85, 5);
  });

  it('une offre étrangère bon marché réduit la qualité et la souveraineté', () => {
    const a = nouvelle(), b = nouvelle();
    attribuerLot(a, 'jo2030', 'sites', 0);
    attribuerLot(b, 'jo2030', 'sites', 3);
    expect(qualiteChantier(b, 'jo2030')).toBeLessThan(qualiteChantier(a, 'jo2030'));
    expect(b.entreprises.bonusSouverainete).toBeLessThan(a.entreprises.bonusSouverainete);
  });

  it('les lots oubliés sont attribués d\'office à l\'offre la moins chère à la date limite', () => {
    let e = nouvelle();
    while (!(e.trimestre.annee === 2029 && e.trimestre.t === 4) && !e.termine) e = jouerTour(e, {}, SANS);
    expect(Object.keys(e.chantiers.jo2030.lots)).toHaveLength(5);
    expect(e.journal.some((j) => j.texte.includes('Faute de décision'))).toBe(true);
  });

  it('la candidature à la Coupe du monde peut aboutir et ouvrir les chantiers', () => {
    const e = nouvelle();
    const cand = GRANDS_EVENEMENTS.find((x) => x.id === 'cdm2038_candidature');
    const vote = GRANDS_EVENEMENTS.find((x) => x.id === 'cdm2038_vote');
    e.grandsEvenements.cdm2038 = { candidature: cand.choix[0].effets(e).grandEvenement.candidature };
    const eff = vote.choix[0].effets(e, certain);
    expect(eff.grandEvenement.attribuee).toBe(true);
    e.grandsEvenements.cdm2038.attribuee = true;
    const c = resumeChantiers(e).find((x) => x.id === 'cdm2038');
    expect(c.lots.find((l) => l.id === 'stades').offres.some((o) => o.entreprise === 'bouygues')).toBe(true);
  });
});
