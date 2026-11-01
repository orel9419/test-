/**
 * Sous-modèle des retraites.
 *
 * Dépense = nombre de retraités × pension moyenne × 12 × coefficient
 * (le coefficient intègre réversions, minimum vieillesse, etc., calé sur la
 * dépense totale sourcée : 422 Md€ en France en 2025 selon le COR).
 *
 * Leviers (par réformes) :
 * - âge légal : un relèvement retarde une partie des départs. Chaque année
 *   d'âge en plus réduit le stock de retraités d'environ
 *   cohorte annuelle × part contrainte par l'âge.
 * - indexation : la revalorisation annuelle suit l'inflation (France) ou les
 *   salaires (Allemagne, taux de remplacement garanti à 48 %), moins une
 *   éventuelle sous-indexation.
 * - les seniors qui partent plus tard augmentent la population active, mais
 *   une partie d'entre eux (ceux qui ne sont pas en emploi) touche d'autres
 *   prestations (chômage, invalidité, minima sociaux) : l'économie nette est
 *   plus faible que l'économie brute sur les pensions.
 */
import { contientMois } from './calendrier.js';

/** Prestation mensuelle moyenne versée aux seniors maintenus hors emploi (€/mois, estimation). */
const PRESTATION_SENIORS_HORS_EMPLOI = 900;

export function etatRetraitesInitial(p) {
  return {
    ageLegal: p.ageLegal,
    ageCible: p.ageLegal,
    rythme: 0,                      // années d'âge légal gagnées par an
    calendrier: p.calendrierLegal,
    nbRetraites: p.nbRetraites,
    pensionMoyenne: p.pensionMoyenne,
    indicePensions: 1,              // revalorisations cumulées (pour les ménages déjà retraités)
    ecartIndexation: 0,             // sous-indexation décidée par le joueur (points)
    sousIndexationPrevue: { ...(p.sousIndexationPrevue || {}) },
    seniorsMaintenus: 0,            // millions de personnes ayant retardé leur départ
    depenses: p.nbRetraites * p.pensionMoyenne * 12 * p.coefDepense / 1000,
    autresPrestations: 0,
    tauxCotisation: p.tauxCotisation ?? null,
    derniereRevalorisation: null,
    // États-Unis : fonds fiduciaire de la Social Security (réserves en Md$)
    fondsSS: p.fondsSS ? { reserves: p.fondsSS.reservesDepart, deficitTendanciel: p.fondsSS.deficitDepart, depensesSansReforme: p.nbRetraites * p.pensionMoyenne * 12 * p.coefDepense / 1000, economiesCumulees: 0, epuisementProjete: null } : null,
  };
}

/**
 * Applique le calendrier légal en vigueur (sans décision du joueur).
 * France : la LFSS 2026 suspend la réforme de 2023 jusqu'au 01/01/2028,
 * puis le relèvement reprend (3 mois par génération) jusqu'à 64 ans.
 * Allemagne : 67 ans atteints en 2031 (2 mois par an).
 */
function calendrierLegal(r, trimestre) {
  if (r.calendrier === 'suspendu_reprise_2028') {
    if (trimestre.annee >= 2028) { r.ageCible = 64; r.rythme = 0.25; }
  } else if (r.calendrier === 'hausse_67_2031') {
    r.ageCible = 67; r.rythme = 2 / 12;
  } else if (r.calendrier === 'fra_67') {
    // États-Unis : l'âge du taux plein atteint 67 ans pour les générations nées à partir de 1960 (2027)
    r.ageCible = Math.max(r.ageCible, 67); r.rythme = Math.max(r.rythme, 2 / 12);
  }
}

/**
 * Fonds fiduciaire de la Social Security (États-Unis).
 * Réserves combinées OASDI : 2 560 Md$ fin 2025, en baisse de 160 Md$ en 2025
 * (rapport des administrateurs 2026). Sans réforme, le déficit annuel du
 * fonds augmente d'environ 27 Md$ par an (valeur dérivée pour retrouver
 * l'épuisement projeté au T3 2034). Les réformes réduisent ce déficit par
 * les économies sur les pensions et les recettes supplémentaires.
 */
function majFondsSS(e, effetsReformes) {
  const r = e.retraites, p = e.statique.retraites;
  const f = r.fondsSS;
  if (!f) return;
  // Dépense « sans réforme » : même démographie et même revalorisation, mais âge et indexation inchangés
  f.depensesSansReforme *= 1 + (p.croissanceDemographique + p.effetNoria) / 4;
  if (contientMois(e.trimestre, p.moisRevalorisation)) f.depensesSansReforme *= 1 + e.macro.inflation / 100;
  const economies = Math.max(-500, f.depensesSansReforme - r.depenses) + (effetsReformes?.fondsSS ?? 0);
  f.deficitTendanciel += p.fondsSS.hausseDeficitAnnuelle / 4;
  const deficit = f.deficitTendanciel - economies;
  f.economiesAnnuelles = economies;
  f.reserves = Math.max(0, f.reserves - deficit / 4);
  // Projection de l'année d'épuisement à politique inchangée
  let reserves = f.reserves, d = deficit, annee = e.trimestre.annee + (e.trimestre.t) / 4;
  let n = 0;
  while (reserves > 0 && n < 400) { d += p.fondsSS.hausseDeficitAnnuelle / 4; reserves -= d / 4; annee += 0.25; n++; }
  f.epuisementProjete = reserves > 0 ? null : Math.floor(annee);
  f.deficitAnnuel = deficit;
}

/**
 * Fait avancer le sous-modèle d'un trimestre.
 * @param {object} e état de la partie
 * @returns {object} effets { offreTravail (%), autresPrestations (Md€/an) }
 */
export function majRetraites(e, effetsReformes = null) {
  const r = e.retraites;
  const p = e.statique.retraites;
  const trimestre = e.trimestre;
  calendrierLegal(r, trimestre);

  // 1. Âge légal : progression vers la cible au rythme prévu
  const avant = r.ageLegal;
  if (r.ageLegal < r.ageCible) r.ageLegal = Math.min(r.ageCible, r.ageLegal + r.rythme / 4);
  else if (r.ageLegal > r.ageCible) r.ageLegal = Math.max(r.ageCible, r.ageLegal - 0.5 / 4); // abaissement : 6 mois par an
  const dAge = r.ageLegal - avant;

  // 2. Effectifs : démographie, puis effet de l'âge légal sur les départs
  r.nbRetraites *= 1 + p.croissanceDemographique / 4;
  const departsDecales = dAge * p.cohorteAnnuelle * p.partContrainteParAge; // millions
  r.nbRetraites -= departsDecales;
  r.seniorsMaintenus += departsDecales;

  // 3. Revalorisation annuelle des pensions
  if (contientMois(trimestre, p.moisRevalorisation)) {
    const base = p.indexationSalaires ? e.macro.croissanceSalaires : e.macro.inflation;
    const sousIndexation = (r.sousIndexationPrevue[trimestre.annee] ?? 0) + r.ecartIndexation;
    const taux = r.gel?.[trimestre.annee] ? 0 : base - sousIndexation;
    r.pensionMoyenne *= 1 + taux / 100;
    r.indicePensions *= 1 + taux / 100;
    r.derniereRevalorisation = { annee: trimestre.annee, taux, base, sousIndexation };
  }
  // Effet noria : les nouveaux retraités ont des pensions plus élevées que les sortants
  r.pensionMoyenne *= 1 + p.effetNoria / 4;

  r.depenses = r.nbRetraites * r.pensionMoyenne * 12 * p.coefDepense / 1000;
  majFondsSS(e, effetsReformes);

  // 4. Effets induits : actifs supplémentaires et prestations hors retraite
  const actifsSupplementaires = r.seniorsMaintenus * 0.8;
  const offreTravail = (actifsSupplementaires / e.macro.populationActive) * 100 * 0.75;
  r.autresPrestations = r.seniorsMaintenus * (1 - p.tauxEmploiSeniors) * PRESTATION_SENIORS_HORS_EMPLOI * 12 / 1000;
  return { offreTravail, actifsSupplementaires, autresPrestations: r.autresPrestations };
}
