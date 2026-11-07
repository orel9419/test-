/**
 * Fonds souverain français : un portefeuille d'actions réparti entre quatre
 * marchés (CAC 40, S&P 500, STOXX Europe 600, marchés émergents), suivi
 * trimestre par trimestre à partir de sa création.
 *
 * - Le CAC 40 est celui de la partie : il réagit à la conjoncture française
 *   et aux décisions du joueur.
 * - Les trois autres indices ont leur propre trajectoire : tendance de long
 *   terme, facteur mondial commun (ils montent et baissent ensemble),
 *   demande mondiale de la partie, krachs mondiaux possibles. Aléa séparé,
 *   stocké dans le fonds : une partie sans fonds n'est pas modifiée.
 * - Dividendes réinvestis ; taux de change constants (hypothèse de jeu).
 *
 * Paramètres (tendances, volatilités, dividendes, probabilité de krach) :
 * hypothèses de jeu calées sur des ordres de grandeur historiques.
 */
import { creerAleatoire } from './aleatoire.js';
import { libelleTrimestre } from './calendrier.js';

/** Les quatre marchés du fonds. Tendance et dividende en % par an ; volatilité propre en % par trimestre. */
export const MARCHES_FONDS = [
  { id: 'cac40', nom: 'CAC 40', zone: 'France', description: 'Les 40 plus grandes entreprises cotées à Paris.', dividende: 3.0, couleur: 'var(--serie-1)' },
  { id: 'sp500', nom: 'S&P 500', zone: 'États-Unis', description: 'Les 500 plus grandes entreprises américaines (Apple, Microsoft, Nvidia…), cotées en dollars.', tendance: 6.0, dividende: 1.3, beta: 1.0, propre: 3.5, couleur: 'var(--serie-2)' },
  { id: 'stoxx600', nom: 'STOXX Europe 600', zone: 'Europe', description: '600 entreprises de 17 pays européens, Royaume-Uni et Suisse compris (environ 17 % sont françaises).', tendance: 4.0, dividende: 3.2, beta: 0.95, propre: 3.0, couleur: 'var(--serie-3)' },
  { id: 'emergents', nom: 'Marchés émergents (MSCI EM)', zone: 'Chine, Inde, Taïwan, Brésil…', description: 'Environ 1 200 entreprises de 24 pays émergents : plus de croissance, plus de risque.', tendance: 5.0, dividende: 2.7, beta: 1.25, propre: 5.0, couleur: 'var(--serie-4)' },
];

/** Part des entreprises françaises dans le STOXX Europe 600 (ordre de grandeur). */
export const PART_FRANCE_STOXX = 0.17;

/** Répartitions proposées (parts en fraction). */
export const ALLOCATIONS_FONDS = {
  equilibre: { nom: 'Équilibrée', parts: { cac40: 0.3, sp500: 0.3, stoxx600: 0.25, emergents: 0.15 }, texte: 'Un tiers en France, le reste réparti entre les États-Unis, l\'Europe et les pays émergents.' },
  france: { nom: 'Priorité France', parts: { cac40: 0.55, sp500: 0.15, stoxx600: 0.2, emergents: 0.1 }, texte: 'Plus de la moitié dans les grandes entreprises françaises : davantage de soutien à l\'économie nationale, moins de diversification.' },
  monde: { nom: 'Mondiale (modèle norvégien)', parts: { cac40: 0.1, sp500: 0.45, stoxx600: 0.25, emergents: 0.2 }, texte: 'Comme le fonds norvégien, qui investit hors de son pays pour diversifier ses risques : meilleur rendement attendu, peu d\'effet sur l\'économie française.' },
  croissance: { nom: 'Pari sur les émergents', parts: { cac40: 0.15, sp500: 0.25, stoxx600: 0.2, emergents: 0.4 }, texte: 'Une forte part dans les pays émergents : plus de croissance attendue, mais des chutes plus fortes.' },
};

/** Krach mondial : environ 1,2 % de risque par trimestre (hypothèse de jeu). */
const PROBA_KRACH = 0.012;

const allocation = (id) => ALLOCATIONS_FONDS[id] ?? ALLOCATIONS_FONDS.equilibre;

/** Part du fonds placée dans des entreprises françaises (CAC 40 et part française du STOXX Europe 600). */
export function partFrance(p) {
  const total = Object.values(p.poches ?? {}).reduce((s, v) => s + v, 0);
  const parts = total > 0
    ? Object.fromEntries(Object.entries(p.poches).map(([k, v]) => [k, v / total]))
    : allocation(p.allocation).parts;
  return (parts.cac40 ?? 0) + PART_FRANCE_STOXX * (parts.stoxx600 ?? 0);
}

/** Crée l'état du fonds (ou complète celui d'une ancienne sauvegarde). */
export function initialiserFonds(e, entree) {
  const p = (entree.pilotage ??= { capital: 0, flux: 0, age: -1 });
  if (p.poches) return p;
  p.allocation = entree.allocation ?? e.fondsSouverainAllocation ?? 'equilibre';
  const parts = allocation(p.allocation).parts;
  p.poches = Object.fromEntries(MARCHES_FONDS.map((m) => [m.id, (p.capital ?? 0) * parts[m.id]]));
  p.apports = p.capital ?? 0;
  p.dividendes = 0;
  p.part = 100; // valeur d'une part du fonds (performance hors apports)
  p.niveaux = Object.fromEntries(MARCHES_FONDS.map((m) => [m.id, 100]));
  p.cacPrecedent = e.entreprises?.indice?.valeur ?? 100;
  p.graine = (((e.graine ?? 1) * 2654435761) ^ (0x9e3779b9 + (entree.tourEffet ?? e.tour))) >>> 0;
  p.debut = { tour: e.tour, annee: e.trimestre.annee, t: e.trimestre.t };
  p.historique = [];
  p.krachs = [];
  return p;
}

/**
 * Un trimestre de vie du fonds : rendement des quatre marchés (cours et
 * dividendes réinvestis), rééquilibrage si la répartition a changé, puis
 * apports du trimestre. Appelé une fois par trimestre par la réforme.
 * @param {number} flux apports annuels (Md€), dont un quart est versé ce trimestre
 */
export function avancerFonds(e, entree, flux) {
  const p = initialiserFonds(e, entree);
  const premier = p.historique.length === 0;
  const rendements = {};
  if (!premier) {
    const alea = creerAleatoire(p.graine);
    // CAC 40 de la partie : variation depuis le trimestre précédent
    const cac = e.entreprises?.indice?.valeur ?? p.cacPrecedent;
    rendements.cac40 = (cac / p.cacPrecedent - 1) * 100;
    p.cacPrecedent = cac;
    // Facteur mondial commun, demande mondiale de la partie, krach éventuel
    const mondial = alea.normale(0, 5);
    const conjoncture = 1.2 * ((e.monde?.croissanceDemandeMondiale ?? 2.5) - 2.5) / 4;
    const krach = alea.tirage(PROBA_KRACH);
    for (const m of MARCHES_FONDS.filter((x) => x.id !== 'cac40')) {
      const choc = krach ? -18 * m.beta : 0;
      rendements[m.id] = m.tendance / 4 + m.beta * (mondial + conjoncture) + alea.normale(0, m.propre) + choc;
    }
    if (krach) {
      p.krachs.push({ tour: e.tour, annee: e.trimestre.annee, t: e.trimestre.t });
      e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'alerte', texte: 'Fonds souverain : krach sur les marchés mondiaux, le S&P 500, le STOXX Europe 600 et les marchés émergents chutent de 18 à 25 %. Un fonds de long terme ne vend pas dans la panique : il attend la reprise.' });
    }
    p.graine = alea.etat();
    const avant = Object.values(p.poches).reduce((s, v) => s + v, 0);
    let dividendes = 0;
    for (const m of MARCHES_FONDS) {
      const r = Math.max(-60, rendements[m.id]);
      p.niveaux[m.id] *= 1 + r / 100;
      const div = p.poches[m.id] * (m.dividende / 400);
      dividendes += div;
      p.poches[m.id] = p.poches[m.id] * (1 + r / 100) + div;
    }
    p.dividendes += dividendes;
    p.dividendesTrimestre = dividendes;
    const apres = Object.values(p.poches).reduce((s, v) => s + v, 0);
    if (avant > 0) p.part *= apres / avant;
  }
  // Rééquilibrage vers la répartition choisie (sans frais : hypothèse de jeu)
  const voulue = entree.allocation ?? p.allocation;
  if (voulue && voulue !== p.allocation) {
    p.allocation = voulue;
    const total = Object.values(p.poches).reduce((s, v) => s + v, 0);
    for (const m of MARCHES_FONDS) p.poches[m.id] = total * allocation(voulue).parts[m.id];
    e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'politique', texte: `Fonds souverain : nouvelle répartition « ${allocation(voulue).nom} ».` });
  }
  // Apports du trimestre, répartis selon l'allocation
  const versement = flux / 4;
  for (const m of MARCHES_FONDS) p.poches[m.id] += versement * allocation(p.allocation).parts[m.id];
  p.apports += versement;
  p.flux = flux;
  p.capital = Object.values(p.poches).reduce((s, v) => s + v, 0);
  p.rendements = rendements;
  p.historique.push({
    tour: e.tour, annee: e.trimestre.annee, t: e.trimestre.t,
    capital: p.capital, apports: p.apports, dividendes: p.dividendes, part: p.part,
    poches: { ...p.poches }, niveaux: { ...p.niveaux },
  });
  return p;
}

/**
 * Change la répartition du fonds (appliquée au trimestre suivant, par un
 * rééquilibrage). Avant le vote de la loi, la répartition est retenue pour
 * le futur fonds.
 */
export function choisirAllocation(e, id) {
  if (!ALLOCATIONS_FONDS[id]) return { erreur: 'Répartition inconnue.' };
  const entree = e.reformes?.actives?.find((a) => a.id === 'fonds_souverain');
  e.fondsSouverainAllocation = id;
  if (entree) entree.allocation = id;
  return { texte: `Fonds souverain : répartition « ${ALLOCATIONS_FONDS[id].nom} »${entree?.pilotage?.poches ? ', rééquilibrage au trimestre prochain' : ' retenue'}.` };
}

/** Résumé pour l'interface (null si la loi n'a pas été votée). */
export function resumeFonds(e) {
  const entree = e.reformes?.actives?.find((a) => a.id === 'fonds_souverain');
  if (!entree) return null;
  const p = entree.pilotage;
  const h = p?.historique ?? [];
  const capital = p?.capital ?? 0;
  const apports = p?.apports ?? 0;
  const annees = h.length > 1 ? (h.length - 1) / 4 : 0;
  const gain = capital - apports;
  // Performance d'une part du fonds (hors apports), annualisée
  const rendementAnnuel = annees >= 1 && p?.part ? (Math.pow(p.part / 100, 1 / annees) - 1) * 100 : null;
  return {
    option: entree.option,
    allocation: entree.allocation ?? p?.allocation ?? e.fondsSouverainAllocation ?? 'equilibre',
    allocationEnVigueur: p?.allocation ?? null,
    tourAdoption: entree.tourAdoption,
    tourEffet: entree.tourEffet,
    actif: !!p?.poches,
    capital, apports, gain, dividendes: p?.dividendes ?? 0, flux: p?.flux ?? 0, part: p?.part ?? 100, annees,
    rendementAnnuel,
    partFrance: p?.poches ? partFrance(p) : partFrance({ allocation: entree.allocation ?? e.fondsSouverainAllocation }),
    poches: MARCHES_FONDS.map((m) => ({
      ...m,
      valeur: p?.poches?.[m.id] ?? 0,
      part: capital > 0 ? (p.poches[m.id] / capital) : allocation(entree.allocation).parts[m.id],
      cible: allocation(entree.allocation ?? p?.allocation).parts[m.id],
      niveau: p?.niveaux?.[m.id] ?? 100,
      dernier: p?.rendements?.[m.id] ?? null,
    })),
    historique: h,
    krachs: p?.krachs ?? [],
    debut: p?.debut ?? null,
  };
}
