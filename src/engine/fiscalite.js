/**
 * Recettes publiques : calcul du rendement de chaque prélèvement.
 *
 * Rendement = R0 × facteurTaux × facteurComportement × indiceBase
 * (voir src/model/impots.js pour les définitions).
 */
import { IMPOTS } from '../model/impots.js';

/**
 * Indices des assiettes économiques (1 au départ).
 * @param {object} e état de la partie
 */
export function indicesAssiettes(e) {
  const mac = e.macro;
  const ref = e.reference;
  const yn = mac.pibNominal / ref.pibNominal;
  const emploi = mac.emploi / ref.emploi;
  // Effet du temps de travail sur la masse salariale, net de ce qui passe déjà par le PIB (heures en plus)
  const heures = 1 + ((e.travail.variationMasseSalariale ?? 0) - 0.65 * (e.travail.offreTravail ?? 0)) / 100;
  const masseSalariale = yn * Math.pow(emploi, 0.5) * heures;
  const pensions = e.retraites.depenses / ref.depensesRetraites;
  const profits = yn * (1 + 2.5 * (mac.ecartProduction - ref.ecartProduction) / 100);
  const volumeEnergie = Math.pow(mac.pibReel / 100, 0.6)
    * Math.pow(mac.prixEnergieConso / ref.prixEnergieConso, -0.15)
    * (1 - 0.4 * (e.stocks.vert.niveau / e.stocks.vert.niveau0 - 1));
  return {
    pib: yn,
    consommation: yn,
    importations: yn * (1 + 0.5 * (mac.ecartProduction - ref.ecartProduction) / 100),
    revenus: Math.pow(masseSalariale, 1.2),
    profits: Math.max(0.3, profits),
    revenusLarges: 0.7 * masseSalariale + 0.18 * pensions + 0.12 * yn,
    masseSalariale,
    volumeEnergie,
    patrimoine: Math.pow(yn, 1.2),
  };
}

/** Rendement annualisé (Md€) d'un prélèvement pour un taux donné. */
export function rendement(id, conf, bases, taux = conf.taux) {
  const def = IMPOTS[id];
  const base = bases[def.base] ?? bases.pib;
  if (!def.levier || conf.tauxRef === null || conf.tauxRef === undefined) return conf.R0 * base;
  const ratio = taux / conf.tauxRef;
  const part = conf.partPilotable ?? def.partPilotable;
  const facteurTaux = 1 - part + part * ratio;
  const facteurComportement = Math.pow(ratio, def.elasticiteComportement);
  return conf.R0 * facteurTaux * facteurComportement * base;
}

/**
 * Applique les nouveaux taux décidés par le joueur et renvoie la variation
 * « discrétionnaire » des recettes (à assiette constante), qui sert au calcul
 * de l'impulsion budgétaire.
 * @returns {object} { [impot]: variation en Md€/an }
 */
export function appliquerTaux(e, nouveauxTaux = {}) {
  const bases = indicesAssiettes(e);
  const variations = {};
  for (const [id, taux] of Object.entries(nouveauxTaux)) {
    const conf = e.impots[id];
    if (!conf || conf.tauxRef === null || taux === undefined || taux === null) continue;
    const [min, max] = conf.bornes;
    const t = Math.min(max, Math.max(min, taux));
    if (t === conf.taux) continue;
    variations[id] = rendement(id, conf, bases, t) - rendement(id, conf, bases, conf.taux);
    conf.taux = t;
  }
  return variations;
}

/**
 * Calcule toutes les recettes du trimestre (Md€/an).
 * @param {object} e état
 * @param {object} ajustements { [impot]: Md€ } ajoutés par les réformes
 */
export function calculerRecettes(e, ajustements = {}) {
  const bases = indicesAssiettes(e);
  let total = 0;
  for (const [id, conf] of Object.entries(e.impots)) {
    conf.rendement = rendement(id, conf, bases) + (ajustements[id] ?? 0);
    total += conf.rendement;
  }
  // Recettes ponctuelles ou durables ajoutées hors prélèvements (diplomatie, cessions...)
  for (const [cle, montant] of Object.entries(ajustements)) {
    if (!e.impots[cle]) total += montant;
  }
  return total;
}
