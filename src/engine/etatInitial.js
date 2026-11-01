/**
 * Construction de l'état initial d'une partie à partir des données sourcées.
 */
import { profilFrance } from '../model/pays/france.js';
import { profilAllemagne } from '../model/pays/allemagne.js';
import { profilEtatsUnis } from '../model/pays/etatsUnis.js';
import { MINISTERES, GROUPES } from '../model/ministeres.js';
import { PARAMETRES } from '../model/parametres.js';
import { etatMondeInitial, initialiserHistoriqueEnergieZE } from './monde.js';
import { etatRetraitesInitial } from './retraites.js';
import { etatTravailInitial } from './travail.js';
import { primeRisqueModele } from './finances.js';
import { structurelSchuldenbremse } from './finances.js';
import { initialiserMenages } from './menages.js';
import { initialiserSocial } from './social.js';
import { initialiserInternational } from './international.js';
import { libelleTrimestre } from './calendrier.js';

export const PROFILS = { france: profilFrance, allemagne: profilAllemagne, etatsUnis: profilEtatsUnis };

/**
 * Reconstitue les niveaux de PIB réel des quatre derniers trimestres (100 = dernier
 * trimestre connu) à partir des trois dernières croissances trimestrielles observées.
 */
function historiquePib(croissances = [0, 0, 0]) {
  const niveaux = [100];
  for (let i = croissances.length - 1; i >= 0; i--) niveaux.unshift(niveaux[0] / (1 + croissances[i] / 100));
  return niveaux;
}

/** Paramètres énergétiques par pays (hypothèses, sauf la hausse de départ qui est sourcée). */
const ENERGIE = {
  france: { partTaxes: 0.4 },
  allemagne: { partTaxes: 0.4 },
  etatsUnis: { partTaxes: 0.15 },
};
/** Ouverture commerciale (part des exportations dans le PIB, estimation). */
const OUVERTURE = { france: 0.33, allemagne: 0.45, etatsUnis: 0.11 };

/**
 * Crée une nouvelle partie.
 * @param {object} options { pays, donnees (JSON du pays), contexte (JSON mondial), mode, graine }
 */
export function creerEtatInitial({ pays, donnees, contexte, mode = 'realiste', graine = 12345 }) {
  const fabrique = PROFILS[pays];
  if (!fabrique) throw new Error(`Pays inconnu : ${pays}`);
  const p = fabrique(donnees);

  const monde = etatMondeInitial(contexte);
  initialiserHistoriqueEnergieZE(monde);
  if (p.banqueCentrale === 'fed') monde.tauxFed = p.macro.tauxDirecteur;
  const directeur0 = p.banqueCentrale === 'fed' ? p.macro.tauxDirecteur : monde.tauxBCE;

  // --- Énergie : on cale la répercussion sur la hausse sourcée des prix de l'énergie ---
  const energie = { ...ENERGIE[pays], poidsConso: p.macro.poidsEnergieConso };
  const hausse = p.macro.hausseEnergieConsoAnnuelle / 100;  // ex. +21,2 % en France
  const cibleAvantTaxe = 1 + hausse / (1 - energie.partTaxes);
  energie.repercussion = Math.log(cibleAvantTaxe) / Math.log(monde.energie / 100);
  const prixEnergie0 = 100 * (1 + hausse);

  // --- Macro -----------------------------------------------------------------
  const macro = {
    pibNominal: p.macro.pibNominal,
    pibReel: 100,
    pibPotentiel: 100 / (1 + p.macro.ecartProduction / 100),
    pibTendanciel: 100 / (1 + p.macro.ecartProduction / 100),
    historiquePibReel: historiquePib(p.macro.croissancesRecentes),
    ecartProduction: p.macro.ecartProduction,
    croissancePotentielleBase: p.macro.croissancePotentielle,
    croissancePotentielle: p.macro.croissancePotentielle,
    croissanceTrimestrielle: 0,
    croissanceAnnuelle: 0,
    inflation: p.macro.inflation,
    inflationSousJacente: p.macro.inflationSousJacente,
    niveauPrix: 100,
    historiquePrix: [1, 2, 3, 4].map((k) => 100 / Math.pow(1 + p.macro.inflation / 100, (5 - k) / 4)).concat([100]).slice(-5),
    prixEnergieConso: prixEnergie0,
    croissanceSalaires: 2.5,
    indiceSalaires: 1,
    chomage: p.macro.chomage,
    chomageStructurelBase: p.macro.chomage + PARAMETRES.okun * p.macro.ecartProduction,
    chomageStructurel: p.macro.chomage + PARAMETRES.okun * p.macro.ecartProduction,
    populationActiveBase: p.macro.populationActive,
    populationActive: p.macro.populationActive,
    emploi: p.macro.populationActive * (1 - p.macro.chomage / 100),
    instabilitePolitique: p.macro.instabilitePolitique,
  };
  // Historique de prix : 5 points, dont le dernier = 100, pour une inflation annuelle de départ exacte
  macro.historiquePrix = [4, 3, 2, 1, 0].map((k) => 100 / Math.pow(1 + p.macro.inflation / 100, k / 4));

  // --- Finances ----------------------------------------------------------------
  const detteRatio = p.finances.dette / p.macro.pibNominal * 100;
  const deficitRatio = (p.finances.depenses - p.finances.recettes) / p.macro.pibNominal * 100;
  const primeModele = primeRisqueModele(detteRatio, deficitRatio, macro.instabilitePolitique, 0) * (p.sensibiliteMarches ?? 1);
  const finances = {
    dette: p.finances.dette,
    tauxMoyen: p.finances.interets / p.finances.dette * 100,
    maturiteMoyenne: p.finances.maturiteMoyenne,
    partCourtTerme: PARAMETRES.partCourtTerme,
    interets: p.finances.interets,
    recettes: p.finances.recettes,
    depenses: p.finances.depenses,
    depensesPrimaires: p.finances.depenses - p.finances.interets,
    deficit: p.finances.depenses - p.finances.recettes,
    soldePrimaire: p.finances.recettes - (p.finances.depenses - p.finances.interets),
    detteRatio,
    deficitRatio,
    interetsRatio: p.finances.interets / p.macro.pibNominal * 100,
    historiqueDeficit: [deficitRatio, deficitRatio, deficitRatio, deficitRatio],
    taux10: p.macro.taux10ans,
    // Résidu de calibrage : écart entre le taux observé et le taux du modèle au départ (s'efface progressivement)
    calibrageTaux: p.macro.taux10ans - (directeur0 + PARAMETRES.primeTerme + primeModele),
    spread: 0,
    credibilite: 0,
    trajectoireAnnoncee: {},
    cumulAnnee: { recettes: 0, depenses: 0, pib: 0, trimestres: 0 },
    historiqueAnnuel: [],
    fondsSpecialInfrastructures: p.finances.fondsSpecialInfrastructures ?? null,
    cessionsRealisees: 0,
  };
  finances.spread = (finances.taux10 - (directeur0 + PARAMETRES.primeTerme + 0.15)) * 100;

  // --- Budget --------------------------------------------------------------------
  const budget = {};
  for (const [id, l] of Object.entries(p.ministeres)) {
    budget[id] = { montant: l.montant, montantInitial: l.montant, base: l.montant, cible: l.montant, variationVolume: 0, ajustementReformes: 0 };
  }
  const impots = {};
  for (const [id, conf] of Object.entries(p.impots)) {
    impots[id] = { ...conf, provenance: undefined, rendement: conf.R0 };
  }

  // --- Stocks de capital (effets différés) ----------------------------------------
  const stocks = {};
  const sources = { recherche: 'recherche', capitalHumain: 'education', infrastructures: 'transports', vert: 'ecologieEnergie' };
  for (const [nom, poste] of Object.entries(sources)) {
    const par = PARAMETRES.stocks[nom];
    const flux = budget[poste].montant;
    const niveau0 = flux / par.depreciationAnnuelle; // stock à l'équilibre
    stocks[nom] = { niveau: niveau0, niveau0, poste, fileAttente: Array(par.delaiTrimestres).fill(flux) };
  }

  const statique = {
    nom: p.nom,
    drapeau: p.drapeau,
    regime: p.regime,
    chefGouvernement: p.chefGouvernement,
    dateDonnees: p.dateDonnees,
    calendrier: p.calendrier,
    ministeres: Object.fromEntries(Object.entries(p.ministeres).map(([id, l]) => [id, { nom: MINISTERES[id].nom, provenance: l.provenance }])),
    impots: Object.fromEntries(Object.entries(p.impots).map(([id, c]) => [id, { provenance: c.provenance }])),
    retraites: p.retraites,
    travail: p.travail,
    menages: p.menages,
    groupes: p.groupes,
    climat: p.climat,
    regles: structuredClone(p.regles),
    partenaires: p.partenaires,
    energie,
    ouverture: OUVERTURE[pays],
    poidsZoneEuro: p.poidsZoneEuro,
    pretSAFE: p.pretSAFE,
    stocksInitiaux: p.stocksInitiaux,
    devise: p.devise ?? '€',
    banqueCentrale: p.banqueCentrale ?? 'bce',
    zoneEuro: p.zoneEuro,
    sensibiliteMarches: p.sensibiliteMarches ?? 1,
    detteIntragouvernementale: p.finances.detteIntragouvernementale ?? 0,
    relationsInitiales: p.relationsInitiales,
  };

  const e = {
    version: 1,
    pays,
    mode,
    graine,
    tour: 1,
    trimestre: { ...p.calendrier.debut },
    nbTours: p.calendrier.nbTours,
    statique,
    monde,
    macro,
    finances,
    budget,
    impots,
    stocks,
    retraites: etatRetraitesInitial(p.retraites),
    travail: etatTravailInitial(p.travail, pays),
    reformes: { actives: [], historique: [] },
    effetsCourants: {},
    climat: { emissions: p.climat.emissions, emissions0: p.climat.emissions, objectif2030: p.climat.objectif2030 },
    journal: [],
    historique: [],
    termine: false,
    issue: null,
  };

  // Valeurs de référence (départ) pour calculer les indices
  e.reference = {
    pibNominal: macro.pibNominal,
    niveauPrix: 100,
    emploi: macro.emploi,
    chomage: macro.chomage,
    ecartProduction: macro.ecartProduction,
    prixEnergieConso: macro.prixEnergieConso,
    depensesRetraites: e.retraites.depenses,
    inflation: macro.inflation,
    deficitRatio,
  };
  // Le budget des retraites suit le sous-modèle dès le départ
  e.budget.retraites.montant = e.retraites.depenses;

  // Frein à l'endettement : on cale le périmètre pour que le budget de départ soit juste au plafond
  // (le gouvernement allemand « épuise » la marge permise, selon la presse).
  const nat = statique.regles.nationale;
  if (nat?.type === 'schuldenbremse') {
    const s = structurelSchuldenbremse(e, deficitRatio);
    nat.ajustementPerimetre = s - (nat.plafondStructurelBund + nat.plafondStructurelLaender);
  }

  e.recherche = { effortPctPIB: p.stocksInitiaux.recherche };
  e.menages = initialiserMenages(e);
  e.social = initialiserSocial(e);
  e.international = initialiserInternational(e, p);

  e.journal.push({ tour: 1, trimestre: libelleTrimestre(e.trimestre), type: 'info', texte: `Prise de fonctions. Données de départ mises à jour le ${p.dateDonnees}.` });
  return e;
}

export { GROUPES };

