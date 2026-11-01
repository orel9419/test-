/** Tests de lecture des formats des API officielles (sans réseau). */
import { describe, it, expect } from 'vitest';
import { serieTemporelle, derniere, urlEurostat, serieFMI, serieBanqueMondiale } from '../scripts/lib/jsonstat.mjs';

describe('Lecture des réponses des API', () => {
  it('lit une réponse JSON-stat d\'Eurostat filtrée', () => {
    const js = {
      id: ['freq', 'unit', 'sector', 'na_item', 'geo', 'time'], size: [1, 1, 1, 1, 1, 3],
      dimension: { time: { category: { index: { 2023: 0, 2024: 1, 2025: 2 } } } },
      value: { 0: 109.8, 1: 113.2, 2: 115.6 },
    };
    const s = serieTemporelle(js);
    expect(s).toHaveLength(3);
    expect(derniere(s)).toEqual({ periode: '2025', valeur: 115.6 });
  });
  it('ignore les périodes sans valeur et refuse une requête non filtrée', () => {
    const js = { id: ['geo', 'time'], size: [1, 2], dimension: { time: { category: { index: { 2024: 0, 2025: 1 } } } }, value: { 0: 2.1 } };
    expect(serieTemporelle(js)).toEqual([{ periode: '2024', valeur: 2.1 }]);
    expect(() => serieTemporelle({ ...js, size: [2, 2] })).toThrow(/non filtrée/);
  });
  it('construit une URL Eurostat', () => {
    expect(urlEurostat('gov_10dd_edpt1', { geo: 'FR', unit: 'PC_GDP' })).toContain('gov_10dd_edpt1?format=JSON&lang=fr&sinceTimePeriod=2019&geo=FR&unit=PC_GDP');
  });
  it('lit les réponses du FMI et de la Banque mondiale', () => {
    expect(serieFMI({ values: { NGDP_RPCH: { FRA: { 2026: 0.6, 2025: 0.8 } } } }, 'NGDP_RPCH', 'FRA')).toEqual([{ periode: '2025', valeur: 0.8 }, { periode: '2026', valeur: 0.6 }]);
    expect(serieBanqueMondiale([{}, [{ date: '2023', value: 2.2 }, { date: '2024', value: null }]])).toEqual([{ periode: '2023', valeur: 2.2 }]);
  });
});
