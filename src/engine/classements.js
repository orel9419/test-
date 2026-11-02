/**
 * Classements internationaux : PIB des grandes économies (en dollars) et
 * finances publiques des 21 pays de la zone euro.
 *
 * Le pays joué suit la simulation (vos décisions) ; les autres pays suivent
 * une trajectoire de croissance nominale et de solde public (hypothèses de
 * jeu, voir countries/_contexte-mondial.json), frappée par les mêmes chocs
 * mondiaux que la partie (demande mondiale, conjoncture de la zone euro) et
 * par des aléas propres. Les taux de change sont supposés constants.
 *
 * Tirage aléatoire séparé : les classements ne modifient pas l'aléa de la
 * partie (même partie, mêmes événements).
 */
import { creerAleatoire } from './aleatoire.js';
import { borner } from '../model/outils.js';

/** Identifiant du pays joué dans les classements. */
export const ID_PAYS = { france: 'FR', allemagne: 'DE', etatsUnis: 'US' };

const val = (x) => (x && typeof x === 'object' && 'valeur' in x ? x.valeur : x);

/** Croissance nominale annuelle d'un pays non joué, à `annees` du départ. */
function croissanceTendancielle(p, annees) {
  return p.g0 + (p.gl - p.g0) * Math.min(1, annees / 25);
}

/**
 * État initial des classements. Les données sont celles de 2025 : les pays
 * non joués sont avancés d'un an (sans aléa) pour représenter 2026, année de
 * départ de la partie.
 */
export function initialiserClassements(e, donnees) {
  if (!donnees?.pib_monde || !donnees?.zone_euro) return null;
  const joue = ID_PAYS[e.pays];
  const euro = donnees.zone_euro.map((p) => {
    const g = val(p.croissance_nominale);
    const solde0 = val(p.solde_2025), dette0 = val(p.dette_2025);
    return {
      id: p.id, nom: p.nom, drapeau: p.drapeau,
      pib: val(p.pib_2025) * (1 + g / 100),
      croissance: g, soldeVise: val(p.solde_vise),
      solde: solde0 + 0.25 * (val(p.solde_vise) - solde0),
      dette: dette0 / (1 + g / 100) - (solde0 + 0.25 * (val(p.solde_vise) - solde0)),
      statutDonnees: [p.dette_2025?.statut, p.solde_2025?.statut].includes('estimation') ? 'estimation' : 'officiel',
    };
  });
  const parId = Object.fromEntries(euro.map((p) => [p.id, p]));
  const monde = donnees.pib_monde.map((p) => {
    const g0 = p.croissance_nominale_dollars.depart, gl = p.croissance_nominale_dollars.long_terme;
    const pib = val(p.pib_2025) * (1 + g0 / 100);
    // Pays de la zone euro : le PIB en dollars suit le PIB en euros (change constant)
    const e2 = parId[p.id];
    return { id: p.id, nom: p.nom, drapeau: p.drapeau, pib, g0, gl, volatilite: p.volatilite ?? 1, change: e2 ? pib / e2.pib : null, statutDonnees: val(p.pib_2025) && p.pib_2025.statut };
  });
  const c = {
    joue,
    graine: ((e.graine ^ 0x5bd1e995) >>> 0) || 1,
    ecartZEPrecedent: e.monde?.ecartZE ?? 0,
    monde, euro,
    pibJoueDepart: e.macro.pibNominal,
    pibDollarsJoueDepart: monde.find((p) => p.id === joue)?.pib ?? null,
    historique: [],
  };
  e.classements = c;
  synchroniserPaysJoue(e);
  c.depart = rangs(e);
  const t = classementsTries(e);
  c.rangsDepartParPays = Object.fromEntries(Object.entries(t).map(([k, l]) => [k, Object.fromEntries(l.map((p, i) => [p.id, i + 1]))]));
  c.historique.push({ trimestre: `T${e.trimestre.t} ${e.trimestre.annee}`, ...c.depart });
  return c;
}

/** Le pays joué reprend les valeurs de la simulation. */
function synchroniserPaysJoue(e) {
  const c = e.classements;
  const m = c.monde.find((p) => p.id === c.joue);
  if (m && c.pibDollarsJoueDepart) m.pib = c.pibDollarsJoueDepart * e.macro.pibNominal / c.pibJoueDepart;
  const z = c.euro.find((p) => p.id === c.joue);
  if (z) {
    z.pib = e.macro.pibNominal;
    z.dette = e.finances.detteRatio;
    z.solde = -e.finances.deficitRatio;
  }
}

/**
 * Fait évoluer les autres pays d'un trimestre, puis synchronise le pays joué.
 * Chocs communs : demande mondiale (tous les pays) et variation de l'écart
 * de production de la zone euro (pays de l'euro).
 */
export function majClassements(e) {
  const c = e.classements;
  if (!c) return;
  const alea = creerAleatoire(c.graine);
  const annees = (e.tour - 1) / 4;
  const chocMonde = 0.6 * ((e.monde?.croissanceDemandeMondiale ?? 2.8) - 2.8);
  const chocZE = 2 * ((e.monde?.ecartZE ?? 0) - c.ecartZEPrecedent); // variation de l'écart, en points de croissance annualisée
  c.ecartZEPrecedent = e.monde?.ecartZE ?? 0;

  for (const p of c.euro) {
    if (p.id === c.joue) continue;
    const surprise = chocMonde + chocZE + alea.normale(0, 1.2);
    const g = p.croissance + surprise;
    p.pib *= 1 + g / 400;
    // Le solde converge vers son niveau visé ; une conjoncture plus faible le dégrade (stabilisateurs automatiques)
    p.solde = borner(p.solde + 0.06 * (p.soldeVise - p.solde) + 0.08 * surprise / 4 + alea.normale(0, 0.08), -12, 8);
    p.dette = Math.max(0, p.dette / (1 + g / 400) - p.solde / 4);
  }
  const parIdEuro = Object.fromEntries(c.euro.map((p) => [p.id, p]));
  for (const p of c.monde) {
    if (p.id === c.joue) continue;
    if (p.change && parIdEuro[p.id]) { p.pib = parIdEuro[p.id].pib * p.change; continue; }
    const g = croissanceTendancielle(p, annees) + chocMonde + alea.normale(0, p.volatilite);
    p.pib *= 1 + g / 400;
  }
  c.graine = alea.etat();
  synchroniserPaysJoue(e);
  const r = rangs(e);
  c.dernier = r;
  if (e.trimestre.t === 4 || e.tour === e.nbTours) c.historique.push({ trimestre: `T${e.trimestre.t} ${e.trimestre.annee}`, ...r });
}

/** Listes triées et rang des pays suivis (pays joué et France). */
export function classementsTries(e) {
  const c = e.classements;
  if (!c) return null;
  const monde = [...c.monde].sort((a, b) => b.pib - a.pib);
  const pibEuro = [...c.euro].sort((a, b) => b.pib - a.pib);
  const dette = [...c.euro].sort((a, b) => b.dette - a.dette);
  const deficit = [...c.euro].sort((a, b) => a.solde - b.solde);
  return { monde, pibEuro, dette, deficit };
}

/** Rangs (1 = premier) d'un pays dans chaque classement. */
export function rangs(e, id = null) {
  const t = classementsTries(e);
  const cible = id ?? e.classements.joue;
  const rang = (liste) => { const i = liste.findIndex((p) => p.id === cible); return i < 0 ? null : i + 1; };
  return { monde: rang(t.monde), pibEuro: rang(t.pibEuro), dette: rang(t.dette), deficit: rang(t.deficit) };
}
