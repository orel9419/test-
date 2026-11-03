/**
 * Opinion publique par groupe social, cohésion et risque de mouvement social.
 *
 * Popularité d'un groupe :
 *   pop(t) = pop(t−1) + retour × (ancrage − pop(t−1)) + chocs
 * L'ancrage dépend de l'économie (chômage, inflation, pouvoir d'achat des
 * ménages du groupe, avec aversion à la perte), des choix budgétaires qui
 * touchent le groupe, et des opinions durables laissées par les réformes.
 *
 * Grief : mécontentement non monétaire laissé par une réforme (par exemple
 * travailler deux ans de plus). Les mesures de compensation (pénibilité,
 * carrières longues, minimum de pension...) le réduisent. Le risque de
 * mouvement social combine grief, perte de popularité, inflation et capacité
 * de mobilisation du groupe (forte pour les agriculteurs et les
 * fonctionnaires, faible pour les retraités).
 */
import { PARAMETRES } from '../model/parametres.js';
import { MINISTERES } from '../model/ministeres.js';
import { pouvoirAchatGroupe } from './menages.js';
import { borner } from '../model/outils.js';

/** Sensibilité au chômage par groupe (les jeunes y sont plus exposés). */
const SENS_CHOMAGE = { jeunes: 1.4, salaries: 1.0, fonctionnaires: 0.4, entrepreneurs: 0.6, agriculteurs: 0.4, retraites: 0.5 };

export function initialiserSocial(e) {
  const groupes = {};
  for (const [id, g] of Object.entries(e.statique.groupes)) {
    groupes[id] = { popularite: g.popularite, ancrage0: g.popularite, chocs: 0, grief: 0, risque: 0 };
  }
  const s = { groupes, popularite: 0, cohesion: 0, risqueGlobal: 0, mobilisation: null, coutMobilisation: 0 };
  calculerAgregats(e, s);
  return s;
}

/** Popularité globale (pondérée par le poids électoral) et cohésion sociale. */
function calculerAgregats(e, s) {
  let pop = 0, risque = 0;
  for (const [id, g] of Object.entries(s.groupes)) {
    const poids = e.statique.groupes[id].poids;
    pop += poids * g.popularite;
    risque += poids * g.risque;
  }
  s.popularite = pop;
  s.risqueGlobal = risque;
  // Composantes pondérées de la popularité (écarts à la situation de départ, en points)
  const comp = {};
  for (const [id, g] of Object.entries(s.groupes)) {
    for (const [k, v] of Object.entries(g.composantes ?? {})) comp[k] = (comp[k] ?? 0) + e.statique.groupes[id].poids * v;
  }
  s.composantes = comp;
  // Cohésion : baisse avec le risque social, le chômage et les écarts de pouvoir d'achat entre ménages
  const variations = (e.menages ?? []).map((m) => m.variationPct ?? 0);
  const dispersion = variations.length ? Math.max(...variations) - Math.min(...variations) : 0;
  const modestes = (e.menages ?? []).filter((m) => ['smic', 'jeune', 'agriculteur'].includes(m.id));
  const perteModestes = modestes.length ? Math.max(0, -modestes.reduce((x, m) => x + (m.variationPct ?? 0), 0) / modestes.length) : 0;
  s.cohesion = borner(72 - 0.6 * risque - 1.5 * Math.max(0, e.macro.chomage - 7) - 0.4 * dispersion - 1.5 * perteModestes, 0, 100);
}

/** Perception d'une variation de dépense (en %, en volume) : une baisse se remarque plus qu'une hausse. */
function perceptionDepense(variationPct) {
  return variationPct < 0 ? 0.45 * variationPct : 0.2 * variationPct;
}

/**
 * Applique des chocs immédiats de popularité (adoption d'une réforme, événement).
 * @param {object} chocs { groupe: points }
 */
export function appliquerChocs(e, chocs = {}) {
  for (const [id, v] of Object.entries(chocs)) {
    if (e.social.groupes[id]) e.social.groupes[id].chocs += v;
  }
}

/**
 * Met à jour l'opinion et le risque social pour le trimestre.
 * @returns {object|null} mobilisation déclenchée ce trimestre, le cas échéant
 */
export function majSocial(e, alea) {
  const s = e.social;
  const P = PARAMETRES.popularite;
  const m = e.macro;
  const indicePrix = m.niveauPrix / 100;

  // Opinion et grief laissés par les réformes actives
  const opinionReformes = {}, griefReformes = {}, compensations = {};
  for (const r of e.reformes.actives) {
    for (const [g, v] of Object.entries(r.opinion ?? {})) opinionReformes[g] = (opinionReformes[g] ?? 0) + v;
    for (const [g, v] of Object.entries(r.grief ?? {})) griefReformes[g] = (griefReformes[g] ?? 0) + v;
    for (const [g, v] of Object.entries(r.compensation ?? {})) compensations[g] = (compensations[g] ?? 0) + v;
    // Les opinions et griefs s'estompent lentement
    for (const cle of ['opinion', 'grief']) for (const g of Object.keys(r[cle] ?? {})) r[cle][g] *= cle === 'grief' ? 0.96 : 0.97;
  }

  for (const [id, g] of Object.entries(s.groupes)) {
    // Économie
    const economie = P.effetChomage * (m.chomage - e.reference.chomage) * SENS_CHOMAGE[id]
      + P.effetInflation * (Math.max(0, m.inflation - 2) - Math.max(0, e.reference.inflation - 2));
    const pa = pouvoirAchatGroupe(e, id);
    const pouvoirAchat = borner(P.effetPouvoirAchat * (pa < 0 ? P.aversionPerte * pa : pa), -2 * P.plafondPouvoirAchat, P.plafondPouvoirAchat);
    // Budget : postes auxquels le groupe est sensible
    let budget = 0;
    for (const [poste, ligne] of Object.entries(e.budget)) {
      const sens = MINISTERES[poste].groupes?.[id];
      if (!sens) continue;
      const variation = (ligne.montant / (ligne.montantInitial * (ligne.facteurBesoins ?? 1) * indicePrix) - 1) * 100;
      budget += sens * borner(perceptionDepense(variation), -10, 6);
    }
    // Fiscalité symbolique (au-delà de l'effet sur le pouvoir d'achat)
    let fiscalite = 0;
    const imp = e.impots;
    if (id === 'entrepreneurs') {
      if (imp.impotSocietes) fiscalite -= 0.8 * (imp.impotSocietes.taux - imp.impotSocietes.tauxRef);
      if (imp.cotisations) fiscalite -= 0.4 * (imp.cotisations.taux - imp.cotisations.tauxRef);
    }
    if (imp.droitsSuccession) {
      const dSucc = imp.droitsSuccession.taux - imp.droitsSuccession.tauxRef;
      if (id === 'retraites' || id === 'entrepreneurs' || id === 'agriculteurs') fiscalite -= 0.06 * dSucc;
      if (id === 'jeunes') fiscalite += 0.02 * dSucc;
    }
    if (imp.accisesEnergie) {
      const dEn = imp.accisesEnergie.taux - imp.accisesEnergie.tauxRef;
      fiscalite -= (id === 'agriculteurs' ? 0.08 : id === 'jeunes' ? 0.01 : 0.04) * dEn;
    }
    const ancrage = g.ancrage0 + economie + pouvoirAchat + budget + fiscalite + (opinionReformes[id] ?? 0);
    // Composantes, pour expliquer au joueur ce qui fait bouger sa popularité
    g.composantes = { economie, pouvoirAchat, budget, fiscalite, reformes: opinionReformes[id] ?? 0 };
    g.popularite = borner(g.popularite + P.retourAncrage * (ancrage - g.popularite) + g.chocs, 2, 95);
    g.chocs = 0; // le choc est absorbé dans le niveau ; le retour vers l'ancrage le fait ensuite s'estomper
    g.ancrage = ancrage;

    // Grief et risque de mouvement social
    const griefNet = Math.max(0, (griefReformes[id] ?? 0) - (compensations[id] ?? 0));
    g.grief = griefNet + Math.max(0, -pa) * 2;
    const mob = e.statique.groupes[id].mobilisation;
    g.risque = borner(mob * (g.grief * 2.2 + Math.max(0, g.ancrage0 - g.popularite) * 0.8 + Math.max(0, m.inflation - 3) * 4), 0, 100);
  }
  calculerAgregats(e, s);

  // Mouvement social en cours : coût économique, puis extinction progressive
  if (s.mobilisation) {
    s.mobilisation.trimestres -= 1;
    s.coutMobilisation = 0.15 * s.mobilisation.intensite;
    if (s.mobilisation.trimestres <= 0) { s.mobilisation = null; s.coutMobilisation = 0; }
    return null;
  }
  s.coutMobilisation = 0;
  // Déclenchement : le groupe le plus à risque, au-delà d'un seuil
  const [idMax, gMax] = Object.entries(s.groupes).sort((a, b) => b[1].risque - a[1].risque)[0];
  if (gMax.risque > 55 && alea.tirage((gMax.risque - 55) / 60)) {
    s.mobilisation = { groupe: idMax, intensite: borner(gMax.risque / 50, 0.5, 2), trimestres: 2, debut: e.tour };
    return s.mobilisation;
  }
  return null;
}
