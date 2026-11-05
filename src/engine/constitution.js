/**
 * Contrôle de constitutionnalité : après son adoption par le Parlement, une
 * réforme fragile peut être censurée en tout ou en partie par le juge
 * constitutionnel. Les textes adoptés par référendum y échappent (France).
 */
import { RISQUES_CONSTITUTIONNELS, JURIDICTIONS } from '../data/constitution.js';
import { libelleTrimestre } from './calendrier.js';

/**
 * Risque constitutionnel d'une réforme pour une option donnée.
 * @returns {object|null} { risque, type, motif, precedent, juridiction }
 */
export function risqueConstitutionnel(pays, id, option) {
  const r = RISQUES_CONSTITUTIONNELS[id]?.[pays];
  if (!r) return null;
  const risque = r.options ? (r.options[option] ?? 0) : r.risque;
  if (!risque) return null;
  return { risque, type: r.type, motif: r.motif, precedent: r.precedent, juridiction: JURIDICTIONS[pays] ?? 'Juge constitutionnel' };
}

/**
 * Décision du juge constitutionnel sur une réforme adoptée.
 * @param {object} options { referendum: vrai si adoptée par référendum }
 * Options : `referendum` (loi adoptée par référendum), `saisinePresident`
 * (France : le président saisit lui-même le Conseil, qui examine le texte
 * plus attentivement). La sévérité du Conseil dépend aussi des nominations
 * (e.institutions.conseil.severite, nulle au départ).
 * @returns {object} { decision: 'conforme'|'partielle'|'totale'|'non_controlee', texte, facteur }
 */
export function controleConstitutionnel(e, id, option, nom, alea, options = {}) {
  const r = risqueConstitutionnel(e.pays, id, option);
  if (!r) return { decision: 'conforme', facteur: 1 };
  const lib = libelleTrimestre(e.trimestre);
  if (options.referendum && e.pays === 'france') {
    const texte = `${nom} : adoptée par référendum, la loi échappe au contrôle du Conseil constitutionnel (jurisprudence de 1962), malgré un risque d'inconstitutionnalité.`;
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte });
    return { decision: 'non_controlee', facteur: 1, texte };
  }
  const severite = e.institutions?.conseil?.severite ?? 0;
  const p = Math.min(0.95, r.risque * (1 + severite) * (options.saisinePresident ? 1.4 : 1));
  const censure = alea.tirage(p);
  let decision = 'conforme', facteur = 1, texte;
  if (!censure) {
    texte = `${r.juridiction} : ${nom} est jugée conforme à la Constitution.`;
  } else if (r.type === 'totale') {
    decision = 'totale'; facteur = 0;
    texte = `${r.juridiction} : ${nom} est censurée. ${r.motif}`;
  } else {
    decision = 'partielle'; facteur = 0.6;
    texte = `${r.juridiction} : ${nom} est censurée en partie ; les dispositions restantes s'appliquent (effets réduits d'environ 40 %). ${r.motif}`;
  }
  e.journal.push({ tour: e.tour, trimestre: lib, type: censure ? 'alerte' : 'politique', texte });
  return { decision, facteur, texte, juridiction: r.juridiction };
}
