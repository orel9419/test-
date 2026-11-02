/**
 * Retraite par capitalisation (France).
 *
 * Quatre dispositifs combinables, activés par des réformes :
 *  - PER renforcé (épargne individuelle encouragée par l'impôt) ;
 *  - deuxième pilier obligatoire : un pourcentage du salaire (part employeur
 *    et part salarié) versé dans un fonds collectif ;
 *  - fonds souverain de retraite piloté par l'État (modèles canadien,
 *    suédois, norvégien ; en France, le Fonds de réserve pour les retraites
 *    créé en 1999 a été réorienté vers le remboursement de la dette sociale) ;
 *  - transition partielle : une part des cotisations retraite est versée sur
 *    des comptes individuels au lieu de payer les pensions actuelles.
 *
 * Mécaniques :
 *  - double charge de transition : les actifs financent les pensions
 *    actuelles ET leur propre épargne (ou l'État s'endette pour combler) ;
 *  - rendement lié aux marchés (indice boursier du jeu, krachs compris) selon
 *    l'allocation choisie : prudente, équilibrée ou dynamique ;
 *  - effets différés : l'épargne s'accumule pendant des décennies avant de
 *    verser des pensions ; une projection sur 30 ans les rend visibles ;
 *  - inégalités : les ménages modestes épargnent peu, une épargne volontaire
 *    profite surtout aux plus aisés.
 *
 * Tous les paramètres chiffrés sont des hypothèses de jeu, signalées comme
 * telles dans l'interface.
 */
import { creerAleatoire } from './aleatoire.js';

/** Allocations : part d'actions, rendement réel annuel attendu et volatilité (ordres de grandeur historiques). */
export const ALLOCATIONS = {
  prudente: { nom: 'Prudente', actions: 0.25, rendement: 2.0, volatilite: 5 },
  equilibree: { nom: 'Équilibrée', actions: 0.55, rendement: 3.5, volatilite: 10 },
  dynamique: { nom: 'Dynamique', actions: 0.85, rendement: 4.5, volatilite: 16 },
};

/** Masse salariale du secteur privé : environ 25 % du PIB (estimation de jeu, environ 760 Md€ en 2026). */
export const masseSalarialePrivee = (e) => 0.25 * e.macro.pibNominal;

/**
 * Système mixte « mi-capitalisation, mi-répartition » : environ 28 % du salaire
 * brut sont cotisés pour la retraite dans le privé (base et complémentaire,
 * parts salariale et patronale, ordre de grandeur sous le plafond de la
 * Sécurité sociale). La moitié, 14 points, bascule progressivement vers des
 * comptes de capitalisation.
 */
export const CIBLE_MIXTE = 14;
/** Scénarios de bascule : rythme (points par an) et financement de la double charge. */
export const SCENARIOS_MIXTE = {
  etale: { rythme: 0.5, financement: 'panache' },
  dette: { rythme: 1, financement: 'dette' },
  impots: { rythme: 1, financement: 'csg' },
  pensions: { rythme: 1, financement: 'pensions' },
};
/** Répartition de la double charge entre dette, impôt (CSG) et baisse des pensions. */
export const PARTS_FINANCEMENT = { dette: [1, 0, 0], csg: [0, 1, 0], pensions: [0, 0, 1], panache: [1 / 3, 1 / 3, 1 / 3] };

/** Part des gains futurs captée par les 20 % de ménages les plus aisés, par dispositif (hypothèses de jeu). */
export const CONCENTRATION_GAINS = { per: 0.75, pilier: 0.3, souverain: 0.2, transition: 0.3 };

export function etatCapitalisationInitial() {
  return {
    allocation: 'equilibree',
    per: null,          // 'plafond' | 'per_pour_tous'
    pilier: null,       // { employeur: %, salarie: % }
    souverain: null,    // 'dividendes' | 'csg' | 'emprunt'
    transition: null,   // { points, financement: 'dette' | 'csg' | 'pensions' | 'panache', cible?, rythme? (points par an) }
    encours: { per: 0, pilier: 0, souverain: 0, transition: 0 },
    flux: { per: 0, pilier: 0, souverain: 0, transition: 0 },
    rendementCumule: 1,
    dernierRendement: 0,
    historique: [],
  };
}

/** Flux annuels versés dans chaque compartiment (Md€ par an, en euros courants). */
export function fluxAnnuels(e) {
  const c = e.capitalisation;
  const masse = masseSalarialePrivee(e);
  return {
    per: c.per === 'plafond' ? 0.0015 * e.macro.pibNominal : c.per === 'per_pour_tous' ? 0.0008 * e.macro.pibNominal : 0,
    pilier: c.pilier ? (c.pilier.employeur + c.pilier.salarie) / 100 * masse : 0,
    souverain: c.souverain === 'dividendes' ? (e.entreprises?.dividendes ?? 4) : c.souverain === 'csg' ? 0.5 / 9.2 * (e.impots.csg?.R0 ?? 160) * (e.macro.niveauPrix / 100) : c.souverain === 'emprunt' ? 10 * (e.macro.niveauPrix / 100) : 0,
    transition: c.transition ? c.transition.points / 100 * masse : 0,
  };
}

/**
 * Double charge de transition (Md€ par an) : ce que les actifs (ou l'État)
 * versent pour leur propre retraite en plus de financer les pensions actuelles.
 */
export function doubleCharge(e) {
  const f = fluxAnnuels(e);
  return f.pilier + f.transition;
}

/**
 * Évolution trimestrielle des fonds : versements, puis rendement de marché
 * (part actions × variation de l'indice boursier du jeu + part obligataire ×
 * taux à 10 ans). Un krach boursier frappe donc directement les fonds.
 */
export function majCapitalisation(e) {
  const c = e.capitalisation;
  if (!c) return;
  // Bascule progressive (système mixte) : les points de cotisation versés en capitalisation montent vers la cible
  const t = c.transition;
  if (t?.cible && t.points < t.cible) t.points = Math.min(t.cible, t.points + (t.rythme ?? 1) / 4);
  const f = fluxAnnuels(e);
  c.flux = f;
  const a = ALLOCATIONS[c.allocation] ?? ALLOCATIONS.equilibree;
  const rActions = (e.entreprises?.indice.variation ?? 1.5) / 100;
  const rObligations = (e.finances.taux10 ?? 3) / 400;
  const r = a.actions * rActions + (1 - a.actions) * rObligations;
  c.dernierRendement = r * 100;
  c.rendementCumule *= 1 + r;
  for (const k of Object.keys(c.encours)) c.encours[k] = Math.max(0, c.encours[k] * (1 + r) + f[k] / 4);
  c.historique.push({ tour: e.tour, total: Object.values(c.encours).reduce((s, x) => s + x, 0), rendement: r * 100 });
}

/**
 * Projection sur `annees` ans (Monte-Carlo, 400 trajectoires, graine fixe) :
 * encours total des fonds (percentiles 10, 50, 90) et supplément de pension
 * mensuel, à l'horizon, pour un salarié au SMIC et un cadre qui entrent
 * aujourd'hui dans le dispositif. Rente : 4 % du capital par an.
 * @param {object} p { fluxAnnuel (Md€), encours (Md€), tauxIndividuel (% du salaire), allocation, volatilite (% optionnel), probaKrach (par an), annees,
 *   montee? { flux (Md€), taux (points), annees } : hausse progressive des versements (bascule vers un système mixte) }
 */
export function projeterCapitalisation(p) {
  const a = ALLOCATIONS[p.allocation] ?? ALLOCATIONS.equilibree;
  const mu = a.rendement / 100;
  const sigma = (p.volatilite ?? a.volatilite) / 100;
  const krach = p.probaKrach ?? 0.06;
  const annees = p.annees ?? 30;
  const alea = creerAleatoire(20261101);
  const N = 400;
  const trajectoires = [];
  const capitauxSmic = [], capitauxCadre = [];
  const salaireSmic = 21000, salaireCadre = 55000; // salaires bruts annuels (ordre de grandeur)
  for (let n = 0; n < N; n++) {
    let total = p.encours ?? 0, smic = 0, cadre = 0;
    const t = [];
    for (let k = 0; k < annees; k++) {
      let r = mu + sigma * alea.normale(0, 1);
      if (alea.tirage(krach)) r -= 0.3 * a.actions / 0.85; // krach : −30 % sur un portefeuille très exposé
      r = Math.max(-0.6, r);
      const m = p.montee ? Math.min(1, (k + 1) / Math.max(1, p.montee.annees)) : 0;
      const taux = (p.tauxIndividuel ?? 0) + m * (p.montee?.taux ?? 0);
      total = total * (1 + r) + (p.fluxAnnuel ?? 0) + m * (p.montee?.flux ?? 0);
      smic = smic * (1 + r) + salaireSmic * taux / 100;
      cadre = cadre * (1 + r) + salaireCadre * taux / 100;
      t.push(total);
    }
    trajectoires.push(t);
    capitauxSmic.push(smic);
    capitauxCadre.push(cadre);
  }
  const pct = (liste, q) => { const s = [...liste].sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
  const parAn = Array.from({ length: annees }, (_, k) => {
    const v = trajectoires.map((t) => t[k]);
    return { annee: k + 1, p10: pct(v, 0.1), p50: pct(v, 0.5), p90: pct(v, 0.9) };
  });
  const rente = (capital) => capital * 0.04 / 12;
  return {
    parAn,
    pensionSmic: { p10: rente(pct(capitauxSmic, 0.1)), p50: rente(pct(capitauxSmic, 0.5)), p90: rente(pct(capitauxSmic, 0.9)) },
    pensionCadre: { p10: rente(pct(capitauxCadre, 0.1)), p50: rente(pct(capitauxCadre, 0.5)), p90: rente(pct(capitauxCadre, 0.9)) },
    hypotheses: { rendement: a.rendement, volatilite: sigma * 100, probaKrach: krach * 100, rente: 4 },
  };
}

/** Paramètres de projection tirés de l'état de la partie. */
export function parametresProjection(e, surcharge = {}) {
  const c = e.capitalisation;
  const f = fluxAnnuels(e);
  const tauxIndividuel = (c.pilier ? c.pilier.employeur + c.pilier.salarie : 0) + (c.transition?.points ?? 0);
  const t = c.transition;
  const reste = t?.cible ? Math.max(0, t.cible - t.points) : 0;
  return {
    fluxAnnuel: Object.values(f).reduce((s, x) => s + x, 0) / (e.macro.niveauPrix / 100),
    encours: Object.values(c.encours ?? {}).reduce((s, x) => s + x, 0),
    tauxIndividuel,
    montee: reste > 0 ? { flux: reste / 100 * masseSalarialePrivee(e) / (e.macro.niveauPrix / 100), taux: reste, annees: reste / (t.rythme ?? 1) } : null,
    allocation: c.allocation,
    annees: 30,
    ...surcharge,
  };
}

/** Indicateur d'inégalité : part des gains futurs captée par les 20 % les plus aisés (pondérée par les flux). */
export function concentrationGains(e) {
  const f = fluxAnnuels(e);
  const total = Object.values(f).reduce((s, x) => s + x, 0);
  if (!total) return null;
  return Object.entries(f).reduce((s, [k, v]) => s + v * CONCENTRATION_GAINS[k], 0) / total;
}

