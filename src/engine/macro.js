/**
 * Bloc macroéconomique trimestriel.
 *
 * PIB réel = PIB potentiel × (1 + écart de production)
 * PIB potentiel = tendance × facteur structurel (stocks de capital, offre de travail)
 *
 * L'écart de production évolue avec :
 *   écart(t) = persistance × écart(t−1) + impulsion budgétaire + choc énergie
 *              + demande mondiale + effet des taux + confiance + chocs
 * L'impulsion budgétaire est la variation, d'un trimestre à l'autre, des
 * dépenses pondérées par leurs multiplicateurs et des hausses ou baisses
 * d'impôts décidées, rapportée au PIB potentiel nominal.
 */
import { PARAMETRES } from '../model/parametres.js';
import { borner } from '../model/outils.js';

/** Indice des prix de l'énergie payés par les consommateurs (100 = avant la guerre). */
export function prixEnergieConso(e) {
  const p = e.statique.energie;
  const mondial = e.monde.energie * (e.international.facteurEnergie ?? 1);
  const avantTaxe = Math.pow(mondial / 100, p.repercussion);
  const taxes = (e.impots.accisesEnergie?.taux ?? 100) / 100;
  const bouclier = e.effetsCourants?.plafonnementEnergie ?? 0; // part de la hausse absorbée par un bouclier tarifaire
  const hausseAvantTaxe = (avantTaxe - 1) * (1 - bouclier);
  return 100 * ((1 - p.partTaxes) * (1 + hausseAvantTaxe) + p.partTaxes * taxes);
}

/**
 * Met à jour le bloc macro pour le trimestre.
 * @param {object} e état
 * @param {object} impulsions { budget, chocs } en points de PIB
 * @param {object} structure { offreTravail (%), chomageStructurel (pt), potentielBonus (pt/an), chocPrix (%) }
 */
export function majMacro(e, impulsions, structure) {
  const m = e.macro;
  const P = PARAMETRES;
  const pays = e.pays;

  // --- Énergie et prix ------------------------------------------------------
  const prixEnergiePrec = m.prixEnergieConso;
  m.prixEnergieConso = prixEnergieConso(e);
  const varEnergieMondiale = (e.monde.energie - e.monde.energiePrecedente) / e.monde.energiePrecedente;
  const resilience = 1 - 0.5 * borner(e.stocks.vert.niveau / e.stocks.vert.niveau0 - 1, 0, 1);
  const sensibilite = (P.sensibiliteEnergie[pays] ?? P.sensibiliteEnergie.defaut) * resilience;
  const impulsionEnergie = -sensibilite * varEnergieMondiale * 10 * (e.international.facteurEnergie ?? 1);

  // --- Demande mondiale et exportations -----------------------------------
  const ouverture = e.statique.ouverture;
  const impulsionExport = ouverture * ((e.monde.croissanceDemandeMondiale - 2.5) / 400) * 100
    + (e.international.chocExport ?? 0);
  e.international.chocExport = 0;

  // --- Taux d'intérêt réels (investissement, logement) ---------------------
  const impulsionTaux = -0.12 * (e.finances.taux10 - (m.taux10Precedent ?? e.finances.taux10));
  m.taux10Precedent = e.finances.taux10;

  // --- Confiance (instabilité politique, mouvements sociaux) --------------
  const impulsionConfiance = -0.4 * (m.instabilitePolitique - (m.instabilitePrecedente ?? m.instabilitePolitique))
    - (e.social.coutMobilisation ?? 0);
  m.instabilitePrecedente = m.instabilitePolitique;

  // --- Écart de production --------------------------------------------------
  let impulsionBudget = impulsions.budget;
  if (m.ecartProduction < 0) impulsionBudget *= 1 + P.amplificationBasCycle * Math.abs(m.ecartProduction) / 2;
  // La composante budgétaire de l'écart est plus persistante que les autres chocs : en zone euro,
  // aucune politique monétaire nationale ne vient compenser un resserrement ou une relance.
  const composantePrec = m.composanteBudgetaire ?? 0;
  m.composanteBudgetaire = P.persistanceBudgetaire * composantePrec + impulsionBudget;
  const horsBudget = m.ecartProduction - composantePrec;
  m.ecartProduction = borner(
    P.persistanceEcart * horsBudget + m.composanteBudgetaire + impulsionEnergie + impulsionExport + impulsionTaux + impulsionConfiance + (impulsions.chocs ?? 0),
    -12, 8,
  );
  m.impulsions = { budget: impulsionBudget, energie: impulsionEnergie, export: impulsionExport, taux: impulsionTaux, confiance: impulsionConfiance, chocs: impulsions.chocs ?? 0 };

  // --- PIB potentiel ------------------------------------------------------
  m.croissancePotentielle = m.croissancePotentielleBase + (structure.potentielBonus ?? 0);
  m.pibTendanciel *= 1 + m.croissancePotentielle / 400;
  let facteurStocks = 1;
  for (const [nom, s] of Object.entries(e.stocks)) {
    facteurStocks *= Math.pow(s.niveau / s.niveau0, P.stocks[nom].elasticitePIB);
  }
  const facteurTravail = 1 + 0.65 * (structure.offreTravail ?? 0) / 100;
  m.pibPotentiel = m.pibTendanciel * facteurStocks * facteurTravail;

  // --- PIB réel et croissance -------------------------------------------
  const pibReelPrec = m.pibReel;
  m.pibReel = m.pibPotentiel * (1 + m.ecartProduction / 100);
  m.croissanceTrimestrielle = (m.pibReel / pibReelPrec - 1) * 100;
  m.historiquePibReel.push(m.pibReel);
  if (m.historiquePibReel.length > 5) m.historiquePibReel.shift();
  m.croissanceAnnuelle = m.historiquePibReel.length >= 5
    ? (m.historiquePibReel[4] / m.historiquePibReel[0] - 1) * 100
    : m.croissanceTrimestrielle * 4;

  // --- Inflation ------------------------------------------------------------
  const anticipations = P.ancrageAnticipations * 2 + (1 - P.ancrageAnticipations) * m.inflation;
  m.inflationSousJacente = borner(
    m.inflationSousJacente + P.vitesseInflation * (anticipations - m.inflationSousJacente) + P.pentePhillips * m.ecartProduction * 0.25,
    -2, 12,
  );
  const w = e.statique.energie.poidsConso;
  const facteurPrix = (1 - w) * (1 + m.inflationSousJacente / 400) + w * (m.prixEnergieConso / prixEnergiePrec)
    + (structure.chocPrix ?? 0) / 100;
  m.niveauPrix *= facteurPrix;
  m.historiquePrix.push(m.niveauPrix);
  if (m.historiquePrix.length > 5) m.historiquePrix.shift();
  m.inflation = (m.historiquePrix[m.historiquePrix.length - 1] / m.historiquePrix[0] - 1) * 100;

  // --- Salaires nominaux ----------------------------------------------------
  const productivite = 0.8 * m.croissancePotentielleBase;
  m.croissanceSalaires = borner(0.7 * m.inflation + 0.3 * 2 + productivite + 0.15 * m.ecartProduction, -2, 10);
  m.indiceSalaires *= 1 + m.croissanceSalaires / 400;

  // --- Marché du travail ------------------------------------------------------
  m.chomageStructurel = m.chomageStructurelBase + (structure.chomageStructurel ?? 0);
  const cibleChomage = m.chomageStructurel - P.okun * m.ecartProduction;
  m.chomage = borner(m.chomage + P.vitesseChomage * (cibleChomage - m.chomage), 1.5, 25);
  // Population active : seuls les actifs supplémentaires (seniors maintenus...) comptent, pas les heures en plus
  m.populationActive = m.populationActiveBase + (structure.actifsSupplementaires ?? 0);
  m.emploi = m.populationActive * (1 - m.chomage / 100);

  // --- PIB nominal ------------------------------------------------------------
  m.pibNominal = e.reference.pibNominal * (m.pibReel / 100) * (m.niveauPrix / e.reference.niveauPrix);
  m.croissanceNominale = (m.pibNominal / (m.pibNominalPrec ?? m.pibNominal) - 1) * 400;
  m.pibNominalPrec = m.pibNominal;
  return m;
}
