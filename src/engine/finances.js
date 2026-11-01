/**
 * Finances publiques : déficit, dette, charge d'intérêts, taux souverains et
 * règles budgétaires.
 *
 * Dette(t+1) = Dette(t) + déficit trimestriel − cessions d'actifs
 * Taux moyen : chaque trimestre, une part 1/(4 × maturité) de la dette est
 * refinancée au taux d'émission du moment, de même que le nouveau déficit.
 * C'est ce qui rend la remontée des taux lente mais durable : la dette
 * française émise à moins de 1 % entre 2015 et 2021 est progressivement
 * remplacée par de la dette à plus de 4 %.
 */
import { PARAMETRES } from '../model/parametres.js';
import { MODES } from '../model/parametres.js';
import { borner } from '../model/outils.js';

/** Prime de risque souveraine (points de pourcentage), hors calibrage. */
export function primeRisqueModele(detteRatio, deficitRatio, instabilite, credibilite) {
  const p = PARAMETRES.primeRisque;
  return p.a * Math.max(0, detteRatio - 60) / 10
    + p.c * Math.pow(Math.max(0, detteRatio - 100) / 10, 2)
    + p.b * Math.max(0, deficitRatio - 3)
    + p.p * instabilite
    - p.credibilite * credibilite;
}

/** Taux à 10 ans de référence allemand (Bund), utilisé pour calculer l'écart de taux. */
export function tauxReferenceBund(tauxBCE) {
  return tauxBCE + PARAMETRES.primeTerme + 0.15;
}

/**
 * Met à jour les finances publiques du trimestre.
 * @param {object} e état
 * @param {number} recettes recettes annualisées (Md€)
 * @param {number} depensesPrimaires dépenses hors intérêts annualisées (Md€)
 * @param {object} options { cessions: Md€ ponctuels, economieInterets: Md€/an }
 */
export function majFinances(e, recettes, depensesPrimaires, options = {}) {
  const f = e.finances;
  const m = e.macro;
  const mode = MODES[e.mode];

  f.recettes = recettes;
  f.depensesPrimaires = depensesPrimaires;
  f.interets = f.tauxMoyen / 100 * f.dette - (options.economieInterets ?? 0);
  // Dépenses exceptionnelles (événements) : payées une fois, comptées en rythme annuel sur le trimestre
  f.depensesExceptionnelles = options.depensesExceptionnelles ?? 0;
  f.depenses = depensesPrimaires + f.interets + 4 * f.depensesExceptionnelles;
  f.deficit = f.depenses - f.recettes;           // Md€/an (positif = déficit)
  f.soldePrimaire = f.recettes - depensesPrimaires;

  // Dette : déficit du trimestre, moins les cessions d'actifs éventuelles
  const besoin = f.deficit / 4;
  const detteAvant = f.dette;
  f.dette = Math.max(0, f.dette + besoin - (options.cessions ?? 0));

  // Taux d'émission et taux moyen de la dette
  const partCT = f.partCourtTerme ?? PARAMETRES.partCourtTerme;
  const tauxEmission = (1 - partCT) * f.taux10 + partCT * e.monde.tauxBCE;
  const maturite = f.maturiteMoyenne * (1 - 0.6 * (partCT - PARAMETRES.partCourtTerme)); // plus de court terme = maturité plus courte
  const refinance = detteAvant / (4 * maturite);
  const nouveau = Math.max(0, besoin);
  f.tauxMoyen = (f.tauxMoyen * (detteAvant - refinance) + tauxEmission * (refinance + nouveau)) / Math.max(1, detteAvant + nouveau);
  f.tauxEmission = tauxEmission;

  // Ratios (en % du PIB)
  f.detteRatio = f.dette / m.pibNominal * 100;
  f.deficitRatio = f.deficit / m.pibNominal * 100;
  f.interetsRatio = f.interets / m.pibNominal * 100;
  f.historiqueDeficit.push(f.deficitRatio);
  if (f.historiqueDeficit.length > 4) f.historiqueDeficit.shift();
  const deficitMoyen = f.historiqueDeficit.reduce((s, x) => s + x, 0) / f.historiqueDeficit.length;

  // Taux à 10 ans : BCE + prime de terme + prime de risque (× nervosité des marchés) + calibrage résiduel
  const prime = primeRisqueModele(f.detteRatio, deficitMoyen, m.instabilitePolitique, f.credibilite) * mode.nervositeMarches;
  f.calibrageTaux *= 0.9; // le résidu de calibrage s'efface progressivement
  f.taux10 = borner(e.monde.tauxBCE + PARAMETRES.primeTerme + prime + f.calibrageTaux + (f.chocTaux ?? 0), 0, 15);
  f.chocTaux = (f.chocTaux ?? 0) * 0.8;
  f.spread = (f.taux10 - tauxReferenceBund(e.monde.tauxBCE)) * 100; // points de base
  f.crise = f.spread > PARAMETRES.seuilCriseSpread;

  // Cumul annuel (pour les règles budgétaires, évaluées au T4)
  const c = f.cumulAnnee;
  c.recettes += f.recettes / 4;
  c.depenses += f.depenses / 4;
  c.pib += m.pibNominal / 4;
  c.trimestres += 1;
  return f;
}

/**
 * Bilan budgétaire annuel (au T4) : déficit de l'année, respect des règles
 * européennes et nationales, ajustement de la crédibilité.
 * @returns {object|null} bilan de l'année ou null si on n'est pas au T4
 */
export function bilanAnnuel(e) {
  if (e.trimestre.t !== 4) return null;
  const f = e.finances;
  const c = f.cumulAnnee;
  const annee = e.trimestre.annee;
  const deficit = (c.depenses - c.recettes) / c.pib * 100;
  const bilan = { annee, deficit, dette: f.detteRatio, regles: [] };

  // Règles européennes : trajectoire de la procédure pour déficit excessif
  const ue = e.statique.regles.ue;
  if (ue?.pde && ue.cibleDeficit?.[annee] !== undefined) {
    let cible = ue.cibleDeficit[annee];
    // Clause dérogatoire nationale : la hausse des dépenses de défense (jusqu'à 1,5 pt de PIB) n'est pas comptée
    if (ue.clauseDerogatoireDefense) {
      const defensePct = e.budget.defense.montant / e.macro.pibNominal * 100;
      cible += Math.min(1.5, Math.max(0, defensePct - (e.international?.defense0 ?? defensePct)));
    }
    const ecart = deficit - cible;
    const respect = ecart <= 0.3;
    bilan.regles.push({ id: 'pde', nom: 'Trajectoire européenne (procédure pour déficit excessif)', cible, realise: deficit, respect });
    f.credibilite = borner(f.credibilite + (respect ? 0.15 : -0.25 * Math.min(2, ecart)), -1, 1);
  }

  // Règle nationale : frein à l'endettement allemand
  const nat = e.statique.regles.nationale;
  if (nat?.type === 'schuldenbremse') {
    const s = structurelSchuldenbremse(e, deficit);
    const plafond = nat.plafondStructurelBund + nat.plafondStructurelLaender;
    const respect = s <= plafond + 0.05;
    bilan.regles.push({ id: 'schuldenbremse', nom: 'Frein à l\'endettement (déficit structurel hors exemptions)', cible: plafond, realise: s, respect });
    f.credibilite = borner(f.credibilite + (respect ? 0.05 : -0.15), -1, 1);
    if (!respect) f.depassementsSchuldenbremse = (f.depassementsSchuldenbremse ?? 0) + 1;
  }

  // Trajectoire annoncée par le joueur (stratégie budgétaire)
  const annonce = f.trajectoireAnnoncee?.[annee];
  if (annonce !== undefined) {
    const respect = deficit <= annonce + 0.2;
    bilan.regles.push({ id: 'trajectoire', nom: 'Trajectoire annoncée par le gouvernement', cible: annonce, realise: deficit, respect });
    f.credibilite = borner(f.credibilite + (respect ? 0.2 : -0.3), -1, 1);
  }

  f.historiqueAnnuel.push(bilan);
  f.cumulAnnee = { recettes: 0, depenses: 0, pib: 0, trimestres: 0 };
  return bilan;
}

/**
 * Déficit structurel au sens du frein à l'endettement allemand (% du PIB) :
 * déficit total − composante conjoncturelle − défense au-delà de 1 % du PIB
 * − décaissements du fonds spécial infrastructures (hors frein).
 */
export function structurelSchuldenbremse(e, deficitPct) {
  const m = e.macro;
  const nat = e.statique.regles.nationale;
  const conjoncturel = -0.5 * m.ecartProduction;
  const defensePct = e.budget.defense.montant / m.pibNominal * 100;
  const exemptionDefense = Math.max(0, defensePct - nat.seuilExemptionDefense);
  const fonds = e.finances.fondsSpecialInfrastructures;
  const fondsPct = fonds ? fonds.decaissementAnnuel / m.pibNominal * 100 : 0;
  return deficitPct - conjoncturel - exemptionDefense - fondsPct - (nat.ajustementPerimetre ?? 0);
}
