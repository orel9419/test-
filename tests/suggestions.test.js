/**
 * « Pour commencer » : suggestions de réformes selon la situation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, reformesDisponibles, voterTexte, suggestionsReformes } from '../src/engine/index.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const FICHIERS = { france: 'france', allemagne: 'allemagne', etatsUnis: 'etats-unis' };
const nouvelle = (pays = 'france') => creerPartie({ pays, donnees: lire(FICHIERS[pays]), contexte, graine: 17, mode: 'facile', calendrier: 'horizon2050' });

describe('Suggestions « Pour commencer »', () => {
  it('propose trois réformes distinctes, disponibles, avec une raison, dans les trois pays', () => {
    for (const pays of Object.keys(FICHIERS)) {
      const e = nouvelle(pays);
      const s = suggestionsReformes(e);
      expect(s.length, pays).toBe(3);
      expect(new Set(s.map((x) => x.id)).size).toBe(3);
      const dispo = reformesDisponibles(e);
      for (const x of s) {
        const r = dispo.find((d) => d.id === x.id);
        expect(r?.disponible, x.id).toBe(true);
        expect(r.options.some((o) => o.id === x.option)).toBe(true);
        expect(x.raison.length).toBeGreaterThan(10);
      }
    }
  });

  it('en France, la première suggestion est populaire et réunit une majorité', () => {
    const e = nouvelle('france');
    const [p] = suggestionsReformes(e);
    expect(p.opinion).toBeGreaterThanOrEqual(1);
    expect(p.votable).toBe(true);
    expect(voterTexte(e, [{ id: p.id, option: p.option }]).adopte).toBe(true);
  });

  it('ne suggère pas une réforme déjà en vigueur, et change avec la situation', () => {
    let e = nouvelle('france');
    const [p] = suggestionsReformes(e);
    e = jouerTour(e, { reformes: [{ id: p.id, option: p.option }] }, { evenementsActifs: false, sansPolitique: true, forcerReformes: true });
    expect(suggestionsReformes(e).map((x) => x.id)).not.toContain(p.id);
  });
});
