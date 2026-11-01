/**
 * Lecture des réponses JSON-stat 2.0 de l'API Eurostat.
 * Documentation : https://wikis.ec.europa.eu/display/EUROSTATHELP/API+Statistics+-+data+query
 */

/**
 * Renvoie la série temporelle d'une réponse JSON-stat déjà filtrée sur toutes
 * les dimensions sauf le temps : [{ periode, valeur }] triée chronologiquement.
 */
export function serieTemporelle(js) {
  const ids = js.id;
  const tailles = js.size;
  const iTemps = ids.indexOf('time');
  if (iTemps < 0) throw new Error('Dimension « time » absente de la réponse.');
  // Toutes les dimensions hors temps doivent être de taille 1 (requête filtrée)
  ids.forEach((d, i) => { if (i !== iTemps && tailles[i] !== 1) throw new Error(`Dimension « ${d} » non filtrée (taille ${tailles[i]}).`); });
  const index = js.dimension.time.category.index; // { "2024": 0, ... }
  const res = [];
  for (const [periode, pos] of Object.entries(index)) {
    const v = js.value[String(pos)] ?? js.value[pos];
    if (v !== undefined && v !== null) res.push({ periode, valeur: v });
  }
  return res.sort((a, b) => a.periode.localeCompare(b.periode));
}

/** Dernière valeur disponible d'une série. */
export function derniere(serie) {
  return serie.length ? serie[serie.length - 1] : null;
}

/** Construit l'URL d'une requête Eurostat. */
export function urlEurostat(jeu, filtres, depuis = '2019') {
  const p = new URLSearchParams({ format: 'JSON', lang: 'fr', sinceTimePeriod: depuis });
  for (const [k, v] of Object.entries(filtres)) p.append(k, v);
  return `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${jeu}?${p.toString()}`;
}

/** Lecture d'une réponse du FMI (DataMapper) : { values: { INDIC: { ISO3: { "2025": x } } } }. */
export function serieFMI(js, indicateur, iso3) {
  const v = js?.values?.[indicateur]?.[iso3] ?? {};
  return Object.entries(v).map(([periode, valeur]) => ({ periode, valeur })).sort((a, b) => a.periode.localeCompare(b.periode));
}

/** Lecture d'une réponse de la Banque mondiale : [meta, [{ date, value }]]. */
export function serieBanqueMondiale(js) {
  const lignes = Array.isArray(js) ? js[1] ?? [] : [];
  return lignes.filter((l) => l.value !== null).map((l) => ({ periode: l.date, valeur: l.value })).sort((a, b) => a.periode.localeCompare(b.periode));
}
